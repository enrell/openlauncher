import React from "react";

interface PanelProps {
	title: string;
	icon: string;
	iconColor?: string;
	children: React.ReactNode;
	reverseClip?: boolean;
	className?: string;
}

export function Panel({
	title,
	icon,
	iconColor = "text-primary",
	children,
	reverseClip = false,
	className = "",
}: PanelProps) {
	const clipClass = reverseClip ? "shatter-clip-reverse" : "shatter-clip";
	return (
		<div
			className={`bg-surface-container ${clipClass} p-6 border border-outline-variant/30 relative ${className}`}
		>
			<div className="absolute inset-0 scanlines opacity-10 pointer-events-none z-10"></div>
			<div className="flex items-center gap-2 mb-6">
				<span className={`material-symbols-outlined text-2xl ${iconColor}`}>
					{icon}
				</span>
				<h2 className="font-headline text-2xl font-bold text-on-surface uppercase tracking-tight">
					{title}
				</h2>
			</div>
			<div className="space-y-4 relative z-20">{children}</div>
		</div>
	);
}

interface SettingRowProps {
	title: string;
	description: string;
	children: React.ReactNode;
	borderColor?: string;
	className?: string;
	isColumn?: boolean;
}

export function SettingRow({
	title,
	description,
	children,
	borderColor = "border-outline-variant/30",
	className = "",
	isColumn = false,
}: SettingRowProps) {
	const layoutClass = isColumn
		? "flex-col gap-2"
		: "flex-col md:flex-row md:items-center justify-between gap-4";
	return (
		<div
			className={`flex ${layoutClass} bg-surface-dim p-4 border-l ${borderColor} ${className}`}
		>
			<div className={isColumn ? "flex justify-between items-start" : ""}>
				<div>
					<h3 className="font-headline font-bold text-on-surface">{title}</h3>
					<p className="font-mono text-xs text-outline-variant mt-1">
						{description}
					</p>
				</div>
				{isColumn &&
					children &&
					React.Children.count(children) === 2 &&
					React.Children.toArray(children)[0]}
			</div>
			{isColumn
				? React.Children.count(children) > 1
					? React.Children.toArray(children).slice(1)
					: children
				: children}
		</div>
	);
}

interface DiagnosticPanelProps {
	title: string;
	icon: string;
	lines: React.ReactNode[];
	className?: string;
}

export function DiagnosticPanel({
	title,
	icon,
	lines,
	className = "",
}: DiagnosticPanelProps) {
	return (
		<div
			className={`bg-surface-container-high shatter-clip p-5 relative border-r-2 border-b-2 border-outline-variant/10 flex flex-col gap-4 h-full ${className}`}
		>
			<div className="flex items-center gap-2 mb-2">
				<span className="material-symbols-outlined text-primary-container">
					{icon}
				</span>
				<h3 className="font-headline text-sm uppercase tracking-widest text-on-surface font-bold">
					{title}
				</h3>
			</div>

			<div className="flex-1 bg-surface-dim font-mono text-[10px] md:text-xs text-outline-variant p-4 overflow-y-auto border-l border-primary-container/30 relative">
				<div className="absolute inset-0 scanlines opacity-20 pointer-events-none"></div>
				<div className="relative z-10 space-y-1">
					{lines.map((line, i) => (
						<React.Fragment key={i}>{line}</React.Fragment>
					))}
					<p className="animate-pulse text-[#00F3FF] mt-2">&gt; _</p>
				</div>
			</div>
		</div>
	);
}
