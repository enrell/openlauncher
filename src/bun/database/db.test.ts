import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeLauncherDatabase, openLauncherDatabase } from "./db";

let tempDirectories: string[] = [];

afterEach(() => {
	for (const tempDirectory of tempDirectories) {
		rmSync(tempDirectory, { recursive: true, force: true });
	}
	tempDirectories = [];
});

describe("openLauncherDatabase", () => {
	test("creates the games table and indexes in an in-memory database", () => {
		const database = openLauncherDatabase(":memory:");

		try {
			const table = database
				.query<{ name: string }, []>(
					"SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'games';",
				)
				.get();
			expect(table?.name).toBe("games");

			const columns = database
				.query<{ name: string }, []>("PRAGMA table_info(games);")
				.all()
				.map((column) => column.name);
			expect(columns).toEqual([
				"id",
				"title",
				"runner",
				"path",
				"cwd",
				"args",
				"env_json",
				"hooks_json",
				"cover_image",
				"description",
				"genre",
				"release_date",
				"developer",
				"publisher",
				"store",
				"store_id",
				"umu_game_id",
				"umu_store",
				"umu_proton_path",
				"umu_wine_prefix",
				"created_at",
				"updated_at",
			]);

			const indexes = database
				.query<{ name: string }, []>("PRAGMA index_list(games);")
				.all()
				.map((index) => index.name);
			expect(indexes).toContain("idx_games_title");
			expect(indexes).toContain("idx_games_runner");
			expect(indexes).toContain("idx_games_store");

			const foreignKeys = database
				.query<{ foreign_keys: number }, []>("PRAGMA foreign_keys;")
				.get();
			expect(foreignKeys?.foreign_keys).toBe(1);
		} finally {
			closeLauncherDatabase(database);
		}
	});

	test("enables WAL for file-backed databases", () => {
		const tempDirectory = mkdtempSync(join(tmpdir(), "openlauncher-db-"));
		tempDirectories.push(tempDirectory);
		const databasePath = join(tempDirectory, "openlauncher.sqlite");
		const database = openLauncherDatabase(databasePath);

		try {
			const journalMode = database
				.query<{ journal_mode: string }, []>("PRAGMA journal_mode;")
				.get();
			expect(journalMode?.journal_mode).toBe("wal");
		} finally {
			closeLauncherDatabase(database);
		}
	});
});
