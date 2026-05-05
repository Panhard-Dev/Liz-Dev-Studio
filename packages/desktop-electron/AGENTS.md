# Desktop package notes

- Renderer process should only call `window.api` from `src/preload`.
- Main process should register IPC handlers in `src/main/ipc.ts`.
- This package uses `electron-vite` for `out/` and `electron-builder` for installers.
- Linux installer targets are configured in `electron-builder.config.ts`: `deb`, `rpm`, and `AppImage`.
- Use Bun for dependency installation/build scripts because the monorepo uses Bun workspaces/catalogs.
- Run Linux installer builds on Linux or the `desktop-electron-artifacts` GitHub Actions workflow; Windows can build the EXE and may build portable Linux archives, but AppImage/RPM require Linux packaging tooling.
