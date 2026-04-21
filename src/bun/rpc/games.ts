import type { GamePatch, NewGame } from "../../shared/types/game";
import type { GameRepository } from "../database/queries";

export function createGameRequestHandlers(gameRepository: GameRepository) {
	return {
		gameList: () => gameRepository.listGames(),
		gameGet: ({ id }: { id: string }) => gameRepository.getGame(id),
		gameCreate: (newGame: NewGame) => gameRepository.createGame(newGame),
		gameUpdate: ({ id, patch }: { id: string; patch: GamePatch }) =>
			gameRepository.updateGame(id, patch),
		gameDelete: ({ id }: { id: string }) => gameRepository.deleteGame(id),
	};
}
