import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

export function encrypt(plaintext: string, key: Uint8Array): string {
	const nonce = randomBytes(NONCE_BYTES);
	const cipher = createCipheriv(ALGORITHM, key, nonce);
	const ciphertext = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([nonce, tag, ciphertext]).toString("base64");
}

export function decrypt(ciphertext: string, key: Uint8Array): string {
	const data = Buffer.from(ciphertext, "base64");
	const nonce = data.subarray(0, NONCE_BYTES);
	const tag = data.subarray(NONCE_BYTES, NONCE_BYTES + TAG_BYTES);
	const encrypted = data.subarray(NONCE_BYTES + TAG_BYTES);
	const decipher = createDecipheriv(ALGORITHM, key, nonce);
	decipher.setAuthTag(tag);
	return Buffer.concat([
		decipher.update(encrypted),
		decipher.final(),
	]).toString("utf8");
}

export function isEncrypted(value: string): boolean {
	return value.startsWith("enc:");
}

export function wrapEncrypted(plaintext: string, key: Uint8Array): string {
	return "enc:" + encrypt(plaintext, key);
}

export function unwrapEncrypted(value: string, key: Uint8Array): string {
	if (!isEncrypted(value)) {
		throw new Error("Value is not encrypted");
	}
	return decrypt(value.slice(4), key);
}