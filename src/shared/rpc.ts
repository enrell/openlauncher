import type { Game, GamePatch, NewGame } from "./types/game";
import type { LaunchOptions, LaunchResult } from "./types/launch";
import type { RAWGGameDetails, RAWGSearchResult } from "./types/rawg";

export type LauncherRPC = {
	bun: {
		requests: {
			openFileDialog: { params: undefined; response: string | null };
			gameList: { params: undefined; response: Game[] };
			gameGet: { params: { id: string }; response: Game | null };
			gameCreate: { params: NewGame; response: Game };
			gameUpdate: {
				params: { id: string; patch: GamePatch };
				response: Game | null;
			};
			gameDelete: { params: { id: string }; response: boolean };
			gameLaunch: {
				params: { id: string; options?: Partial<LaunchOptions> };
				response: LaunchResult;
			};
			runInstaller: {
				params: {
					path: string;
					runner: "native" | "umu";
					args?: string;
				};
				response: { started: boolean };
			};
			credentialStore: {
				params: { key: string; value: string };
				response: boolean;
			};
			credentialGet: { params: { key: string }; response: string | null };
			credentialDelete: { params: { key: string }; response: boolean };
			metadataSearch: {
				params: { query: string };
				response: RAWGSearchResult[];
			};
			metadataGetDetails: {
				params: { rawgId: number; refresh?: boolean };
				response: RAWGGameDetails | null;
			};
		};
		// biome-ignore lint/complexity/noBannedTypes: empty messages object is intentional for RPC contract
		messages: {};
	};
	webview: {
		// biome-ignore lint/complexity/noBannedTypes: empty requests object is intentional for RPC contract
		requests: {};
		messages: {
			gameLaunchStarted: { gameId: string; title: string };
			gameLaunchEnded: {
				gameId: string;
				title: string;
				exitCode: number | null;
				durationMs: number;
			};
		};
	};
};
