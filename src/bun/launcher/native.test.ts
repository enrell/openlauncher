import { describe, expect, test } from "bun:test";
import type { LaunchOptions } from "../../shared/types/launch";
import { buildNativeLaunch } from "./native";

describe("buildNativeLaunch", () => {
	test("builds a native command from executable path and parsed arguments", () => {
		const launch = buildNativeLaunch(
			nativeOptions({
				path: "  /games/native/run.sh  ",
				args: '--fullscreen "--profile=Steam Deck"',
				cwd: "/games/native",
				env: { SDL_VIDEODRIVER: "wayland" },
			}),
		);

		expect(launch).toEqual({
			command: ["/games/native/run.sh", "--fullscreen", "--profile=Steam Deck"],
			cwd: "/games/native",
			env: { SDL_VIDEODRIVER: "wayland" },
		});
	});

	test("wraps native commands with mangohud when enabled", () => {
		const launch = buildNativeLaunch(
			nativeOptions({
				hooks: { mangohud: true },
			}),
		);

		expect(launch.command).toEqual(["mangohud", "--", "/bin/true"]);
	});

	test("composes mangohud inside gamescope when both hooks are enabled", () => {
		const launch = buildNativeLaunch(
			nativeOptions({
				hooks: {
					gamescope: true,
					mangohud: true,
					gamescopeResolution: "1280x720",
				},
			}),
		);

		expect(launch.command).toEqual([
			"gamescope",
			"-f",
			"-W",
			"1280",
			"-H",
			"720",
			"--",
			"mangohud",
			"--",
			"/bin/true",
		]);
	});

	test("requires an executable path", () => {
		expect(() => buildNativeLaunch(nativeOptions({ path: " " }))).toThrow(
			"Executable path is required.",
		);
	});
});

function nativeOptions(overrides: Partial<LaunchOptions> = {}): LaunchOptions {
	return {
		gameId: "native-game",
		runner: "native",
		path: "/bin/true",
		...overrides,
	};
}
