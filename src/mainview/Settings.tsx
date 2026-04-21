import { RangeSlider, Select, Toggle } from "./components/Forms";
import { Panel, SettingRow } from "./components/Panels";
import { SectionHeader } from "./components/SectionHeader";

export function Settings() {
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
