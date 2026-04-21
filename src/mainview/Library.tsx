import { useEffect, useState } from "react";
import type { Game } from "../shared/types/game";
import { AddGameModal } from "./components/AddGameModal";
import { AddGameCard, GameCard } from "./components/GameCard";
import { SectionHeader } from "./components/SectionHeader";
import { electroview } from "./electroview";

interface LibraryProps {
	onSelectGame: (game: Game) => void;
}

export function Library({ onSelectGame }: LibraryProps) {
	const [isAddGameOpen, setIsAddGameOpen] = useState(false);
	const [games, setGames] = useState<Game[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		electroview.rpc.request
			.gameList()
			.then((result) => {
				setGames(result);
				setLoading(false);
			})
			.catch(() => {
				setLoading(false);
			});
	}, []);

	return (
		<>
			<SectionHeader
				title="Game Library"
				subtitle={`${games.length} INSTALLED_GAMES`}
				actionText="ADD_GAME"
				actionIcon="add"
				onAction={() => setIsAddGameOpen(true)}
			/>

			{/* Grid of Games */}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
				{loading && (
					<div className="col-span-full flex items-center justify-center py-12">
						<span className="font-mono text-sm text-outline-variant animate-pulse">
							LOADING_GAMES...
						</span>
					</div>
				)}

				{!loading &&
					games.map((game) => (
						<GameCard
							key={game.id}
							title={game.title}
							statusText={game.runner === "umu" ? "UMU RUNNER" : "LINUX NATIVE"}
							badgeVariant={game.store === "steam" ? "ready" : "default"}
							badgeText={game.store?.toUpperCase() ?? "MANUAL"}
							onClick={() => onSelectGame(game)}
						/>
					))}

				<AddGameCard onClick={() => setIsAddGameOpen(true)} />
			</div>

			<AddGameModal
				isOpen={isAddGameOpen}
				onClose={() => setIsAddGameOpen(false)}
				onGameCreated={() => {
					electroview.rpc.request
						.gameList()
						.then(setGames)
						.catch(() => {});
				}}
			/>
		</>
	);
}
