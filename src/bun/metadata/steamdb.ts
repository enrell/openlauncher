const CHEAPSHARK_SEARCH_URL = "https://www.cheapshark.com/api/1.0/games.php";

export interface CheapSharkSearchResult {
	gameID: string;
	name: string;
	steamAppID: string;
	salePrice: string;
	normalPrice: string;
	savings: string;
	thumb: string;
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
		}[]
	> {
		const url = new URL(CHEAPSHARK_SEARCH_URL);
		url.searchParams.set("title", query);
		url.searchParams.set("limit", "8");

		try {
			const response = await fetch(url.toString(), {
				headers: {
					"User-Agent": "OpenLauncher/1.0",
				},
			});
			if (!response.ok) {
				return [];
			}

			const data = (await response.json()) as CheapSharkSearchResult[];
			return data.map((r) => ({
				id: parseInt(r.steamAppID || r.gameID, 10) || 0,
				appid: parseInt(r.steamAppID || r.gameID, 10) || 0,
				type: "game",
				name: r.name,
				deprecated: false,
				metadata: { types: [], categories: [] },
			}));
		} catch {
			return [];
		}
	}
}
