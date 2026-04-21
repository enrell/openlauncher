import { BrowserView, BrowserWindow, Updater, Utils } from "electrobun/bun";
import type { LauncherRPC } from "../shared/rpc";
import { closeLauncherDatabase, openLauncherDatabase } from "./database/db";
import { createGameRepository } from "./database/queries";
import { createMetadataService } from "./metadata";
import { createCredentialRequestHandlers } from "./rpc/credentials";
import { createGameRequestHandlers } from "./rpc/games";
import { createLaunchRequestHandlers } from "./rpc/launch";
import { createMetadataRequestHandlers } from "./rpc/metadata";

const DEV_SERVER_PORT = 5175;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

type LaunchStartedPayload =
	LauncherRPC["webview"]["messages"]["gameLaunchStarted"];
type LaunchEndedPayload = LauncherRPC["webview"]["messages"]["gameLaunchEnded"];

const database = openLauncherDatabase();
const gameRepository = createGameRepository(database);
const metadataService = createMetadataService(database);

process.on("exit", () => {
	closeLauncherDatabase(database);
});

let sendLaunchStarted = (_payload: LaunchStartedPayload): void => {};
let sendLaunchEnded = (_payload: LaunchEndedPayload): void => {};

// Check if Vite dev server is running for HMR
async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log(
				"Vite dev server not running. Run 'bun run dev:hmr' for HMR support.",
			);
		}
	}
	return "views://mainview/index.html";
}

// Create the main application window
const url = await getMainViewUrl();

const rpc = BrowserView.defineRPC<LauncherRPC>({
	handlers: {
		requests: {
			openFileDialog: async () => {
				const files = await Utils.openFileDialog({
					canChooseFiles: true,
					canChooseDirectory: false,
					allowsMultipleSelection: false,
				});
				return files[0] || null;
			},
			...createGameRequestHandlers(gameRepository),
			...createLaunchRequestHandlers(gameRepository, {
				started: (payload) => sendLaunchStarted(payload),
				ended: (payload) => sendLaunchEnded(payload),
			}),
			...createCredentialRequestHandlers(),
			...createMetadataRequestHandlers(metadataService),
		},
		messages: {},
	},
});

sendLaunchStarted = (payload) => rpc.send.gameLaunchStarted(payload);
sendLaunchEnded = (payload) => rpc.send.gameLaunchEnded(payload);

const mainWindow = new BrowserWindow({
	title: "OpenLauncher",
	url,
	rpc,
	frame: {
		width: 1320,
		height: 860,
		x: 200,
		y: 200,
	},
});
void mainWindow;

console.log("OpenLauncher bootstrap started!");
