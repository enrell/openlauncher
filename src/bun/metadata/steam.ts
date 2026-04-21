export interface SteamAppDetails {
	success: boolean;
	data?: {
		type: string;
		name: string;
		steam_appid: number;
		required_age: string;
		is_free: boolean;
		detailed_description: string;
		about_the_game: string;
		supported_languages: string;
		header_image: string;
		capsule_image: string;
		capsule_imagev5: string;
		library_background: string;
		library_hero: string;
		library_header: string;
		max_width: number;
		header_size: { width: number; height: number };
		capsule_size: { width: number; height: number };
		hero_size: { width: number; height: number };
		icon: string;
		logo: string;
		logo_size: { width: number; height: number };
		client_manifests: string[];
		platforms: {
			windows: boolean;
			mac: boolean;
			linux: boolean;
		};
		categories: { id: string; description: string }[];
		genres: { id: string; description: string }[];
		release_date: {
			coming_soon: boolean;
			date: string;
		};
		developers: string[];
		publishers: string[];
		price_overview?: {
			currency: string;
			initial: number;
			final: number;
			discount_percent: number;
		};
		media: {
			minimum: { width: number; height: number };
			maximum: { width: number; height: number };
		};
	};
}

const BASE_URL = "https://store.steampowered.com/api/appdetails";

export class SteamClient {
	async getDetails(appId: number): Promise<SteamAppDetails | null> {
		const url = new URL(BASE_URL);
		url.searchParams.set("appids", appId.toString());
		url.searchParams.set("l", "english");
		url.searchParams.set("cc", "US");

		try {
			const response = await fetch(url);
			if (!response.ok) {
				return null;
			}

			const data = (await response.json()) as Record<string, SteamAppDetails>;
			const appData = data[appId.toString()];
			return appData ?? null;
		} catch {
			return null;
		}
	}
}
