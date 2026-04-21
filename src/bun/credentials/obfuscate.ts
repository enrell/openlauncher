const OBFUSCATION_KEY = "openlauncher-meta-v1";
const STORAGE_PREFIX = "v1:";

export function obfuscate(plaintext: string): string {
	const keyBytes = new TextEncoder().encode(OBFUSCATION_KEY);
	const textBytes = new TextEncoder().encode(plaintext);
	const result = new Uint8Array(textBytes.length);

	for (let i = 0; i < textBytes.length; i++) {
		result[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
	}

	return STORAGE_PREFIX + Buffer.from(result).toString("base64");
}

export function deobfuscate(encoded: string): string {
	if (!encoded.startsWith(STORAGE_PREFIX)) {
		throw new Error("Invalid format - not obfuscated");
	}

	const data = encoded.slice(STORAGE_PREFIX.length);
	const keyBytes = new TextEncoder().encode(OBFUSCATION_KEY);
	const decoded = Buffer.from(data, "base64");
	const result = new Uint8Array(decoded.length);

	for (let i = 0; i < decoded.length; i++) {
		result[i] = decoded[i] ^ keyBytes[i % keyBytes.length];
	}

	return new TextDecoder().decode(result);
}

export function tryDeobfuscate(encoded: string | null): string | null {
	if (!encoded) return null;

	// If it's not obfuscated (old format before v1), return as-is
	if (!encoded.startsWith(STORAGE_PREFIX)) {
		return encoded;
	}

	try {
		return deobfuscate(encoded);
	} catch {
		// If deobfuscate fails, return as-is (shouldn't happen)
		return encoded;
	}
}
