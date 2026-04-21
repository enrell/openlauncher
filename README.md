# OpenLauncher

A Linux-first desktop game launcher built with Electrobun, React 18, Tailwind CSS, and Vite.

## Overview

OpenLauncher provides reliable game execution on Linux, with native Linux games as first-class citizens and Windows games supported through community-maintained runners like `umu`.

The priority is runtime reliability and maintainability, not supporting every game store as fast as possible.

## Tech Stack

- **Electrobun** - Native desktop framework (not Electron)
- **Bun** - JavaScript runtime
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Vite** - Build tooling

## Development

```bash
bun install
bun run dev
bun run dev:hmr
bun run build:canary
```

## Architecture

```
src/
├── bun/        # Main process and native orchestration
├── mainview/   # Application UI
└── shared/     # Shared types and contracts
```

## External Tooling

- `umu` - Windows games on Linux
- `gamescope` - Session wrapping
- `mangohud` - Performance overlay

## Documentation

- `AGENTS.md` - Project rules and AI agent guidelines
- `CONTRIBUTING.md` - Contribution guidelines

## License

MIT
