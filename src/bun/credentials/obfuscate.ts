const OBFUSCATION_KEY = "openlauncher-meta-v1";

export function obfuscate(plaintext: string): string {
	const keyBytes = new TextEncoder().encode(OBFUSCATION_KEY);
	const textBytes = new TextEncoder().encode(plaintext);
	const result = new Uint8Array(textBytes.length);

	for (let i = 0; i < textBytes.length; i++) {
		result[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
	}

	return Buffer.from(result).toString("base64");
}

export function deobfuscate(encoded: string): string {
	const keyBytes = new TextEncoder().encode(OBFUSCATION_KEY);
	const data = Buffer.from(encoded, "base64");
	const result = new Uint8Array(data.length);

	for (let i = 0; i < data.length; i++) {
		result[i] = data[i] ^ keyBytes[i % keyBytes.length];
	}

	return new TextDecoder().decode(result);
}

export function frontendObfuscate(plaintext: string): string {
	return obfuscate(plaintext);
}

export function frontendDeobfuscate(encoded: string): string {
	try {
		return deobfuscate(encoded);
	} catch {
		return encoded;
	}
}
