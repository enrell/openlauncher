import { useEffect, useState } from "react";
import type { Game } from "../shared/types/game";
import { AddGameModal } from "./components/AddGameModal";
import { AddGameCard, GameCard } from "./components/GameCard";
import { SectionHeader } from "./components/SectionHeader";
import { electroview } from "./electroview";

interface LibraryProps {
	onSelectGame: (game: Game) => void;
	gamesRefresh?: number;
}

type RunnerFilter = "all" | "umu" | "native";

export function Library({ onSelectGame, gamesRefresh }: LibraryProps) {
	const [isAddGameOpen, setIsAddGameOpen] = useState(false);
	const [games, setGames] = useState<Game[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [runnerFilter, setRunnerFilter] = useState<RunnerFilter>("all");

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
	}, [gamesRefresh]);

	const filteredGames = games.filter((game) => {
		const matchesSearch = game.title
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesRunner =
			runnerFilter === "all" || game.runner === runnerFilter;
		return matchesSearch && matchesRunner;
	});

	return (
		<>
			<SectionHeader
				title="Game Library"
				subtitle={`${filteredGames.length} OF ${games.length} GAMES`}
				actionText="ADD_GAME"
				actionIcon="add"
				onAction={() => setIsAddGameOpen(true)}
			/>

			{/* Filter Bar */}
			<div className="flex flex-col sm:flex-row gap-3 mb-6">
				<div className="flex-1">
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search games..."
						className="w-full !py-2.5 px-3 bg-surface-container-high border border-outline-variant/50 rounded font-mono text-xs text-on-surface placeholder:text-outline-variant focus:border-primary focus:outline-none transition-colors"
					/>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => setRunnerFilter("all")}
						className={`px-3 py-2 font-mono text-xs rounded border transition-colors ${
							runnerFilter === "all"
								? "bg-primary text-on-primary border-primary"
								: "bg-surface-container-high border-outline-variant/50 text-secondary hover:border-primary"
						}`}
					>
						ALL
					</button>
					<button
						onClick={() => setRunnerFilter("umu")}
						className={`px-3 py-2 font-mono text-xs rounded border transition-colors ${
							runnerFilter === "umu"
								? "bg-primary text-on-primary border-primary"
								: "bg-surface-container-high border-outline-variant/50 text-secondary hover:border-primary"
						}`}
					>
						UMU
					</button>
					<button
						onClick={() => setRunnerFilter("native")}
						className={`px-3 py-2 font-mono text-xs rounded border transition-colors ${
							runnerFilter === "native"
								? "bg-primary text-on-primary border-primary"
								: "bg-surface-container-high border-outline-variant/50 text-secondary hover:border-primary"
						}`}
					>
						NATIVE
					</button>
				</div>
			</div>

			{/* Grid of Games */}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
				{loading && (
					<div className="col-span-full flex items-center justify-center py-12">
						<span className="font-mono text-sm text-outline-variant animate-pulse">
							LOADING_GAMES...
						</span>
					</div>
				)}

				{!loading && filteredGames.length === 0 && (
					<div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
						<span className="material-symbols-outlined text-5xl text-outline-variant/50 mb-3">
							sports_esports
						</span>
						<p className="font-mono text-sm text-outline-variant">
							{searchQuery || runnerFilter !== "all"
								? "NO GAMES MATCH FILTER"
								: "NO GAMES YET"}
						</p>
					</div>
				)}

				{!loading &&
					filteredGames.map((game) => (
						<GameCard
							key={game.id}
							title={game.title}
							coverImage={game.coverImage}
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
