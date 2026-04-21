import { homedir } from "node:os";
import { join } from "node:path";
import type { LaunchOptions } from "../../shared/types/launch";
import { splitLaunchArguments } from "./arguments";
import type { LaunchCommand } from "./executor";
import { applyLaunchHooks } from "./hooks";

const DEFAULT_PROTON_PATH = "GE-Proton";
const DEFAULT_UMU_GAME_ID = "umu-default";
const DEFAULT_UMU_STORE = "none";

export function buildUmuLaunch(options: LaunchOptions): LaunchCommand {
	const umuConfig = options.umu ?? {};
	const gameId = trimOptional(umuConfig.gameId) ?? DEFAULT_UMU_GAME_ID;
	const winePrefix =
		trimOptional(umuConfig.winePrefix) ??
		defaultWinePrefix(umuConfig.gameId ?? options.gameId);

	const env = {
		...options.env,
		WINEPREFIX: winePrefix,
		GAMEID: gameId,
		STORE: normalizeUmuStore(umuConfig.store),
		PROTONPATH: trimOptional(umuConfig.protonPath) ?? DEFAULT_PROTON_PATH,
	};

	const baseCommand = [
		"umu-run",
		requireExecutablePath(options.path),
		...splitLaunchArguments(options.args),
	];

	return {
		command: applyLaunchHooks(baseCommand, options.hooks),
		cwd: options.cwd,
		env,
	};
}

function defaultWinePrefix(gameId: string): string {
	return join(homedir(), "Games", "umu", gameId);
}

function normalizeUmuStore(store: string | undefined): string {
	const normalizedStore = trimOptional(store);
	if (!normalizedStore || normalizedStore === "manual") {
		return DEFAULT_UMU_STORE;
	}

	if (normalizedStore === "epic") {
		return "egs";
	}

	return normalizedStore;
}

function requireExecutablePath(path: string): string {
	const trimmedPath = path.trim();
	if (!trimmedPath) {
		throw new Error("Executable path is required.");
	}
	return trimmedPath;
}

function trimOptional(value: string | undefined): string | undefined {
	const trimmedValue = value?.trim();
	return trimmedValue || undefined;
}
