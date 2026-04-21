import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
	chmodSync,
	mkdtempSync,
	rmdirSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { LaunchOptions } from "../../shared/types/launch";
import { buildNativeLaunch } from "../launcher/native";
import { buildUmuLaunch } from "../launcher/umu";

describe("integration: launcher", () => {
	let tempDir: string;
	let echoScriptPath: string;

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), "openlauncher-launch-"));
		echoScriptPath = join(tempDir, "test_script.sh");
		writeFileSync(echoScriptPath, "#!/bin/sh\necho hello\n");
		chmodSync(echoScriptPath, 0o755);
	});

	afterEach(() => {
		try {
			unlinkSync(echoScriptPath);
		} catch {
			// Best effort
		}
		try {
			rmdirSync(tempDir);
		} catch {
			// Best effort
		}
	});

	test("buildNativeLaunch passes correct args, env, and cwd to command", () => {
		const options: LaunchOptions = {
			gameId: "native-game",
			runner: "native",
			path: echoScriptPath,
			cwd: tempDir,
			args: '--verbose --config "my config.ini"',
			env: { CUSTOM_VAR: "custom_value", DISPLAY: ":0" },
		};

		const launch = buildNativeLaunch(options);

		expect(launch.command).toEqual([
			echoScriptPath,
			"--verbose",
			"--config",
			"my config.ini",
		]);
		expect(launch.cwd).toBe(tempDir);
		expect(launch.env).toEqual({ CUSTOM_VAR: "custom_value", DISPLAY: ":0" });
	});

	test("buildNativeLaunch applies mangohud hook correctly", () => {
		const options: LaunchOptions = {
			gameId: "native-game",
			runner: "native",
			path: echoScriptPath,
			hooks: { mangohud: true },
		};

		const launch = buildNativeLaunch(options);

		expect(launch.command).toEqual(["mangohud", "--", echoScriptPath]);
	});

	test("buildNativeLaunch applies gamescope hook with resolution", () => {
		const options: LaunchOptions = {
			gameId: "native-game",
			runner: "native",
			path: echoScriptPath,
			hooks: {
				gamescope: true,
				gamescopeResolution: "1280x720",
				gamescopeUpscaling: "fsr",
			},
		};

		const launch = buildNativeLaunch(options);

		expect(launch.command).toEqual([
			"gamescope",
			"-f",
			"-W",
			"1280",
			"-H",
			"720",
			"-F",
			"fsr",
			"--",
			echoScriptPath,
		]);
	});

	test("buildNativeLaunch applies mangohud inside gamescope when both enabled", () => {
		const options: LaunchOptions = {
			gameId: "native-game",
			runner: "native",
			path: echoScriptPath,
			hooks: { gamescope: true, mangohud: true },
		};

		const launch = buildNativeLaunch(options);

		expect(launch.command).toEqual([
			"gamescope",
			"-f",
			"--",
			"mangohud",
			"--",
			echoScriptPath,
		]);
	});

	test("buildUmuLaunch constructs umu-run command correctly", () => {
		const options: LaunchOptions = {
			gameId: "umu-game",
			runner: "umu",
			path: echoScriptPath,
			args: "--fullscreen",
			umu: {
				gameId: "my-umu-game",
				store: "gog",
				protonPath: "GE-Proton9-26",
				winePrefix: "/tmp/umu-test-prefix",
			},
		};

		const launch = buildUmuLaunch(options);

		expect(launch.command).toEqual(["umu-run", echoScriptPath, "--fullscreen"]);
		expect(launch.env?.GAMEID).toBe("my-umu-game");
		expect(launch.env?.STORE).toBe("gog");
		expect(launch.env?.PROTONPATH).toBe("GE-Proton9-26");
		expect(launch.env?.WINEPREFIX).toBe("/tmp/umu-test-prefix");
	});

	test("buildUmuLaunch uses sensible defaults when umu config is minimal", () => {
		const options: LaunchOptions = {
			gameId: "umu-default",
			runner: "umu",
			path: echoScriptPath,
		};

		const launch = buildUmuLaunch(options);

		expect(launch.command).toEqual(["umu-run", echoScriptPath]);
		expect(launch.env?.GAMEID).toBe("umu-default");
		expect(launch.env?.WINEPREFIX).toContain("/Games/umu/umu-default");
	});

	test("buildUmuLaunch normalizes store 'manual' to 'none'", () => {
		const options: LaunchOptions = {
			gameId: "umu-game",
			runner: "umu",
			path: echoScriptPath,
			umu: { store: "manual" },
		};

		const launch = buildUmuLaunch(options);

		expect(launch.env?.STORE).toBe("none");
	});

	test("buildUmuLaunch applies hooks to umu command", () => {
		const options: LaunchOptions = {
			gameId: "umu-game",
			runner: "umu",
			path: echoScriptPath,
			hooks: { mangohud: true, gamescope: true },
			umu: { gameId: "umu-game", store: "steam" },
		};

		const launch = buildUmuLaunch(options);

		// gamescope wraps outermost
		expect(launch.command[0]).toBe("gamescope");
		// mangohud is inside gamescope
		const mangohudIdx = launch.command.indexOf("mangohud");
		expect(mangohudIdx).toBeGreaterThan(-1);
		// umu-run is the actual game command
		expect(launch.command).toContain("umu-run");
	});
});
