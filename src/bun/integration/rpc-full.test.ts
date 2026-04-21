import type { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { NewGame } from "../../shared/types/game";
import { closeLauncherDatabase, openLauncherDatabase } from "../database/db";
import { createGameRepository, type GameRepository } from "../database/queries";
import { createGameRequestHandlers } from "../rpc/games";

describe("integration: rpc-full", () => {
	let database: Database;
	let repository: GameRepository;
	let handlers: ReturnType<typeof createGameRequestHandlers>;

	beforeEach(() => {
		database = openLauncherDatabase(":memory:");
		repository = createGameRepository(database);
		handlers = createGameRequestHandlers(repository);
	});

	afterEach(() => {
		closeLauncherDatabase(database);
	});

	test("gameCreate → gameList → gameGet → gameUpdate → gameDelete lifecycle", () => {
		// gameCreate
		const created = handlers.gameCreate({
			title: "RPC Full Lifecycle",
			runner: "native",
			path: "/bin/true",
			args: "--fullscreen",
			store: "manual",
		});
		expect(created.id).toBeTruthy();
		expect(created.title).toBe("RPC Full Lifecycle");
		expect(created.runner).toBe("native");

		// gameList — should contain the new game
		const listAfterCreate = handlers.gameList();
		expect(listAfterCreate.some((g) => g.id === created.id)).toBe(true);

		// gameGet — should retrieve exact game
		const fetched = handlers.gameGet({ id: created.id });
		expect(fetched?.title).toBe("RPC Full Lifecycle");
		expect(fetched?.args).toBe("--fullscreen");

		// gameUpdate — modify title, add env and hooks
		const updated = handlers.gameUpdate({
			id: created.id,
			patch: {
				title: "RPC Full Lifecycle Updated",
				env: { DISPLAY: ":0", SDL_VIDEODRIVER: "wayland" },
				hooks: { mangohud: true },
			},
		});
		expect(updated?.title).toBe("RPC Full Lifecycle Updated");
		expect(updated?.env).toEqual({ DISPLAY: ":0", SDL_VIDEODRIVER: "wayland" });
		expect(updated?.hooks).toEqual({ mangohud: true });
		// env and hooks should replace (not merge) the existing
		expect(updated?.env).not.toHaveProperty("OPENLAUNCHER_TEST");

		// gameList — title should be updated
		const listAfterUpdate = handlers.gameList();
		const updatedInList = listAfterUpdate.find((g) => g.id === created.id);
		expect(updatedInList?.title).toBe("RPC Full Lifecycle Updated");

		// gameDelete — should return true and game should be gone
		expect(handlers.gameDelete({ id: created.id })).toBe(true);

		// gameGet after delete — should be null
		expect(handlers.gameGet({ id: created.id })).toBeNull();

		// gameDelete again — should return false
		expect(handlers.gameDelete({ id: created.id })).toBe(false);
	});

	test("gameCreate with umu runner stores umu config correctly", () => {
		const created = handlers.gameCreate({
			title: "UMU Game",
			runner: "umu",
			path: "/usr/bin/true",
			store: "gog",
			storeId: "gog-game-id",
			umu: {
				gameId: "celeste",
				store: "gog",
				protonPath: "GE-Proton9-26",
				winePrefix: "/tmp/celeste-prefix",
			},
		});

		expect(created.runner).toBe("umu");
		expect(created.umu?.gameId).toBe("celeste");
		expect(created.umu?.store).toBe("gog");
		expect(created.umu?.protonPath).toBe("GE-Proton9-26");
		expect(created.umu?.winePrefix).toBe("/tmp/celeste-prefix");

		// Verify persistence
		const fetched = handlers.gameGet({ id: created.id });
		expect(fetched?.umu?.gameId).toBe("celeste");
		expect(fetched?.umu?.store).toBe("gog");
	});

	test("gameUpdate with partial patch preserves unchanged fields", () => {
		const created = handlers.gameCreate({
			title: "Partial Update Test",
			runner: "native",
			path: "/bin/true",
			args: "--verbose",
			env: { LOG_DIR: "/tmp/logs" },
			description: "Original description",
		});

		// Update only the title, nothing else
		const updated = handlers.gameUpdate({
			id: created.id,
			patch: { title: "New Title" },
		});

		expect(updated?.title).toBe("New Title");
		expect(updated?.args).toBe("--verbose");
		expect(updated?.env).toEqual({ LOG_DIR: "/tmp/logs" });
		expect(updated?.description).toBe("Original description");
	});

	test("gameUpdate returns null for non-existent game id", () => {
		const result = handlers.gameUpdate({
			id: "non-existent-id",
			patch: { title: "Should Fail" },
		});
		expect(result).toBeNull();
	});

	test("gameGet returns null for non-existent game id", () => {
		const result = handlers.gameGet({ id: "non-existent-id" });
		expect(result).toBeNull();
	});

	test("gameList returns empty array when no games exist", () => {
		const result = handlers.gameList();
		expect(result).toEqual([]);
	});

	test("gameList returns multiple games sorted case-insensitively", () => {
		handlers.gameCreate(nativeGame({ title: "Zelda" }));
		handlers.gameCreate(nativeGame({ title: "amiga" }));
		handlers.gameCreate(nativeGame({ title: "Braid" }));
		handlers.gameCreate(nativeGame({ title: "arcade" }));

		const titles = handlers.gameList().map((g) => g.title);
		expect(titles).toEqual(["amiga", "arcade", "Braid", "Zelda"]);
	});

	test("gameCreate rejects invalid runner with descriptive error", () => {
		expect(() =>
			handlers.gameCreate(nativeGame({ runner: "wine" as "native" })),
		).toThrow("Unsupported runner: wine");
	});

	test("gameCreate rejects empty title with descriptive error", () => {
		expect(() => handlers.gameCreate(nativeGame({ title: "   " }))).toThrow(
			"Game title is required.",
		);
	});

	test("gameCreate rejects empty path with descriptive error", () => {
		expect(() => handlers.gameCreate(nativeGame({ path: "  " }))).toThrow(
			"Executable path is required.",
		);
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
