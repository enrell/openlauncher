interface NavItemProps {
	icon: string;
	label: string;
	isActive: boolean;
	onClick?: () => void;
	className?: string;
}

export function NavItem({
	icon,
	label,
	isActive,
	onClick,
	className = "",
}: NavItemProps) {
	return (
		<a
			className={`w-full flex flex-col items-center justify-center py-4 side-nav-hover group cursor-pointer ${isActive ? "side-nav-active" : "side-nav-inactive"} ${className}`}
			onClick={onClick}
		>
			<span
				className={`material-symbols-outlined mb-1 ${isActive ? "side-nav-primary" : ""}`}
			>
				{icon}
			</span>
			<span className={`side-nav-typo ${isActive ? "side-nav-primary" : ""}`}>
				{label}
			</span>
		</a>
	);
}
