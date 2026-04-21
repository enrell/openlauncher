import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "./Button";
import { Select, TextInput, Toggle } from "./Forms";
import { Panel, SettingRow } from "./Panels";

interface GameConfigModalProps {
	isOpen: boolean;
	onClose: () => void;
	gameTitle: string;
}

export function GameConfigModal({
	isOpen,
	onClose,
	gameTitle,
}: GameConfigModalProps) {
	const [useProton, setUseProton] = useState(true);
	const [useGamescope, setUseGamescope] = useState(false);
	const [useMangoHud, setUseMangoHud] = useState(false);
	const [launchArgs, setLaunchArgs] = useState("gamemoderun %command%");

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
										{gameTitle}
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
						<div className="relative z-20 flex-1 overflow-y-auto p-6 space-y-6">
							<Panel
								title="Compatibility Layer"
								icon="layers"
								iconColor="text-secondary"
								className="!p-5"
							>
								<SettingRow
									title="Force specific Steam Play compatibility tool"
									description="Run this game using Proton instead of Linux native runtime"
								>
									<Toggle
										checked={useProton}
										onChange={() => setUseProton(!useProton)}
										variant="primary"
									/>
								</SettingRow>

								{useProton && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: "auto" }}
										className="pt-2"
									>
										<SettingRow
											title="Proton Version"
											description="Select the community or official runner"
											borderColor="border-secondary/30"
										>
											<Select
												options={[
													{
														value: "ge-8-25",
														label: "GE-Proton8-25 (Default)",
													},
													{
														value: "experimental",
														label: "Proton Experimental",
													},
													{ value: "hotfix", label: "Proton Hotfix" },
												]}
											/>
										</SettingRow>
									</motion.div>
								)}
							</Panel>

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
													placeholder="e.g. 1920x1080"
													defaultValue="1920x1080"
													className="!py-1.5"
												/>
											</div>
											<div>
												<label className="font-mono text-[10px] text-outline-variant mb-1 block">
													UPSCALING
												</label>
												<Select
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
										Advanced users only. Inject custom parameters directly into
										the game's boot sequence.
										<br />
										Use <code className="text-secondary">%command%</code> to
										represent the game executable.
									</p>
									<TextInput
										value={launchArgs}
										onChange={(e) => setLaunchArgs(e.target.value)}
										icon="terminal"
										className="font-mono text-secondary !border-primary-container/50"
									/>
								</div>
							</Panel>

							<div className="flex flex-col gap-2">
								<span className="font-mono text-[10px] text-outline-variant ml-1">
									EXECUTABLE PATH
								</span>
								<div className="bg-surface-container-lowest border border-outline-variant/20 p-2 font-mono text-[10px] text-outline-variant truncate select-all">
									/home/user/.steam/steam/steamapps/common/
									{gameTitle.replace(/\s+/g, "")}/game.exe
								</div>
							</div>
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
							<Button variant="primary" onClick={onClose}>
								Save Configuration
							</Button>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
