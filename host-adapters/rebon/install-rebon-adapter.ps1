[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$adapterRoot = Split-Path -Parent $PSCommandPath
$sourceHostAdaptersRoot = Split-Path -Parent $adapterRoot
$sourcePackageRoot = Split-Path -Parent $sourceHostAdaptersRoot
$userProfile = [Environment]::GetFolderPath('UserProfile')
$rebonRoot = [Environment]::GetEnvironmentVariable('REBON_CONFIG_DIR')
if (-not $rebonRoot) { $rebonRoot = Join-Path $userProfile '.rebon' }
$installedPackageRoot = Join-Path $rebonRoot 'skills\dev-skill'
$packageRoot = if (Test-Path -LiteralPath (Join-Path $installedPackageRoot 'host-adapters\guard-core\src\mcp-server.mjs')) { $installedPackageRoot } else { $sourcePackageRoot }
$hostAdaptersRoot = Join-Path $packageRoot 'host-adapters'
$coreRoot = Join-Path $hostAdaptersRoot 'guard-core'
$coreServerPath = Join-Path $coreRoot 'src\mcp-server.mjs'
$coreServer = $coreServerPath.Replace('\', '/')
$hook = (Join-Path $hostAdaptersRoot 'rebon\rebon-guard-hook.mjs').Replace('\', '/')
$configPath = Join-Path $rebonRoot 'config.json'
$settingsPath = Join-Path $rebonRoot 'settings.json'

function ConvertTo-Hashtable($value) {
  if ($null -eq $value) { return $null }
  if ($value -is [string]) { return $value }
  if ($value -is [System.Collections.IDictionary]) {
    $table = @{}
    foreach ($key in $value.Keys) { $table[$key] = ConvertTo-Hashtable $value[$key] }
    return $table
  }
  if ($value -is [pscustomobject]) {
    $table = @{}
    foreach ($property in $value.PSObject.Properties) {
      $table[$property.Name] = ConvertTo-Hashtable $property.Value
    }
    return $table
  }
  if ($value -is [System.Collections.IEnumerable]) {
    return @($value | ForEach-Object { ConvertTo-Hashtable $_ })
  }
  return $value
}

function Read-Object([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) { return @{} }
  $text = Get-Content -LiteralPath $path -Raw
  if (-not $text.Trim()) { return @{} }
  return ConvertTo-Hashtable ($text | ConvertFrom-Json)
}

function Hook([string]$event, [string]$tool = '') {
  $suffix = if ($tool) { "--tool $tool" } else { "--event $event" }
  $entry = @{
    hooks = @(@{
      type = 'command'
      command = ('& "' + $nodeCommand + '" "' + $hook + '" ' + $suffix)
      shell = 'powershell'
      timeout = 5
    })
  }
  if ($tool) { $entry.matcher = $tool }
  return $entry
}

New-Item -ItemType Directory -Path $rebonRoot -Force | Out-Null

$nodeCommand = (Get-Command node -ErrorAction Stop).Source
if (-not (Test-Path -LiteralPath $nodeCommand)) { throw 'Node executable was not found.' }
$npmCommand = (Get-Command npm -ErrorAction Stop).Source
if (-not (Test-Path -LiteralPath $coreServerPath)) { throw 'Guard Core MCP server was not found.' }

$coreDependency = Join-Path $coreRoot 'node_modules\@modelcontextprotocol\sdk\package.json'
if (-not (Test-Path -LiteralPath $coreDependency)) {
  & $npmCommand --prefix $coreRoot ci
  if ($LASTEXITCODE -ne 0) { throw 'Guard Core dependency installation failed.' }
}

$config = Read-Object $configPath
if (-not $config.ContainsKey('mcpServers')) { $config.mcpServers = @{} }
$config.mcpServers.devskill_guard = @{
  command = $nodeCommand
  args = @($coreServer)
  env = @{
    DEVSKILL_GUARD_URL = 'http://127.0.0.1:7636'
    DEVSKILL_GUARD_SESSION = 'rebon-default'
    DEVSKILL_GUARD_ADAPTER = 'rebon'
  }
}

$settings = Read-Object $settingsPath
if (-not $settings.ContainsKey('hooks')) { $settings.hooks = @{} }
$hookEvents = @{
  SessionStart = @(Hook 'session-start')
  SessionEnd = @(Hook 'session-end')
  PreToolUse = @('Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'Bash', 'PowerShell' | ForEach-Object { Hook '' $_ })
}
foreach ($event in $hookEvents.Keys) {
  $existing = @($settings.hooks[$event] | Where-Object {
    if ($null -eq $_) { return $false }
    $command = $_.hooks | ForEach-Object command
    -not ($command -match [regex]::Escape('rebon-guard-hook.mjs'))
  })
  $settings.hooks[$event] = @($existing + $hookEvents[$event])
}

$config | ConvertTo-Json -Depth 32 | Set-Content -LiteralPath $configPath -Encoding utf8
$settings | ConvertTo-Json -Depth 32 | Set-Content -LiteralPath $settingsPath -Encoding utf8
Write-Output 'DevSkill Rebon adapter installed. Open a fresh Rebon session once to load the MCP bridge and hooks.'
