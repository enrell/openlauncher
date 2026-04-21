interface RunnerCardProps {
	title: string;
	path: string;
	statusVariant?: "active" | "installed";
	statusText: string;
	borderColor?: string;
	titleColor?: string;
}

export function RunnerCard({
	title,
	path,
	statusVariant = "installed",
	statusText,
	borderColor = "border-outline-variant/30",
	titleColor = "text-on-surface",
}: RunnerCardProps) {
	const badgeClasses =
		statusVariant === "active"
			? "bg-secondary/10 text-secondary"
			: "bg-surface-variant text-outline-variant";

	return (
		<div
			className={`flex flex-col sm:flex-row sm:items-center justify-between bg-surface-dim p-4 border-l-2 ${borderColor} hover:bg-surface-variant/50 transition-colors gap-4`}
		>
			<div>
				<h3 className={`font-headline font-bold text-lg ${titleColor}`}>
					{title}
				</h3>
				<p className="font-mono text-xs text-outline-variant mt-1">{path}</p>
			</div>
			<div className="flex items-center gap-3">
				<span
					className={`font-mono text-[10px] px-2 py-1 shatter-clip ${badgeClasses}`}
				>
					{statusText}
				</span>
				<button className="material-symbols-outlined text-outline-variant hover:text-error transition-colors">
					delete
				</button>
			</div>
		</div>
	);
}

interface ToolCardProps {
	title: string;
	description: string;
	version: string;
	iconColor?: string;
	hoverBorder?: string;
}

export function ToolCard({
	title,
	description,
	version,
	iconColor = "text-secondary",
	hoverBorder = "hover:border-secondary/50",
}: ToolCardProps) {
	return (
		<div
			className={`bg-surface-dim p-4 border border-outline-variant/20 flex flex-col gap-3 group ${hoverBorder} transition-colors`}
		>
			<div className="flex justify-between items-start">
				<h3 className="font-headline font-bold text-lg text-on-surface uppercase">
					{title}
				</h3>
				<span className={`material-symbols-outlined text-sm ${iconColor}`}>
					check_circle
				</span>
			</div>
			<p className="font-mono text-xs text-outline-variant">{description}</p>
			<div className="mt-auto pt-2 border-t border-outline-variant/10 flex justify-between items-center">
				<span className="font-mono text-[10px] text-outline-variant">
					{version}
				</span>
				<button
					className={`font-mono text-[10px] ${iconColor} hover:text-white transition-colors`}
				>
					CONFIGURE
				</button>
			</div>
		</div>
	);
}
