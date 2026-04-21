import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { Runner } from "../../shared/types/game";
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
	const [path, setPath] = useState("");
	const [layer, setLayer] = useState<"native" | "umu">("native");
	const [args, setArgs] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!title.trim() || !path.trim()) {
			setError("Title and path are required");
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			await electroview.rpc?.request.gameCreate({
				title: title.trim(),
				runner: layer as Runner,
				path: path.trim(),
				args: args.trim() || undefined,
			});
			setTitle("");
			setPath("");
			setArgs("");
			onGameCreated?.();
			onClose();
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
						onClick={onClose}
					/>

					{/* Modal Content */}
					<motion.div
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 20, scale: 0.95 }}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
						className="relative w-full max-w-xl flex flex-col bg-surface border border-outline-variant/50 shadow-2xl shatter-clip overflow-hidden"
					>
						<div className="absolute inset-0 scanlines opacity-20 pointer-events-none z-10"></div>

						{/* Header */}
						<div className="relative z-20 flex justify-between items-center p-6 border-b border-outline-variant/30 bg-surface-container/50">
							<div className="flex items-center gap-3">
								<span className="material-symbols-outlined text-primary text-3xl">
									add_circle
								</span>
								<div>
									<h2 className="font-headline text-2xl font-bold text-on-surface uppercase tracking-tight">
										Import Local Game
									</h2>
									<p className="font-mono text-xs text-outline-variant">
										Add an executable to your library
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

						{/* Body */}
						<div className="relative z-20 p-8 space-y-6">
							<div className="space-y-2">
								<label className="font-mono text-[10px] text-outline-variant block">
									GAME TITLE
								</label>
								<TextInput
									placeholder="e.g. Project 2049"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="!py-3"
								/>
							</div>

							<div className="space-y-2">
								<label className="font-mono text-[10px] text-outline-variant block">
									EXECUTABLE PATH
								</label>
								<div className="flex gap-2">
									<TextInput
										placeholder="/path/to/game.exe"
										value={path}
										onChange={(e) => setPath(e.target.value)}
										className="flex-1 !py-3"
									/>
									<button
										type="button"
										onClick={async () => {
											const selectedPath =
												await electroview.rpc?.request.openFileDialog();
											if (selectedPath) {
												setPath(selectedPath);
											}
										}}
										className="shatter-clip bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant/50 px-4 font-mono text-xs transition-colors flex items-center gap-2"
									>
										<span className="material-symbols-outlined text-[18px]">
											folder_open
										</span>
										BROWSE
									</button>
								</div>
							</div>

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
										LAUNCH ARGS (OPTIONAL)
									</label>
									<TextInput
										placeholder="gamemoderun %command%"
										value={args}
										onChange={(e) => setArgs(e.target.value)}
										className="!py-3"
									/>
								</div>
							</div>

							{error && (
								<div className="font-mono text-xs text-error bg-error/10 border border-error/30 p-3">
									{error}
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="relative z-20 flex justify-end gap-4 p-6 border-t border-outline-variant/30 bg-surface-container/80">
							<Button
								variant="ghost"
								onClick={onClose}
								className="!text-outline-variant hover:!text-white border border-transparent hover:border-outline-variant/30 shatter-clip"
							>
								Cancel
							</Button>
							<Button
								variant="primary"
								icon="add"
								onClick={handleSubmit}
								disabled={submitting}
							>
								{submitting ? "Importing..." : "Import Game"}
							</Button>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
