# Game Data Model

## Overview

This document describes the game data model for OpenLauncher. It defines what is stored in the local database and what is fetched from external sources.

## Core Entity: Game

```typescript
type Runner = 'native' | 'umu';

type Game = {
  // Identity
  id: string;                    // UUID, generated locally
  title: string;                // Display name

  // Execution
  runner: Runner;               // How to run the game
  path: string;                 // Executable path
  cwd?: string;                // Working directory override
  args?: string;               // Launch arguments
  env?: Record<string, string>; // Environment variables

  // Runtime overlays
  hooks?: {
    gamescope?: boolean;        // Wrap in gamescope session
    mangohud?: boolean;         // Show performance overlay
  };

  // Metadata (from RAWG or manual)
  coverImage?: string;          // Local path or RAWG URL
  description?: string;
  genre?: string;
  releaseDate?: string;
  developer?: string;
  publisher?: string;

  // Store association
  store?: 'steam' | 'gog' | 'epic' | 'manual';
  storeId?: string;            // Store-specific game ID

  // umu-specific (only for runner='umu')
  umu?: {
    gameId?: string;           // umu-database GAMEID
    store?: string;            // umu STORE env var
    protonPath?: string;       // Override proton path
    winePrefix?: string;       // Custom WINEPREFIX
  };
};
```

## Database Schema (SQLite)

```sql
CREATE TABLE games (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  runner      TEXT NOT NULL CHECK (runner IN ('native', 'umu')),
  path        TEXT NOT NULL,
  cwd         TEXT,
  args        TEXT,
  env         TEXT,             -- JSON-encoded Record<string, string>
  hooks       TEXT,              -- JSON-encoded { gamescope?: bool, mangohud?: bool }
  cover_image TEXT,
  description TEXT,
  genre       TEXT,
  release_date TEXT,
  developer   TEXT,
  publisher   TEXT,
  store       TEXT,
  store_id    TEXT,
  umu_game_id TEXT,
  umu_store   TEXT,
  umu_proton_path TEXT,
  umu_wine_prefix TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX idx_games_title ON games(title);
CREATE INDEX idx_games_runner ON games(runner);
CREATE INDEX idx_games_store ON games(store);
```

## Encryption Strategy

**IMPORTANT**: bun:sqlite does NOT support SQLCipher encrypted databases natively (see [GitHub Issue #11397](https://github.com/oven-sh/bun/issues/11397)).

**Recommended approach**: Application-level encryption for sensitive fields.

### Sensitive Fields
These should be encrypted before写入 database:
- Store authentication tokens (Steam, GOG, Epic)
- API keys
- Custom environment variables containing secrets

### Implementation
1. Generate a random DEK (Data Encryption Key) on first launch
2. Store DEK in the user's kernel keyring via `keyctl` syscall
3. Use the DEK to encrypt/decrypt sensitive fields using AES-256-GCM
4. Encrypted values stored as Base64-encoded strings in SQLite

```typescript
// Encryption flow
const kek = await getKeyFromKeyring();        // Master key from kernel keyring
const dek = await generateDEK();              // Random 256-bit key
await storeDEKinKeyring(dek);                 // DEK stored encrypted with KEK
// On write:
const encrypted = await encrypt(sensitive, dek);
db.run("UPDATE games SET env = $env WHERE id = $id", { $env: encrypted });
// On read:
const encrypted = query.get(...);
const decrypted = await decrypt(encrypted, dek);
```

This approach ensures:
- Database file is opaque without the key
- Key lives in kernel memory, not on disk
- No third-party dependencies beyond syscall bindings

### Simpler Alternative (MVP)

For initial development, store sensitive data in the kernel keyring only and reference it by key name in the database:

```sql
-- Store key names, not values
CREATE TABLE games (
  ...,
  steam_token_key TEXT,  -- References a key in the kernel keyring
  gog_token_key   TEXT,
  ...
);
```

## External Metadata (RAWG)

RAWG data is NOT stored permanently. It is fetched on demand and cached locally:

```typescript
type GameMetadata = {
  rawgId: number;
  coverUrl: string;
  description: string;
  genre: string[];
  developer: string;
  publisher: string;
  releaseDate: string;
  stores: { store: string; url: string }[];
};
```

Cache policy:
- Store RAWG response alongside the game record (as JSON or separate table)
- Refresh on user request (metadata refresh button)
- Never use RAWG as the source of truth for local game paths

## umu Launch Flow

### For `runner = 'umu'`:

```bash
# Construct environment
WINEPREFIX={game.umu.winePrefix || "$HOME/Games/umu/{game.umu.gameId || game.id}"}
GAMEID={game.umu.gameId || "umu-default"}
STORE={game.umu.store || "none"}
PROTONPATH={game.umu.protonPath || "GE-Proton"}
args="{game.path} {game.args}"

# Apply hooks if enabled
if game.hooks.gamescope:
  CMD="gamescope -f -- {CMD}"
if game.hooks.mangohud:
  CMD="mangohud -- {CMD}"

# Execute
umu-run {args}
```

### For `runner = 'native'`:

```bash
# Native Linux game
if game.hooks.mangohud:
  CMD="mangohud -- {CMD}"

execute(game.path, args, { cwd: game.cwd, env: game.env })
```

## Store Integration Notes

- Store credentials go in kernel keyring, never in database
- Store ID in database is for display/filtering, not authentication
- Launcher owns the execution model — store adapters are installers/providers only
- A game can be associated with multiple stores but has one primary executable path

## Migration Path

When the schema needs to change:
1. Add new columns with NULL defaults
2. Backfill NULLs with appropriate values
3. Once all rows are migrated, add NOT NULL constraints if needed
4. Clean up old columns in a later migration

Always use `ALTER TABLE` for schema changes. Never drop and recreate.