import { constants, Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const DATABASE_FILE = "openlauncher.sqlite";

export function resolveDatabasePath(): string {
	const configuredPath = Bun.env.OPENLAUNCHER_DB_PATH?.trim();
	if (configuredPath) {
		return configuredPath;
	}

	const configuredDataHome = Bun.env.XDG_DATA_HOME?.trim();
	const dataHome = configuredDataHome || join(homedir(), ".local", "share");
	return join(dataHome, "openlauncher", DATABASE_FILE);
}

export function openLauncherDatabase(
	databasePath = resolveDatabasePath(),
): Database {
	mkdirSync(dirname(databasePath), { recursive: true });

	const database = new Database(databasePath, {
		create: true,
		readwrite: true,
		strict: true,
	});

	configureDatabase(database);
	createSchema(database);

	return database;
}

export function closeLauncherDatabase(database: Database): void {
	try {
		database.fileControl(constants.SQLITE_FCNTL_PERSIST_WAL, 0);
		database.run("PRAGMA wal_checkpoint(TRUNCATE);");
	} catch {
		// WAL cleanup is best effort during process shutdown.
	} finally {
		database.close();
	}
}

function configureDatabase(database: Database): void {
	database.run("PRAGMA journal_mode = WAL;");
	database.run("PRAGMA foreign_keys = ON;");
	database.run("PRAGMA busy_timeout = 5000;");
}

function createSchema(database: Database): void {
	database.run(`
		CREATE TABLE IF NOT EXISTS games (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			runner TEXT NOT NULL CHECK (runner IN ('native', 'umu')),
			path TEXT NOT NULL,
			cwd TEXT,
			args TEXT,
			env_json TEXT,
			hooks_json TEXT,
			cover_image TEXT,
			description TEXT,
			genre TEXT,
			release_date TEXT,
			developer TEXT,
			publisher TEXT,
			store TEXT CHECK (
				store IS NULL OR store IN ('steam', 'gog', 'epic', 'manual')
			),
			store_id TEXT,
			umu_game_id TEXT,
			umu_store TEXT,
			umu_proton_path TEXT,
			umu_wine_prefix TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);
	`);

	database.run("CREATE INDEX IF NOT EXISTS idx_games_title ON games(title);");
	database.run("CREATE INDEX IF NOT EXISTS idx_games_runner ON games(runner);");
	database.run("CREATE INDEX IF NOT EXISTS idx_games_store ON games(store);");
}
