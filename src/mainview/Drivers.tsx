import { RunnerCard, ToolCard } from "./components/DriverCards";
import { DiagnosticPanel, Panel } from "./components/Panels";
import { SectionHeader } from "./components/SectionHeader";

export function Drivers() {
	return (
		<>
			<SectionHeader
				title="System Drivers"
				subtitle="COMPATIBILITY_LAYERS // RUNTIME_TOOLS"
				actionText="CHECK_FOR_UPDATES"
				actionIcon="update"
				actionVariant="secondary"
			/>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
				<div className="lg:col-span-8 flex flex-col gap-6">
					<Panel title="Proton Runners" icon="layers">
						<RunnerCard
							title="GE-Proton8-25"
							path="/home/user/.steam/root/compatibilitytools.d/"
							statusText="ACTIVE_DEFAULT"
							statusVariant="active"
							titleColor="text-secondary"
							borderColor="border-secondary/50"
						/>
						<RunnerCard
							title="Proton Experimental"
							path="/home/user/.local/share/Steam/steamapps/common/"
							statusText="INSTALLED"
						/>
						<button className="w-full border-2 border-dashed border-outline-variant/30 hover:border-primary-container text-outline-variant hover:text-primary p-3 font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shatter-clip">
							<span className="material-symbols-outlined text-lg">add</span>
							INSTALL_NEW_VERSION
						</button>
					</Panel>

					<Panel
						title="Runtime Tools"
						icon="build_circle"
						iconColor="text-secondary"
						reverseClip
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<ToolCard
								title="Gamescope"
								description="Micro-compositor for tailored gaming sessions. Wayland required."
								version="v3.13.8"
								iconColor="text-secondary"
								hoverBorder="hover:border-secondary/50"
							/>
							<ToolCard
								title="MangoHud"
								description="Vulkan and OpenGL overlay for monitoring FPS, temperatures, CPU/GPU load."
								version="v0.7.1"
								iconColor="text-primary"
								hoverBorder="hover:border-primary/50"
							/>
						</div>
					</Panel>
				</div>

				<div className="lg:col-span-4 flex flex-col">
					<DiagnosticPanel
						title="System Diagnostics"
						icon="terminal"
						lines={[
							<p className="text-[#00F3FF]">&gt; INIT_SYS_SCAN</p>,
							<p>&gt; Checking kernel version... [6.6.10-arch1-1]</p>,
							<p>&gt; Validating Vulkan drivers...</p>,
							<p className="text-secondary">
								&gt; GPU 0: AMD Radeon RX 6700 XT [RADV 23.3.4]
							</p>,
							<p className="text-secondary">
								&gt; Vulkan API Version: 1.3.267
							</p>,
							<p>&gt; Checking proprietary drivers... [N/A]</p>,
							<p>&gt; Detecting Steam runtime... [OK]</p>,
							<p>&gt; Detecting Lutris runners... [OK]</p>,
							<p>&gt; Scanning for MangoHud... [FOUND]</p>,
							<p>&gt; Scanning for Gamescope... [FOUND]</p>,
							<p className="text-primary mt-4">&gt; STATUS: OPTIMAL</p>,
						]}
					/>
				</div>
			</div>
		</>
	);
}
