import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Game } from "../shared/types/game";
import { GameConfigModal } from "./components/GameConfigModal";

interface GameDetailsProps {
	game: Game;
	onBack: () => void;
}

export function GameDetails({ game, onBack }: GameDetailsProps) {
	const [isConfigOpen, setIsConfigOpen] = useState(false);
	const [launchStatus, setLaunchStatus] = useState<string | null>(null);
	const bgUrl =
		game.coverImage ||
		"https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=2850&q=80";

	useEffect(() => {
		const handler = (payload: {
			gameId: string;
			title: string;
			exitCode: number | null;
			durationMs: number;
		}) => {
			if (payload.gameId === game.id) {
				setLaunchStatus(
					payload.exitCode !== null
						? `Exited with code ${payload.exitCode} after ${Math.round(payload.durationMs / 1000)}s`
						: `Launched successfully (${Math.round(payload.durationMs / 1000)}s)`,
				);
				setTimeout(() => setLaunchStatus(null), 5000);
			}
		};
		electroview.rpc.on("gameLaunchEnded", handler);
		return () => {
			electroview.rpc.off("gameLaunchEnded", handler);
		};
	}, [game.id]);

	const handlePlay = async () => {
		setLaunchStatus("LAUNCHING...");
		try {
			await electroview.rpc.request.gameLaunch({ id: game.id });
		} catch (err) {
			setLaunchStatus(
				`LAUNCH FAILED: ${err instanceof Error ? err.message : String(err)}`,
			);
			setTimeout(() => setLaunchStatus(null), 5000);
		}
	};

	const runnerLabel = game.runner === "umu" ? "UMU RUNNER" : "LINUX NATIVE";

	return (
		<>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 1.05 }}
				transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
				className="absolute inset-0 z-50 bg-surface flex flex-col justify-between overflow-hidden"
			>
				{/* Background Image & Overlays */}
				<div className="absolute inset-0 z-0">
					<img
						src={bgUrl}
						alt={game.title}
						className="w-full h-full object-cover opacity-60"
					/>
					<div className="absolute inset-0 bg-gradient-to-b from-surface/80 via-transparent to-surface z-10"></div>
					<div className="absolute inset-0 bg-gradient-to-r from-surface/90 via-surface/40 to-transparent z-10"></div>
					<div className="absolute inset-0 scanlines opacity-30 pointer-events-none z-20"></div>
				</div>

				{/* Top Area: Back Button & Title */}
				<div className="relative z-30 p-8 flex flex-col items-start gap-8 flex-1">
					<button
						onClick={onBack}
						className="shatter-clip bg-surface-container/80 backdrop-blur-md hover:bg-surface-variant text-on-surface border border-outline-variant/30 p-4 transition-all flex items-center justify-center group"
					>
						<span className="material-symbols-outlined text-2xl group-hover:-translate-x-1 transition-transform">
							arrow_back
						</span>
					</button>

					<motion.h1
						initial={{ x: -20, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
						className="font-headline text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white uppercase text-left drop-shadow-2xl max-w-[60%] break-words leading-tight"
					>
						{game.title}
					</motion.h1>
				</div>

				{/* Bottom Bar: Config & Play */}
				<div className="relative z-30 p-8 flex justify-between items-end">
					{/* Bottom Left: Config */}
					<motion.button
						initial={{ x: -50, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
						onClick={() => setIsConfigOpen(true)}
						className="shatter-clip bg-surface-container/80 backdrop-blur-md hover:bg-surface-variant text-on-surface border border-outline-variant/30 px-6 py-4 transition-all flex items-center gap-3 group"
					>
						<span className="material-symbols-outlined text-2xl text-outline-variant group-hover:text-primary transition-colors">
							tune
						</span>
						<span className="font-mono text-sm uppercase tracking-widest font-bold">
							Game Config
						</span>
					</motion.button>

					{/* Bottom Right: Giant Play Button (Scaled down) */}
					<motion.button
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						transition={{
							delay: 0.4,
							duration: 0.5,
							ease: "easeOut",
						}}
						onClick={handlePlay}
						className="relative group cursor-pointer outline-none"
					>
						<div className="absolute inset-0 bg-primary-container blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300 rounded-full"></div>
						<div className="shatter-clip-reverse bg-gradient-to-r from-[#9D00FF] to-[#6b00b0] hover:from-[#b333ff] hover:to-[#8c00e5] px-6 py-3 md:py-4 flex items-center gap-3 border border-[#dfb7ff]/30 shadow-[0_0_15px_rgba(157,0,255,0.4)] transition-all relative z-10">
							<span
								className="material-symbols-outlined text-3xl md:text-4xl text-white"
								style={{ fontVariationSettings: "'FILL' 1" }}
							>
								play_arrow
							</span>
							<div className="flex flex-col items-start pr-2">
								<span className="font-headline font-black text-lg md:text-xl text-white uppercase tracking-tight leading-none">
									Play Now
								</span>
								<span className="font-mono text-[9px] md:text-[10px] text-primary-fixed-dim tracking-widest mt-1">
									{launchStatus ?? runnerLabel}
								</span>
							</div>
						</div>
					</motion.button>
				</div>
			</motion.div>

			<GameConfigModal
				isOpen={isConfigOpen}
				onClose={() => setIsConfigOpen(false)}
				gameTitle={game.title}
			/>
		</>
	);
}
