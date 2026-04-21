import { Button } from "./Button";

interface SectionHeaderProps {
	title: string;
	subtitle: string;
	actionText?: string;
	actionIcon?: string;
	actionVariant?: "primary" | "secondary" | "outline" | "ghost";
	onAction?: () => void;
}

export function SectionHeader({
	title,
	subtitle,
	actionText,
	actionIcon,
	actionVariant = "primary",
	onAction,
}: SectionHeaderProps) {
	return (
		<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-outline-variant/20 pb-6 mb-6">
			<div>
				<h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-on-surface uppercase mb-2">
					{title}
				</h1>
				<p className="font-mono text-sm text-outline-variant uppercase tracking-widest border-l-2 border-primary-container pl-3">
					{subtitle}
				</p>
			</div>

			{actionText && (
				<Button variant={actionVariant} icon={actionIcon} onClick={onAction}>
					{actionText}
				</Button>
			)}
		</div>
	);
}
