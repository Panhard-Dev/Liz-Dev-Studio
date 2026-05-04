#!/usr/bin/env sh
set -eu

PACKAGE_URL="https://liz-ai-brasil.vercel.app/npm/liz-ai-brasil.tgz"
PREFIX="${NPM_CONFIG_PREFIX:-$HOME/.local}"
PROFILE="${HOME}/.bashrc"

if [ -n "${SHELL:-}" ] && [ "$(basename "$SHELL")" = "zsh" ]; then
  PROFILE="${HOME}/.zshrc"
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm nao encontrado. Instale Node.js/npm e rode este instalador de novo."
  exit 1
fi

mkdir -p "$PREFIX"
npm install -g --prefix "$PREFIX" "$PACKAGE_URL"

case ":$PATH:" in
  *":$PREFIX/bin:"*) ;;
  *)
    mkdir -p "$(dirname "$PROFILE")"
    touch "$PROFILE"
    if ! grep -F "export PATH=\"$PREFIX/bin:\$PATH\"" "$PROFILE" >/dev/null 2>&1; then
      {
        echo ""
        echo "# LIZ AI BRASIL CLI"
        echo "export PATH=\"$PREFIX/bin:\$PATH\""
      } >> "$PROFILE"
    fi
    export PATH="$PREFIX/bin:$PATH"
    ;;
esac

echo "LIZ AI BRASIL instalada."
echo "Abra um novo terminal ou rode:"
echo "export PATH=\"$PREFIX/bin:\$PATH\""
echo ""
"$PREFIX/bin/liz" --version
