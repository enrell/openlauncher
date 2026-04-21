const STEAMGRID_BOTTLES_API = "https://steamgrid.usebottles.com/api/search";

export class SteamGridBottlesClient {
	async search(title: string): Promise<string[]> {
		const url = `${STEAMGRID_BOTTLES_API}/${encodeURIComponent(title)}`;

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 3500);

			const response = await fetch(url, {
				signal: controller.signal,
				headers: {
					Accept: "application/json, */*",
				},
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				return [];
			}

			const text = await response.text();
			const trimmed = text.trim();

			// Direct URL string response
			if (trimmed.startsWith("http")) {
				return [trimmed];
			}

			// Try JSON parse
			try {
				const parsed = JSON.parse(trimmed);

				// If it's already a string (JSON string literal), treat as URL
				if (typeof parsed === "string") {
					return parsed.startsWith("http") ? [parsed] : [];
				}

				// JSON array of URLs
				if (Array.isArray(parsed)) {
					return parsed.filter(
						(item): item is string =>
							typeof item === "string" && item.startsWith("http"),
					);
				}

				// JSON object with image fields
				if (parsed && typeof parsed === "object") {
					const urls: string[] = [];
					if (parsed.grid) urls.push(parsed.grid);
					if (parsed.hero) urls.push(parsed.hero);
					if (parsed.icon) urls.push(parsed.icon);
					if (parsed.logo) urls.push(parsed.logo);
					return urls;
				}
			} catch {
				// Not JSON
			}

			return [];
		} catch {
			return [];
		}
	}
}

export const steamGridBottlesClient = new SteamGridBottlesClient();