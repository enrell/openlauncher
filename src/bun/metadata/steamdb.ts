const STEAMDB_API_URL = "https://steamdb.info/api/search/?q={query}&t=apps";

export interface SteamDBSearchResult {
	id: number;
	appid: number;
	type: string;
	name: string;
	deprecated: boolean;
	metadata: {
		types: string[];
		categories: string[];
	};
}

export interface SteamDBResponse {
	results: SteamDBSearchResult[];
}

export class SteamDBClient {
	async search(query: string): Promise<SteamDBSearchResult[]> {
		const url = STEAMDB_API_URL.replace("{query}", encodeURIComponent(query));

		try {
			const response = await fetch(url, {
				headers: {
					"User-Agent": "OpenLauncher/1.0",
				},
			});
			if (!response.ok) {
				return [];
			}

			const data = (await response.json()) as SteamDBResponse;
			return (data.results ?? []).slice(0, 8);
		} catch {
			return [];
		}
	}
}
