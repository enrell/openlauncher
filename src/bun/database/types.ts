import type { Runner } from "../../shared/types/game";

export type GameRow = {
	id: string;
	title: string;
	runner: Runner;
	path: string;
	cwd: string | null;
	args: string | null;
	env_json: string | null;
	hooks_json: string | null;
	cover_image: string | null;
	description: string | null;
	genre: string | null;
	release_date: string | null;
	developer: string | null;
	publisher: string | null;
	store: string | null;
	store_id: string | null;
	umu_game_id: string | null;
	umu_store: string | null;
	umu_proton_path: string | null;
	umu_wine_prefix: string | null;
	created_at: string;
	updated_at: string;
};
