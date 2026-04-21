const SECRET_TOOL = "secret-tool";
const APPLICATION_ATTRIBUTE = "application";
const APPLICATION_VALUE = "openlauncher";
const KEY_ATTRIBUTE = "key";

export async function getSecretToolSecret(key: string): Promise<string | null> {
	const secretToolPath = Bun.which(SECRET_TOOL);
	if (!secretToolPath) {
		return null;
	}

	const subprocess = Bun.spawn({
		cmd: [
			secretToolPath,
			"lookup",
			APPLICATION_ATTRIBUTE,
			APPLICATION_VALUE,
			KEY_ATTRIBUTE,
			normalizeKey(key),
		],
		stdout: "pipe",
		stderr: "ignore",
	});

	const output = await new Response(subprocess.stdout).text();
	const exitCode = await subprocess.exited;
	if (exitCode !== 0) {
		return null;
	}

	return output.trim() || null;
}

export async function storeSecretToolSecret(
	key: string,
	value: string,
): Promise<boolean> {
	const secretToolPath = Bun.which(SECRET_TOOL);
	if (!secretToolPath) {
		return false;
	}

	const subprocess = Bun.spawn({
		cmd: [
			secretToolPath,
			"store",
			"--label",
			`openlauncher:${normalizeKey(key)}`,
			APPLICATION_ATTRIBUTE,
			APPLICATION_VALUE,
			KEY_ATTRIBUTE,
			normalizeKey(key),
		],
		stdin: "pipe",
		stdout: "ignore",
		stderr: "ignore",
	});

	await subprocess.stdin.write(value);
	await subprocess.stdin.end();

	return (await subprocess.exited) === 0;
}

export async function deleteSecretToolSecret(key: string): Promise<boolean> {
	const secretToolPath = Bun.which(SECRET_TOOL);
	if (!secretToolPath) {
		return false;
	}

	const subprocess = Bun.spawn({
		cmd: [
			secretToolPath,
			"clear",
			APPLICATION_ATTRIBUTE,
			APPLICATION_VALUE,
			KEY_ATTRIBUTE,
			normalizeKey(key),
		],
		stdout: "ignore",
		stderr: "ignore",
	});

	return (await subprocess.exited) === 0;
}

function normalizeKey(key: string): string {
	const trimmedKey = key.trim();
	if (!trimmedKey) {
		throw new Error("Credential key is required.");
	}
	return trimmedKey;
}
