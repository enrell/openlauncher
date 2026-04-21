# bun:sqlite API Reference

## Overview

`bun:sqlite` is a high-performance synchronous SQLite3 driver built into Bun. It is 3-6x faster than better-sqlite3.

```ts
import { Database } from "bun:sqlite";
```

## Database Constructor

```ts
const db = new Database("mydb.sqlite");
const mem = new Database(":memory:"); // in-memory
const readonly = new Database("mydb.sqlite", { readonly: true });
const create = new Database("mydb.sqlite", { create: true });
const strict = new Database("mydb.sqlite", { strict: true }); // throws on missing params
const safeInts = new Database("mydb.sqlite", { safeIntegers: true }); // bigint returns
```

Options: `readonly`, `create`, `readwrite`, `strict`, `safeIntegers`

## Query API

```ts
const query = db.query("SELECT * FROM games WHERE id = $id");

// .all() - returns array of objects
const rows = query.all({ $id: 1 });

// .get() - returns first row or null
const row = query.get({ $id: 1 });

// .run() - execute without returning rows
const result = query.run({ $id: 1 });
// Returns: { lastInsertRowid: number, changes: number }

// .values() - returns array of arrays (raw values)
const vals = query.values({ $id: 1 });

// .iterate() - for large result sets
for (const row of query.iterate()) { ... }

// Class mapping
class Game { id: number; title: string; }
const games = db.query("SELECT id, title FROM games").as(Game).all();
```

## Parameters

Named: `$name`, `:name`, `@name` (prefix required unless `strict: true`)
Positional: `?1`, `?2` or unbound positional `?`

```ts
// strict mode (no prefix needed)
const db = new Database(":memory:", { strict: true });
query.all({ message: "hello" }); // binds to $message

// regular mode
query.all({ $message: "hello" });
query.all("hello"); // positional without name
```

## Transactions

```ts
const insert = db.prepare("INSERT INTO games (title) VALUES ($title)");
const insertAll = db.transaction(games => {
  for (const g of games) insert.run(g);
});
insertAll([{ $title: "Game 1" }, { $title: "Game 2" }]);

// isolation levels
insertAll(games);           // BEGIN
insertAll.deferred(games);   // BEGIN DEFERRED
insertAll.immediate(games);  // BEGIN IMMEDIATE
insertAll.exclusive(games); // BEGIN EXCLUSIVE
```

## WAL Mode

```ts
db.run("PRAGMA journal_mode = WAL;");

// Cleanup on close (macOS fix)
import { Database, constants } from "bun:sqlite";
db.fileControl(constants.SQLITE_FCNTL_PERSIST_WAL, 0);
db.run("PRAGMA wal_checkpoint(TRUNCATE);");
db.close();
```

## Statement Inspection

```ts
query.toString();      // expanded SQL with bound values
query.columnNames;     // ['id', 'title']
query.columnTypes;    // ['INTEGER', 'TEXT']
query.paramsCount;    // number of expected params
```

## Important Limitation: Encryption

**bun:sqlite does NOT support SQLCipher encrypted databases.** The underlying implementation is based on better-sqlite3 but without SQLCipher compiled in. Opening an encrypted database will fail silently or return corrupted data.

Options for encrypted storage:
1. **File-level encryption** with `@nicholasjordan/bun-encryption` or similar Bun-compatible crypto libraries
2. **Application-level encryption** — encrypt sensitive columns (store tokens, API keys) before writing to the database, decrypt on read
3. **Kernel keyring** — store encryption key in the Linux kernel keyring, use it to encrypt/decrypt data at the application layer

See: [GitHub Issue #11397](https://github.com/oven-sh/bun/issues/11397)

## Type Reference

```ts
class Database {
  constructor(filename: string, options?: number | {
    readonly?: boolean;
    create?: boolean;
    readwrite?: boolean;
    safeIntegers?: boolean;
    strict?: boolean;
  });
  query<ReturnType, ParamsType>(sql: string): Statement<ReturnType, ParamsType>;
  prepare<ReturnType, ParamsType>(sql: string): Statement<ReturnType, ParamsType>;
  run(sql: string, params?: SQLQueryBindings): { lastInsertRowid: number; changes: number };
  transaction(fn: (...args: any) => any): CallableFunction & {
    deferred: (...args: any) => void;
    immediate: (...args: any) => void;
    exclusive: (...args: any) => void;
  };
  loadExtension(name: string): void;
  fileControl(cmd: number, value: any): void;
  close(throwOnError?: boolean): void;
}

class Statement<ReturnType, ParamsType> {
  all(...params: ParamsType[]): ReturnType[];
  get(...params: ParamsType[]): ReturnType | null;
  run(...params: ParamsType[]): { lastInsertRowid: number; changes: number };
  values(...params: ParamsType[]): unknown[][];
  finalize(): void;
  toString(): string;
  as<T>(Class: new (...args: any[]) => T): Statement<T, ParamsType>;
}

type SQLQueryBindings =
  | string | bigint | TypedArray | number | boolean | null
  | Record<string, string | bigint | TypedArray | number | boolean | null>;
```