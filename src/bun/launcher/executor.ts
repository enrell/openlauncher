import type { LaunchResult } from "../../shared/types/launch";

export type LaunchCommand = {
	command: string[];
	cwd?: string;
	env?: Record<string, string>;
};

export async function executeCommand(
	launchCommand: LaunchCommand,
): Promise<LaunchResult> {
	const startedAt = Date.now();

	try {
		const subprocess = Bun.spawn({
			cmd: launchCommand.command,
			cwd: launchCommand.cwd,
			env: mergeEnvironment(launchCommand.env),
			stdin: "ignore",
			stdout: "inherit",
			stderr: "inherit",
		});

		const exitCode = await subprocess.exited;
		return {
			success: exitCode === 0,
			exitCode,
			durationMs: Date.now() - startedAt,
			command: launchCommand.command,
		};
	} catch (error) {
		return {
			success: false,
			exitCode: null,
			durationMs: Date.now() - startedAt,
			error: errorMessage(error),
			command: launchCommand.command,
		};
	}
}

function mergeEnvironment(
	env: Record<string, string> | undefined,
): Record<string, string | undefined> {
	return {
		...Bun.env,
		...env,
	};
}

function errorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}
