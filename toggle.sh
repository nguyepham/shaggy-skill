#!/bin/sh
DIR="$(cd "$(dirname "$0")" && pwd)"
LINK=~/.claude/skills/"$(basename "$DIR")"

[ -L "$LINK" ] && rm -f "$LINK" || ln -sfn "$DIR" "$LINK"
