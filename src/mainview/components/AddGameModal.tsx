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
	const [runningInstaller, setRunningInstaller] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const handleBrowseExecutable = async () => {
		setError(null);
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
				// For local files, we need to convert to file:// URL
				// Or just store the path and let the renderer handle it
				setCoverUrl(selected);
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
			// Open file browser to select installer exe
			const selected = await electroview.rpc.request.openFileDialog();
			if (!selected) {
				return; // User cancelled
			}

			setRunningInstaller(true);
			setError(null);

			// Run the selected exe with umu
			await electroview.rpc.request.runInstaller({
				path: selected,
				runner,
				args: args.trim() || undefined,
			});

			// After installer finishes, pre-fill the executable path
			setExecutable(selected);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to run installer");
		} finally {
			setRunningInstaller(false);
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
			setTitle("");
			setCoverUrl("");
			setExecutable("");
			setArgs("");
			onGameCreated?.();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to add game");
		} finally {
			setSubmitting(false);
		}
	};

	const handleClose = () => {
		setTitle("");
		setCoverUrl("");
		setExecutable("");
		setRunner("umu");
		setArgs("");
		setShowWineSettings(false);
		setError(null);
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
							{/* Close button */}
							<div className="p-4 flex justify-end">
								<button
									onClick={handleClose}
									className="w-8 h-8 flex items-center justify-center text-outline-variant hover:text-white transition-colors"
								>
									<span className="material-symbols-outlined">close</span>
								</button>
							</div>

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
							</div>

							{/* Form */}
							<div className="relative z-20 flex-1 overflow-y-auto p-6 space-y-5">
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
											className={`material-symbols-outlined text-lg text-outline-variant transition-transform ${
												showWineSettings ? "rotate-90" : ""
											}`}
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
									icon="play_arrow"
									onClick={handleRunInstaller}
									disabled={runningInstaller || submitting}
								>
									{runningInstaller ? "Running..." : "Run Installer First"}
								</Button>
								<Button
									variant="primary"
									onClick={handleFinish}
									disabled={submitting || runningInstaller}
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
