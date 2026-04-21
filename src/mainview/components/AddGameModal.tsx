import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { Runner } from "../../shared/types/game";
import { electroview } from "../electroview";
import { Button } from "./Button";
import { Select, TextInput } from "./Forms";

interface AddGameModalProps {
	isOpen: boolean;
	onClose: () => void;
	onGameCreated?: () => void;
}

type ModalTab = "import" | "install";

export function AddGameModal({
	isOpen,
	onClose,
	onGameCreated,
}: AddGameModalProps) {
	const [tab, setTab] = useState<ModalTab>("import");
	const [title, setTitle] = useState("");
	const [path, setPath] = useState("");
	const [coverUrl, setCoverUrl] = useState("");
	const [layer, setLayer] = useState<"native" | "umu">("native");
	const [args, setArgs] = useState("");
	const [installPath, setInstallPath] = useState("");
	const [installArchive, setInstallArchive] = useState("");
	const [installing, setInstalling] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const resetForm = () => {
		setTitle("");
		setPath("");
		setCoverUrl("");
		setLayer("native");
		setArgs("");
		setInstallPath("");
		setInstallArchive("");
		setError(null);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const handleBrowse = async () => {
		setError(null);
		try {
			const selectedPath = await electroview.rpc.request.openFileDialog();
			if (selectedPath) {
				setPath(selectedPath);
			}
		} catch (err) {
			setError(
				`Failed to open file dialog: ${
					err instanceof Error ? err.message : String(err)
				}`,
			);
		}
	};

	const handleBrowseArchive = async () => {
		setError(null);
		try {
			const selectedPath = await electroview.rpc.request.openFileDialog();
			if (selectedPath) {
				setInstallArchive(selectedPath);
			}
		} catch (err) {
			setError(
				`Failed to open file dialog: ${
					err instanceof Error ? err.message : String(err)
				}`,
			);
		}
	};

	const handleBrowseInstallDir = async () => {
		setError(null);
		try {
			// Use openFileDialog with directory option - if not supported,
			// fall back to letting user type the path
			const selectedPath = await electroview.rpc.request.openFileDialog();
			if (selectedPath) {
				setInstallPath(selectedPath);
			}
		} catch (err) {
			setError(
				`Failed to open directory dialog: ${
					err instanceof Error ? err.message : String(err)
				}`,
			);
		}
	};

	const handleInstall = async () => {
		if (!title.trim()) {
			setError("Game title is required");
			return;
		}
		if (!installArchive.trim()) {
			setError("Archive path is required");
			return;
		}
		if (!installPath.trim()) {
			setError("Install directory is required");
			return;
		}

		setInstalling(true);
		setError(null);
		try {
			// TODO: Implement actual extraction via RPC call
			// For now, create the game with a placeholder path
			// The path will be set after extraction completes
			await electroview.rpc.request.gameCreate({
				title: title.trim(),
				runner: layer as Runner,
				path: installPath.trim(),
				coverImage: coverUrl.trim() || undefined,
				args: args.trim() || undefined,
			});
			resetForm();
			onGameCreated?.();
			handleClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to install game");
		} finally {
			setInstalling(false);
		}
	};

	const handleSubmit = async () => {
		if (!title.trim() || !path.trim()) {
			setError("Title and executable path are required");
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			await electroview.rpc.request.gameCreate({
				title: title.trim(),
				runner: layer as Runner,
				path: path.trim(),
				coverImage: coverUrl.trim() || undefined,
				args: args.trim() || undefined,
			});
			resetForm();
			onGameCreated?.();
			handleClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to add game");
		} finally {
			setSubmitting(false);
		}
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
						className="relative w-full max-w-2xl flex flex-col bg-surface border border-outline-variant/50 shadow-2xl shatter-clip overflow-hidden max-h-[90vh]"
					>
						<div className="absolute inset-0 scanlines opacity-20 pointer-events-none z-10" />

						{/* Header */}
						<div className="relative z-20 flex justify-between items-center p-6 border-b border-outline-variant/30 bg-surface-container/50 shrink-0">
							<div className="flex items-center gap-3">
								<span className="material-symbols-outlined text-primary text-3xl">
									add_circle
								</span>
								<div>
									<h2 className="font-headline text-2xl font-bold text-on-surface uppercase tracking-tight">
										Add Game
									</h2>
									<p className="font-mono text-xs text-outline-variant">
										Import or install games to your library
									</p>
								</div>
							</div>
							<button
								onClick={handleClose}
								className="w-10 h-10 flex items-center justify-center border border-outline-variant/30 text-outline-variant hover:text-white hover:bg-error/20 hover:border-error/50 transition-colors shatter-clip-reverse"
							>
								<span className="material-symbols-outlined">close</span>
							</button>
						</div>

						{/* Tab Switcher */}
						<div className="relative z-20 flex border-b border-outline-variant/30 shrink-0">
							<button
								onClick={() => {
									setTab("import");
									setError(null);
								}}
								className={`flex-1 py-3 font-mono text-xs uppercase tracking-widest transition-colors ${
									tab === "import"
										? "text-primary border-b-2 border-primary bg-surface-container/30"
										: "text-outline-variant hover:text-on-surface"
								}`}
							>
								Import Installed
							</button>
							<button
								onClick={() => {
									setTab("install");
									setError(null);
								}}
								className={`flex-1 py-3 font-mono text-xs uppercase tracking-widest transition-colors ${
									tab === "install"
										? "text-primary border-b-2 border-primary bg-surface-container/30"
										: "text-outline-variant hover:text-on-surface"
								}`}
							>
								Install Package
							</button>
						</div>

						{/* Body */}
						<div className="relative z-20 p-6 space-y-6 overflow-y-auto flex-1">
							{tab === "import" && (
								<>
									{/* Game Title */}
									<div className="space-y-2">
										<label className="font-mono text-[10px] text-outline-variant block">
											GAME TITLE
										</label>
										<TextInput
											placeholder="e.g. Elden Ring"
											value={title}
											onChange={(e) => setTitle(e.target.value)}
											className="!py-3"
										/>
									</div>

									{/* Executable Path */}
									<div className="space-y-2">
										<label className="font-mono text-[10px] text-outline-variant block">
											EXECUTABLE PATH
										</label>
										<div className="flex gap-2">
											<TextInput
												placeholder="/path/to/game"
												value={path}
												onChange={(e) => setPath(e.target.value)}
												className="flex-1 !py-3"
											/>
											<button
												type="button"
												onClick={handleBrowse}
												className="shatter-clip bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant/50 px-4 font-mono text-xs transition-colors flex items-center gap-2 shrink-0"
											>
												<span className="material-symbols-outlined text-[18px]">
													folder_open
												</span>
												BROWSE
											</button>
										</div>
									</div>

									{/* Cover Image URL */}
									<div className="space-y-2">
										<label className="font-mono text-[10px] text-outline-variant block">
											COVER IMAGE URL{" "}
											<span className="text-primary/50">(OPTIONAL)</span>
										</label>
										<TextInput
											placeholder="https://images.example.com/cover.jpg"
											value={coverUrl}
											onChange={(e) => setCoverUrl(e.target.value)}
											className="!py-3"
										/>
										{coverUrl && (
											<div className="mt-2">
												<img
													src={coverUrl}
													alt="Cover preview"
													className="h-32 w-auto object-contain border border-outline-variant/30 bg-surface-dim rounded"
													onError={(e) => {
														(
															e.currentTarget as HTMLImageElement
														).style.display = "none";
													}}
												/>
											</div>
										)}
									</div>

									{/* Compatibility Layer + Launch Args */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<label className="font-mono text-[10px] text-outline-variant block">
												COMPATIBILITY LAYER
											</label>
											<Select
												value={layer}
												onChange={(e) =>
													setLayer(e.target.value as "native" | "umu")
												}
												options={[
													{ value: "native", label: "Linux Native" },
													{ value: "umu", label: "UMU Runner (Proton)" },
												]}
												className="w-full !py-3"
											/>
										</div>

										<div className="space-y-2">
											<label className="font-mono text-[10px] text-outline-variant block">
												LAUNCH ARGS{" "}
												<span className="text-primary/50">(OPTIONAL)</span>
											</label>
											<TextInput
												placeholder="gamemoderun %command%"
												value={args}
												onChange={(e) => setArgs(e.target.value)}
												className="!py-3"
											/>
										</div>
									</div>
								</>
							)}

							{tab === "install" && (
								<>
									{/* Game Title */}
									<div className="space-y-2">
										<label className="font-mono text-[10px] text-outline-variant block">
											GAME TITLE
										</label>
										<TextInput
											placeholder="e.g. Elden Ring"
											value={title}
											onChange={(e) => setTitle(e.target.value)}
											className="!py-3"
										/>
									</div>

									{/* Archive File */}
									<div className="space-y-2">
										<label className="font-mono text-[10px] text-outline-variant block">
											PACKAGE FILE{" "}
											<span className="text-primary/50">
												(.zip, .tar.gz, .deb)
											</span>
										</label>
										<div className="flex gap-2">
											<TextInput
												placeholder="/path/to/game-package.tar.gz"
												value={installArchive}
												onChange={(e) => setInstallArchive(e.target.value)}
												className="flex-1 !py-3"
											/>
											<button
												type="button"
												onClick={handleBrowseArchive}
												className="shatter-clip bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant/50 px-4 font-mono text-xs transition-colors flex items-center gap-2 shrink-0"
											>
												<span className="material-symbols-outlined text-[18px]">
													folder_open
												</span>
												BROWSE
											</button>
										</div>
									</div>

									{/* Install Directory */}
									<div className="space-y-2">
										<label className="font-mono text-[10px] text-outline-variant block">
											INSTALL DIRECTORY
										</label>
										<div className="flex gap-2">
											<TextInput
												placeholder="/home/user/Games"
												value={installPath}
												onChange={(e) => setInstallPath(e.target.value)}
												className="flex-1 !py-3"
											/>
											<button
												type="button"
												onClick={handleBrowseInstallDir}
												className="shatter-clip bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant/50 px-4 font-mono text-xs transition-colors flex items-center gap-2 shrink-0"
											>
												<span className="material-symbols-outlined text-[18px]">
													folder_open
												</span>
												BROWSE
											</button>
										</div>
									</div>

									{/* Cover Image URL */}
									<div className="space-y-2">
										<label className="font-mono text-[10px] text-outline-variant block">
											COVER IMAGE URL{" "}
											<span className="text-primary/50">(OPTIONAL)</span>
										</label>
										<TextInput
											placeholder="https://images.example.com/cover.jpg"
											value={coverUrl}
											onChange={(e) => setCoverUrl(e.target.value)}
											className="!py-3"
										/>
										{coverUrl && (
											<div className="mt-2">
												<img
													src={coverUrl}
													alt="Cover preview"
													className="h-32 w-auto object-contain border border-outline-variant/30 bg-surface-dim rounded"
													onError={(e) => {
														(
															e.currentTarget as HTMLImageElement
														).style.display = "none";
													}}
												/>
											</div>
										)}
									</div>

									{/* Compatibility Layer + Launch Args */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<label className="font-mono text-[10px] text-outline-variant block">
												COMPATIBILITY LAYER
											</label>
											<Select
												value={layer}
												onChange={(e) =>
													setLayer(e.target.value as "native" | "umu")
												}
												options={[
													{ value: "native", label: "Linux Native" },
													{ value: "umu", label: "UMU Runner (Proton)" },
												]}
												className="w-full !py-3"
											/>
										</div>

										<div className="space-y-2">
											<label className="font-mono text-[10px] text-outline-variant block">
												LAUNCH ARGS{" "}
												<span className="text-primary/50">(OPTIONAL)</span>
											</label>
											<TextInput
												placeholder="gamemoderun %command%"
												value={args}
												onChange={(e) => setArgs(e.target.value)}
												className="!py-3"
											/>
										</div>
									</div>
								</>
							)}

							{error && (
								<div className="font-mono text-xs text-error bg-error/10 border border-error/30 p-3">
									{error}
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="relative z-20 flex justify-end gap-4 p-6 border-t border-outline-variant/30 bg-surface-container/80 shrink-0">
							<Button
								variant="ghost"
								onClick={handleClose}
								className="!text-outline-variant hover:!text-white border border-transparent hover:border-outline-variant/30 shatter-clip"
							>
								Cancel
							</Button>
							{tab === "import" ? (
								<Button
									variant="primary"
									icon="add"
									onClick={handleSubmit}
									disabled={submitting}
								>
									{submitting ? "Importing..." : "Import Game"}
								</Button>
							) : (
								<Button
									variant="primary"
									icon="download"
									onClick={handleInstall}
									disabled={installing}
								>
									{installing ? "Installing..." : "Install Game"}
								</Button>
							)}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
