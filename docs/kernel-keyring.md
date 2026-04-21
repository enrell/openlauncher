# Linux Kernel Keyring — Integration Guide

## What is the Kernel Keyring?

The Linux kernel keyring is a kernel-space facility for storing security data, encryption keys, and credentials. Keys live in kernel memory, are bound to a user session, and persist until explicitly removed or the system reboots.

**Advantages:**
- No daemons required (unlike GNOME Keyring or KWallet)
- Keys are kernel-protected — only the owning user/session can read them
- Survives process restarts within the same session
- No third-party library dependencies

**Key types relevant for OpenLauncher:**
- `user` — general-purpose key type for arbitrary byte payloads
- `keyring` — container that holds other keys

## Syscalls

Three syscalls handle all keyring operations:

```c
// Create or update a key, attach to a keyring
int add_key(const char *type, const char *desc, const void *payload, size_t plen, key_serial_t keyring);

// Find and load a key by description
key_serial_t request_key(const char *type, const char *desc, const char *callout_info, key_serial_t dest_keyring);

// Miscellaneous key operations (read, setperm, delete, etc.)
int keyctl(int operation, ...);
```

## Special Keyring Identifiers

| Symbol | Meaning |
|--------|---------|
| `@s` | Session keyring (lives for the login session) |
| `@u` | User keyring (persists across sessions for a UID) |
| `@p` | Persistent keyring (survives session logout, needs systemd) |
| `-1` | No keyring (cleared destination) |

`KEY_SPEC_SESSION_KEYRING`, `KEY_SPEC_USER_KEYRING`, etc. are the numeric constants.

## Bun FFI Approach (No Daemons)

Since Bun has `bun:ffi`, we can call the raw syscalls from TypeScript:

```typescript
import { C } from "bun:ffi";

// syscall numbers for x86_64 Linux
const SYS_ADD_KEY = 248;
const SYS_KEYCTL = 250;

// Key operations (keyctl command codes)
const KEYCTL_SET_TIMEOUT = 21;
const KEYCTL_GET_SECURITY = 22;
```

### Direct Syscall Wrappers

```typescript
// keyctl syscall wrapper
export function keyctl(op: number, ...args: unknown[]): number {
  return C.syscall(SYS_KEYCTL, op, ...args);
}

// add_key syscall wrapper  
export function addKey(
  type: string,      // "user" for userspace keys
  description: string,
  payload: Buffer,
  keyring: number    // KEY_SPEC_SESSION_KEYRING = -3
): number {
  return C.syscall(SYS_ADD_KEY, type, description, payload, payload.length, keyring);
}
```

### Complete Keyring Module

```typescript
import { C } from "bun:ffi";

// Linux syscall numbers
const SYS_ADD_KEY = 248;
const SYS_REQUEST_KEY = 249;
const SYS_KEYCTL = 250;

// keyctl operations
const KEYCTL_GET_KEYRING_ID = 0;
const KEYCTL_JOIN_SESSION_KEYRING = 1;
const KEYCTL_UPDATE = 2;
const KEYCTL_REVOKE = 3;
const KEYCTL_CHOWN = 4;
const KEYCTL_SETPERM = 5;
const KEYCTL_DESCRIBE = 6;
const KEYCTL_CLEAR = 7;
const KEYCTL_LINK = 8;
const KEYCTL_UNLINK = 9;
const KEYCTL_SEARCH = 10;
const KEYCTL_READ = 11;
const KEYCTL_INSTANTIATE = 12;
const KEYCTL_NEGATIVE = 13;
const KEYCTL_SETREQKEY_KEYRING = 14;
const KEYCTL_SET_TIMEOUT = 15;
const KEYCTL_ASSUME_AUTHORITY = 16;
const KEYCTL_GET_SECURITY = 17;
const KEYCTL_SESSION_TO_PARENT = 18;
const KEYCTL_REJECT = 19;
const KEYCTL_INSTANTIATE_IOV = 20;
const KEYCTL_SET_TIMEOUT_ARGS = 21;
const KEYCTL_MOVE = 22;
const KEYCTL_GET_PERSISTENT = 23;
const KEYCTL_GET_SECURITY_OR_SET_TIMEOUT = 24;
const KEYCTL_REVOKE_AUTHORITY = 25;

// Special keyring IDs
const KEY_SPEC_SESSION_KEYRING = -3;
const KEY_SPEC_USER_KEYRING = -4;
const KEY_SPEC_THREAD_KEYRING = -1;
const KEY_SPEC_PROCESS_KEYRING = -2;

export function keyctl(op: number, ...args: unknown[]): number {
  return C.syscall(SYS_KEYCTL, op, ...args) as number;
}

export function addKey(
  type: string,
  description: string,
  payload: Buffer,
  keyring: number = KEY_SPEC_SESSION_KEYRING
): number {
  return C.syscall(
    SYS_ADD_KEY,
    type,
    description,
    payload,
    payload.length,
    keyring
  ) as number;
}

// Read a key's payload
export function readKey(keyId: number): Buffer | null {
  const size = keyctl(KEYCTL_READ, keyId, 0, 0, 0, 0);
  if (size <= 0) return null;
  
  const buf = Buffer.alloc(size);
  const bytesRead = keyctl(KEYCTL_READ, keyId, buf, size, 0);
  if (bytesRead < 0) return null;
  return buf;
}

// Update an existing key
export function updateKey(keyId: number, payload: Buffer): boolean {
  return keyctl(KEYCTL_UPDATE, keyId, payload, payload.length) === 0;
}

// Delete a key
export function revokeKey(keyId: number): boolean {
  return keyctl(KEYCTL_REVOKE, keyId) === 0;
}

// Search for a key by type + description
export function searchKey(
  keyring: number,
  type: string,
  description: string,
  destKeyring: number = 0
): number {
  return keyctl(
    KEYCTL_SEARCH,
    keyring,
    type,
    description,
    destKeyring
  ) as number;
}

// Get keyring ID (creates if doesn't exist when options is 1)
export function getKeyringId(keyring: number, create: number = 0): number {
  return keyctl(KEYCTL_GET_KEYRING_ID, keyring, create) as number;
}
```

