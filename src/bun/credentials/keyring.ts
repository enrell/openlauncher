import { dlopen, FFIType, ptr } from "bun:ffi";

export const SYS_ADD_KEY_X64 = 248;
export const SYS_KEYCTL_X64 = 250;
export const SYS_ADD_KEY = SYS_ADD_KEY_X64;
export const SYS_KEYCTL = SYS_KEYCTL_X64;

const KEYCTL_REVOKE = 3;
const KEYCTL_SEARCH = 10;
const KEYCTL_READ = 11;

export const KEY_SPEC_SESSION_KEYRING = -3;
const KEY_TYPE_USER = "user";
const KEY_PREFIX = "openlauncher:";

type Syscall = (
	syscallNumber: number,
	arg1: number,
	arg2: number,
	arg3: number,
	arg4: number,
	arg5: number,
	arg6: number,
) => number | bigint;

type KeyringSyscalls = {
	symbols: {
		syscall: Syscall;
	};
};

let syscalls: KeyringSyscalls | null = null;

export function getKeyringSecret(key: string): string | null {
	const keyId = searchSecretKey(key);
	if (keyId <= 0) {
		return null;
	}

	const payload = readKeyPayload(keyId);
	return payload?.toString("utf8") ?? null;
}

export function storeKeyringSecret(key: string, value: string): boolean {
	const payload = Buffer.from(value, "utf8");
	const keyId = addUserKey(secretDescription(key), payload);
	return keyId > 0;
}

export function deleteKeyringSecret(key: string): boolean {
	const keyId = searchSecretKey(key);
	if (keyId <= 0) {
		return false;
	}

	return revokeKey(keyId);
}

function addUserKey(description: string, payload: Buffer): number {
	return addKey(KEY_TYPE_USER, description, payload, KEY_SPEC_SESSION_KEYRING);
}

function searchSecretKey(key: string): number {
	return searchKey(
		KEY_SPEC_SESSION_KEYRING,
		KEY_TYPE_USER,
		secretDescription(key),
	);
}

function readKeyPayload(keyId: number): Buffer | null {
	return readKey(keyId);
}

export function addKey(
	keyType: string,
	description: string,
	payload: Buffer,
	keyring = KEY_SPEC_SESSION_KEYRING,
): number {
	const loadedSyscalls = getSyscalls();
	const encodedKeyType = toCString(keyType);
	const encodedDescription = toCString(description);

	return syscallResult(
		loadedSyscalls.symbols.syscall(
			SYS_ADD_KEY_X64,
			ptr(encodedKeyType),
			ptr(encodedDescription),
			ptr(payload),
			payload.byteLength,
			keyring,
			0,
		),
	);
}

export function searchKey(
	keyring: number,
	keyType: string,
	description: string,
	destinationKeyring = 0,
): number {
	const loadedSyscalls = getSyscalls();
	const encodedKeyType = toCString(keyType);
	const encodedDescription = toCString(description);

	return syscallResult(
		loadedSyscalls.symbols.syscall(
			SYS_KEYCTL_X64,
			KEYCTL_SEARCH,
			keyring,
			ptr(encodedKeyType),
			ptr(encodedDescription),
			destinationKeyring,
			0,
		),
	);
}

export function readKey(keyId: number): Buffer | null {
	const loadedSyscalls = getSyscalls();
	const size = syscallResult(
		loadedSyscalls.symbols.syscall(
			SYS_KEYCTL_X64,
			KEYCTL_READ,
			keyId,
			0,
			0,
			0,
			0,
		),
	);

	if (size < 0) {
		return null;
	}

	const payload = Buffer.alloc(size);
	const bytesRead = syscallResult(
		loadedSyscalls.symbols.syscall(
			SYS_KEYCTL_X64,
			KEYCTL_READ,
			keyId,
			ptr(payload),
			payload.byteLength,
			0,
			0,
		),
	);

	if (bytesRead < 0) {
		return null;
	}

	return payload.subarray(0, bytesRead);
}

export function revokeKey(keyId: number): boolean {
	const loadedSyscalls = getSyscalls();
	return (
		syscallResult(
			loadedSyscalls.symbols.syscall(
				SYS_KEYCTL_X64,
				KEYCTL_REVOKE,
				keyId,
				0,
				0,
				0,
				0,
			),
		) === 0
	);
}

function getSyscalls(): KeyringSyscalls {
	if (!syscalls) {
		syscalls = loadSyscalls();
	}
	return syscalls;
}

function loadSyscalls(): KeyringSyscalls {
	if (process.platform !== "linux" || process.arch !== "x64") {
		throw new Error("Kernel keyring FFI is only configured for x64 Linux.");
	}

	return dlopen("libc.so.6", {
		syscall: {
			args: [
				FFIType.i64,
				FFIType.i64,
				FFIType.i64,
				FFIType.i64,
				FFIType.i64,
				FFIType.i64,
				FFIType.i64,
			],
			returns: FFIType.i64,
		},
	}) as unknown as KeyringSyscalls;
}

function secretDescription(key: string): string {
	const trimmedKey = key.trim();
	if (!trimmedKey) {
		throw new Error("Credential key is required.");
	}
	return trimmedKey.startsWith(KEY_PREFIX)
		? trimmedKey
		: `${KEY_PREFIX}${trimmedKey}`;
}

function toCString(value: string): Uint8Array {
	return new TextEncoder().encode(`${value}\0`);
}

function syscallResult(value: number | bigint): number {
	return Number(value);
}
