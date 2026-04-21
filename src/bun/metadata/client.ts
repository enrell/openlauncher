import type {
	RAWGGameDetails,
	RAWGSearchResponse,
} from "../../shared/types/rawg";

export const BASE_URL = "https://api.rawg.io/api";

export class RAWGClient {
	private readonly apiKey: string;
	private readonly baseUrl: string;

	constructor(apiKey: string, baseUrl = BASE_URL) {
		const trimmedApiKey = apiKey.trim();
		if (!trimmedApiKey) {
			throw new Error("RAWG API key is required.");
		}

		this.apiKey = trimmedApiKey;
		this.baseUrl = baseUrl;
	}

	search(query: string): Promise<RAWGSearchResponse> {
		const url = this.buildUrl("/games", { search: query });
		return fetchRAWG<RAWGSearchResponse>(url);
	}

	getDetails(rawgId: number): Promise<RAWGGameDetails> {
		const url = this.buildUrl(`/games/${rawgId}`);
		return fetchRAWG<RAWGGameDetails>(url);
	}

	private buildUrl(path: string, params: Record<string, string> = {}): URL {
		const baseUrl = this.baseUrl.endsWith("/")
			? this.baseUrl
			: `${this.baseUrl}/`;
		const normalizedPath = path.replace(/^\/+/, "");
		const url = new URL(normalizedPath, baseUrl);
		url.searchParams.set("key", this.apiKey);

		for (const [paramName, paramValue] of Object.entries(params)) {
			url.searchParams.set(paramName, paramValue);
		}

		return url;
	}
}

async function fetchRAWG<ResponseBody>(url: URL): Promise<ResponseBody> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`RAWG request failed with ${response.status} ${response.statusText}.`,
		);
	}

	return (await response.json()) as ResponseBody;
}
