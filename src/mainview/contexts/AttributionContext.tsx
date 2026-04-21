import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type AttributionState = {
	visible: boolean;
	show: () => void;
	hide: () => void;
};

const AttributionContext = createContext<AttributionState | null>(null);

export function AttributionProvider({ children }: { children: ReactNode }) {
	const [visible, setVisible] = useState(() => {
		if (typeof localStorage !== "undefined") {
			return localStorage.getItem("rawg-attribution-dismissed") !== "true";
		}
		return true;
	});

	const show = useCallback(() => {
		setVisible(true);
		localStorage.setItem("rawg-attribution-dismissed", "false");
	}, []);

	const hide = useCallback(() => {
		setVisible(false);
		localStorage.setItem("rawg-attribution-dismissed", "true");
	}, []);

	return (
		<AttributionContext.Provider value={{ visible, show, hide }}>
			{children}
		</AttributionContext.Provider>
	);
}

export function useAttribution(): AttributionState {
	const context = useContext(AttributionContext);
	if (!context) {
		throw new Error("useAttribution must be used within AttributionProvider");
	}
	return context;
}