## Usage Example

```typescript
import { addKey, readKey, updateKey, revokeKey, searchKey, KEY_SPEC_SESSION_KEYRING } from "./keyring";

// Store a secret
const secret = Buffer.from("my-api-token", "utf8");
const keyId = addKey("user", "openlauncher:steam-token", secret, KEY_SPEC_SESSION_KEYRING);

// Retrieve a secret
const retrieved = readKey(keyId);
if (retrieved) {
  console.log("Secret:", retrieved.toString("utf8"));
}

// Or search by description
const found = searchKey(KEY_SPEC_SESSION_KEYRING, "user", "openlauncher:steam-token");
if (found > 0) {
  const data = readKey(found);
}

// Update existing secret
updateKey(found, Buffer.from("new-token", "utf8"));

// Delete when done
revokeKey(found);
```

## Alternative: libsecret (secret-tool)

If kernel keyring access fails (sandboxed environment or permission issues), fall back to `secret-tool` via `Bun.spawn`:

```typescript
import { spawn } from "bun";

export async function getSecretFallback(name: string): Promise<string | null> {
  const proc = spawn({
    cmd: ["secret-tool", "lookup", "service", name],
    stdout: "pipe",
  });
  const output = await new Response(proc.stdout).text();
  return output.trim() || null;
}

export async function setSecretFallback(name: string, value: string): Promise<void> {
  const proc = spawn({
    cmd: ["secret-tool", "store", "--label", `openlauncher:${name}`, "service", name],
    stdin: "pipe",
  });
  await new Response(proc.stdin).arrayBuffer(); // close stdin
  await proc.exited;
}
```

`secret-tool` uses D-Bus to communicate with GNOME Keyring or KWallet. It requires a running keyring daemon but provides a simpler API and is more portable across desktop environments.

## Persistent Storage Across Sessions

The user keyring (`@u` or `KEY_SPEC_USER_KEYRING`) persists across login sessions for a given UID but is destroyed on logout. For truly persistent secrets (survives reboot), use:

1. **Persistent keyring (`@p`)** — requires systemd to manage, cleared on reboot
2. **Encrypted file** — store encrypted blob on disk, key in kernel keyring
3. **secret-tool** — backed by GNOME Keyring/KWallet, survives reboot

For OpenLauncher MVP, use session keyring (`@s`) for launch credentials that don't need to survive logout.

## Key Permissions

By default, keys are only accessible to the creating process. To share keys with child processes:

```bash
# Make key readable by process with matching UID
keyctl setperm KEY_ID 0x3f3f3f3f  # 0x3f3f3f3f = all permissions for associated UID
```

In code:
```typescript
// Set permissions (uid all + others none)
// 0x01000000 | 0x3f3f3f3f = 0x3f3f3f3f (UID all, others none)
keyctl(KEYCTL_SETPERM, keyId, 0x3f3f3f3f);
```

## Limitations & Gotchas

1. **Key size limits** — kernel keys have size limits (usually a few KB). For large secrets, store a reference handle, not the full secret.

2. **Session lifetime** — keys in `@s` are destroyed when the session ends. Keys in `@u` survive session but not logout.

3. **Sandbox restrictions** — Flatpak and some sandboxed environments block `keyctl` syscalls. Fall back to secret-tool in these cases.

4. **No encryption at rest** — the kernel keyring itself is not encrypted on disk. Keys are stored in kernel memory only. For data-at-rest encryption, combine with application-level encryption.

5. **keyctl syscall wrapper** — glibc doesn't provide a wrapper for `keyctl()`. You must use the raw syscall via `bun:ffi`.

## OpenLauncher Implementation Notes

For OpenLauncher's credential storage:

1. **Primary**: kernel keyring via FFI `add_key`/`keyctl`
2. **Fallback**: `secret-tool` via `Bun.spawn`
3. **Detection**: try kernel keyring first, catch exceptions, fall back to libsecret

```typescript
// Detection pattern
function getSecret(name: string): string | null {
  try {
    return readFromKeyring(name);
  } catch {
    return getSecretFallback(name); // secret-tool
  }
}
```

Store credentials with descriptive names:
- `openlauncher:steam-token`
- `openlauncher:gog-session`
- `openlauncher:decryption-key` (DEK for database encryption)

## References

- Kernel docs: `/usr/share/doc/linux-doc/security/keys-core.html`
- `man add_key`, `man keyctl`, `man keyrings`
- Go keyctl packages: `github.com/jsipprell/keyctl`, `github.com/99designs/keyring`
- Bun FFI: `bun.com/docs/runtime/ffi`