import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { RAWGGameDetails } from "../../shared/types/rawg";
import { createMetadataCache } from "./cache";

let database: Database;
let currentDate: Date;

beforeEach(() => {
	database = new Database(":memory:", { strict: true });
	currentDate = new Date("2026-01-01T00:00:00.000Z");
});

afterEach(() => {
	database.close();
});

describe("createMetadataCache", () => {
	test("stores and returns RAWG details from SQLite", () => {
		const cache = createMetadataCache(database, () => currentDate);
		const details = rawgDetails({ id: 42, name: "Elden Ring" });

		cache.set(42, details);

		expect(cache.get(42)).toEqual(details);
		const row = database
			.query<{ data: string | null; fetched_at: string | null }, [number]>(
				"SELECT data, fetched_at FROM metadata_cache WHERE rawg_id = ?;",
			)
			.get(42);
		expect(JSON.parse(row?.data ?? "{}")).toEqual(details);
		expect(row?.fetched_at).toBe("2026-01-01T00:00:00.000Z");
	});

	test("expires entries after the TTL", () => {
		const cache = createMetadataCache(database, () => currentDate);
		cache.set(7, rawgDetails({ id: 7 }));

		currentDate = new Date("2026-01-08T00:00:00.000Z");
		expect(cache.get(7)).not.toBeNull();

		currentDate = new Date("2026-01-09T00:00:00.000Z");
		expect(cache.get(7)).toBeNull();
	});

	test("upserts details for the same RAWG id", () => {
		const cache = createMetadataCache(database, () => currentDate);

		cache.set(10, rawgDetails({ id: 10, name: "Old Name" }));
		cache.set(10, rawgDetails({ id: 10, name: "New Name" }));

		expect(cache.get(10)?.name).toBe("New Name");
		const rows = database
			.query<{ count: number }, [number]>(
				"SELECT COUNT(*) AS count FROM metadata_cache WHERE rawg_id = ?;",
			)
			.get(10);
		expect(rows?.count).toBe(1);
	});

	test("returns null for invalid ids and malformed cache rows", () => {
		const cache = createMetadataCache(database, () => currentDate);

		expect(cache.get(0)).toBeNull();
		expect(() => cache.set(0, rawgDetails())).toThrow("Invalid RAWG id: 0");

		database
			.query(
				"INSERT INTO metadata_cache (rawg_id, data, fetched_at) VALUES (?, ?, ?);",
			)
			.run(99, "{broken", currentDate.toISOString());
		expect(cache.get(99)).toBeNull();
	});
});

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
