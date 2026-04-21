import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Game } from "../shared/types/game";
import { NavItem } from "./components/Navigation";
import { Drivers } from "./Drivers";
import { GameDetails } from "./GameDetails";
import { Library } from "./Library";
import { Settings } from "./Settings";
import { Store } from "./Store";

function App() {
	const [activeTab, setActiveTab] = useState<
		"LIBRARY" | "STORE" | "DRIVERS" | "SETTINGS"
	>("LIBRARY");
	const [selectedGame, setSelectedGame] = useState<Game | null>(null);

	return (
		<div className="font-body antialiased h-screen overflow-hidden flex relative">
			{/* SideNavBar */}
			<nav className="hidden md:flex side-nav-bg side-nav-shape side-nav-sep side-nav-layout">
				<div className="flex-1 flex flex-col gap-6 items-center w-full mt-16">
					<NavItem
						icon="grid_view"
						label="LIBRARY"
						isActive={activeTab === "LIBRARY"}
						onClick={() => {
							setActiveTab("LIBRARY");
							setSelectedGame(null);
						}}
					/>
					<NavItem
						icon="shopping_cart"
						label="STORE"
						isActive={activeTab === "STORE"}
						onClick={() => {
							setActiveTab("STORE");
							setSelectedGame(null);
						}}
					/>
					<NavItem
						icon="settings_input_component"
						label="DRIVERS"
						isActive={activeTab === "DRIVERS"}
						onClick={() => {
							setActiveTab("DRIVERS");
							setSelectedGame(null);
						}}
					/>

					<NavItem icon="groups" label="COMMUNITY" isActive={false} />

					<NavItem
						icon="settings"
						label="SETTINGS"
						isActive={activeTab === "SETTINGS"}
						onClick={() => {
							setActiveTab("SETTINGS");
							setSelectedGame(null);
						}}
						className="mt-auto"
					/>
				</div>
			</nav>

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col md:ml-20 w-full h-full">
				{/* TopAppBar */}
				<header className="top-app-bar-bg top-app-bar-shape top-app-bar-sep top-app-bar-shadow top-app-bar-layout shrink-0">
					<div className="flex items-center gap-4">
						<span className="top-app-bar-logo">OPENLAUNCHER</span>
					</div>
					<div className="flex items-center gap-2 h-full">
						<button className="h-full px-4 flex items-center justify-center top-app-bar-inactive top-app-bar-hover">
							<span className="material-symbols-outlined text-xl">sensors</span>
						</button>
						<button className="h-full px-4 flex items-center justify-center top-app-bar-inactive top-app-bar-hover">
							<span className="material-symbols-outlined text-xl">memory</span>
						</button>
						<button className="h-full px-4 flex items-center justify-center top-app-bar-inactive top-app-bar-hover">
							<span className="material-symbols-outlined text-xl">
								account_circle
							</span>
						</button>
					</div>
				</header>

				{/* Page Canvas */}
				<div className="flex-1 relative overflow-hidden flex flex-col">
					<main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8 max-w-[1600px] mx-auto w-full">
						{activeTab === "LIBRARY" && (
							<Library onSelectGame={setSelectedGame} />
						)}
						{activeTab === "STORE" && <Store />}
						{activeTab === "DRIVERS" && <Drivers />}
						{activeTab === "SETTINGS" && <Settings />}
					</main>

					<AnimatePresence>
						{selectedGame && (
							<GameDetails
								game={selectedGame}
								onBack={() => setSelectedGame(null)}
							/>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
}

export default App;
