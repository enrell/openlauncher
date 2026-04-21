import { describe, expect, mock, test } from "bun:test";
import { createCredentialRequestHandlers } from "./credentials";

describe("createCredentialRequestHandlers", () => {
	test("stores credentials through the credential chain", async () => {
		const credentialStore = {
			storeSecret: mock(async () => true),
			getSecret: mock(async () => null),
			deleteSecret: mock(async () => false),
		};
		const handlers = createCredentialRequestHandlers(credentialStore);

		expect(
			await handlers.credentialStore({ key: "rawg-api-key", value: "token" }),
		).toBe(true);
		expect(credentialStore.storeSecret).toHaveBeenCalledWith(
			"rawg-api-key",
			"token",
		);
	});

	test("gets and deletes credentials through the credential chain", async () => {
		const credentialStore = {
			storeSecret: mock(async () => false),
			getSecret: mock(async () => "token"),
			deleteSecret: mock(async () => true),
		};
		const handlers = createCredentialRequestHandlers(credentialStore);

		expect(await handlers.credentialGet({ key: "rawg-api-key" })).toBe("token");
		expect(await handlers.credentialDelete({ key: "rawg-api-key" })).toBe(true);
		expect(credentialStore.getSecret).toHaveBeenCalledWith("rawg-api-key");
		expect(credentialStore.deleteSecret).toHaveBeenCalledWith("rawg-api-key");
	});
});
