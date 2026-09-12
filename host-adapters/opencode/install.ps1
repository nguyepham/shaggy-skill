[CmdletBinding()]
param(
  [string]$PluginDirectory = (Join-Path $env:USERPROFILE ".config\opencode\plugins")
)

$source = Join-Path $PSScriptRoot "devskill-guard.js"
New-Item -ItemType Directory -Force -Path $PluginDirectory | Out-Null
Copy-Item -LiteralPath $source -Destination (Join-Path $PluginDirectory "devskill-guard.js") -Force
Write-Output "Installed DevSkill Guard plugin. Merge opencode.mcp.jsonc into your OpenCode configuration."
