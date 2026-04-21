import type { LauncherRPC } from "../../shared/rpc";
import type { LaunchOptions, LaunchResult } from "../../shared/types/launch";
import type { GameRepository } from "../database/queries";
import { execute } from "../launcher";
import { resolveUmuGameId } from "../metadata/umu-database";

type LaunchStartedPayload =
	LauncherRPC["webview"]["messages"]["gameLaunchStarted"];
type LaunchEndedPayload = LauncherRPC["webview"]["messages"]["gameLaunchEnded"];

type LaunchNotifications = {
	started(payload: LaunchStartedPayload): void;
	ended(payload: LaunchEndedPayload): void;
};

export function createLaunchRequestHandlers(
	gameRepository: GameRepository,
	notifications: LaunchNotifications,
) {
	return {
		gameLaunch: async ({
			id,
			options,
		}: {
			id: string;
			options?: Partial<LaunchOptions>;
		}): Promise<LaunchResult> => {
			const game = gameRepository.getGame(id);
			if (!game) {
				return {
					success: false,
					exitCode: null,
					durationMs: 0,
					error: `Game not found: ${id}`,
				};
			}

			const resolvedGame = await resolveAndUpdateGameId(game);

			notifyStarted(notifications, {
				gameId: resolvedGame.id,
				title: resolvedGame.title,
			});

			const result = await execute(resolvedGame, options);
			notifyEnded(notifications, {
				gameId: resolvedGame.id,
				title: resolvedGame.title,
				exitCode: result.exitCode,
				durationMs: result.durationMs,
			});

			return result;
		},
		runInstaller: async ({
			path,
			runner,
			args,
		}: {
			path: string;
			runner: "native" | "umu";
			args?: string;
		}): Promise<{ started: boolean }> => {
			notifyStarted(notifications, {
				gameId: "",
				title: "Installer",
			});

			// Fire and forget - launch installer without waiting
			execute(
				{
					id: "",
					title: "Installer",
					runner,
					path,
					args,
				},
				{},
			)
				.then((result) => {
					notifyEnded(notifications, {
						gameId: "",
						title: "Installer",
						exitCode: result.exitCode,
						durationMs: result.durationMs,
					});
				})
				.catch(() => {
					notifyEnded(notifications, {
						gameId: "",
						title: "Installer",
						exitCode: -1,
						durationMs: 0,
					});
				});

			return { started: true };
		},
	};
}

function notifyStarted(
	notifications: LaunchNotifications,
	payload: LaunchStartedPayload,
): void {
	try {
		notifications.started(payload);
	} catch {
		// The launch result is more important than a best-effort UI event.
	}
}

function notifyEnded(
	notifications: LaunchNotifications,
	payload: LaunchEndedPayload,
): void {
	try {
		notifications.ended(payload);
	} catch {
		// The launch result is more important than a best-effort UI event.
	}
}
