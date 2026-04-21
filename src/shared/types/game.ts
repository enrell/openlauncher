export type Runner = "native" | "umu";

export type GameStore = "steam" | "gog" | "epic" | "manual";

export type GameHooks = {
	gamescope?: boolean;
	mangohud?: boolean;
};

export type UmuConfig = {
	gameId?: string;
	store?: string;
	protonPath?: string;
	winePrefix?: string;
};

export type Game = {
	id: string;
	title: string;
	runner: Runner;
	path: string;
	cwd?: string;
	args?: string;
	env?: Record<string, string>;
	hooks?: GameHooks;
	coverImage?: string;
	description?: string;
	genre?: string;
	releaseDate?: string;
	developer?: string;
	publisher?: string;
	store?: GameStore;
	storeId?: string;
	umu?: UmuConfig;
	createdAt: string;
	updatedAt: string;
};

export type NewGame = Omit<Game, "id" | "createdAt" | "updatedAt">;

export type GamePatch = Partial<NewGame>;
