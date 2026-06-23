#!/usr/bin/env bash
# PostToolUse hook: format newly created/edited files with Prettier and ESLint.
# Receives a JSON payload on stdin with tool_input.file_path.

file=$(node -e '
  let d = "";
  process.stdin.on("data", c => d += c).on("end", () => {
    try {
      const j = JSON.parse(d);
      process.stdout.write((j.tool_input && j.tool_input.file_path) || "");
    } catch (e) {}
  });
')

[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || true

# Format with Prettier (silently ignore unsupported types like images)
npx prettier --write --ignore-unknown "$file" >/dev/null 2>&1

# Fix with ESLint only for JS/TS files
case "$file" in
  *.js|*.jsx|*.ts|*.tsx)
    npx eslint --fix "$file" >/dev/null 2>&1
    ;;
esac

exit 0
