import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Game } from "../../shared/types/game";
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

type Tab = "runtime" | "umu" | "env" | "info";

export function GameConfigModal({
	isOpen,
	onClose,
	game,
	onSaved,
	onDeleted,
}: GameConfigModalProps) {
	const [activeTab, setActiveTab] = useState<Tab>("runtime");
	const [useGamescope, setUseGamescope] = useState(
		game.hooks?.gamescope ?? false,
	);
	const [useMangoHud, setUseMangoHud] = useState(game.hooks?.mangohud ?? false);
	const [gamescopeResolution, setGamescopeResolution] = useState("1920x1080");
	const [gamescopeUpscaling, setGamescopeUpscaling] = useState<
		"none" | "fsr" | "nis"
	>("none");
	const [launchArgs, setLaunchArgs] = useState(game.args ?? "");
	const [umuGameId, setUmuGameId] = useState(game.umu?.gameId ?? "");
	const [umuStore, setUmuStore] = useState(game.umu?.store ?? "");
	const [umuProtonPath, setUmuProtonPath] = useState(
		game.umu?.protonPath ?? "",
	);
	const [umuWinePrefix, setUmuWinePrefix] = useState(
		game.umu?.winePrefix ?? "",
	);
	const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>(
		() => {
			const env = game.env ?? {};
			return Object.entries(env).map(([key, value]) => ({ key, value }));
		},
	);
	const [submitting, setSubmitting] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (isOpen) {
			setActiveTab("runtime");
			setUseGamescope(game.hooks?.gamescope ?? false);
			setUseMangoHud(game.hooks?.mangohud ?? false);
			setLaunchArgs(game.args ?? "");
			setUmuGameId(game.umu?.gameId ?? "");
			setUmuStore(game.umu?.store ?? "");
			setUmuProtonPath(game.umu?.protonPath ?? "");
			setUmuWinePrefix(game.umu?.winePrefix ?? "");
			const env = game.env ?? {};
			setEnvVars(
				Object.entries(env).map(([key, value]) => ({ key, value })),
			);
			setError(null);
			setShowDeleteConfirm(false);
		}
	}, [isOpen, game]);

	const handleSave = async () => {
		setSubmitting(true);
		setError(null);
		try {
			const envObject: Record<string, string> = {};
			for (const { key, value } of envVars) {
				if (key.trim()) {
					envObject[key.trim()] = value;
				}
			}

			const patch: Record<string, unknown> = {
				hooks: {
					gamescope: useGamescope,
					mangohud: useMangoHud,
				},
				args: launchArgs || undefined,
				env: Object.keys(envObject).length > 0 ? envObject : undefined,
			};

			if (game.runner === "umu") {
				patch.umu = {
					gameId: umuGameId || undefined,
					store: umuStore || undefined,
					protonPath: umuProtonPath || undefined,
					winePrefix: umuWinePrefix || undefined,
				};
			}

			const updated = await electroview.rpc.request.gameUpdate({
				id: game.id,
				patch: patch as Parameters<typeof electroview.rpc.request.gameUpdate>[0]["patch"],
			});
			if (updated) {
				onSaved?.(updated);
			}
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save configuration");
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
			setError(err instanceof Error ? err.message : "Failed to delete game");
			setSubmitting(false);
		}
	};

	const addEnvVar = () => {
		setEnvVars([...envVars, { key: "", value: "" }]);
	};

	const removeEnvVar = (index: number) => {
		setEnvVars(envVars.filter((_, i) => i !== index));
	};

	const updateEnvVar = (
		index: number,
		field: "key" | "value",
		val: string,
	) => {
		const updated = [...envVars];
		updated[index] = { ...updated[index], [field]: val };
		setEnvVars(updated);
	};

	const tabs: { id: Tab; label: string; icon: string }[] = [
		{ id: "runtime", label: "Runtime", icon: "build_circle" },
		...(game.runner === "umu"
			? [{ id: "umu" as Tab, label: "umu", icon: "sports_esports" }]
			: []),
		{ id: "env", label: "Env Vars", icon: "terminal" },
		{ id: "info", label: "Info", icon: "info" },
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
						className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-surface border border-outline-variant/50 shadow-2xl shatter-clip overflow-hidden"
					>
						<div className="absolute inset-0 scanlines opacity-20 pointer-events-none z-10"></div>

						{/* Header */}
						<div className="relative z-20 flex justify-between items-center p-6 border-b border-outline-variant/30 bg-surface-container/50">
							<div className="flex items-center gap-3">
								<span className="material-symbols-outlined text-primary-container text-3xl">
									tune
								</span>
								<div>
									<h2 className="font-headline text-2xl font-bold text-on-surface uppercase tracking-tight">
										Configuration
									</h2>
									<p className="font-mono text-xs text-outline-variant">
										{game.title}
									</p>
								</div>
							</div>
							<button
								onClick={onClose}
								className="w-10 h-10 flex items-center justify-center border border-outline-variant/30 text-outline-variant hover:text-white hover:bg-error/20 hover:border-error/50 transition-colors shatter-clip-reverse"
							>
								<span className="material-symbols-outlined">close</span>
							</button>
						</div>

						{/* Tabs */}
						<div className="relative z-20 flex border-b border-outline-variant/30 bg-surface-dim/50">
						{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`flex items-center gap-2 px-5 py-3 font-mono text-xs transition-colors ${
										activeTab === tab.id
											? "text-secondary border-b-2 border-secondary bg-surface/50"
											: "text-outline-variant hover:text-white"
									}`}
								>
									<span className="material-symbols-outlined text-sm">
										{tab.icon}
									</span>
									{tab.label}
								</button>
							))}
						</div>

						{/* Body */}
						<div className="relative z-20 flex-1 overflow-y-auto p-6">
							{activeTab === "runtime" && (
								<div className="space-y-4">
									<Panel
										title="Runtime Environment"
										icon="build_circle"
										iconColor="text-tertiary"
										reverseClip
										className="!p-5"
									>
										<SettingRow
											title="Enable Gamescope"
											description="Use Gamescope micro-compositor for this title"
										>
											<Toggle
												checked={useGamescope}
												onChange={() => setUseGamescope(!useGamescope)}
											/>
										</SettingRow>

										{useGamescope && (
											<motion.div
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: "auto" }}
												className="pt-2 pl-4 border-l border-outline-variant/20 ml-2"
											>
												<div className="grid grid-cols-2 gap-4">
													<div>
														<label className="font-mono text-[10px] text-outline-variant mb-1 block">
															RESOLUTION (W x H)
														</label>
														<TextInput
															value={gamescopeResolution}
															onChange={(e) =>
																setGamescopeResolution(e.target.value)
															}
															placeholder="e.g. 1920x1080"
															className="!py-1.5"
														/>
													</div>
													<div>
														<label className="font-mono text-[10px] text-outline-variant mb-1 block">
															UPSCALING
														</label>
														<Select
															value={gamescopeUpscaling}
															onChange={(e) =>
																setGamescopeUpscaling(
																	e.target.value as "none" | "fsr" | "nis",
																)
															}
															options={[
																{ value: "none", label: "None" },
																{ value: "fsr", label: "AMD FSR" },
																{ value: "nis", label: "NVIDIA NIS" },
															]}
															className="w-full !py-1.5"
														/>
													</div>
												</div>
											</motion.div>
										)}

										<SettingRow
											title="Enable MangoHud"
											description="Show performance overlay during gameplay"
										>
											<Toggle
												checked={useMangoHud}
												onChange={() => setUseMangoHud(!useMangoHud)}
											/>
										</SettingRow>
									</Panel>

									<Panel
										title="Launch Options"
										icon="code_blocks"
										iconColor="text-primary"
										className="!p-5"
									>
										<div className="bg-surface-dim border border-outline-variant/30 p-4">
											<p className="font-mono text-[10px] text-outline-variant mb-3 leading-relaxed">
												Advanced users only. Inject custom parameters directly
												into the game's boot sequence.
											</p>
											<TextInput
												value={launchArgs}
												onChange={(e) => setLaunchArgs(e.target.value)}
												icon="terminal"
												className="font-mono text-secondary !border-primary-container/50"
											/>
										</div>
									</Panel>
								</div>
							)}

							{activeTab === "umu" && game.runner === "umu" && (
								<Panel title="umu Configuration" icon="sports_esports" iconColor="text-primary" className="!p-5">
									<SettingRow
										title="GAMEID"
										description="umu-database codename for protonfixes. Auto-resolved if empty."
										isColumn
									>
										<TextInput
											value={umuGameId}
											onChange={(e) => setUmuGameId(e.target.value)}
											placeholder="e.g. umu-dauntless (auto-resolved if empty)"
											className="font-mono"
										/>
									</SettingRow>

									<SettingRow
										title="STORE"
										description="Store for protonfixes: steam, egs, gog, none"
										isColumn
									>
										<Select
											value={umuStore || "none"}
											onChange={(e) => setUmuStore(e.target.value)}
											options={[
												{ value: "none", label: "None" },
												{ value: "steam", label: "Steam" },
												{ value: "egs", label: "Epic Games" },
												{ value: "gog", label: "GOG" },
											]}
										/>
									</SettingRow>

									<SettingRow
										title="PROTON PATH"
										description="Override proton version (default: GE-Proton)"
										isColumn
									>
										<TextInput
											value={umuProtonPath}
											onChange={(e) => setUmuProtonPath(e.target.value)}
											placeholder="e.g. GE-Proton9-5 (auto-downloads if empty)"
											className="font-mono"
										/>
									</SettingRow>

									<SettingRow
										title="WINE PREFIX"
										description="Custom WINEPREFIX path"
										isColumn
									>
										<TextInput
											value={umuWinePrefix}
											onChange={(e) => setUmuWinePrefix(e.target.value)}
											placeholder="e.g. ~/.wine (auto-generated if empty)"
											className="font-mono"
										/>
									</SettingRow>
								</Panel>
							)}

							{activeTab === "env" && (
								<Panel
									title="Environment Variables"
									icon="terminal"
									iconColor="text-secondary"
									className="!p-5"
								>
									<div className="bg-surface-dim border border-outline-variant/30 p-4">
										<p className="font-mono text-[10px] text-outline-variant mb-4 leading-relaxed">
											Environment variables injected at launch. Sensitive values
											are encrypted in the database.
										</p>
										<div className="space-y-2">
											{envVars.map((envVar, index) => (
												<div key={index} className="flex gap-2 items-center">
													<TextInput
														value={envVar.key}
														onChange={(e) =>
															updateEnvVar(index, "key", e.target.value)
														}
														placeholder="VAR_NAME"
														className="font-mono !py-1.5 flex-1"
													/>
													<TextInput
														value={envVar.value}
														onChange={(e) =>
															updateEnvVar(index, "value", e.target.value)
														}
														placeholder="value"
														className="font-mono !py-1.5 flex-1"
													/>
													<button
														onClick={() => removeEnvVar(index)}
														className="text-outline-variant hover:text-error transition-colors"
													>
														<span className="material-symbols-outlined text-lg">
															delete
														</span>
													</button>
												</div>
											))}
											<button
												onClick={addEnvVar}
												className="flex items-center gap-2 text-secondary hover:text-secondary/80 font-mono text-xs mt-2 transition-colors"
											>
												<span className="material-symbols-outlined text-sm">
													add
												</span>
												ADD VARIABLE
											</button>
										</div>
									</div>
								</Panel>
							)}

							{activeTab === "info" && (
								<Panel title="Game Information" icon="info" iconColor="text-outline-variant" className="!p-5">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<span className="font-mono text-[10px] text-outline-variant block mb-1">
												TITLE
											</span>
											<span className="font-mono text-sm text-on-surface">
												{game.title}
											</span>
										</div>
										<div>
											<span className="font-mono text-[10px] text-outline-variant block mb-1">
												RUNNER
											</span>
											<span className="font-mono text-sm text-on-surface uppercase">
												{game.runner}
											</span>
										</div>
										<div>
											<span className="font-mono text-[10px] text-outline-variant block mb-1">
												STORE
											</span>
											<span className="font-mono text-sm text-on-surface capitalize">
												{game.store ?? "manual"}
											</span>
										</div>
										<div>
											<span className="font-mono text-[10px] text-outline-variant block mb-1">
												STORE ID
											</span>
											<span className="font-mono text-sm text-on-surface">
												{game.storeId ?? "—"}
											</span>
										</div>
									</div>
									<div className="mt-4">
										<span className="font-mono text-[10px] text-outline-variant block mb-1">
											EXECUTABLE
										</span>
										<div className="bg-surface-container-lowest border border-outline-variant/20 p-3 font-mono text-[10px] text-outline-variant break-all">
											{game.path}
										</div>
									</div>
									{game.coverImage && (
										<div className="mt-4">
											<span className="font-mono text-[10px] text-outline-variant block mb-1">
												COVER
											</span>
											<img
												src={game.coverImage}
												alt={game.title}
												className="h-20 object-contain bg-surface-dim rounded border border-outline-variant/20"
											/>
										</div>
									)}
								</Panel>
							)}
						</div>

						{/* Footer */}
						<div className="relative z-20 flex justify-between items-center p-6 border-t border-outline-variant/30 bg-surface-container/80">
							<div>
								{!showDeleteConfirm ? (
									<button
										onClick={() => setShowDeleteConfirm(true)}
										className="text-error/70 hover:text-error font-mono text-xs flex items-center gap-1 transition-colors"
									>
										<span className="material-symbols-outlined text-sm">delete</span>
										Delete Game
									</button>
								) : (
									<div className="flex items-center gap-3">
										<span className="font-mono text-xs text-error">
											Confirm delete?
										</span>
										<Button
											variant="ghost"
											onClick={() => setShowDeleteConfirm(false)}
											className="!text-xs"
										>
											Cancel
										</Button>
										<Button
											variant="primary"
											onClick={handleDelete}
											disabled={submitting}
											className="!bg-error/20 !text-error hover:!bg-error/30 !text-xs"
										>
											{submitting ? "Deleting..." : "Delete"}
										</Button>
									</div>
								)}
							</div>
							<div className="flex gap-4">
								<Button
									variant="ghost"
									onClick={onClose}
									className="!text-outline-variant hover:!text-white border border-transparent hover:border-outline-variant/30 shatter-clip"
								>
									Cancel
								</Button>
								<Button variant="primary" onClick={handleSave} disabled={submitting}>
									{submitting ? "Saving..." : "Save Configuration"}
								</Button>
							</div>
						</div>

						{error && (
							<div className="relative z-20 px-6 pb-4">
								<div className="font-mono text-xs text-error bg-error/10 border border-error/30 p-3">
									{error}
								</div>
							</div>
						)}
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}