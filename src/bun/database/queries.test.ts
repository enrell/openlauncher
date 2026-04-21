import type { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { NewGame } from "../../shared/types/game";
import { closeLauncherDatabase, openLauncherDatabase } from "./db";
import { createGameRepository, type GameRepository } from "./queries";

let database: Database;
let repository: GameRepository;

beforeEach(() => {
	database = openLauncherDatabase(":memory:");
	repository = createGameRepository(database);
});

afterEach(() => {
	closeLauncherDatabase(database);
});

describe("createGameRepository", () => {
	test("inserts games with normalized values and transforms stored rows", () => {
		const game = repository.createGame({
			title: "  Celeste  ",
			runner: "native",
			path: "  /games/celeste/run.sh  ",
			cwd: "  /games/celeste  ",
			args: "  --fullscreen --language en  ",
			env: { MANGOHUD_CONFIG: "fps_limit=60" },
			hooks: { mangohud: true, gamescope: false },
			coverImage: "  https://img.example/celeste.jpg  ",
			description: "  Precision platformer  ",
			genre: "  Platformer  ",
			releaseDate: "  2018-01-25  ",
			developer: "  Maddy Makes Games  ",
			publisher: "  Maddy Makes Games  ",
			store: "manual",
			storeId: "  local-celeste  ",
			umu: {
				gameId: " ",
				store: " ",
				protonPath: " ",
				winePrefix: " ",
			},
		});

		expect(game.title).toBe("Celeste");
		expect(game.path).toBe("/games/celeste/run.sh");
		expect(game.cwd).toBe("/games/celeste");
		expect(game.hooks).toEqual({ mangohud: true, gamescope: false });
		expect(game.umu).toBeUndefined();
		expect(typeof game.createdAt).toBe("string");
		expect(typeof game.updatedAt).toBe("string");

		const rawRow = database
			.query<
				{
					env_json: string | null;
					hooks_json: string | null;
					cover_image: string | null;
					store_id: string | null;
				},
				[string]
			>(
				"SELECT env_json, hooks_json, cover_image, store_id FROM games WHERE id = ?;",
			)
			.get(game.id);
		expect(rawRow?.env_json).toBe(
			JSON.stringify({ MANGOHUD_CONFIG: "fps_limit=60" }),
		);
		expect(rawRow?.hooks_json).toBe(
			JSON.stringify({ mangohud: true, gamescope: false }),
		);
		expect(rawRow?.cover_image).toBe("https://img.example/celeste.jpg");
		expect(rawRow?.store_id).toBe("local-celeste");

		const storedGame = repository.getGame(game.id);
		expect(storedGame).toEqual({
			...game,
			hooks: { mangohud: true, gamescope: undefined },
		});
	});

	test("lists games sorted case-insensitively by title", () => {
		const zed = repository.createGame(nativeGame({ title: "zed" }));
		const alpha = repository.createGame(nativeGame({ title: "Alpha" }));
		const alphaLower = repository.createGame(nativeGame({ title: "alpha" }));

		expect(repository.listGames().map((game) => game.id)).toEqual([
			alpha.id,
			alphaLower.id,
			zed.id,
		]);
	});

	test("updates existing games and preserves immutable fields", () => {
		const game = repository.createGame(nativeGame({ title: "Original" }));
		const updated = repository.updateGame(game.id, {
			title: "  Updated  ",
			env: { ENABLE_LOGS: "1" },
			hooks: { gamescope: true },
			umu: {
				gameId: "umu-game",
				store: "gog",
				protonPath: "GE-Proton9-20",
				winePrefix: "/prefixes/umu-game",
			},
		});

		expect(updated).toMatchObject({
			id: game.id,
			title: "Updated",
			env: { ENABLE_LOGS: "1" },
			hooks: { gamescope: true },
			umu: {
				gameId: "umu-game",
				store: "gog",
				protonPath: "GE-Proton9-20",
				winePrefix: "/prefixes/umu-game",
			},
			createdAt: game.createdAt,
		});
		expect(typeof updated?.updatedAt).toBe("string");
		expect(repository.updateGame("missing", { title: "Nope" })).toBeNull();
	});

	test("deletes games by id", () => {
		const game = repository.createGame(nativeGame({ title: "Delete Me" }));

		expect(repository.deleteGame(game.id)).toBe(true);
		expect(repository.getGame(game.id)).toBeNull();
		expect(repository.deleteGame(game.id)).toBe(false);
	});

	test("rejects invalid required fields", () => {
		expect(() =>
			repository.createGame(nativeGame({ title: " ", path: "/bin/true" })),
		).toThrow("Game title is required.");
		expect(() =>
			repository.createGame(nativeGame({ title: "Broken", path: " " })),
		).toThrow("Executable path is required.");
		expect(() =>
			repository.createGame({
				...nativeGame({ title: "Broken" }),
				runner: "wine" as "native",
			}),
		).toThrow("Unsupported runner: wine");
	});
});

function nativeGame(overrides: Partial<NewGame> = {}): NewGame {
	return {
		title: "Test Game",
		runner: "native",
		path: "/bin/true",
		...overrides,
	};
}
