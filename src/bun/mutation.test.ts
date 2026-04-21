import type { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { closeLauncherDatabase, openLauncherDatabase } from "./database/db";
import { createGameRepository } from "./database/queries";
import { splitLaunchArguments } from "./launcher/arguments";
import { applyLaunchHooks } from "./launcher/hooks";

describe("mutation: catch regressions", () => {
	/**
	 * Mutation testing harness.
	 *
	 * Each test below exercises critical logic paths and verifies the
	 * test suite catches broken versions of those functions.
	 *
	 * Mutation targets include:
	 * - Operator swaps (=== → !==, + → -, || → &&)
	 * - Removed conditions or early returns
	 * - Inverted logic
	 *
	 * Since internal normalization functions are not exported, we test them
	 * indirectly through createGameRepository (which exercises them).
	 */

	test("splitLaunchArguments: whitespace splitting works correctly", () => {
		const result = splitLaunchArguments('--flag "arg with spaces" --other');
		expect(result).toEqual(["--flag", "arg with spaces", "--other"]);

		expect(result.length).toBe(3);
		expect(result[1]).toBe("arg with spaces");
	});

	test("splitLaunchArguments: quote handling preserves inner spaces", () => {
		const result = splitLaunchArguments('--config "value with spaces"');
		expect(result).toEqual(["--config", "value with spaces"]);
		expect(result[1]).toBe("value with spaces");
	});

	test("splitLaunchArguments: escaped characters are handled", () => {
		const result = splitLaunchArguments('--option "value\\ with\\ spaces"');
		expect(result.length).toBe(2);

		// If escape handling is broken, this would parse incorrectly
	});

	test("splitLaunchArguments: unclosed quote is handled gracefully", () => {
		const result = splitLaunchArguments('--option "unclosed');
		expect(result[0]).toBe("--option");
	});

	test("splitLaunchArguments: empty args returns empty array", () => {
		expect(splitLaunchArguments(undefined)).toEqual([]);
		expect(splitLaunchArguments("")).toEqual([]);
		expect(splitLaunchArguments("   ")).toEqual([]);
	});

	test("applyLaunchHooks: returns base command when no hooks enabled", () => {
		const base = ["/bin/game", "--fullscreen"];

		expect(applyLaunchHooks(base, undefined)).toEqual(base);
		expect(applyLaunchHooks(base, {})).toEqual(base);

		// Mutation target: if mangohud/gamescope condition were inverted,
		// commands would be wrapped even without hooks enabled.
	});

	test("applyLaunchHooks: mangohud is applied when enabled", () => {
		const base = ["/bin/game"];

		const result = applyLaunchHooks(base, { mangohud: true });
		expect(result).toEqual(["mangohud", "--", "/bin/game"]);
	});

	test("applyLaunchHooks: gamescope is applied when enabled", () => {
		const base = ["/bin/game"];

		const result = applyLaunchHooks(base, { gamescope: true });
		expect(result).toEqual(["gamescope", "-f", "--", "/bin/game"]);
	});

	test("applyLaunchHooks: gamescope wraps mangohud (correct nesting order)", () => {
		const base = ["/bin/game"];

		const result = applyLaunchHooks(base, { gamescope: true, mangohud: true });
		expect(result).toEqual([
			"gamescope",
			"-f",
			"--",
			"mangohud",
			"--",
			"/bin/game",
		]);

		// Mutation target: if wrapping order were reversed (mangohud outermost),
		// command would be ["mangohud", "--", "gamescope", "-f", "--", "/bin/game"]
	});

	test("applyLaunchHooks: resolution is parsed and applied correctly", () => {
		const base = ["/bin/game"];

		const result = applyLaunchHooks(base, {
			gamescope: true,
			gamescopeResolution: "1920x1080",
		});

		expect(result).toContain("-W");
		expect(result).toContain("1920");
		expect(result).toContain("-H");
		expect(result).toContain("1080");
	});

	test("applyLaunchHooks: invalid resolution does not break command", () => {
		const base = ["/bin/game"];

		const result = applyLaunchHooks(base, {
			gamescope: true,
			gamescopeResolution: "invalid-resolution",
		});

		// Should fall back to basic gamescope without resolution args
		expect(result).toEqual(["gamescope", "-f", "--", "/bin/game"]);
	});

	test("applyLaunchHooks: upscaling option is applied when set", () => {
		const base = ["/bin/game"];

		const result = applyLaunchHooks(base, {
			gamescope: true,
			gamescopeUpscaling: "nis",
		});

		expect(result).toContain("-F");
		expect(result).toContain("nis");
	});
});

describe("mutation: repository normalization (indirect)", () => {
	/**
	 * These tests exercise the internal normalization functions indirectly
	 * by passing edge cases through createGameRepository.
	 * If normalization logic were mutated, these tests would fail.
	 */

	let database: Database;
	let repository: ReturnType<typeof createGameRepository>;

	beforeEach(() => {
		database = openLauncherDatabase(":memory:");
		repository = createGameRepository(database);
	});

	afterEach(() => {
		closeLauncherDatabase(database);
	});

	test("createGameRepository trims whitespace from title", () => {
		const game = repository.createGame({
			title: "  Spaced Title  ",
			runner: "native",
			path: "/bin/true",
		});

		expect(game.title).toBe("Spaced Title");

		// Mutation target: if trimming were removed, title would be "  Spaced Title  "
	});

	test("createGameRepository trims whitespace from path", () => {
		const game = repository.createGame({
			title: "Trim Test",
			runner: "native",
			path: "  /bin/true  ",
		});

		expect(game.path).toBe("/bin/true");
	});

	test("createGameRepository rejects empty title", () => {
		expect(() =>
			repository.createGame({
				title: "",
				runner: "native",
				path: "/bin/true",
			}),
		).toThrow("Game title is required.");

		// Mutation target: if empty check were removed, empty title would be stored
	});

	test("createGameRepository rejects whitespace-only title", () => {
		expect(() =>
			repository.createGame({
				title: "   ",
				runner: "native",
				path: "/bin/true",
			}),
		).toThrow("Game title is required.");
	});

	test("createGameRepository rejects empty path", () => {
		expect(() =>
			repository.createGame({
				title: "Valid Title",
				runner: "native",
				path: "",
			}),
		).toThrow("Executable path is required.");

		// Mutation target: if path validation were removed, empty path would be stored
	});

	test("createGameRepository rejects invalid runner", () => {
		expect(() =>
			repository.createGame({
				title: "Valid",
				runner: "wine" as "native",
				path: "/bin/true",
			}),
		).toThrow("Unsupported runner: wine");

		// Mutation target: if runner validation used === instead of !==,
		// "wine" might be accepted as valid
	});

	test("createGameRepository rejects invalid store", () => {
		expect(() =>
			repository.createGame({
				title: "Valid",
				runner: "native",
				path: "/bin/true",
				store: "invalid" as "steam",
			}),
		).toThrow("Unsupported store: invalid");
	});

	test("createGameRepository normalizes umu config - removes empty fields", () => {
		const game = repository.createGame({
			title: "UMU Test",
			runner: "umu",
			path: "/bin/true",
			umu: {
				gameId: "  ",
				store: "  ",
				protonPath: "  ",
				winePrefix: "  ",
			},
		});

		// All whitespace-only umu fields should be removed (umu becomes undefined)
		expect(game.umu).toBeUndefined();

		// Mutation target: if normalizeUmuConfig were changed to keep empty strings,
		// umu would have empty string fields
	});

	test("createGameRepository preserves non-empty umu fields", () => {
		const game = repository.createGame({
			title: "UMU Full",
			runner: "umu",
			path: "/bin/true",
			umu: {
				gameId: "game-id",
				store: "steam",
				protonPath: "GE-Proton9-26",
				winePrefix: "/prefix/path",
			},
		});

		expect(game.umu?.gameId).toBe("game-id");
		expect(game.umu?.store).toBe("steam");
		expect(game.umu?.protonPath).toBe("GE-Proton9-26");
		expect(game.umu?.winePrefix).toBe("/prefix/path");
	});

	test("createGameRepository parses env JSON correctly", () => {
		const game = repository.createGame({
			title: "Env Test",
			runner: "native",
			path: "/bin/true",
			env: { KEY: "value", OTHER: "123" },
		});

		expect(game.env).toEqual({ KEY: "value", OTHER: "123" });

		// Mutation target: if JSON.stringify were called incorrectly,
		// the env would be stored incorrectly or throw
	});

	test("createGameRepository parses hooks JSON correctly", () => {
		const game = repository.createGame({
			title: "Hooks Test",
			runner: "native",
			path: "/bin/true",
			hooks: { mangohud: true, gamescope: false },
		});

		expect(game.hooks).toEqual({ mangohud: true, gamescope: false });

		// Mutation target: if hooks parsing were broken, hooks would be null/undefined
	});

	test("createGameRepository list sorts case-insensitively", () => {
		repository.createGame({
			title: "Zelda",
			runner: "native",
			path: "/bin/true",
		});
		repository.createGame({
			title: "amiga",
			runner: "native",
			path: "/bin/true",
		});
		repository.createGame({
			title: "Braid",
			runner: "native",
			path: "/bin/true",
		});
		repository.createGame({
			title: "arcade",
			runner: "native",
			path: "/bin/true",
		});

		const titles = repository.listGames().map((g) => g.title);
		expect(titles).toEqual(["amiga", "arcade", "Braid", "Zelda"]);

		// Mutation target: if the ORDER BY used lower() incorrectly or not at all,
		// sorting would be wrong
	});
});
