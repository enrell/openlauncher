import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./electroview"; // Initialize electroview global before App
import App from "./App";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
