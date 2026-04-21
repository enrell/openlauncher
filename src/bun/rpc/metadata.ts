import type { LauncherRPC } from "../../shared/rpc";
import type { MetadataService } from "../metadata";

type MetadataSearchParams =
	LauncherRPC["bun"]["requests"]["metadataSearch"]["params"];
type MetadataGetDetailsParams =
	LauncherRPC["bun"]["requests"]["metadataGetDetails"]["params"];

export function createMetadataRequestHandlers(
	metadataService: MetadataService,
) {
	return {
		metadataSearch: ({ query }: MetadataSearchParams) =>
			metadataService.searchRAWG(query),
		metadataGetDetails: ({ rawgId, refresh }: MetadataGetDetailsParams) =>
			metadataService.getGameDetails(rawgId, { refresh }),
	};
}
