import { useAttribution } from "../contexts/AttributionContext";

export function AttributionFooter() {
	const { visible, hide } = useAttribution();

	if (!visible) return null;

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-surface-dim/95 backdrop-blur-sm border-t border-outline-variant/20">
			<span className="text-[11px] font-mono text-outline-variant">
				Game data provided by{" "}
				<a
					href="https://rawg.io"
					target="_blank"
					rel="noopener noreferrer"
					className="text-secondary hover:text-secondary/80 underline"
				>
					RAWG
				</a>
			</span>
			<button
				onClick={hide}
				className="text-[11px] font-mono text-outline-variant hover:text-outline hover:underline"
			>
				Dismiss
			</button>
		</div>
	);
}