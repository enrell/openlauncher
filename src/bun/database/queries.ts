import type { Database, SQLQueryBindings } from "bun:sqlite";
import type {
	Game,
	GameHooks,
	GamePatch,
	GameStore,
	NewGame,
	Runner,
	UmuConfig,
} from "../../shared/types/game";
import type { GameRow } from "./types";

type GameBindings = Record<string, string | null>;

export type GameRepository = {
	listGames(): Game[];
	getGame(id: string): Game | null;
	createGame(newGame: NewGame): Game;
	updateGame(id: string, patch: GamePatch): Game | null;
	deleteGame(id: string): boolean;
};

const SELECT_COLUMNS = `
	id,
	title,
	runner,
	path,
	cwd,
	args,
	env_json,
	hooks_json,
	cover_image,
	description,
	genre,
	release_date,
	developer,
	publisher,
	store,
	store_id,
	umu_game_id,
	umu_store,
	umu_proton_path,
	umu_wine_prefix,
	created_at,
	updated_at
`;

export function createGameRepository(database: Database): GameRepository {
	const selectAll = database.query<GameRow, []>(`
		SELECT ${SELECT_COLUMNS}
		FROM games
		ORDER BY lower(title), title;
	`);

	const selectById = database.query<GameRow, [{ id: string }]>(`
		SELECT ${SELECT_COLUMNS}
		FROM games
		WHERE id = $id;
	`);

	const insertGame = database.query<unknown, [GameBindings]>(`
		INSERT INTO games (
			id,
			title,
			runner,
			path,
			cwd,
			args,
			env_json,
			hooks_json,
			cover_image,
			description,
			genre,
			release_date,
			developer,
			publisher,
			store,
			store_id,
			umu_game_id,
			umu_store,
			umu_proton_path,
			umu_wine_prefix,
			created_at,
			updated_at
		) VALUES (
			$id,
			$title,
			$runner,
			$path,
			$cwd,
			$args,
			$env_json,
			$hooks_json,
			$cover_image,
			$description,
			$genre,
			$release_date,
			$developer,
			$publisher,
			$store,
			$store_id,
			$umu_game_id,
			$umu_store,
			$umu_proton_path,
			$umu_wine_prefix,
			$created_at,
			$updated_at
		);
	`);

	const updateGame = database.query<unknown, [GameBindings]>(`
		UPDATE games
		SET
			title = $title,
			runner = $runner,
			path = $path,
			cwd = $cwd,
			args = $args,
			env_json = $env_json,
			hooks_json = $hooks_json,
			cover_image = $cover_image,
			description = $description,
			genre = $genre,
			release_date = $release_date,
			developer = $developer,
			publisher = $publisher,
			store = $store,
			store_id = $store_id,
			umu_game_id = $umu_game_id,
			umu_store = $umu_store,
			umu_proton_path = $umu_proton_path,
			umu_wine_prefix = $umu_wine_prefix,
			updated_at = $updated_at
		WHERE id = $id;
	`);

	const deleteById = database.query<unknown, [{ id: string }]>(`
		DELETE FROM games
		WHERE id = $id;
	`);

	return {
		listGames() {
			return selectAll.all().map(rowToGame);
		},
		getGame(id: string) {
			const row = selectById.get({ id });
			return row ? rowToGame(row) : null;
		},
		createGame(newGame: NewGame) {
			const now = new Date().toISOString();
			const game = normalizeGame({
				...newGame,
				id: crypto.randomUUID(),
				createdAt: now,
				updatedAt: now,
			});

			insertGame.run(gameToBindings(game));
			return game;
		},
		updateGame(id: string, patch: GamePatch) {
			const currentGame = this.getGame(id);
			if (!currentGame) {
				return null;
			}

			const updatedGame = normalizeGame({
				...currentGame,
				...patch,
				hooks: patch.hooks ?? currentGame.hooks,
				env: patch.env ?? currentGame.env,
				umu: patch.umu ?? currentGame.umu,
				id: currentGame.id,
				createdAt: currentGame.createdAt,
				updatedAt: new Date().toISOString(),
			});

			updateGame.run(gameToBindings(updatedGame));
			return updatedGame;
		},
		deleteGame(id: string) {
			return deleteById.run({ id }).changes > 0;
		},
	};
}

function normalizeGame(game: Game): Game {
	return {
		...game,
		title: requireText(game.title, "Game title"),
		runner: requireRunner(game.runner),
		path: requireText(game.path, "Executable path"),
		cwd: trimOptionalText(game.cwd),
		args: trimOptionalText(game.args),
		coverImage: trimOptionalText(game.coverImage),
		description: trimOptionalText(game.description),
		genre: trimOptionalText(game.genre),
		releaseDate: trimOptionalText(game.releaseDate),
		developer: trimOptionalText(game.developer),
		publisher: trimOptionalText(game.publisher),
		store: normalizeStore(game.store),
		storeId: trimOptionalText(game.storeId),
		umu: normalizeUmuConfig(game.umu),
	};
}

