import type { LaunchHooks } from "../../shared/types/launch";

export function applyLaunchHooks(
	command: string[],
	hooks: LaunchHooks | undefined,
): string[] {
	let wrappedCommand = [...command];

	if (hooks?.mangohud) {
		wrappedCommand = ["mangohud", "--", ...wrappedCommand];
	}

	if (hooks?.gamescope) {
		wrappedCommand = [
			...gamescopeCommandPrefix(hooks),
			"--",
			...wrappedCommand,
		];
	}

	return wrappedCommand;
}

function gamescopeCommandPrefix(hooks: LaunchHooks): string[] {
	const commandPrefix = ["gamescope"];

	const resolution = parseResolution(hooks.gamescopeResolution);
	if (resolution) {
		commandPrefix.push("-W", resolution.width, "-H", resolution.height);
	}

	if (hooks.gamescopeFrameRate) {
		commandPrefix.push("-r", hooks.gamescopeFrameRate);
	}

	if (hooks.gamescopeFullscreen) {
		commandPrefix.push("-F");
	}

	if (hooks.gamescopeBorderless) {
		commandPrefix.push("-b");
	}

	if (hooks.gamescopeIntegerScale) {
		commandPrefix.push("-i");
	}

	if (hooks.gamescopeVsync) {
		commandPrefix.push("-vsync");
	} else {
		commandPrefix.push("-nosync");
	}

	// FSR/NIS upscaling
	if (
		hooks.gamescopeUpscaling === "fsr" ||
		hooks.gamescopeUpscaling === "nis"
	) {
		commandPrefix.push("-F", hooks.gamescopeUpscaling);
	}

	// Always add -f (fullscreen wrapper) at the end
	commandPrefix.push("-f");

	return commandPrefix;
}

function parseResolution(
	resolution: string | undefined,
): { width: string; height: string } | null {
	const match = resolution?.trim().match(/^(\d{3,5})x(\d{3,5})$/i);
	if (!match) {
		return null;
	}

	return {
		width: match[1],
		height: match[2],
	};
}
