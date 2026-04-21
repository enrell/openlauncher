import type React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	icon?: string;
	children: React.ReactNode;
}

export function Button({
	variant = "primary",
	icon,
	children,
	className = "",
	...props
}: ButtonProps) {
	const baseClasses =
		"font-headline font-bold flex items-center justify-center gap-2 transition-all uppercase px-6 py-3 text-sm md:text-lg";

	let variantClasses = "";
	if (variant === "primary") {
		variantClasses =
			"shatter-clip-reverse bg-gradient-to-r from-[#9D00FF] to-[#6b00b0] hover:from-[#b333ff] hover:to-[#8c00e5] text-white glow-primary";
	} else if (variant === "secondary") {
		variantClasses =
			"shatter-clip bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant/30";
	} else if (variant === "outline") {
		variantClasses =
			"shatter-clip-reverse bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary text-sm";
	}

	return (
		<button
			className={`${baseClasses} ${variantClasses} ${className}`}
			{...props}
		>
			{icon && (
				<span className="material-symbols-outlined text-[18px] md:text-[24px]">
					{icon}
				</span>
			)}
			<span>{children}</span>
		</button>
	);
}
