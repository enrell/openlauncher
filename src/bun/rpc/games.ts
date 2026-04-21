import type { GamePatch, NewGame } from "../../shared/types/game";
import type { GameRepository } from "../database/queries";
import { resolveUmuGameId } from "../metadata/umu-database";

export function createGameRequestHandlers(gameRepository: GameRepository) {
	return {
		gameList: () => gameRepository.listGames(),
		gameGet: ({ id }: { id: string }) => gameRepository.getGame(id),
		gameCreate: async (newGame: NewGame) => {
			const game = await gameRepository.createGame(newGame);
			const resolved = await resolveAndUpdateGameId(game);
			if (resolved.umu?.gameId !== game.umu?.gameId) {
				gameRepository.updateGame(game.id, { umu: resolved.umu });
			}
			return resolved;
		},
		gameUpdate: ({ id, patch }: { id: string; patch: GamePatch }) =>
			gameRepository.updateGame(id, patch),
		gameDelete: ({ id }: { id: string }) => gameRepository.deleteGame(id),
	};
}

async function resolveAndUpdateGameId(game: { id: string; title: string; runner: string; store?: string; umu?: { gameId?: string; store?: string } }): Promise<typeof game> {
	if (game.runner !== "umu") return game;
	if (game.umu?.gameId) return game;

	const store = game.store && game.store !== "manual" ? game.store : game.umu?.store ?? "none";
	const codename = await resolveUmuGameId(game.title, store);
	if (!codename) return game;

	const updated = {
		...game,
		umu: { ...game.umu, gameId: codename },
	};
	return updated;
}
