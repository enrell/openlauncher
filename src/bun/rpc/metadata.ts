import type { LauncherRPC } from "../../shared/rpc";
import { getSecret } from "../credentials";
import type { MetadataService } from "../metadata";

type MetadataGetSteamDetailsParams =
	LauncherRPC["bun"]["requests"]["metadataGetSteamDetails"]["params"];

const RAWG_API_KEY_SECRET = "rawg-api-key";

export function createMetadataRequestHandlers(
	metadataService: MetadataService,
) {
	return {
		metadataSearch: async ({ query }: { query: string }) => {
			const apiKey = await getSecret(RAWG_API_KEY_SECRET);
			if (apiKey?.trim()) {
				const results = await metadataService.searchRAWG(query);
				if (results.length > 0) {
					return results;
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
		metadataGetSteamDetails: ({ appId }: MetadataGetSteamDetailsParams) =>
			metadataService.getSteamDetails(appId),
	};
}
