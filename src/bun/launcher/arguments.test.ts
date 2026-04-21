import { describe, expect, test } from "bun:test";
import { splitLaunchArguments } from "./arguments";

describe("splitLaunchArguments", () => {
	test("returns an empty array for empty input", () => {
		expect(splitLaunchArguments(undefined)).toEqual([]);
		expect(splitLaunchArguments("   ")).toEqual([]);
	});

	test("splits whitespace-delimited arguments", () => {
		expect(splitLaunchArguments("--fullscreen --width 1920")).toEqual([
			"--fullscreen",
			"--width",
			"1920",
		]);
	});

	test("preserves quoted argument groups", () => {
		expect(
			splitLaunchArguments("--title \"A Game\" --path '/games/My Game/run.sh'"),
		).toEqual(["--title", "A Game", "--path", "/games/My Game/run.sh"]);
	});

	test("handles escaped characters outside quotes", () => {
		expect(splitLaunchArguments("--name Space\\ Game --flag\\=on")).toEqual([
			"--name",
			"Space Game",
			"--flag=on",
		]);
	});

	test("keeps a trailing escape as a literal backslash", () => {
		expect(splitLaunchArguments("game\\")).toEqual(["game\\"]);
	});
});
