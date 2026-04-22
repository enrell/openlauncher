import type { GameHooks, Runner, UmuConfig } from "./game";

export type GamescopeUpscaling = "none" | "fsr" | "nis";

export type LaunchHooks = GameHooks & {
	gamescopeResolution?: string;
	gamescopeUpscaling?: GamescopeUpscaling;
	gamescopeFrameRate?: string;
	gamescopeBorderless?: boolean;
	gamescopeFullscreen?: boolean;
	gamescopeIntegerScale?: boolean;
	gamescopeVsync?: boolean;
};

export type LaunchOptions = {
	gameId: string;
	runner: Runner;
	path: string;
	cwd?: string;
	args?: string;
	env?: Record<string, string>;
	hooks?: LaunchHooks;
	umu?: UmuConfig;
};

export type LaunchResult = {
	success: boolean;
	exitCode: number | null;
	durationMs: number;
	error?: string;
	command?: string[];
};
