import type { Game } from "../../shared/types/game";
import type { LaunchOptions, LaunchResult } from "../../shared/types/launch";
import { executeCommand } from "./executor";
import { buildNativeLaunch } from "./native";
import { buildUmuLaunch } from "./umu";

export async function execute(
	game: Game,
	overrides: Partial<LaunchOptions> | undefined,
): Promise<LaunchResult> {
	try {
		const launchOptions = buildLaunchOptions(game, overrides);

		if (launchOptions.runner === "native") {
			return executeCommand(buildNativeLaunch(launchOptions));
		}

		if (launchOptions.runner === "umu") {
			return executeCommand(buildUmuLaunch(launchOptions));
		}

		return {
			success: false,
			exitCode: null,
			durationMs: 0,
			error: `Unsupported runner: ${String(launchOptions.runner)}`,
		};
	} catch (error) {
		return {
			success: false,
			exitCode: null,
			durationMs: 0,
			error: errorMessage(error),
		};
	}
}

function buildLaunchOptions(
	game: Game,
	overrides: Partial<LaunchOptions> | undefined,
): LaunchOptions {
	const overrideOptions = overrides ?? {};

	return {
		gameId: overrideOptions.gameId ?? game.id,
		runner: overrideOptions.runner ?? game.runner,
		path: overrideOptions.path ?? game.path,
		cwd: overrideOptions.cwd ?? game.cwd,
		args: overrideOptions.args ?? game.args,
		env: mergeRecords(game.env, overrideOptions.env),
		hooks: mergeRecords(game.hooks, overrideOptions.hooks),
		umu: mergeRecords(defaultUmuConfig(game), overrideOptions.umu),
	};
}

function defaultUmuConfig(game: Game): LaunchOptions["umu"] {
	if (game.runner !== "umu") {
		return game.umu;
	}

	const store = game.store && game.store !== "manual" ? game.store : undefined;
	return {
		store,
		...game.umu,
	};
}

function mergeRecords<T extends object>(
	baseRecord: T | undefined,
	overrideRecord: T | undefined,
): T | undefined {
	if (!baseRecord && !overrideRecord) {
		return undefined;
	}

	return {
		...baseRecord,
		...overrideRecord,
	} as T;
}

function errorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}
