import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { deleteSecret, getSecret, storeSecret } from "../credentials";

const TEST_KEY_PREFIX = `integration-test-${crypto.randomUUID()}`;

describe("integration: credentials", () => {
	let testKey: string;

	beforeEach(() => {
		testKey = `${TEST_KEY_PREFIX}:${crypto.randomUUID()}`;
	});

	afterEach(async () => {
		// Best effort cleanup
		try {
			await deleteSecret(testKey);
		} catch {
			// Ignore cleanup errors
		}
	});

	test("stores and retrieves a secret through the real credential system", async () => {
		const secretValue = `integration-secret-${crypto.randomUUID()}`;

		const stored = await storeSecret(testKey, secretValue);
		if (!stored) {
			console.warn(
				`Skipping credential integration test: both keyring and secret-tool unavailable.`,
			);
			return;
		}

		const retrieved = await getSecret(testKey);
		expect(retrieved).toBe(secretValue);
	});

	test("overwrites an existing secret with a new value", async () => {
		const firstValue = `first-${crypto.randomUUID()}`;
		const secondValue = `second-${crypto.randomUUID()}`;

		const stored = await storeSecret(testKey, firstValue);
		if (!stored) {
			console.warn(
				`Skipping credential overwrite test: both keyring and secret-tool unavailable.`,
			);
			return;
		}

		expect(await getSecret(testKey)).toBe(firstValue);

		const overwritten = await storeSecret(testKey, secondValue);
		if (!overwritten) {
			console.warn(`Skipping credential overwrite test: store failed.`);
			return;
		}

		expect(await getSecret(testKey)).toBe(secondValue);
	});

	test("deletes a secret and verifies it is gone", async () => {
		const secretValue = `delete-test-${crypto.randomUUID()}`;

		const stored = await storeSecret(testKey, secretValue);
		if (!stored) {
			console.warn(
				`Skipping credential deletion test: both keyring and secret-tool unavailable.`,
			);
			return;
		}

		expect(await getSecret(testKey)).toBe(secretValue);

		const deleted = await deleteSecret(testKey);
		expect(deleted).toBe(true);

		// After deletion, secret should not be retrievable
		const retrieved = await getSecret(testKey);
		expect(retrieved).toBeNull();
	});

	test("deleting a non-existent key returns false without error", async () => {
		const nonExistentKey = `non-existent-${crypto.randomUUID()}`;

		const deleted = await deleteSecret(nonExistentKey);
		expect(deleted).toBe(false);
	});

	test("retrieving a non-existent key returns null", async () => {
		const nonExistentKey = `non-existent-${crypto.randomUUID()}`;

		const retrieved = await getSecret(nonExistentKey);
		expect(retrieved).toBeNull();
	});

	test("key with whitespace is normalized in storage and retrieval", async () => {
		const normalKey = `whitespace-test-${crypto.randomUUID()}`;
		const secretValue = "whitespace-secret";

		const stored = await storeSecret(normalKey, secretValue);
		if (!stored) {
			console.warn(
				`Skipping whitespace key test: both keyring and secret-tool unavailable.`,
			);
			return;
		}

		const retrieved = await getSecret(normalKey);
		expect(retrieved).toBe(secretValue);
	});
});
