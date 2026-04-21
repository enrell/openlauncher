import type { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { closeLauncherDatabase, openLauncherDatabase } from "../database/db";
import { createGameRepository, type GameRepository } from "../database/queries";
import { createLaunchRequestHandlers } from "./launch";

let database: Database;
let repository: GameRepository;

beforeEach(() => {
	database = openLauncherDatabase(":memory:");
	repository = createGameRepository(database);
});

afterEach(() => {
	closeLauncherDatabase(database);
});

describe("createLaunchRequestHandlers", () => {
	test("dispatches game launches and sends started/ended notifications", async () => {
		const game = repository.createGame({
			title: "Launchable",
			runner: "native",
			path: "true",
		});
		const started = mock(() => {});
		const ended = mock(() => {});
		const handlers = createLaunchRequestHandlers(repository, {
			started,
			ended,
		});

		const result = await handlers.gameLaunch({
			id: game.id,
			options: { args: "--ignored-by-true" },
		});

		expect(result.success).toBe(true);
		expect(result.exitCode).toBe(0);
		expect(result.command).toEqual(["true", "--ignored-by-true"]);
		expect(started).toHaveBeenCalledWith({
			gameId: game.id,
			title: "Launchable",
		});
		expect(ended).toHaveBeenCalledWith({
			gameId: game.id,
			title: "Launchable",
			exitCode: 0,
			durationMs: result.durationMs,
		});
	});

	test("returns an error without notifications when the game is missing", async () => {
		const started = mock(() => {});
		const ended = mock(() => {});
		const handlers = createLaunchRequestHandlers(repository, {
			started,
			ended,
		});

		const result = await handlers.gameLaunch({ id: "missing" });

		expect(result).toEqual({
			success: false,
			exitCode: null,
			durationMs: 0,
			error: "Game not found: missing",
		});
		expect(started).not.toHaveBeenCalled();
		expect(ended).not.toHaveBeenCalled();
	});
});
