import { useCallback, useEffect, useState } from "react";
import { Button } from "./components/Button";
import { RangeSlider, Select, Toggle } from "./components/Forms";
import { Panel, SettingRow } from "./components/Panels";
import { SectionHeader } from "./components/SectionHeader";
import { electroview } from "./electroview";

type MetadataSource = "rawg" | "steam" | "auto";

export function Settings() {
	const [rawgKey, setRawgKey] = useState("");
	const [rawgKeyStatus, setRawgKeyStatus] = useState<
		"loading" | "configured" | "missing"
	>("loading");
	const [showKey, setShowKey] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [metadataSource, setMetadataSource] = useState<MetadataSource>("auto");
	const [saving, setSaving] = useState(false);
	const [saveMsg, setSaveMsg] = useState<string | null>(null);

	const checkRawgKey = useCallback(async () => {
		try {
			const key = await electroview.rpc.request.rawgKeyGet();
			if (key) {
				setRawgKey(key);
				setRawgKeyStatus("configured");
			} else {
				setRawgKey("");
				setRawgKeyStatus("missing");
			}
		} catch {
			setRawgKeyStatus("missing");
		}
	}, []);

	const checkMetadataSource = useCallback(async () => {
		try {
			const source = await electroview.rpc.request.metadataSourceGet();
			setMetadataSource(source);
		} catch {
			setMetadataSource("auto");
		}
	}, []);

	useEffect(() => {
		checkRawgKey();
		checkMetadataSource();
	}, [checkRawgKey, checkMetadataSource]);

	const handleSaveRawgKey = async () => {
		setSaving(true);
		setSaveMsg(null);
		try {
			await electroview.rpc.request.rawgKeyStore({ key: rawgKey.trim() });
			setRawgKeyStatus("configured");
			setShowKey(false);
			setSaveMsg("API key saved");
		} catch (err) {
			setSaveMsg(
				`Failed to save: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteRawgKey = async () => {
		setSaving(true);
		setSaveMsg(null);
		try {
			await electroview.rpc.request.rawgKeyDelete();
			setRawgKey("");
			setRawgKeyStatus("missing");
			setSaveMsg("API key removed");
		} catch (err) {
			setSaveMsg(
				`Failed to delete: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setSaving(false);
		}
	};

	const handleMetadataSourceChange = async (source: MetadataSource) => {
		setMetadataSource(source);
		try {
			await electroview.rpc.request.metadataSourceSet({ source });
		} catch {
			// Keep UI in sync even if save fails
		}
	};

	const displayValue =
		rawgKeyStatus === "configured" && !showKey && !isEditing
			? "•".repeat(Math.min(rawgKey.length, 24))
			: rawgKey;

	return (
		<>
			<SectionHeader
				title="Settings"
				subtitle="SYSTEM_CONFIG // USER_PREFERENCES"
				actionText="APPLY_CHANGES"
				actionIcon="save"
			/>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
				<div className="lg:col-span-8 flex flex-col gap-6">
					{/* Metadata API Settings */}
					<Panel title="Game Metadata" icon="search">
						<SettingRow
							title="Metadata Source"
							description="Choose where to fetch game information from"
							borderColor="border-primary/30"
						>
							<Select
								value={metadataSource}
								onChange={(e) =>
									handleMetadataSourceChange(e.target.value as MetadataSource)
								}
								options={[
									{ value: "auto", label: "Auto (RAWG preferred)" },
									{ value: "rawg", label: "RAWG Only" },
									{ value: "steam", label: "Steam Only" },
								]}
							/>
						</SettingRow>

						<SettingRow
							title="RAWG API Key"
							description="Required for RAWG searches. Get a free key at rawg.io/apidocs"
							borderColor="border-primary/30"
							isColumn
						>
							<div className="w-full space-y-3">
								<div className="flex gap-2 w-full">
									<input
										type="text"
										value={displayValue}
										onChange={(e) => setRawgKey(e.target.value)}
										onFocus={() => {
											if (!showKey && rawgKeyStatus === "configured") {
												setShowKey(true);
												setIsEditing(true);
											}
										}}
										onBlur={() => setIsEditing(false)}
										placeholder="Paste your RAWG API key here..."
										className="flex-1 !py-2.5 px-3 bg-surface-container-high border border-outline-variant/50 rounded font-mono text-xs text-on-surface placeholder:text-outline-variant focus:border-primary focus:outline-none transition-colors"
									/>
									{rawgKeyStatus === "configured" && (
										<button
											type="button"
											onClick={() => {
												setShowKey(!showKey);
												setIsEditing(false);
											}}
											className="shatter-clip bg-surface-container-high hover:bg-surface-variant border border-outline-variant/50 px-4 flex items-center justify-center transition-colors shrink-0"
											title={showKey ? "Hide key (streaming)" : "Show key"}
										>
											<span className="material-symbols-outlined text-xl text-secondary">
												{showKey ? "visibility_off" : "visibility"}
											</span>
										</button>
									)}
								</div>
								<div className="flex items-center gap-3">
									<Button
										variant="primary"
										icon="save"
										onClick={handleSaveRawgKey}
										disabled={saving || !rawgKey.trim()}
									>
										{saving ? "Saving..." : "Save Key"}
									</Button>
									{rawgKeyStatus === "configured" && (
										<Button
											variant="ghost"
											onClick={handleDeleteRawgKey}
											disabled={saving}
											className="!text-error"
										>
											Remove Key
										</Button>
									)}
									{rawgKeyStatus === "configured" && (
										<span className="font-mono text-[10px] text-secondary flex items-center gap-1">
											<span className="material-symbols-outlined text-[14px]">
												check_circle
											</span>
											Configured
										</span>
									)}
									{rawgKeyStatus === "missing" && (
										<span className="font-mono text-[10px] text-outline-variant flex items-center gap-1">
											<span className="material-symbols-outlined text-[14px]">
												info
											</span>
											Using Steam (no key)
										</span>
									)}
								</div>
								{saveMsg && (
									<p
										className={`font-mono text-xs ${saveMsg.includes("Failed") ? "text-error" : "text-secondary"}`}
									>
										{saveMsg}
									</p>
								)}
							</div>
						</SettingRow>

						<div className="mt-4 p-4 bg-surface-dim rounded border border-outline-variant/20">
							<p className="font-mono text-[10px] text-outline-variant leading-relaxed">
								<span className="text-secondary font-bold">
									RAWG Attribution Required:
								</span>{" "}
								When using RAWG data, you must include a visible attribution
								link to{" "}
								<a
									href="https://rawg.io"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline hover:text-primary/80"
								>
									RAWG.io
								</a>
								. Free tier: 20,000 requests/month. Steam does not require
								attribution.
							</p>
						</div>
					</Panel>

					{/* General Settings */}
					<Panel title="General" icon="tune">
						<SettingRow
							title="Language"
							description="Interface localization"
							borderColor="border-primary/30"
						>
							<Select
								options={[
									{ value: "EN_US", label: "EN_US" },
									{ value: "PT_BR", label: "PT_BR" },
									{ value: "ES_ES", label: "ES_ES" },
								]}
							/>
						</SettingRow>

						<SettingRow
							title="Launch Behavior"
							description="Run at system startup"
						>
							<Toggle checked={false} />
						</SettingRow>

						<SettingRow
							title="Close Behavior"
							description="Minimize to system tray instead of exiting"
						>
							<Toggle checked={true} variant="primary" />
						</SettingRow>
					</Panel>

					{/* Storage & Library */}
					<Panel
						title="Storage & Library"
						icon="folder_special"
						iconColor="text-secondary"
						reverseClip
					>
						<SettingRow
							title="Default Install Path"
							description="Where games are installed by default"
							borderColor="border-secondary/30"
							isColumn
						>
							<button className="material-symbols-outlined text-secondary hover:text-white transition-colors">
								folder_open
							</button>
							<div className="bg-surface-container-lowest border border-outline-variant/30 p-2 font-mono text-xs text-secondary mt-2 w-full truncate">
								/home/user/Games/OpenLauncher
							</div>
						</SettingRow>

						<SettingRow
							title="Auto-Scan Directories"
							description="Watch for local games to import automatically"
							isColumn
						>
							<div />
							<div className="w-full">
								<div className="bg-surface-container-lowest border border-outline-variant/30 p-2 font-mono text-xs text-outline-variant mt-2 flex justify-between items-center">
									<span className="truncate">
										/home/user/.steam/steam/steamapps/common
									</span>
									<button className="material-symbols-outlined text-outline-variant hover:text-error text-sm ml-2">
										delete
									</button>
								</div>
								<div className="bg-surface-container-lowest border border-outline-variant/30 p-2 font-mono text-xs text-outline-variant mt-2 flex justify-between items-center">
									<span className="truncate">/home/user/Games/Heroic</span>
									<button className="material-symbols-outlined text-outline-variant hover:text-error text-sm ml-2">
										delete
									</button>
								</div>
								<button className="text-secondary font-mono text-xs text-left hover:underline mt-2 flex items-center gap-1">
									<span className="material-symbols-outlined text-xs">add</span>{" "}
									ADD_DIRECTORY
								</button>
							</div>
						</SettingRow>
					</Panel>
				</div>

				<div className="lg:col-span-4 flex flex-col gap-6">
					<div className="bg-surface-container-high shatter-clip p-5 relative border-r-2 border-b-2 border-outline-variant/10">
						<div className="flex items-center gap-2 mb-4">
							<span className="material-symbols-outlined text-primary-container">
								palette
							</span>
							<h3 className="font-headline text-sm uppercase tracking-widest text-on-surface font-bold">
								Appearance
							</h3>
						</div>

						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<span className="font-mono text-xs text-outline-variant">
									Theme Mode
								</span>
								<span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1">
									SYNTH_OS (DARK)
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="font-mono text-xs text-outline-variant">
									Scanline Opacity
								</span>
								<RangeSlider defaultValue="20" />
							</div>
							<div className="flex justify-between items-center">
								<span className="font-mono text-xs text-outline-variant">
									UI Animations
								</span>
								<Toggle checked={true} variant="primary" />
							</div>
						</div>
					</div>

					<div className="bg-surface-container shatter-clip-reverse p-5 relative border border-outline-variant/20 flex-1">
						<div className="absolute inset-0 scanlines opacity-10 pointer-events-none"></div>
						<div className="flex flex-col items-center justify-center h-full text-center p-4 relative z-10">
							<span className="font-headline font-black text-4xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic tracking-widest mb-2">
								SYNTH_OS
							</span>
							<span className="font-mono text-xs text-outline-variant mb-6 border border-outline-variant/30 px-2 py-1 shatter-clip">
								V.2.0.99-FINAL
							</span>

							<div className="space-y-2 w-full text-left font-mono text-[10px] text-outline-variant bg-surface-dim p-3 border-l-2 border-primary-container/50 mb-6">
								<p className="flex justify-between">
									<span>Electrobun:</span> <span>v1.16.0</span>
								</p>
								<p className="flex justify-between">
									<span>Bun:</span> <span>v1.0.35</span>
								</p>
								<p className="flex justify-between">
									<span>Architecture:</span> <span>linux-x64</span>
								</p>
							</div>

							<div className="flex gap-4 w-full">
								<button className="flex-1 bg-surface-variant hover:bg-surface-variant/80 text-on-surface-variant font-mono text-[10px] py-2 transition-colors flex items-center justify-center gap-1 shatter-clip">
									<span className="material-symbols-outlined text-[14px]">
										bug_report
									</span>
									DEBUG_LOGS
								</button>
								<button className="flex-1 bg-surface-variant hover:bg-surface-variant/80 text-on-surface-variant font-mono text-[10px] py-2 transition-colors flex items-center justify-center gap-1 shatter-clip-reverse">
									<span className="material-symbols-outlined text-[14px]">
										code
									</span>
									GITHUB
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
