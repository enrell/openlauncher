import type { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { closeLauncherDatabase, openLauncherDatabase } from "../database/db";
import { createGameRepository, type GameRepository } from "../database/queries";
import { createGameRequestHandlers } from "./games";

let database: Database;
let repository: GameRepository;

beforeEach(() => {
	database = openLauncherDatabase(":memory:");
	repository = createGameRepository(database);
});

afterEach(() => {
	closeLauncherDatabase(database);
});

describe("createGameRequestHandlers", () => {
	test("performs CRUD operations through the real game repository", () => {
		const handlers = createGameRequestHandlers(repository);

		const created = handlers.gameCreate({
			title: "RPC Game",
			runner: "native",
			path: "/bin/true",
			args: "--fullscreen",
			store: "manual",
		});
		expect(created.title).toBe("RPC Game");

		expect(handlers.gameList().map((game) => game.id)).toEqual([created.id]);
		expect(handlers.gameGet({ id: created.id })?.path).toBe("/bin/true");

		const updated = handlers.gameUpdate({
			id: created.id,
			patch: {
				title: "Updated RPC Game",
				hooks: { mangohud: true },
			},
		});
		expect(updated?.title).toBe("Updated RPC Game");
		expect(updated?.hooks).toEqual({ mangohud: true });

		expect(handlers.gameDelete({ id: created.id })).toBe(true);
		expect(handlers.gameGet({ id: created.id })).toBeNull();
		expect(handlers.gameDelete({ id: created.id })).toBe(false);
	});
});