function requireText(value: string, label: string): string {
	const trimmedValue = value.trim();
	if (!trimmedValue) {
		throw new Error(`${label} is required.`);
	}
	return trimmedValue;
}

function trimOptionalText(value: string | undefined): string | undefined {
	const trimmedValue = value?.trim();
	return trimmedValue || undefined;
}

function requireRunner(runner: Runner): Runner {
	if (runner === "native" || runner === "umu") {
		return runner;
	}
	throw new Error(`Unsupported runner: ${String(runner)}`);
}

function normalizeStore(store: GameStore | undefined): GameStore | undefined {
	if (!store) {
		return undefined;
	}
	if (
		store === "steam" ||
		store === "gog" ||
		store === "epic" ||
		store === "manual"
	) {
		return store;
	}
	throw new Error(`Unsupported store: ${String(store)}`);
}

function normalizeUmuConfig(umu: UmuConfig | undefined): UmuConfig | undefined {
	if (!umu) {
		return undefined;
	}

	const normalizedUmu = {
		gameId: trimOptionalText(umu.gameId),
		store: trimOptionalText(umu.store),
		protonPath: trimOptionalText(umu.protonPath),
		winePrefix: trimOptionalText(umu.winePrefix),
	};

	return hasUmuConfig(normalizedUmu) ? normalizedUmu : undefined;
}

function hasUmuConfig(umu: UmuConfig): boolean {
	return Boolean(umu.gameId || umu.store || umu.protonPath || umu.winePrefix);
}

function rowToGame(row: GameRow): Game {
	const umu = rowToUmuConfig(row);

	return {
		id: row.id,
		title: row.title,
		runner: row.runner,
		path: row.path,
		cwd: optionalText(row.cwd),
		args: optionalText(row.args),
		env: parseStringRecord(row.env_json),
		hooks: parseHooks(row.hooks_json),
		coverImage: optionalText(row.cover_image),
		description: optionalText(row.description),
		genre: optionalText(row.genre),
		releaseDate: optionalText(row.release_date),
		developer: optionalText(row.developer),
		publisher: optionalText(row.publisher),
		store: normalizeStore(optionalText(row.store) as GameStore | undefined),
		storeId: optionalText(row.store_id),
		umu,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function rowToUmuConfig(row: GameRow): UmuConfig | undefined {
	return normalizeUmuConfig({
		gameId: optionalText(row.umu_game_id),
		store: optionalText(row.umu_store),
		protonPath: optionalText(row.umu_proton_path),
		winePrefix: optionalText(row.umu_wine_prefix),
	});
}

function optionalText(value: string | null): string | undefined {
	return value || undefined;
}

function parseStringRecord(
	json: string | null,
): Record<string, string> | undefined {
	if (!json) {
		return undefined;
	}

	const parsedValue: unknown = JSON.parse(json);
	if (!isStringRecord(parsedValue)) {
		throw new Error("Stored environment JSON is not a string record.");
	}

	return parsedValue;
}

function isStringRecord(value: unknown): value is Record<string, string> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return false;
	}

	return Object.values(value).every(
		(recordValue) => typeof recordValue === "string",
	);
}

function parseHooks(json: string | null): GameHooks | undefined {
	if (!json) {
		return undefined;
	}

	const parsedValue: unknown = JSON.parse(json);
	if (
		!parsedValue ||
		typeof parsedValue !== "object" ||
		Array.isArray(parsedValue)
	) {
		throw new Error("Stored hooks JSON is not an object.");
	}

	const hooks = parsedValue as Record<string, unknown>;
	return {
		gamescope: hooks.gamescope === true || undefined,
		mangohud: hooks.mangohud === true || undefined,
	};
}

function gameToBindings(game: Game): GameBindings {
	const umu = game.umu;

	return {
		id: game.id,
		title: game.title,
		runner: game.runner,
		path: game.path,
		cwd: game.cwd ?? null,
		args: game.args ?? null,
		env_json: stringifyOptional(game.env),
		hooks_json: stringifyOptional(game.hooks),
		cover_image: game.coverImage ?? null,
		description: game.description ?? null,
		genre: game.genre ?? null,
		release_date: game.releaseDate ?? null,
		developer: game.developer ?? null,
		publisher: game.publisher ?? null,
		store: game.store ?? null,
		store_id: game.storeId ?? null,
		umu_game_id: umu?.gameId ?? null,
		umu_store: umu?.store ?? null,
		umu_proton_path: umu?.protonPath ?? null,
		umu_wine_prefix: umu?.winePrefix ?? null,
		created_at: game.createdAt,
		updated_at: game.updatedAt,
	} satisfies Record<string, SQLQueryBindings>;
}

function stringifyOptional(value: object | undefined): string | null {
	return value ? JSON.stringify(value) : null;
}
