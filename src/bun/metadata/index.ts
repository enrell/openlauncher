import type { Database } from "bun:sqlite";
import type {
	RAWGGameDetails,
	RAWGSearchResult,
} from "../../shared/types/rawg";
import { getSecret } from "../credentials";
import { createMetadataCache, type MetadataCache } from "./cache";
import { RAWGClient } from "./client";

const RAWG_API_KEY_SECRET = "rawg-api-key";

export type MetadataService = {
	searchRAWG(query: string): Promise<RAWGSearchResult[]>;
	getGameDetails(
		rawgId: number,
		options?: { refresh?: boolean },
	): Promise<RAWGGameDetails | null>;
};

type MetadataServiceOptions = {
	getApiKey?: () => Promise<string | null>;
	now?: () => Date;
};

export function createMetadataService(
	database: Database,
	options: MetadataServiceOptions = {},
): MetadataService {
	const metadataCache = createMetadataCache(database, options.now);
	const getApiKey = options.getApiKey ?? (() => getSecret(RAWG_API_KEY_SECRET));

	return {
		async searchRAWG(query: string) {
			const searchQuery = normalizeSearchQuery(query);
			if (!searchQuery) {
				return [];
			}

			const client = await createClient(getApiKey);
			if (!client) {
				return [];
			}

			try {
				const searchResponse = await client.search(searchQuery);
				return searchResponse.results;
			} catch (error) {
				console.warn("RAWG search failed.", formatError(error));
				return [];
			}
		},

		async getGameDetails(
			rawgId: number,
			requestOptions: { refresh?: boolean } = {},
		) {
			if (!isValidRawgId(rawgId)) {
				return null;
			}

			if (requestOptions.refresh !== true) {
				const cachedDetails = metadataCache.get(rawgId);
				if (cachedDetails) {
					return cachedDetails;
				}
			}

			const client = await createClient(getApiKey);
			if (!client) {
				return null;
			}

			try {
				const gameDetails = await client.getDetails(rawgId);
				cacheGameDetails(metadataCache, rawgId, gameDetails);
				return gameDetails;
			} catch (error) {
				console.warn("RAWG details lookup failed.", formatError(error));
				return null;
			}
		},
	};
}

async function createClient(
	getApiKey: () => Promise<string | null>,
): Promise<RAWGClient | null> {
	const apiKey = (await getApiKey())?.trim();
	return apiKey ? new RAWGClient(apiKey) : null;
}

function normalizeSearchQuery(query: string): string | null {
	const trimmedQuery = query.trim();
	return trimmedQuery || null;
}

function isValidRawgId(rawgId: number): boolean {
	return Number.isInteger(rawgId) && rawgId > 0;
}

function cacheGameDetails(
	metadataCache: MetadataCache,
	rawgId: number,
	gameDetails: RAWGGameDetails,
): void {
	try {
		metadataCache.set(rawgId, gameDetails);
	} catch (error) {
		console.warn("RAWG cache write failed.", formatError(error));
	}
}

function formatError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
