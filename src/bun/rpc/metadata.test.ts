import { describe, expect, mock, test } from "bun:test";
import type {
	RAWGGameDetails,
	RAWGSearchResult,
} from "../../shared/types/rawg";
import type { MetadataService } from "../metadata";
import { createMetadataRequestHandlers } from "./metadata";

describe("createMetadataRequestHandlers", () => {
	test("forwards metadata search requests to the metadata service", async () => {
		const results = [rawgResult({ id: 1, name: "Hades" })];
		const service: MetadataService = {
			searchRAWG: mock(async () => results),
			getGameDetails: mock(async () => null),
		};
		const handlers = createMetadataRequestHandlers(service);

		expect(await handlers.metadataSearch({ query: "Hades" })).toEqual(results);
		expect(service.searchRAWG).toHaveBeenCalledWith("Hades");
	});

	test("forwards details requests and refresh flags to the metadata service", async () => {
		const details = rawgDetails({ id: 2, name: "Celeste" });
		const service: MetadataService = {
			searchRAWG: mock(async () => []),
			getGameDetails: mock(async () => details),
		};
		const handlers = createMetadataRequestHandlers(service);

		expect(
			await handlers.metadataGetDetails({ rawgId: 2, refresh: true }),
		).toEqual(details);
		expect(service.getGameDetails).toHaveBeenCalledWith(2, { refresh: true });
	});
});

function rawgResult(
	overrides: Partial<RAWGSearchResult> = {},
): RAWGSearchResult {
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
		...overrides,
	};
}

function rawgDetails(
	overrides: Partial<RAWGGameDetails> = {},
): RAWGGameDetails {
	return {
		...rawgResult(),
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
