import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type {
	RAWGGameDetails,
	RAWGSearchResponse,
} from "../../shared/types/rawg";
import { createMetadataService } from "./index";

const originalFetch = globalThis.fetch;
const originalWarn = console.warn;

let database: Database;
let currentDate: Date;

beforeEach(() => {
	database = new Database(":memory:", { strict: true });
	currentDate = new Date("2026-01-01T00:00:00.000Z");
	console.warn = mock(() => {}) as typeof console.warn;
});

afterEach(() => {
	database.close();
	globalThis.fetch = originalFetch;
	console.warn = originalWarn;
});

describe("createMetadataService", () => {
	test("searchRAWG trims queries and returns RAWG search results", async () => {
		const fetchMock = installFetchQueue([searchResponse("Elden Ring")]);
		const service = createMetadataService(database, {
			getApiKey: async () => "test-key",
		});

		const results = await service.searchRAWG("  Elden Ring  ");

		expect(results.map((result) => result.name)).toEqual(["Elden Ring"]);
		expect(fetchMock.urls[0]?.toString()).toBe(
			"https://api.rawg.io/api/games?key=test-key&search=Elden+Ring",
		);
	});

	test("searchRAWG returns an empty list without query or API key", async () => {
		const fetchMock = installFetchQueue([searchResponse("Unused")]);
		const serviceWithoutKey = createMetadataService(database, {
			getApiKey: async () => null,
		});

		expect(await serviceWithoutKey.searchRAWG("Elden Ring")).toEqual([]);
		expect(await serviceWithoutKey.searchRAWG(" ")).toEqual([]);
		expect(fetchMock.urls.length).toBe(0);
	});

	test("searchRAWG handles RAWG failures without throwing", async () => {
		globalThis.fetch = mock(async () => {
			return new Response("denied", {
				status: 401,
				statusText: "Unauthorized",
			});
		}) as typeof fetch;
		const service = createMetadataService(database, {
			getApiKey: async () => "bad-key",
		});

		expect(await service.searchRAWG("Elden Ring")).toEqual([]);
		expect(console.warn).toHaveBeenCalled();
	});

	test("getGameDetails caches misses and returns cached details on later reads", async () => {
		const fetchMock = installFetchQueue([
			rawgDetails({ id: 42, name: "Fetched Game" }),
		]);
		const service = createMetadataService(database, {
			getApiKey: async () => "test-key",
			now: () => currentDate,
		});

		const fetched = await service.getGameDetails(42);
		const cached = await service.getGameDetails(42);

		expect(fetched?.name).toBe("Fetched Game");
		expect(cached).toEqual(fetched);
		expect(fetchMock.urls.length).toBe(1);
		expect(fetchMock.urls[0]?.toString()).toBe(
			"https://api.rawg.io/api/games/42?key=test-key",
		);
	});

	test("getGameDetails refresh bypasses a populated cache", async () => {
		const fetchMock = installFetchQueue([
			rawgDetails({ id: 42, name: "Cached Game" }),
			rawgDetails({ id: 42, name: "Refreshed Game" }),
		]);
		const service = createMetadataService(database, {
			getApiKey: async () => "test-key",
			now: () => currentDate,
		});

		await service.getGameDetails(42);
		const refreshed = await service.getGameDetails(42, { refresh: true });

		expect(refreshed?.name).toBe("Refreshed Game");
		expect(fetchMock.urls.length).toBe(2);
	});

	test("getGameDetails returns null for invalid ids, missing keys, and failures", async () => {
		const fetchMock = installFetchQueue([rawgDetails({ id: 42 })]);
		const serviceWithoutKey = createMetadataService(database, {
			getApiKey: async () => null,
		});

		expect(await serviceWithoutKey.getGameDetails(0)).toBeNull();
		expect(await serviceWithoutKey.getGameDetails(42)).toBeNull();
		expect(fetchMock.urls.length).toBe(0);

		globalThis.fetch = mock(async () => {
			return new Response("down", {
				status: 503,
				statusText: "Service Unavailable",
			});
		}) as typeof fetch;
		const service = createMetadataService(database, {
			getApiKey: async () => "test-key",
		});

		expect(await service.getGameDetails(42, { refresh: true })).toBeNull();
		expect(console.warn).toHaveBeenCalled();
	});
});

function installFetchQueue(responseBodies: unknown[]) {
	const urls: URL[] = [];

	globalThis.fetch = mock(async (input: RequestInfo | URL) => {
		const url = input instanceof URL ? input : new URL(String(input));
		urls.push(url);
		const body = responseBodies.shift();
		return Response.json(body);
	}) as typeof fetch;

	return { urls };
}

function searchResponse(name: string): RAWGSearchResponse {
	return {
		count: 1,
		next: null,
		previous: null,
		results: [rawgDetails({ id: 3498, name })],
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
