# Linux desktop builds

This project packages the Electron desktop app with `electron-vite` and `electron-builder`.

## Structure

- Electron package: `packages/desktop-electron`
- Electron main entry: `packages/desktop-electron/src/main/index.ts`
- Preload entry: `packages/desktop-electron/src/preload/index.ts`
- Renderer entry: `packages/desktop-electron/src/renderer/index.tsx`
- Local sidecar/server: `packages/desktop-electron/src/main/server.ts`
- Bundled CLI/server build: `packages/liz`
- Installer config: `packages/desktop-electron/electron-builder.config.ts`
- Linux icons: `packages/desktop-electron/resources/icons/*.png`

## Requirements

Use Bun. The monorepo uses Bun workspaces and catalog dependencies, so `npm install` is not the supported install path.

```bash
bun install
```

On Debian/Ubuntu runners that build all Linux targets:

```bash
sudo apt-get update
sudo apt-get install -y --no-install-recommends rpm libarchive-tools
```

## Development

```bash
bun --cwd packages/desktop-electron dev
```

## Build installers

Run these from `packages/desktop-electron`.

```bash
bun run build:linux
```

From the repository root, the same build is available as:

```bash
bun run build:linux
```

Individual targets:

```bash
bun run build:deb
bun run build:rpm
bun run build:appimage
bun run build:tar.gz
```

Legacy package-only scripts are still available:

```bash
bun run build
bun run package:linux
```

## Output

Artifacts are written to:

```text
packages/desktop-electron/dist/
```

Expected Linux files:

```text
Liz Dev Studio Setup.AppImage
Liz Dev Studio Setup.deb
Liz Dev Studio Setup.rpm
Liz Dev Studio Setup.tar.gz
```

## Install on Linux

Debian/Ubuntu/Pop!_OS/Linux Mint:

```bash
sudo apt install ./dist/*.deb
```

Fedora/OpenSUSE:

```bash
sudo dnf install ./dist/*.rpm
```

AppImage:

```bash
chmod +x ./dist/*.AppImage
./dist/*.AppImage
```

Portable tarball:

```bash
tar -xzf ./dist/*.tar.gz
```

## CI build

The `desktop-electron-artifacts` GitHub Actions workflow builds Windows, Linux, and macOS artifacts on the correct operating systems. Prefer this workflow when you need AppImage, `.deb`, and `.rpm` together from a non-Linux workstation.

```bash
gh workflow run desktop-electron-artifacts.yml --ref dev -f version=0.0.0-dev-YYYYMMDDHHMM
```

## Preservation rules

- Do not change provider URLs, model routing, login/session, usage, plans, or auth flow just to package Linux.
- Do not hardcode Windows paths such as `C:/`, `AppData`, backslashes, or `.exe` outside `process.platform === "win32"` branches.
- Use `app.getPath("userData")`, `path.join`, and `process.platform` for platform-specific behavior.
- Keep Windows EXE packaging (`package:win`) and dev mode working while adding Linux targets.
