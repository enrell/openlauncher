import {
	deleteKeyringSecret,
	getKeyringSecret,
	storeKeyringSecret,
} from "./keyring";
import {
	deleteSecretToolSecret,
	getSecretToolSecret,
	storeSecretToolSecret,
} from "./secret_tool";

const DEK_KEY = "decryption-key";
const DEK_BYTES = 32;
let cachedDEK: Uint8Array | null = null;

export async function getSecret(key: string): Promise<string | null> {
	const keyringSecret = tryKeyring(() => getKeyringSecret(key));
	if (keyringSecret !== null) {
		return keyringSecret;
	}

	return getSecretToolSecret(key);
}

export async function storeSecret(
	key: string,
	value: string,
): Promise<boolean> {
	const storedInKeyring = tryKeyring(() => storeKeyringSecret(key, value));
	if (storedInKeyring) {
		return true;
	}

	return storeSecretToolSecret(key, value);
}

export async function deleteSecret(key: string): Promise<boolean> {
	const deletedFromKeyring = tryKeyring(() => deleteKeyringSecret(key));
	if (deletedFromKeyring) {
		return true;
	}

	return deleteSecretToolSecret(key);
}

export async function ensureDEK(): Promise<Uint8Array> {
	if (cachedDEK) {
		return cachedDEK;
	}

	const storedDEK = await getSecret(DEK_KEY);
	if (storedDEK) {
		cachedDEK = Uint8Array.from(Buffer.from(storedDEK, "base64"));
		return cachedDEK;
	}

	const generatedDEK = crypto.getRandomValues(new Uint8Array(DEK_BYTES));
	const encodedDEK = Buffer.from(generatedDEK).toString("base64");
	const stored = await storeSecret(DEK_KEY, encodedDEK);
	if (!stored) {
		throw new Error("Unable to store OpenLauncher data encryption key.");
	}

	cachedDEK = generatedDEK;
	return cachedDEK;
}

function tryKeyring<T>(operation: () => T): T | null {
	try {
		return operation();
	} catch {
		return null;
	}
}
