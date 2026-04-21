import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Game, GamePatch } from "../../shared/types/game";
import { electroview } from "../electroview";
import { Button } from "./Button";
import { Select, TextInput, Toggle } from "./Forms";
import { Panel, SettingRow } from "./Panels";

interface GameConfigModalProps {
	isOpen: boolean;
	onClose: () => void;
	game: Game;
	onSaved?: (game: Game) => void;
	onDeleted?: () => void;
}

type Tab = "general" | "paths" | "umu" | "runtime";

export function GameConfigModal({
	isOpen,
	onClose,
	game,
	onSaved,
	onDeleted,
}: GameConfigModalProps) {
	const [activeTab, setActiveTab] = useState<Tab>("general");
	const [title, setTitle] = useState(game.title);
	const [coverUrl, setCoverUrl] = useState(game.coverImage ?? "");
	const [executable, setExecutable] = useState(game.path);
	const [cwd, setCwd] = useState(game.cwd ?? "");
	const [launchArgs, setLaunchArgs] = useState(game.args ?? "");
	const [winePrefix, setWinePrefix] = useState(game.umu?.winePrefix ?? "");
	const [protonPath, setProtonPath] = useState(game.umu?.protonPath ?? "");
	const [useGamescope, setUseGamescope] = useState(
		game.hooks?.gamescope ?? false,
	);
	const [useMangoHud, setUseMangoHud] = useState(game.hooks?.mangohud ?? false);
	const [gamescopeResolution, setGamescopeResolution] = useState("1920x1080");
	const [gamescopeUpscaling, setGamescopeUpscaling] = useState<
		"none" | "fsr" | "nis"
	>("none");
	const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>(
		() => {
			const env = game.env ?? {};
			return Object.entries(env).map(([key, value]) => ({ key, value }));
		},
	);
	const [submitting, setSubmitting] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [coverSearchResults, setCoverSearchResults] = useState<string[]>([]);
	const [searchingCover, setSearchingCover] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setActiveTab("general");
			setTitle(game.title);
			setCoverUrl(game.coverImage ?? "");
			setExecutable(game.path);
			setCwd(game.cwd ?? "");
			setLaunchArgs(game.args ?? "");
			setWinePrefix(game.umu?.winePrefix ?? "");
			setProtonPath(game.umu?.protonPath ?? "");
			setUseGamescope(game.hooks?.gamescope ?? false);
			setUseMangoHud(game.hooks?.mangohud ?? false);
			const env = game.env ?? {};
			setEnvVars(Object.entries(env).map(([key, value]) => ({ key, value })));
			setError(null);
			setShowDeleteConfirm(false);
			setCoverSearchResults([]);
		}
	}, [isOpen, game]);

	const handleBrowseExecutable = async () => {
		const selected = await electroview.rpc.request.openFileDialog();
		if (selected) setExecutable(selected);
	};

	const handleBrowseWinePrefix = async () => {
		const selected = await electroview.rpc.request.openFileDialog();
		if (selected) setWinePrefix(selected);
	};

	const handleBrowseCwd = async () => {
		const selected = await electroview.rpc.request.openFileDialog();
		if (selected) setCwd(selected);
	};

	const handleSearchCover = async () => {
		if (!title.trim()) return;
		setSearchingCover(true);
		try {
			const results = await electroview.rpc.request.metadataSearch({
				query: title.trim(),
			});
			const urls = results
				.map((r) => r.background_image)
				.filter((url): url is string => Boolean(url));
			setCoverSearchResults(urls);
		} catch {
			setCoverSearchResults([]);
		} finally {
			setSearchingCover(false);
		}
	};

	const handleSave = async () => {
		setSubmitting(true);
		setError(null);
		try {
			const envObject: Record<string, string> = {};
			for (const { key, value } of envVars) {
				if (key.trim()) envObject[key.trim()] = value;
			}

			const patch: GamePatch = {
				title: title.trim() || game.title,
				path: executable.trim() || game.path,
				cwd: cwd.trim() || undefined,
				args: launchArgs.trim() || undefined,
				coverImage: coverUrl.trim() || undefined,
				hooks: { gamescope: useGamescope, mangohud: useMangoHud },
				env: Object.keys(envObject).length > 0 ? envObject : undefined,
			};

			if (game.runner === "umu") {
				patch.umu = {
					gameId: game.umu?.gameId,
					store: game.umu?.store,
					protonPath: protonPath.trim() || undefined,
					winePrefix: winePrefix.trim() || undefined,
				};
			}

			const updated = await electroview.rpc.request.gameUpdate({
				id: game.id,
				patch,
			});
			if (updated) onSaved?.(updated);
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		setSubmitting(true);
		setError(null);
		try {
			await electroview.rpc.request.gameDelete({ id: game.id });
			onDeleted?.();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete");
			setSubmitting(false);
		}
	};

	const addEnvVar = () => setEnvVars([...envVars, { key: "", value: "" }]);
	const removeEnvVar = (index: number) =>
		setEnvVars(envVars.filter((_, i) => i !== index));
	const updateEnvVar = (index: number, field: "key" | "value", val: string) => {
		const updated = [...envVars];
		updated[index] = { ...updated[index], [field]: val };
		setEnvVars(updated);
	};

	const tabs: { id: Tab; label: string; icon: string }[] = [
		{ id: "general", label: "General", icon: "info" },
		{ id: "paths", label: "Paths", icon: "folder_open" },
		...(game.runner === "umu"
			? [{ id: "umu" as Tab, label: "umu", icon: "sports_esports" }]
			: []),
		{ id: "runtime", label: "Runtime", icon: "build_circle" },
	];

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 bg-background/80 backdrop-blur-sm"
						onClick={onClose}
					/>

					<motion.div
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 20, scale: 0.95 }}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
						className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-surface border border-outline-variant/50 shadow-2xl shatter-clip overflow-hidden"
					>
						<div className="absolute inset-0 scanlines opacity-20 pointer-events-none z-10" />

						{/* Header */}
						<div className="relative z-20 flex justify-between items-center px-6 py-4 border-b border-outline-variant/30 bg-surface-container/50 shrink-0">
							<div className="flex items-center gap-3">
								<span className="material-symbols-outlined text-primary-container text-2xl">tune</span>
								<h2 className="font-headline text-xl font-bold text-on-surface uppercase tracking-tight">Edit Game</h2>
							</div>
							<button
								onClick={onClose}
								className="w-8 h-8 flex items-center justify-center text-outline-variant hover:text-white hover:bg-error/20 transition-colors shatter-clip-reverse"
							>
								<span className="material-symbols-outlined">close</span>
							</button>
						</div>

						{/* Tabs */}
						<div className="relative z-20 flex border-b border-outline-variant/30 bg-surface-dim/50 shrink-0">
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`flex items-center gap-2 px-5 py-3 font-mono text-xs transition-colors ${activeTab === tab.id ? "text-secondary border-b-2 border-secondary bg-surface/50" : "text-outline-variant hover:text-white"}`}
								>
									<span className="material-symbols-outlined text-sm">{tab.icon}</span>
									{tab.label}
								</button>
							))}
						</div>

						{/* Body */}
						<div className="relative z-20 flex-1 overflow-y-auto p-6">
							{activeTab === "general" && (
								<div className="space-y-5">
									{/* Cover */}
									<div>
										<div className="flex items-start gap-4">
											<div className="flex-1 space-y-3">
												<div>
													<label className="font-mono text-[10px] text-outline-variant block mb-1.5">TITLE</label>
													<TextInput
														value={title}
														onChange={(e) => setTitle(e.target.value)}
														placeholder="Game title"
														className="!py-2.5 w-full"
													/>
												</div>
												<div>
													<label className="font-mono text-[10px] text-outline-variant block mb-1.5">COVER URL</label>
													<TextInput
														value={coverUrl}
														onChange={(e) => setCoverUrl(e.target.value)}
														placeholder="https://..."
														className="!py-2.5 w-full"
													/>
												</div>
												<div>
													<label className="font-mono text-[10px] text-outline-variant block mb-1.5">LAUNCH ARGUMENTS</label>
													<TextInput
														value={launchArgs}
														onChange={(e) => setLaunchArgs(e.target.value)}
														placeholder="Optional arguments"
														className="!py-2.5 w-full font-mono"
													/>
												</div>
											</div>
											{coverUrl && (
												<div className="shrink-0 w-24 h-32 bg-surface-dim rounded border border-outline-variant/20 overflow-hidden">
													<img src={coverUrl} alt="cover" className="w-full h-full object-cover" onError={() => setCoverUrl("")} />
												</div>
											)}
										</div>
										<Button variant="ghost" onClick={handleSearchCover} disabled={searchingCover || !title.trim()} className="mt-2 !text-xs">
											<span className="material-symbols-outlined text-sm mr-1">image_search</span>
											{searchingCover ? "Searching..." : "Search Covers"}
										</Button>
										{coverSearchResults.length > 0 && (
											<div className="mt-3 flex gap-2 overflow-x-auto pb-2">
												{coverSearchResults.slice(0, 6).map((url, i) => (
													<button
														key={i}
														onClick={() => { setCoverUrl(url); setCoverSearchResults([]); }}
														className={`shrink-0 w-16 h-20 rounded border-2 transition-colors overflow-hidden ${coverUrl === url ? "border-primary" : "border-outline-variant/30 hover:border-primary/50"}`}
													>
														<img src={url} alt="" className="w-full h-full object-cover" onError={() => {}} />
													</button>
												))}
											</div>
										)}
									</div>

									{/* Env Vars */}
									<div>
										<label className="font-mono text-[10px] text-outline-variant block mb-2">ENVIRONMENT VARIABLES</label>
										<div className="space-y-2">
											{envVars.map((envVar, index) => (
												<div key={index} className="flex gap-2 items-center">
													<TextInput
														value={envVar.key}
														onChange={(e) => updateEnvVar(index, "key", e.target.value)}
														placeholder="VAR_NAME"
														className="font-mono !py-2 w-1/3"
													/>
													<TextInput
														value={envVar.value}
														onChange={(e) => updateEnvVar(index, "value", e.target.value)}
														placeholder="value"
														className="font-mono !py-2 flex-1"
													/>
													<button onClick={() => removeEnvVar(index)} className="text-outline-variant hover:text-error transition-colors shrink-0">
														<span className="material-symbols-outlined text-lg">delete</span>
													</button>
												</div>
											))}
											<button onClick={addEnvVar} className="flex items-center gap-2 text-secondary hover:text-secondary/80 font-mono text-xs transition-colors mt-1">
												<span className="material-symbols-outlined text-sm">add</span> ADD VARIABLE
											</button>
										</div>
									</div>
								</div>
							)}

							{activeTab === "paths" && (
								<div className="space-y-5">
									<div>
										<label className="font-mono text-[10px] text-outline-variant block mb-1.5">EXECUTABLE</label>
										<div className="flex gap-2">
											<TextInput
												value={executable}
												onChange={(e) => setExecutable(e.target.value)}
												placeholder="Path to game executable"
												className="!py-2.5 flex-1 font-mono"
											/>
											<Button variant="ghost" onClick={handleBrowseExecutable} className="!px-4 !py-2" title="Browse">
												<span className="material-symbols-outlined">folder_open</span>
											</Button>
										</div>
									</div>
									<div>
										<label className="font-mono text-[10px] text-outline-variant block mb-1.5">WORKING DIRECTORY</label>
										<div className="flex gap-2">
											<TextInput
												value={cwd}
												onChange={(e) => setCwd(e.target.value)}
												placeholder="Optional (defaults to parent dir)"
												className="!py-2.5 flex-1 font-mono"
											/>
											<Button variant="ghost" onClick={handleBrowseCwd} className="!px-4 !py-2" title="Browse">
												<span className="material-symbols-outlined">folder_open</span>
											</Button>
										</div>
									</div>
								</div>
							)}

							{activeTab === "umu" && game.runner === "umu" && (
								<div className="space-y-5">
									<div>
										<label className="font-mono text-[10px] text-outline-variant block mb-1.5">WINE PREFIX</label>
										<div className="flex gap-2">
											<TextInput
												value={winePrefix}
												onChange={(e) => setWinePrefix(e.target.value)}
												placeholder="~/.wine (auto-generated if empty)"
												className="!py-2.5 flex-1 font-mono"
											/>
											<Button variant="ghost" onClick={handleBrowseWinePrefix} className="!px-4 !py-2" title="Browse">
												<span className="material-symbols-outlined">folder_open</span>
											</Button>
										</div>
									</div>
									<div>
										<label className="font-mono text-[10px] text-outline-variant block mb-1.5">PROTON PATH</label>
										<TextInput
											value={protonPath}
											onChange={(e) => setProtonPath(e.target.value)}
											placeholder="GE-Proton9-5 (auto-downloaded if empty)"
											className="!py-2.5 w-full font-mono"
										/>
									</div>
								</div>
							)}

							{activeTab === "runtime" && (
								<div className="space-y-4">
									<SettingRow title="MangoHud" description="Show performance overlay during gameplay">
										<Toggle checked={useMangoHud} onChange={() => setUseMangoHud(!useMangoHud)} />
									</SettingRow>
									<SettingRow title="Gamescope" description="Wrap in Gamescope micro-compositor">
										<Toggle checked={useGamescope} onChange={() => setUseGamescope(!useGamescope)} />
									</SettingRow>
									{useGamescope && (
										<div className="grid grid-cols-2 gap-4 pt-3 pl-4 border-l-2 border-outline-variant/20">
											<div>
												<label className="font-mono text-[10px] text-outline-variant block mb-1.5">RESOLUTION</label>
												<TextInput
													value={gamescopeResolution}
													onChange={(e) => setGamescopeResolution(e.target.value)}
													placeholder="1920x1080"
													className="!py-2 font-mono"
												/>
											</div>
											<div>
												<label className="font-mono text-[10px] text-outline-variant block mb-1.5">UPSCALING</label>
												<Select
													value={gamescopeUpscaling}
													onChange={(e) => setGamescopeUpscaling(e.target.value as "none" | "fsr" | "nis")}
													options={[
														{ value: "none", label: "None" },
														{ value: "fsr", label: "AMD FSR" },
														{ value: "nis", label: "NVIDIA NIS" },
													]}
													className="!py-2"
												/>
											</div>
										</div>
									)}
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="relative z-20 flex justify-between items-center px-6 py-4 border-t border-outline-variant/30 bg-surface-container/80 shrink-0">
							<div>
								{!showDeleteConfirm ? (
									<button onClick={() => setShowDeleteConfirm(true)} className="text-error/70 hover:text-error font-mono text-xs flex items-center gap-1 transition-colors">
										<span className="material-symbols-outlined text-sm">delete</span> Delete Game
									</button>
								) : (
									<div className="flex items-center gap-3">
										<span className="font-mono text-xs text-error">Confirm delete?</span>
										<Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="!text-xs">Cancel</Button>
										<Button variant="primary" onClick={handleDelete} disabled={submitting} className="!bg-error/20 !text-error hover:!bg-error/30 !text-xs">
											{submitting ? "Deleting..." : "Delete"}
										</Button>
									</div>
								)}
							</div>
							<div className="flex gap-3">
								<Button variant="ghost" onClick={onClose}>Cancel</Button>
								<Button variant="primary" onClick={handleSave} disabled={submitting}>
									{submitting ? "Saving..." : "Save Changes"}
								</Button>
							</div>
						</div>

						{error && (
							<div className="relative z-20 px-6 pb-4 shrink-0">
								<div className="font-mono text-xs text-error bg-error/10 border border-error/30 p-3">{error}</div>
							</div>
						)}
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}