import { afterEach, describe, expect, mock, test } from "bun:test";
import type {
	RAWGGameDetails,
	RAWGSearchResponse,
} from "../../shared/types/rawg";
import { BASE_URL, RAWGClient } from "./client";

const originalFetch = globalThis.fetch;

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe("RAWGClient", () => {
	test("requires a non-empty API key", () => {
		expect(() => new RAWGClient(" ")).toThrow("RAWG API key is required.");
	});

	test("searches RAWG with the expected games URL and query params", async () => {
		const fetchMock = installFetchMock(searchResponse());
		const client = new RAWGClient(" test-key ");

		const response = await client.search("Elden Ring");

		expect(response.results[0]?.name).toBe("Elden Ring");
		const url = fetchMock.urls[0];
		expect(url?.origin + url?.pathname).toBe(`${BASE_URL}/games`);
		expect(url?.searchParams.get("key")).toBe("test-key");
		expect(url?.searchParams.get("search")).toBe("Elden Ring");
		expect(url?.toString()).toBe(
			"https://api.rawg.io/api/games?key=test-key&search=Elden+Ring",
		);
	});

	test("gets RAWG details by id with the expected URL", async () => {
		const fetchMock = installFetchMock(rawgDetails({ id: 3498 }));
		const client = new RAWGClient("test-key");

		const response = await client.getDetails(3498);

		expect(response.id).toBe(3498);
		const url = fetchMock.urls[0];
		expect(url?.origin + url?.pathname).toBe(`${BASE_URL}/games/3498`);
		expect(url?.searchParams.get("key")).toBe("test-key");
	});

	test("supports a custom base URL for local HTTP mocks", async () => {
		const fetchMock = installFetchMock(searchResponse());
		const client = new RAWGClient("test-key", "http://127.0.0.1:4455/mock");

		await client.search("Hades");

		expect(fetchMock.urls[0]?.toString()).toBe(
			"http://127.0.0.1:4455/mock/games?key=test-key&search=Hades",
		);
	});

	test("throws when RAWG responds with a non-ok status", async () => {
		globalThis.fetch = mock(async () => {
			return new Response("unavailable", {
				status: 503,
				statusText: "Service Unavailable",
			});
		}) as typeof fetch;

		const client = new RAWGClient("test-key");

		await expect(client.search("Elden Ring")).rejects.toThrow(
			"RAWG request failed with 503 Service Unavailable.",
		);
	});
});

function installFetchMock(responseBody: unknown) {
	const urls: URL[] = [];

	globalThis.fetch = mock(async (input: RequestInfo | URL) => {
		const url = input instanceof URL ? input : new URL(String(input));
		urls.push(url);
		return Response.json(responseBody);
	}) as typeof fetch;

	return { urls };
}

function searchResponse(): RAWGSearchResponse {
	return {
		count: 1,
		next: null,
		previous: null,
		results: [rawgDetails({ id: 3498, name: "Elden Ring" })],
	};
}

function rawgDetails(
	overrides: Partial<RAWGGameDetails> = {},
): RAWGGameDetails {
	return {
		id: 1,
		name: "Test Game",
		slug: "test-game",
		released: "2024-01-01",
		background_image: "https://img.example/test.jpg",
		rating: 4.5,
		metacritic: 90,
		genres: [{ id: 4, name: "Action" }],
		platforms: [{ platform: { id: 1, name: "PC" } }],
		stores: [{ store: { id: 1, name: "Steam" } }],
		description: "A test game.",
		background_image_additional: null,
		developers: [{ id: 100, name: "Developer" }],
		publishers: [{ id: 200, name: "Publisher" }],
		tags: [{ id: 300, name: "Tag" }],
		website: "https://example.com",
		metacritic_url: "https://metacritic.example/test",
		playtime: 12,
		ratings_count: 50,
		tba: false,
		...overrides,
	};
}
