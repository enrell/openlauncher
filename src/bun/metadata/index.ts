import type { Database } from "bun:sqlite";
import type {
	RAWGGameDetails,
	RAWGSearchResult,
} from "../../shared/types/rawg";
import { getSecret } from "../credentials";
import { createMetadataCache, type MetadataCache } from "./cache";
import { RAWGClient } from "./client";
import { SteamClient } from "./steam";
import { SteamDBClient } from "./steamdb";

const RAWG_API_KEY_SECRET = "rawg-api-key";

export type MetadataService = {
	searchRAWG(query: string): Promise<RAWGSearchResult[]>;
	getGameDetails(
		rawgId: number,
		options?: { refresh?: boolean },
	): Promise<RAWGGameDetails | null>;
	searchSteam(query: string): Promise<RAWGSearchResult[]>;
	getSteamDetails(appId: number): Promise<RAWGSearchResult | null>;
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

	const steamDbClient = new SteamDBClient();
	const steamClient = new SteamClient();

	return {
		async searchRAWG(query: string) {
			const searchQuery = normalizeSearchQuery(query);
			if (!searchQuery) {
				return [];
			}

			const client = await createRAWGClient(getApiKey);
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

			const client = await createRAWGClient(getApiKey);
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

		async searchSteam(query: string) {
			const searchQuery = normalizeSearchQuery(query);
			if (!searchQuery) {
				return [];
			}

			try {
				const steamDbResults = await steamDbClient.search(searchQuery);
				return steamDbResults.map((r) => {
					// Try library_hero first, fallback to tiny_image capsule
					const heroImage = `https://cdn.steamstatic.com/steam/apps/${r.id}/library_hero.jpg`;
					return {
						id: r.id,
						name: r.name,
						slug: "",
						released: null,
						background_image: heroImage,
						rating: 0,
						metacritic: r.metacritic_score ?? null,
						genres: [],
						platforms: [
							...(r.platforms?.windows
								? [
										{
											platform: { id: 0, name: "Windows", slug: "windows" },
											requirements: null,
										},
									]
								: []),
							...(r.platforms?.mac
								? [
										{
											platform: { id: 0, name: "Mac", slug: "mac" },
											requirements: null,
										},
									]
								: []),
							...(r.platforms?.linux
								? [
										{
											platform: { id: 0, name: "Linux", slug: "linux" },
											requirements: null,
										},
									]
								: []),
						],
						stores: [],
					};
				});
			} catch (error) {
				console.warn("Steam search failed.", formatError(error));
				return [];
			}
		},

		async getSteamDetails(appId: number) {
			try {
				const details = await steamClient.getDetails(appId);
				if (!details?.success || !details.data) {
					return null;
				}

				const d = details.data;
				return {
					id: d.steam_appid,
					name: d.name,
					slug: "",
					released: d.release_date.date,
					background_image: d.header_image,
					rating: 0,
					metacritic: null,
					genres: d.genres.map((g) => ({
						id: parseInt(g.id, 10),
						name: g.description,
						slug: "",
					})),
					platforms: [
						{
							platform: { id: 0, name: "Windows", slug: "windows" },
							requirements: null,
						},
						...(d.platforms.mac
							? [
									{
										platform: { id: 0, name: "Mac", slug: "mac" },
										requirements: null,
									},
								]
							: []),
						...(d.platforms.linux
							? [
									{
										platform: { id: 0, name: "Linux", slug: "linux" },
										requirements: null,
									},
								]
							: []),
					],
					stores: [{ store: { id: 0, name: "Steam", slug: "steam" } }],
				};
			} catch (error) {
				console.warn("Steam details lookup failed.", formatError(error));
				return null;
			}
		},
	};
}

async function createRAWGClient(
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
