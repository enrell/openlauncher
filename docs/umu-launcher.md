# umu-launcher Integration Guide

## What is umu-launcher?

umu-launcher is a unified launcher for Windows games on Linux. It replicates the Proton runtime environment that Steam uses, allowing Windows games to run on Linux without Steam being installed.

Source: [Open-Wine-Components/umu-launcher](https://github.com/Open-Wine-Components/umu-launcher)

## Core Concept

Steam launches Proton games through a complex chain:
```
steam-launch-wrapper → SteamLinuxRuntime_sniper/_v2-entry-point → Proton → Game.exe
```

umu-launcher extracts this same runtime and exposes it via `umu-run`, allowing any launcher to run Windows games through Proton with the same compatibility.

## Installation

```bash
# Arch Linux
pacman -S umu-launcher

# Nix/NixOS
nix-env -iA nixpkgs.umu-launcher

# uv (Python bootstrap)
uv add --script umu-run 'python-xlib' 'urllib3' 'truststore'
uv run umu-run -h

# Manual build
./configure.sh --prefix=/usr && make && make install
```

umu auto-downloads the required Steam Runtime to `$HOME/.local/share/umu` on first run.

## CLI Usage

### Basic
```bash
WINEPREFIX=~/.wine PROTONPATH=~/GE-Proton9-4 umu-run game.exe
```

### With umu-database game ID (applies protonfixes)
```bash
WINEPREFIX=~/.wine GAMEID=umu-dauntless STORE=egs PROTONPATH=~/GE-Proton9-4 umu-run "path/to/game.exe"
```

### Auto-download latest GE-Proton
```bash
WINEPREFIX=~/.wine PROTONPATH=GE-Proton umu-run game.exe
```

### Using TOML config file
```bash
umu-run --config config.toml
```

```toml
# config.toml
[umu]
prefix = "~/.wine"
proton = "~/GE-Proton30"
game_id = "0"
exe = "~/foo.exe"
launch_args = ["-opengl", "-SkipBuildPatchPrereq"]
store = "gog"
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `WINEPREFIX` | WINE prefix directory | `$HOME/Games/umu/$GAMEID` |
| `GAMEID` | umu-database ID for protonfixes | `umu-default` (no fixes) |
| `STORE` | Store type (egs, gog, steam) | `none` |
| `PROTONPATH` | Path, version name, or codename (`GE-Proton`, `GE-Proton9-5`) | `UMU-Proton` (latest stable) |
| `PROTON_VERB` | Proton verb | `waitforexitandrun` |
| `UMU_LOG` | Enable debug logging | (unset) |
| `PROTON_LOG` | Enable Proton verbose logging | (unset) |
| `PROTONFIXES_DISABLE` | Skip protonfixes | `0` (apply fixes) |
| `UMU_NO_PROTON` | Run native Linux exe in Steam Runtime | (unset) |
| `UMU_RUNTIME_UPDATE` | Disable auto-update of Steam Runtime | `1` (update enabled) |

## Key Defaults

- **Default WINEPREFIX**: `$HOME/Games/umu/$GAMEID`
  - If no GAMEID set: `$HOME/Games/umu/umu-default`
- **Proton auto-download**: `PROTONPATH=GE-Proton` fetches latest GE-Proton automatically
- **umu-database**: https://umu.openwinecomponents.org/ — maps GAMEID + STORE to protonfixes

## Native Linux Games

umu can also run native Linux executables inside the Steam Runtime container:

```bash
UMU_NO_PROTON=1 umu-run ./native_game
```

This is useful for games that need the Steam Runtime environment.

## Debugging

```bash
# umu debug logs
UMU_LOG=debug umu-run game.exe

# Proton verbose logs (saved to $HOME/steam-{GAMEID}.log)
PROTON_LOG=1 umu-run game.exe
```

## OpenLauncher Integration Notes

When integrating with OpenLauncher:

1. **Build the umu-run command** — construct env vars + exe path + args
2. **Spawn as child process** — `Bun.spawn()` or similar, capture stdout/stderr
3. **Track game state** — umu-run blocks until game exits, exit code tells if it succeeded
4. **Gamescope/Mangohud** — wrap the umu-run call with these tools:
  ```bash
  gamescope -f -- mangohud -- umu-run game.exe
  ```
5. **WINEPREFIX per game** — use a unique prefix per game installation to avoid conflicts
6. **GAMEID resolution** — OpenLauncher should map store + game title to umu-database ID when available, falling back to `umu-default`

## umu-database Structure

The umu-database contains game fixes mapped by:
- `game_id` — unique umu identifier
- `store` — which store the fix applies to (egs, gog, steam, none)
- `codename` — store-specific internal name (e.g., EGS's "Catnip" for Borderlands 3)

When launching a known game with a known store, pass `GAMEID` + `STORE` so protonfixes apply automatically.

## Relevant Links

- umu-launcher: https://github.com/Open-Wine-Components/umu-launcher
- umu-database: https://umu.openwinecomponents.org/
- umu-protonfixes: https://github.com/Open-Wine-Components/umu-protonfixes
- GE-Proton: https://github.com/GloriousEggroll/proton-ge-custom