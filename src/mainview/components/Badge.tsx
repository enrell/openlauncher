import type React from "react";

type BadgeVariant = "ready" | "updating" | "error" | "default";

interface BadgeProps {
	children: React.ReactNode;
	variant?: BadgeVariant;
	className?: string;
	pulse?: boolean;
}

export function Badge({
	children,
	variant = "default",
	className = "",
	pulse = false,
}: BadgeProps) {
	let variantClasses =
		"bg-surface-variant/50 text-on-surface-variant border-outline-variant/50";
	let pulseDot = null;

	if (variant === "ready") {
		variantClasses = "bg-[#00F3FF]/20 text-[#00F3FF] border-[#00F3FF]/50";
	} else if (variant === "updating") {
		variantClasses = "bg-secondary/20 text-secondary border-secondary/50";
		if (pulse) {
			pulseDot = (
				<span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
			);
		}
	} else if (variant === "error") {
		variantClasses = "bg-error/20 text-error border-error/50";
	}

	return (
		<span
			className={`border font-mono text-[10px] px-2 py-0.5 shatter-clip backdrop-blur-md flex items-center gap-1 ${variantClasses} ${className}`}
		>
			{pulseDot}
			{children}
		</span>
	);
}
