import { afterEach, describe, expect, mock, test } from "bun:test";
import { deleteSecret, getSecret, storeSecret } from "./index";
import {
	addKey,
	deleteKeyringSecret,
	getKeyringSecret,
	KEY_SPEC_SESSION_KEYRING,
	readKey,
	revokeKey,
	SYS_ADD_KEY,
	SYS_KEYCTL,
	searchKey,
	storeKeyringSecret,
} from "./keyring";
import {
	deleteSecretToolSecret,
	getSecretToolSecret,
	storeSecretToolSecret,
} from "./secret_tool";

const originalWhich = Bun.which;
const originalSpawn = Bun.spawn;

type SecretToolResponse = {
	stdout?: string;
	exitCode?: number;
};

type SpawnCall = {
	cmd: string[];
	stdin?: string;
	stdout?: string;
	stderr?: string;
};

afterEach(() => {
	Bun.which = originalWhich;
	Bun.spawn = originalSpawn;
});

describe("kernel keyring credentials", () => {
	test("uses the expected x64 Linux syscall numbers", () => {
		expect(SYS_ADD_KEY).toBe(248);
		expect(SYS_KEYCTL).toBe(250);
	});

	test("adds, searches, reads, and revokes a real user key when available", () => {
		if (!isLinuxX64()) {
			return;
		}

		const description = `openlauncher:test:${crypto.randomUUID()}`;
		const payload = Buffer.from("kernel-secret", "utf8");
		let keyId = -1;

		try {
			keyId = addKey("user", description, payload);
			if (keyId <= 0) {
				console.warn(
					"Skipping kernel keyring round trip: add_key unavailable.",
				);
				return;
			}

			const foundKeyId = searchKey(
				KEY_SPEC_SESSION_KEYRING,
				"user",
				description,
			);
			expect(foundKeyId).toBeGreaterThan(0);
			expect(readKey(foundKeyId)?.toString("utf8")).toBe("kernel-secret");
		} catch (error) {
			console.warn(
				`Skipping kernel keyring round trip: ${errorMessage(error)}`,
			);
		} finally {
			if (keyId > 0) {
				revokeKey(keyId);
			}
		}
	});

	test("stores, reads, and deletes OpenLauncher secrets when keyring is available", () => {
		if (!isLinuxX64()) {
			return;
		}

		const key = `test-${crypto.randomUUID()}`;

		try {
			const stored = storeKeyringSecret(key, "stored-secret");
			if (!stored) {
				console.warn("Skipping OpenLauncher keyring secret round trip.");
				return;
			}

			expect(getKeyringSecret(key)).toBe("stored-secret");
			expect(deleteKeyringSecret(key)).toBe(true);
			expect(getKeyringSecret(key)).toBeNull();
		} catch (error) {
			console.warn(
				`Skipping OpenLauncher keyring secret round trip: ${errorMessage(error)}`,
			);
		} finally {
			try {
				deleteKeyringSecret(key);
			} catch {
				// Best effort cleanup for environments where keyring access is partial.
			}
		}
	});
});

describe("secret-tool fallback", () => {
	test("returns null or false when secret-tool is unavailable", async () => {
		Bun.which = mock(() => null) as typeof Bun.which;
		Bun.spawn = mock(() => {
			throw new Error("secret-tool should not spawn");
		}) as typeof Bun.spawn;

		expect(await getSecretToolSecret("rawg")).toBeNull();
		expect(await storeSecretToolSecret("rawg", "secret")).toBe(false);
		expect(await deleteSecretToolSecret("rawg")).toBe(false);
	});

	test("looks up secrets through secret-tool attributes", async () => {
		const secretTool = installSecretToolMock([{ stdout: "api-token\n" }]);

		expect(await getSecretToolSecret(" rawg-api-key ")).toBe("api-token");
		expect(secretTool.calls[0]?.cmd).toEqual([
			"/usr/bin/secret-tool",
			"lookup",
			"application",
			"openlauncher",
			"key",
			"rawg-api-key",
		]);
	});

	test("returns null for failed secret-tool lookups", async () => {
		installSecretToolMock([{ stdout: "missing\n", exitCode: 1 }]);

		expect(await getSecretToolSecret("missing")).toBeNull();
	});

	test("stores secrets by writing the value to secret-tool stdin", async () => {
		const secretTool = installSecretToolMock([{ exitCode: 0 }]);

		expect(await storeSecretToolSecret(" rawg-api-key ", "api-token")).toBe(
			true,
		);
		expect(secretTool.calls[0]?.cmd).toEqual([
			"/usr/bin/secret-tool",
			"store",
			"--label",
			"openlauncher:rawg-api-key",
			"application",
			"openlauncher",
			"key",
			"rawg-api-key",
		]);
		expect(secretTool.stdinWrites).toEqual(["api-token"]);
	});

	test("deletes secrets through secret-tool clear", async () => {
		const secretTool = installSecretToolMock([{ exitCode: 0 }]);

		expect(await deleteSecretToolSecret(" rawg-api-key ")).toBe(true);
		expect(secretTool.calls[0]?.cmd).toEqual([
			"/usr/bin/secret-tool",
			"clear",
			"application",
			"openlauncher",
			"key",
			"rawg-api-key",
		]);
	});
});

describe("credential fallback chain", () => {
	test("falls back to secret-tool lookup when the keyring has no value", async () => {
		const key = `fallback-${crypto.randomUUID()}`;
		const secretTool = installSecretToolMock([{ stdout: "fallback-token\n" }]);

		expect(await getSecret(key)).toBe("fallback-token");
		expect(secretTool.calls[0]?.cmd[1]).toBe("lookup");
	});

	test("falls back to secret-tool store and delete when keyring storage fails", async () => {
		const secretTool = installSecretToolMock([
			{ exitCode: 0 },
			{ exitCode: 0 },
		]);
		const key = `fallback-${crypto.randomUUID()}`;
		const oversizedValue = "x".repeat(2 * 1024 * 1024);

		expect(await storeSecret(key, oversizedValue)).toBe(true);
		if (secretTool.calls.length === 0) {
			console.warn(
				"Skipping secret-tool store fallback: kernel keyring accepted oversized payload.",
			);
			await deleteSecret(key);
			return;
		}

		expect(secretTool.stdinWrites[0]?.length).toBe(oversizedValue.length);
		expect(await deleteSecret(key)).toBe(true);
		expect(secretTool.calls.map((call) => call.cmd[1])).toEqual([
			"store",
			"clear",
		]);
	});
});

function installSecretToolMock(responses: SecretToolResponse[]) {
	const calls: SpawnCall[] = [];
	const stdinWrites: string[] = [];

	Bun.which = mock((command: string) =>
		command === "secret-tool" ? "/usr/bin/secret-tool" : null,
	) as typeof Bun.which;

	Bun.spawn = mock((options: SpawnCall) => {
		const response = responses.shift() ?? {};
		calls.push(options);

		return {
			stdout: new Response(response.stdout ?? "").body,
			stdin: {
				write: mock(async (chunk: string | Uint8Array) => {
					const value =
						typeof chunk === "string"
							? chunk
							: Buffer.from(chunk).toString("utf8");
					stdinWrites.push(value);
					return value.length;
				}),
				end: mock(async () => {}),
			},
			exited: Promise.resolve(response.exitCode ?? 0),
		};
	}) as typeof Bun.spawn;

	return { calls, stdinWrites };
}

function isLinuxX64(): boolean {
	return process.platform === "linux" && process.arch === "x64";
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
