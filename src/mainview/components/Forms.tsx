import type React from "react";

export function TextInput({
	icon,
	className = "",
	...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: string }) {
	return (
		<div className="relative">
			{icon && (
				<span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline-variant text-lg">
					{icon}
				</span>
			)}
			<input
				className={`bg-surface-container-high border-b-2 border-outline-variant focus:border-secondary text-on-surface font-mono text-xs py-2 ${icon ? "pl-10" : "pl-4"} pr-4 w-full transition-colors outline-none shatter-clip ${className}`}
				{...props}
			/>
		</div>
	);
}

export function Select({
	options,
	className = "",
	...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
	options: { value: string; label: string }[];
}) {
	return (
		<select
			className={`bg-surface-container-high border border-outline-variant text-secondary font-mono text-sm py-2 px-4 focus:ring-1 focus:ring-secondary outline-none shatter-clip min-w-[150px] ${className}`}
			{...props}
		>
			{options.map((opt) => (
				<option key={opt.value} value={opt.value}>
					{opt.label}
				</option>
			))}
		</select>
	);
}

export function Toggle({
	checked,
	onChange,
	variant = "secondary",
	className = "",
}: {
	checked: boolean;
	onChange?: () => void;
	variant?: "secondary" | "primary";
	className?: string;
}) {
	const bgClass = checked
		? variant === "primary"
			? "bg-primary-container/20 border-primary-container/50 glow-primary"
			: "bg-surface-container-high border-outline-variant"
		: "bg-surface-container-high border-outline-variant";
	const justifyClass = checked ? "justify-end" : "justify-start";
	const dotClass = checked
		? variant === "primary"
			? "bg-primary-container"
			: "bg-outline-variant"
		: "bg-outline-variant";

	return (
		<div
			className={`w-12 h-6 rounded-full relative cursor-pointer border flex items-center px-1 transition-all ${bgClass} ${justifyClass} ${className}`}
			onClick={onChange}
		>
			<div className={`w-4 h-4 rounded-full ${dotClass}`}></div>
		</div>
	);
}

export function RangeSlider({
	className = "",
	...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input
			type="range"
			className={`w-24 accent-secondary ${className}`}
			{...props}
		/>
	);
}
