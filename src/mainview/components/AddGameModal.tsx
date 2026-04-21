import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Runner } from "../../shared/types/game";
import type { RAWGSearchResult } from "../../shared/types/rawg";
import { electroview } from "../electroview";
import { Button } from "./Button";
import { Select, TextInput } from "./Forms";

interface AddGameModalProps {
	isOpen: boolean;
	onClose: () => void;
	onGameCreated?: () => void;
}

export function AddGameModal({
	isOpen,
	onClose,
	onGameCreated,
}: AddGameModalProps) {
	const [title, setTitle] = useState("");
	const [coverUrl, setCoverUrl] = useState("");
	const [executable, setExecutable] = useState("");
	const [runner, setRunner] = useState<Runner>("umu");
	const [args, setArgs] = useState("");
	const [showWineSettings, setShowWineSettings] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [installerStatus, setInstallerStatus] = useState<
		"idle" | "running" | "done" | "error"
	>("idle");

	// Search state
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<RAWGSearchResult[]>([]);
	const [searching, setSearching] = useState(false);
	const [showResults, setShowResults] = useState(false);
	const searchRef = useRef<HTMLDivElement>(null);

	// Listen for installer launch messages to update UI
	useEffect(() => {
		if (!isOpen) return;

		const onStarted = (payload: { gameId: string }) => {
			if (payload.gameId !== "") return;
			setInstallerStatus("running");
			setError(null);
		};

		const onEnded = (payload: {
			gameId: string;
			exitCode: number | null;
			durationMs: number;
		}) => {
			if (payload.gameId !== "") return;
			if (payload.exitCode === 0 || payload.exitCode === null) {
				setInstallerStatus("done");
			} else {
				setInstallerStatus("error");
				setError(
					`Installer exited with code ${payload.exitCode} after ${Math.round(payload.durationMs / 1000)}s`,
				);
			}
		};

		electroview.rpc.addMessageListener("gameLaunchStarted", onStarted);
		electroview.rpc.addMessageListener("gameLaunchEnded", onEnded);

		return () => {
			electroview.rpc.removeMessageListener("gameLaunchStarted", onStarted);
			electroview.rpc.removeMessageListener("gameLaunchEnded", onEnded);
		};
	}, [isOpen]);

	// Close search results when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
				setShowResults(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSearch = async () => {
		if (!searchQuery.trim()) return;
		setSearching(true);
		setError(null);
		setShowResults(true);
		try {
			const results = await electroview.rpc.request.metadataSearch(
				searchQuery.trim(),
			);
			setSearchResults(results);
		} catch (err) {
			setError(
				`Search failed: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setSearching(false);
		}
	};

	const handleSelectResult = (result: RAWGSearchResult) => {
		setTitle(result.name);
		setCoverUrl(result.background_image || "");
		setSearchQuery("");
		setSearchResults([]);
		setShowResults(false);
	};

	const handleBrowseExecutable = async () => {
		setError(null);
		setInstallerStatus("idle");
		try {
			const selected = await electroview.rpc.request.openFileDialog();
			if (selected) {
				setExecutable(selected);
			}
		} catch (err) {
			setError(
				`Failed to open file dialog: ${
					err instanceof Error ? err.message : String(err)
				}`,
			);
		}
	};

	const handleBrowseCover = async () => {
		setError(null);
		try {
			const selected = await electroview.rpc.request.openFileDialog();
			if (selected) {
				setCoverUrl(selected.startsWith("/") ? `file://${selected}` : selected);
			}
		} catch (err) {
			setError(
				`Failed to open file dialog: ${
					err instanceof Error ? err.message : String(err)
				}`,
			);
		}
	};

	const handleRunInstaller = async () => {
		setError(null);
		try {
			const selected = await electroview.rpc.request.openFileDialog();
			if (!selected) {
				return;
			}

			setExecutable(selected);
			setInstallerStatus("running");

			await electroview.rpc.request.runInstaller({
				path: selected,
				runner,
				args: args.trim() || undefined,
			});
		} catch (err) {
			setInstallerStatus("error");
			setError(err instanceof Error ? err.message : "Failed to run installer");
		}
	};

	const handleFinish = async () => {
		if (!title.trim()) {
			setError("Game title is required");
			return;
		}
		if (!executable.trim()) {
			setError("Executable path is required");
			return;
		}

		setSubmitting(true);
		setError(null);
		try {
			await electroview.rpc.request.gameCreate({
				title: title.trim(),
				runner,
				path: executable.trim(),
				coverImage: coverUrl.trim() || undefined,
				args: args.trim() || undefined,
			});
			resetForm();
			onGameCreated?.();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to add game");
		} finally {
			setSubmitting(false);
		}
	};

	const resetForm = () => {
		setTitle("");
		setCoverUrl("");
		setExecutable("");
		setRunner("umu");
		setArgs("");
		setShowWineSettings(false);
		setError(null);
		setInstallerStatus("idle");
		setSearchQuery("");
		setSearchResults([]);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 bg-background/80 backdrop-blur-sm"
						onClick={handleClose}
					/>

					{/* Modal Content */}
					<motion.div
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 20, scale: 0.95 }}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
						className="relative w-full max-w-4xl flex bg-surface border border-outline-variant/50 shadow-2xl shatter-clip overflow-hidden max-h-[85vh]"
					>
						<div className="absolute inset-0 scanlines opacity-20 pointer-events-none z-10" />

						{/* Left Sidebar - Cover Preview */}
						<div className="w-64 shrink-0 bg-surface-dim border-r border-outline-variant/20 flex flex-col">
							{/* Cover preview */}
							<div className="flex-1 flex flex-col items-center justify-center p-6">
								{coverUrl ? (
									<img
										src={
											coverUrl.startsWith("/") ? `file://${coverUrl}` : coverUrl
										}
										alt="Cover"
										className="w-full max-h-64 object-contain rounded border border-outline-variant/30"
										onError={(e) => {
											(e.currentTarget as HTMLImageElement).src = "";
											(e.currentTarget as HTMLImageElement).style.display =
												"none";
										}}
									/>
								) : (
									<div className="w-full aspect-[3/4] bg-surface-container rounded border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-2">
										<span className="material-symbols-outlined text-4xl text-outline-variant/50">
											games
										</span>
										<span className="font-mono text-[10px] text-outline-variant/50 uppercase">
											No Cover
										</span>
									</div>
								)}
								<span className="font-mono text-[10px] text-outline-variant/50 uppercase mt-2">
									{title || "Title"}
								</span>

								{/* Installer Status Indicator */}
								{installerStatus === "running" && (
									<div className="mt-4 w-full bg-surface-container rounded border border-secondary/30 p-3">
										<div className="flex items-center gap-2">
											<span className="material-symbols-outlined text-secondary animate-spin text-lg">
												hourglass_top
											</span>
											<span className="font-mono text-[10px] text-secondary uppercase">
												Running...
											</span>
										</div>
									</div>
								)}

								{installerStatus === "done" && (
									<div className="mt-4 w-full bg-surface-container rounded border border-secondary/30 p-3">
										<div className="flex items-center gap-2">
											<span className="material-symbols-outlined text-secondary text-lg">
												check_circle
											</span>
											<span className="font-mono text-[10px] text-secondary uppercase">
												Done
											</span>
										</div>
									</div>
								)}

								{installerStatus === "error" && (
									<div className="mt-4 w-full bg-surface-container rounded border border-error/30 p-3">
										<div className="flex items-center gap-2">
											<span className="material-symbols-outlined text-error text-lg">
												error
											</span>
											<span className="font-mono text-[10px] text-error uppercase">
												Failed
											</span>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Right Content Area */}
						<div className="flex-1 flex flex-col min-w-0">
							{/* Header */}
							<div className="relative z-20 flex justify-between items-center p-6 border-b border-outline-variant/30 shrink-0">
								<div className="flex items-center gap-3">
									<span className="material-symbols-outlined text-primary text-3xl">
										add_circle
									</span>
									<div>
										<h2 className="font-headline text-2xl font-bold text-on-surface uppercase tracking-tight">
											Add New Game
										</h2>
									</div>
								</div>
								<button
									onClick={handleClose}
									className="w-8 h-8 flex items-center justify-center border border-outline-variant/30 text-outline-variant hover:text-white hover:bg-error/20 hover:border-error/50 transition-colors shatter-clip-reverse"
								>
									<span className="material-symbols-outlined">close</span>
								</button>
							</div>

							{/* Form */}
							<div className="relative z-20 flex-1 overflow-y-auto p-6 space-y-5">
								{/* Search */}
								<div className="space-y-1" ref={searchRef}>
									<label className="font-mono text-[10px] text-outline-variant block uppercase">
										Search Game Metadata
									</label>
									<div className="flex gap-2">
										<TextInput
											placeholder="Search by title..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") handleSearch();
											}}
											className="flex-1 !py-2.5"
										/>
										<button
											type="button"
											onClick={handleSearch}
											disabled={searching || !searchQuery.trim()}
											className="shatter-clip bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant/50 px-4 font-mono text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
										>
											{searching ? (
												<span className="material-symbols-outlined text-[16px] animate-spin">
													hourglass_top
												</span>
											) : (
												<span className="material-symbols-outlined text-[16px]">
													search
												</span>
											)}
											SEARCH
										</button>
									</div>

									{/* Search Results Dropdown */}
									{showResults && searchResults.length > 0 && (
										<div className="absolute z-50 w-full max-w-[calc(100%-2rem)] mt-1 bg-surface border border-outline-variant/30 rounded shadow-xl max-h-64 overflow-y-auto">
											{searchResults.slice(0, 8).map((result) => (
												<button
													key={result.id}
													type="button"
													onClick={() => handleSelectResult(result)}
													className="w-full flex items-center gap-3 p-2 hover:bg-surface-container transition-colors text-left"
												>
													{result.background_image ? (
														<img
															src={result.background_image}
															alt={result.name}
															className="w-12 h-12 object-cover rounded"
															onError={(e) => {
																(
																	e.currentTarget as HTMLImageElement
																).style.display = "none";
															}}
														/>
													) : (
														<div className="w-12 h-12 bg-surface-dim rounded flex items-center justify-center">
															<span className="material-symbols-outlined text-outline-variant text-lg">
																games
															</span>
														</div>
													)}
													<div className="flex-1 min-w-0">
														<p className="font-mono text-xs text-on-surface truncate">
															{result.name}
														</p>
														<p className="font-mono text-[9px] text-outline-variant">
															{result.released?.slice(0, 4) ?? "TBA"}
															{result.genres[0]
																? ` • ${result.genres[0].name}`
																: ""}
														</p>
													</div>
												</button>
											))}
										</div>
									)}

									{showResults && searchResults.length === 0 && !searching && (
										<div className="w-full bg-surface border border-outline-variant/30 rounded p-3">
											<p className="font-mono text-xs text-outline-variant text-center">
												No results found
											</p>
										</div>
									)}
								</div>

								{/* Game Title */}
								<div className="space-y-1">
									<label className="font-mono text-[10px] text-outline-variant block uppercase">
										Game Title
									</label>
									<TextInput
										placeholder="Title"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										className="!py-2.5"
									/>
								</div>

								{/* App Image */}
								<div className="space-y-1">
									<label className="font-mono text-[10px] text-outline-variant block uppercase">
										App Image
									</label>
									<div className="flex gap-2">
										<TextInput
											placeholder="Paste an URL or select file"
											value={coverUrl}
											onChange={(e) => setCoverUrl(e.target.value)}
											className="flex-1 !py-2.5"
										/>
										<button
											type="button"
											onClick={handleBrowseCover}
											className="shatter-clip bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant/50 px-3 font-mono text-xs transition-colors flex items-center gap-1"
										>
											<span className="material-symbols-outlined text-[16px]">
												folder_open
											</span>
										</button>
									</div>
								</div>

								{/* Platform */}
								<div className="space-y-1">
									<label className="font-mono text-[10px] text-outline-variant block uppercase">
										Select Platform Version to Install
									</label>
									<Select
										value={runner}
										onChange={(e) => setRunner(e.target.value as Runner)}
										options={[
											{ value: "umu", label: "Windows (UMU/Proton)" },
											{ value: "native", label: "Linux Native" },
										]}
										className="w-full !py-2.5"
									/>
								</div>

								{/* Wine Settings Collapsible */}
								<div className="border border-outline-variant/20 rounded overflow-hidden">
									<button
										type="button"
										onClick={() => setShowWineSettings(!showWineSettings)}
										className="w-full px-4 py-3 flex items-center justify-between bg-surface-container/50 hover:bg-surface-container transition-colors"
									>
										<span className="font-mono text-xs text-outline-variant uppercase">
											Show Wine Settings
										</span>
										<span
											className={`material-symbols-outlined text-lg text-outline-variant transition-transform ${showWineSettings ? "rotate-90" : ""}`}
										>
											chevron_right
										</span>
									</button>
									{showWineSettings && (
										<div className="p-4 space-y-4 border-t border-outline-variant/20">
											<div className="space-y-1">
												<label className="font-mono text-[10px] text-outline-variant block uppercase">
													Launch Arguments
												</label>
												<TextInput
													placeholder="gamemoderun %command%"
													value={args}
													onChange={(e) => setArgs(e.target.value)}
													className="!py-2.5"
												/>
											</div>
										</div>
									)}
								</div>

								{/* Select Executable */}
								<div className="space-y-1">
									<label className="font-mono text-[10px] text-outline-variant block uppercase">
										Select Executable
									</label>
									<div className="flex gap-2">
										<TextInput
											placeholder="Select Executable"
											value={executable}
											onChange={(e) => setExecutable(e.target.value)}
											className="flex-1 !py-2.5"
										/>
										<button
											type="button"
											onClick={handleBrowseExecutable}
											className="shatter-clip bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant/50 px-3 font-mono text-xs transition-colors flex items-center gap-1"
										>
											<span className="material-symbols-outlined text-[16px]">
												folder_open
											</span>
										</button>
									</div>
								</div>

								{error && (
									<div className="font-mono text-xs text-error bg-error/10 border border-error/30 p-3">
										{error}
									</div>
								)}
							</div>

							{/* Footer Buttons */}
							<div className="relative z-20 flex justify-end gap-3 p-6 border-t border-outline-variant/30 bg-surface-container/80 shrink-0">
								<Button
									variant="secondary"
									icon={
										installerStatus === "running"
											? "hourglass_top"
											: installerStatus === "done"
												? "check_circle"
												: installerStatus === "error"
													? "error"
													: "play_arrow"
									}
									onClick={handleRunInstaller}
									disabled={submitting}
								>
									{installerStatus === "running"
										? "Running..."
										: installerStatus === "done"
											? "Run Again"
											: installerStatus === "error"
												? "Retry"
												: "Run Installer First"}
								</Button>
								<Button
									variant="primary"
									onClick={handleFinish}
									disabled={submitting}
								>
									{submitting ? "Adding..." : "Finish"}
								</Button>
							</div>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
