import type { LauncherRPC } from "../../shared/rpc";
import { deleteSecret, getSecret, storeSecret } from "../credentials";
import { obfuscate, tryDeobfuscate } from "../credentials/obfuscate";
import type { MetadataService } from "../metadata";

type MetadataGetSteamDetailsParams =
	LauncherRPC["bun"]["requests"]["metadataGetDetails"]["params"];

const RAWG_API_KEY_SECRET = "rawg-api-key";
const METADATA_SOURCE_SECRET = "metadata-source";

export function createMetadataRequestHandlers(
	metadataService: MetadataService,
) {
	return {
		metadataSearch: async ({ query }: { query: string }) => {
			const source = await getMetadataSource();
			const rawgKey = await getRawgApiKey();

			if (source === "rawg" || source === "auto") {
				if (rawgKey?.trim()) {
					const results = await metadataService.searchRAWG(query);
					if (results.length > 0) {
						return results;
					}
				}
			}

			return metadataService.searchSteam(query);
		},
		metadataSearchSteam: ({ query }: { query: string }) =>
			metadataService.searchSteam(query),
		metadataGetDetails: ({
			rawgId,
			refresh,
		}: {
			rawgId: number;
			refresh?: boolean;
		}) => metadataService.getGameDetails(rawgId, { refresh }),
		metadataGetSteamDetails: ({ appId }: { appId: number }) =>
			metadataService.getSteamDetails(appId),
		metadataSourceGet: async () => {
			const source = await getSecret(METADATA_SOURCE_SECRET);
			if (source === "rawg" || source === "steam" || source === "auto") {
				return source;
			}
			return "auto";
		},
		metadataSourceSet: async ({
			source,
		}: {
			source: "rawg" | "steam" | "auto";
		}) => {
			await storeSecret(METADATA_SOURCE_SECRET, source);
			return true;
		},
		rawgKeyStore: async ({ key }: { key: string }) => {
			await storeSecret(RAWG_API_KEY_SECRET, obfuscate(key.trim()));
			return true;
		},
		rawgKeyGet: async () => {
			const stored = await getSecret(RAWG_API_KEY_SECRET);
			return tryDeobfuscate(stored);
		},
		rawgKeyDelete: async () => {
			await deleteSecret(RAWG_API_KEY_SECRET);
			return true;
		},
	};
}

async function getRawgApiKey(): Promise<string | null> {
	const stored = await getSecret(RAWG_API_KEY_SECRET);
	return tryDeobfuscate(stored);
}

async function getMetadataSource(): Promise<"rawg" | "steam" | "auto"> {
	const source = await getSecret(METADATA_SOURCE_SECRET);
	if (source === "rawg" || source === "steam" || source === "auto") {
		return source;
	}
	return "auto";
}
