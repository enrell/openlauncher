import { Badge } from "./Badge";

interface GameCardProps {
	title: string;
	statusText: string;
	badgeVariant?: "ready" | "updating" | "error" | "default";
	badgeText?: string;
	isUpdating?: boolean;
	progress?: number;
	progressText?: string;
	disabled?: boolean;
	onClick?: () => void;
}

export function GameCard({
	title,
	statusText,
	badgeVariant,
	badgeText,
	isUpdating = false,
	progress = 0,
	progressText,
	disabled = false,
	onClick,
}: GameCardProps) {
	const containerClasses = `group flex flex-col gap-3 transition-opacity ${disabled ? "opacity-60" : "cursor-pointer"} ${disabled && !onClick ? "" : "hover:opacity-100"}`;
	const imageContainerClasses = `aspect-[3/4] shatter-clip bg-surface-container relative overflow-hidden border transition-colors ${isUpdating ? "border-secondary/50 glow-secondary" : "border-outline-variant/30 group-hover:border-primary-container/50"}`;

	return (
		<div className={containerClasses} onClick={disabled ? undefined : onClick}>
			<div className={imageContainerClasses}>
				<div className="absolute inset-0 scanlines opacity-20 pointer-events-none z-10"></div>
				<div
					className={`absolute inset-0 bg-surface-dim/80 z-0 flex items-center justify-center ${!disabled && !isUpdating ? "group-hover:scale-105 transition-transform duration-500" : ""} ${disabled ? "grayscale" : ""}`}
				>
					<span className="material-symbols-outlined text-6xl text-outline-variant/50">
						sports_esports
					</span>
				</div>

				{isUpdating && (
					<div className="absolute bottom-0 left-0 w-full h-1 bg-surface-dim z-20">
						<div
							className="h-full bg-secondary"
							style={{ width: `${progress}%` }}
						></div>
					</div>
				)}

				{badgeText && (
					<div className="absolute top-2 right-2 z-20">
						<Badge variant={badgeVariant} pulse={isUpdating}>
							{badgeText}
						</Badge>
					</div>
				)}
			</div>
			<div>
				<h3
					className={`font-headline font-bold uppercase truncate transition-colors ${isUpdating ? "text-secondary" : "text-on-surface group-hover:text-primary"}`}
				>
					{title}
				</h3>
				<p className="font-mono text-xs text-outline-variant">
					{isUpdating && progressText ? progressText : statusText}
				</p>
			</div>
		</div>
	);
}

export function AddGameCard({ onClick }: { onClick?: () => void }) {
	return (
		<div className="group cursor-pointer flex flex-col gap-3" onClick={onClick}>
			<div className="aspect-[3/4] shatter-clip bg-surface-container-highest relative overflow-hidden border-2 border-dashed border-outline-variant/40 group-hover:border-primary-container/80 hover:bg-surface-variant transition-all flex flex-col items-center justify-center gap-4">
				<span className="material-symbols-outlined text-4xl text-outline-variant group-hover:text-primary transition-colors">
					add_circle
				</span>
				<span className="font-mono text-xs text-outline-variant group-hover:text-primary transition-colors uppercase tracking-widest">
					Import Local
				</span>
			</div>
			<div>
				<h3 className="font-headline font-bold text-transparent select-none">
					_
				</h3>
				<p className="font-mono text-xs text-transparent select-none">_</p>
			</div>
		</div>
	);
}
