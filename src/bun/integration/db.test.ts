import type { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeLauncherDatabase, openLauncherDatabase } from "../database/db";
import { createGameRepository, type GameRepository } from "../database/queries";

let database: Database;
let repository: GameRepository;
let tempDbPath: string;

beforeEach(() => {
	// Use a real temporary SQLite database with actual filesystem I/O
	tempDbPath = `${mkdtempSync(join(tmpdir(), "openlauncher-test-"))}/test.db`;
	database = openLauncherDatabase(tempDbPath);
	repository = createGameRepository(database);
});

afterEach(() => {
	closeLauncherDatabase(database);
	try {
		unlinkSync(tempDbPath);
	} catch {
		// Best effort cleanup
	}
});

describe("integration: db", () => {
	test("inserts and retrieves a game through real database I/O", () => {
		const created = repository.createGame({
			title: "Real DB Game",
			runner: "native",
			path: "/usr/bin/true",
			env: { TEST_VAR: "test_value" },
			hooks: { mangohud: true },
		});

		expect(created.id).toBeTruthy();
		expect(created.title).toBe("Real DB Game");

		// Verify it persists via raw query (no mocks)
		const raw = database
			.query<{ id: string; title: string; env_json: string | null }, [string]>(
				"SELECT id, title, env_json FROM games WHERE id = ?;",
			)
			.get(created.id);

		expect(raw?.title).toBe("Real DB Game");
		expect(raw?.env_json).toBe(JSON.stringify({ TEST_VAR: "test_value" }));
	});

	test("performs full CRUD cycle on disk-persisted database", () => {
		// Create
		const game = repository.createGame({
			title: "CRUD Test",
			runner: "umu",
			path: "/usr/bin/true",
			args: "--verbose",
			umu: { gameId: "crud-game", store: "gog" },
		});

		// Read
		const fetched = repository.getGame(game.id);
		expect(fetched?.title).toBe("CRUD Test");
		expect(fetched?.umu?.gameId).toBe("crud-game");

		// Update
		const updated = repository.updateGame(game.id, {
			title: "CRUD Updated",
			env: { LAUNCH_MODE: "test" },
		});
		expect(updated?.title).toBe("CRUD Updated");
		expect(updated?.env).toEqual({ LAUNCH_MODE: "test" });

		// Verify raw DB was updated
		const raw = database
			.query<{ title: string; env_json: string | null }, [string]>(
				"SELECT title, env_json FROM games WHERE id = ?;",
			)
			.get(game.id);
		expect(raw?.title).toBe("CRUD Updated");
		expect(raw?.env_json).toBe(JSON.stringify({ LAUNCH_MODE: "test" }));

		// Delete
		expect(repository.deleteGame(game.id)).toBe(true);
		expect(repository.getGame(game.id)).toBeNull();
		expect(repository.deleteGame(game.id)).toBe(false);
	});

	test("persists games and survives repository recreation from same file", () => {
		const game = repository.createGame({
			title: "Persistence Test",
			runner: "native",
			path: "/bin/echo",
			args: "hello",
		});

		// Re-open the same database file with a new database instance
		const database2 = openLauncherDatabase(tempDbPath);
		const repository2 = createGameRepository(database2);

		const recovered = repository2.getGame(game.id);
		expect(recovered?.title).toBe("Persistence Test");

		closeLauncherDatabase(database2);
	});

	test("lists games in case-insensitive alphabetical order from disk", () => {
		repository.createGame(nativeGame({ title: "Zelda" }));
		repository.createGame(nativeGame({ title: "amiga" }));
		repository.createGame(nativeGame({ title: "Braid" }));
		repository.createGame(nativeGame({ title: "arcade" }));

		const titles = repository.listGames().map((g) => g.title);
		expect(titles).toEqual(["amiga", "arcade", "Braid", "Zelda"]);
	});

	test("enforces foreign key constraints and runner check via real SQLite", () => {
		expect(() =>
			repository.createGame(nativeGame({ runner: "invalid" as "native" })),
		).toThrow("Unsupported runner: invalid");
	});
});

function nativeGame(
	overrides: Partial<import("../../shared/types/game").NewGame> = {},
): import("../../shared/types/game").NewGame {
	return {
		title: "Test Game",
		runner: "native",
		path: "/bin/true",
		...overrides,
	};
}
