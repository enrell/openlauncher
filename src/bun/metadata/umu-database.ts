const UMU_DATABASE_API = "https://umu.openwinecomponents.org/database";

export interface UmuDatabaseGame {
	id: string;
	name: string;
	stores: Array<{
		store: string;
		codename: string;
	}>;
}

export interface UmuDatabaseSearchResult {
	games: UmuDatabaseGame[];
}

export class UmuDatabaseClient {
	async searchByTitle(
		title: string,
		store: string,
	): Promise<UmuDatabaseGame | null> {
		const url = `${UMU_DATABASE_API}/search?title=${encodeURIComponent(title)}&store=${encodeURIComponent(store)}`;

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);

			const response = await fetch(url, {
				signal: controller.signal,
				headers: {
					Accept: "application/json",
				},
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				return null;
			}

			const data = (await response.json()) as UmuDatabaseSearchResult;
			return data.games?.[0] ?? null;
		} catch {
			return null;
		}
	}

	getCodename(game: UmuDatabaseGame, store: string): string | null {
		const normalizedStore = normalizeStore(store);
		const entry = game.stores.find((s) => s.store === normalizedStore);
		return entry?.codename ?? null;
	}
}

function normalizeStore(store: string): string {
	if (store === "epic") return "egs";
	if (store === "manual") return "none";
	return store;
}

export const umuDatabaseClient = new UmuDatabaseClient();

export async function resolveUmuGameId(
	title: string,
	store: string,
): Promise<string | null> {
	const game = await umuDatabaseClient.searchByTitle(title, store);
	if (!game) return null;
	return umuDatabaseClient.getCodename(game, store);
}