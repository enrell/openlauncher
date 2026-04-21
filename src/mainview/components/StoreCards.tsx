interface ProviderCardProps {
	title: string;
	description: string;
	icon: string;
	statusText?: string;
	actionText?: string;
}

export function ProviderCard({
	title,
	description,
	icon,
	statusText = "NOT_CONNECTED",
	actionText = "Connect",
}: ProviderCardProps) {
	return (
		<div className="group cursor-pointer flex flex-col h-full shatter-clip bg-surface-container border border-outline-variant/30 hover:border-primary-container/80 transition-all p-6 relative">
			<div className="absolute inset-0 scanlines opacity-10 pointer-events-none z-10"></div>
			<div className="flex justify-between items-start mb-6">
				<div className="w-12 h-12 bg-surface-dim flex items-center justify-center border border-outline-variant/50">
					<span className="material-symbols-outlined text-2xl text-on-surface">
						{icon}
					</span>
				</div>
				<span className="bg-surface-variant text-on-surface-variant border border-outline-variant/50 font-mono text-[10px] px-2 py-0.5 shatter-clip">
					{statusText}
				</span>
			</div>
			<div>
				<h3 className="font-headline font-bold text-xl text-on-surface uppercase mb-2">
					{title}
				</h3>
				<p className="font-mono text-xs text-outline-variant leading-relaxed mb-6">
					{description}
				</p>
			</div>
			<div className="mt-auto">
				<button className="w-full text-center border border-outline-variant hover:border-primary text-outline-variant hover:text-primary font-mono text-xs py-2 transition-colors uppercase tracking-widest">
					{actionText}
				</button>
			</div>
		</div>
	);
}

export function AddProviderCard() {
	return (
		<div className="group cursor-pointer flex flex-col h-full shatter-clip bg-surface-container-highest border-2 border-dashed border-outline-variant/40 hover:border-secondary/80 hover:bg-surface-variant transition-all p-6 relative items-center justify-center text-center">
			<span className="material-symbols-outlined text-4xl text-outline-variant group-hover:text-secondary mb-4 transition-colors">
				extension
			</span>
			<h3 className="font-headline font-bold text-lg text-outline-variant group-hover:text-secondary uppercase mb-2 transition-colors">
				Add Custom Provider
			</h3>
			<p className="font-mono text-[10px] text-outline-variant/70 leading-relaxed max-w-[200px]">
				Load a community-maintained store adapter module via URL or local path.
			</p>
		</div>
	);
}

export function FeaturedProviderBanner() {
	return (
		<div className="w-full h-64 md:h-80 shatter-clip bg-surface-container relative overflow-hidden border border-secondary/30 group cursor-pointer mt-6 mb-10">
			<div className="absolute inset-0 scanlines opacity-30 pointer-events-none z-10"></div>

			<div className="absolute inset-0 bg-gradient-to-r from-surface-dim via-surface-dim/80 to-transparent z-10"></div>
			<div className="absolute right-0 top-0 w-2/3 h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent z-0 opacity-50"></div>

			<div className="absolute inset-0 z-20 flex flex-col justify-center p-8 md:p-12 w-full md:w-2/3">
				<span className="font-mono text-secondary text-xs tracking-widest mb-2 flex items-center gap-2">
					<span className="w-2 h-2 rounded-full bg-secondary glow-secondary animate-pulse"></span>
					FEATURED_INTEGRATION
				</span>
				<h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface uppercase mb-4 tracking-tight">
					UMU Runner
				</h2>
				<p className="font-body text-outline-variant text-sm md:text-base max-w-lg mb-6">
					The unified Linux gaming runtime. Execute Windows games on Linux
					seamlessly using Proton-compatible tooling, detached from any specific
					store.
				</p>
				<div className="flex gap-4">
					<button className="shatter-clip-reverse bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary font-headline font-bold text-sm px-6 py-2 transition-all">
						INSTALL_MODULE
					</button>
				</div>
			</div>

			<div className="absolute right-10 bottom-10 z-0 hidden md:block">
				<span className="material-symbols-outlined text-[160px] text-surface-variant/40">
					terminal
				</span>
			</div>
		</div>
	);
}
