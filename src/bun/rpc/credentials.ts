import { deleteSecret, getSecret, storeSecret } from "../credentials";

type CredentialStore = {
	storeSecret(key: string, value: string): Promise<boolean>;
	getSecret(key: string): Promise<string | null>;
	deleteSecret(key: string): Promise<boolean>;
};

const defaultCredentialStore: CredentialStore = {
	storeSecret,
	getSecret,
	deleteSecret,
};

export function createCredentialRequestHandlers(
	credentialStore: CredentialStore = defaultCredentialStore,
) {
	return {
		credentialStore: async ({ key, value }: { key: string; value: string }) =>
			credentialStore.storeSecret(key, value),
		credentialGet: async ({ key }: { key: string }) =>
			credentialStore.getSecret(key),
		credentialDelete: async ({ key }: { key: string }) =>
			credentialStore.deleteSecret(key),
	};
}
