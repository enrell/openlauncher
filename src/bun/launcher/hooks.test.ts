import { describe, expect, test } from "bun:test";
import { applyLaunchHooks } from "./hooks";

describe("applyLaunchHooks", () => {
	test("returns the base command when no hooks are enabled", () => {
		const command = ["/bin/game", "--fullscreen"];

		expect(applyLaunchHooks(command, undefined)).toEqual(command);
		expect(applyLaunchHooks(command, {})).toEqual(command);
	});

	test("wraps commands with mangohud", () => {
		expect(applyLaunchHooks(["/bin/game"], { mangohud: true })).toEqual([
			"mangohud",
			"--",
			"/bin/game",
		]);
	});

	test("wraps commands with gamescope fullscreen mode", () => {
		expect(applyLaunchHooks(["/bin/game"], { gamescope: true })).toEqual([
			"gamescope",
			"-f",
			"--",
			"/bin/game",
		]);
	});

	test("adds gamescope resolution and upscaling options", () => {
		expect(
			applyLaunchHooks(["/bin/game"], {
				gamescope: true,
				gamescopeResolution: "1920x1080",
				gamescopeUpscaling: "fsr",
			}),
		).toEqual([
			"gamescope",
			"-f",
			"-W",
			"1920",
			"-H",
			"1080",
			"-F",
			"fsr",
			"--",
			"/bin/game",
		]);
	});

	test("ignores invalid gamescope resolution and upscaling values", () => {
		expect(
			applyLaunchHooks(["/bin/game"], {
				gamescope: true,
				gamescopeResolution: "wide",
				gamescopeUpscaling: "none",
			}),
		).toEqual(["gamescope", "-f", "--", "/bin/game"]);
	});

	test("nests gamescope outside mangohud when both hooks are enabled", () => {
		expect(
			applyLaunchHooks(["/bin/game"], {
				gamescope: true,
				mangohud: true,
			}),
		).toEqual(["gamescope", "-f", "--", "mangohud", "--", "/bin/game"]);
	});
});
