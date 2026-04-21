import { Electroview } from "electrobun/view";
import type { LauncherRPC } from "../shared/rpc";

// Create the typed RPC instance for communicating with the main process
// The handlers.requests are empty because the renderer doesn't handle requests from main
// The handlers.messages are empty because we use addMessageListener directly
const rpcInstance = Electroview.defineRPC<LauncherRPC>({
	handlers: {
		requests: {},
		messages: {},
	},
});

// Create the Electroview instance
const electroview = new Electroview({
	rpc: rpcInstance,
});

// Export the electroview instance
export { electroview };

// Also expose it globally for components that import electroview.ts indirectly
// via the global electroview variable
(globalThis as unknown as { electroview: typeof electroview }).electroview =
	electroview;
