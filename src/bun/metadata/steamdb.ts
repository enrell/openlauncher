const STEAM_STORE_SEARCH = "https://store.steampowered.com/api/storesearch";

export interface SteamStoreSearchResult {
	id: number;
	type: string;
	name: string;
	metacritic_score: number | null;
	tiny_image: string;
	platforms: {
		windows: boolean;
		mac: boolean;
		linux: boolean;
	};
	drm_notice: string;
	is_local_file: boolean;
	is_subscription: boolean;
}

export interface SteamStoreSearchResponse {
	items: SteamStoreSearchResult[];
	total_count: number;
}

export class SteamDBClient {
	async search(query: string): Promise<
		{
			id: number;
			appid: number;
			type: string;
			name: string;
			deprecated: boolean;
			metadata: { types: string[]; categories: string[] };
			tiny_image: string;
		}[]
	> {
		const url = new URL(STEAM_STORE_SEARCH);
		url.searchParams.set("term", query);
		url.searchParams.set("l", "english");
		url.searchParams.set("cc", "US");

		try {
			const response = await fetch(url.toString(), {
				headers: {
					"User-Agent": "OpenLauncher/1.0",
					Accept: "application/json",
				},
			});
			if (!response.ok) {
				return [];
			}

			const data = (await response.json()) as SteamStoreSearchResponse;
			return (data.items ?? []).map((item) => ({
				id: item.id,
				appid: item.id,
				type: item.type,
				name: item.name,
				deprecated: false,
				metadata: { types: [], categories: [] },
				tiny_image: item.tiny_image,
			}));
		} catch {
			return [];
		}
	}
}
