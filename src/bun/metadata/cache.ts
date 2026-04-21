import type { Database } from "bun:sqlite";
import type { RAWGGameDetails } from "../../shared/types/rawg";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type MetadataCacheRow = {
	data: string | null;
	fetched_at: string | null;
};

type MetadataCacheBindings = {
	rawg_id: number;
	data: string;
	fetched_at: string;
};

export type MetadataCache = {
	get(rawgId: number): RAWGGameDetails | null;
	set(rawgId: number, gameDetails: RAWGGameDetails): void;
};

export function createMetadataCache(
	database: Database,
	now: () => Date = () => new Date(),
): MetadataCache {
	database.run(`
		CREATE TABLE IF NOT EXISTS metadata_cache (
			rawg_id INTEGER PRIMARY KEY,
			data TEXT,
			fetched_at TEXT
		);
	`);

	const selectByRawgId = database.query<
		MetadataCacheRow,
		[{ rawg_id: number }]
	>(`
		SELECT data, fetched_at
		FROM metadata_cache
		WHERE rawg_id = $rawg_id;
	`);

	const upsertDetails = database.query<unknown, [MetadataCacheBindings]>(`
		INSERT INTO metadata_cache (rawg_id, data, fetched_at)
		VALUES ($rawg_id, $data, $fetched_at)
		ON CONFLICT(rawg_id) DO UPDATE SET
			data = excluded.data,
			fetched_at = excluded.fetched_at;
	`);

	return {
		get(rawgId: number) {
			if (!isValidRawgId(rawgId)) {
				return null;
			}

			const row = selectByRawgId.get({ rawg_id: rawgId });
			if (!row?.data || !row.fetched_at || isExpired(row.fetched_at, now())) {
				return null;
			}

			return parseDetails(row.data);
		},
		set(rawgId: number, gameDetails: RAWGGameDetails) {
			if (!isValidRawgId(rawgId)) {
				throw new Error(`Invalid RAWG id: ${rawgId}`);
			}

			upsertDetails.run({
				rawg_id: rawgId,
				data: JSON.stringify(gameDetails),
				fetched_at: now().toISOString(),
			});
		},
	};
}

function isValidRawgId(rawgId: number): boolean {
	return Number.isInteger(rawgId) && rawgId > 0;
}

function isExpired(fetchedAt: string, now: Date): boolean {
	const fetchedAtMs = Date.parse(fetchedAt);
	if (!Number.isFinite(fetchedAtMs)) {
		return true;
	}

	return now.getTime() - fetchedAtMs > CACHE_TTL_MS;
}

function parseDetails(serializedDetails: string): RAWGGameDetails | null {
	try {
		return JSON.parse(serializedDetails) as RAWGGameDetails;
	} catch {
		return null;
	}
}
