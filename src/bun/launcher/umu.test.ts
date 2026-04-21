import { describe, expect, test } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import type { LaunchOptions } from "../../shared/types/launch";
import { buildUmuLaunch } from "./umu";

describe("buildUmuLaunch", () => {
	test("builds the umu-run command with default umu environment", () => {
		const launch = buildUmuLaunch(
			umuOptions({
				gameId: "local-game",
				path: "  /games/windows/Game.exe  ",
				args: '"--profile name" --skip-launcher',
			}),
		);

		expect(launch.command).toEqual([
			"umu-run",
			"/games/windows/Game.exe",
			"--profile name",
			"--skip-launcher",
		]);
		expect(launch.env).toMatchObject({
			WINEPREFIX: join(homedir(), "Games", "umu", "local-game"),
			GAMEID: "umu-default",
			STORE: "none",
			PROTONPATH: "GE-Proton",
		});
	});

	test("uses explicit WINEPREFIX, GAMEID, STORE, and PROTONPATH values", () => {
		const launch = buildUmuLaunch(
			umuOptions({
				env: { DXVK_ASYNC: "1" },
				umu: {
					gameId: "umu-123",
					store: "gog",
					protonPath: "/opt/proton/custom",
					winePrefix: "/prefixes/game",
				},
			}),
		);

		expect(launch.env).toEqual({
			DXVK_ASYNC: "1",
			WINEPREFIX: "/prefixes/game",
			GAMEID: "umu-123",
			STORE: "gog",
			PROTONPATH: "/opt/proton/custom",
		});
	});

	test("maps manual store to none and epic store to egs", () => {
		expect(
			buildUmuLaunch(umuOptions({ umu: { store: "manual" } })).env?.STORE,
		).toBe("none");
		expect(
			buildUmuLaunch(umuOptions({ umu: { store: "epic" } })).env?.STORE,
		).toBe("egs");
	});

	test("wraps umu-run with gamescope outside mangohud", () => {
		const launch = buildUmuLaunch(
			umuOptions({
				hooks: {
					gamescope: true,
					mangohud: true,
					gamescopeUpscaling: "nis",
				},
			}),
		);

		expect(launch.command).toEqual([
			"gamescope",
			"-f",
			"-F",
			"nis",
			"--",
			"mangohud",
			"--",
			"umu-run",
			"/bin/true",
		]);
	});

	test("requires an executable path", () => {
		expect(() => buildUmuLaunch(umuOptions({ path: " " }))).toThrow(
			"Executable path is required.",
		);
	});
});

function umuOptions(overrides: Partial<LaunchOptions> = {}): LaunchOptions {
	return {
		gameId: "game-id",
		runner: "umu",
		path: "/bin/true",
		...overrides,
	};
}
