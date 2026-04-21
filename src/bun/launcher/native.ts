import type { LaunchOptions } from "../../shared/types/launch";
import { splitLaunchArguments } from "./arguments";
import type { LaunchCommand } from "./executor";
import { applyLaunchHooks } from "./hooks";

export function buildNativeLaunch(options: LaunchOptions): LaunchCommand {
	const baseCommand = [
		requireExecutablePath(options.path),
		...splitLaunchArguments(options.args),
	];

	return {
		command: applyLaunchHooks(baseCommand, options.hooks),
		cwd: options.cwd,
		env: options.env,
	};
}

function requireExecutablePath(path: string): string {
	const trimmedPath = path.trim();
	if (!trimmedPath) {
		throw new Error("Executable path is required.");
	}
	return trimmedPath;
}
