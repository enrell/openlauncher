export type RAWGNamedResource = {
	id: number;
	name: string;
	slug?: string;
};

export type RAWGPlatformEntry = {
	platform: RAWGNamedResource;
	released_at?: string | null;
	requirements?: {
		minimum?: string;
		recommended?: string;
	} | null;
};

export type RAWGStoreEntry = {
	store: RAWGNamedResource;
};

export interface RAWGSearchResult {
	id: number;
	name: string;
	slug: string;
	released: string | null;
	background_image: string | null;
	rating: number;
	metacritic: number | null;
	genres: RAWGNamedResource[];
	platforms: RAWGPlatformEntry[];
	stores: RAWGStoreEntry[];
}

export interface RAWGSearchResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: RAWGSearchResult[];
}

export interface RAWGGameDetails extends RAWGSearchResult {
	description: string;
	background_image_additional: string | null;
	clip?: {
		clip?: string | null;
		video?: string | null;
	} | null;
	developers: RAWGNamedResource[];
	publishers: RAWGNamedResource[];
	tags: RAWGNamedResource[];
	website: string;
	metacritic_url: string;
	playtime: number;
	ratings_count: number;
	tba: boolean;
}
