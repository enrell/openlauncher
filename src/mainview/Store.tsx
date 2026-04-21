import { TextInput } from "./components/Forms";
import {
	AddProviderCard,
	FeaturedProviderBanner,
	ProviderCard,
} from "./components/StoreCards";

export function Store() {
	return (
		<>
			<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-outline-variant/20 pb-6">
				<div>
					<h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-on-surface uppercase mb-2">
						Store Providers
					</h1>
					<p className="font-mono text-sm text-outline-variant uppercase tracking-widest border-l-2 border-primary-container pl-3">
						COMMUNITY_MAINTAINED {/* EXTERNAL_CATALOGS */}
					</p>
				</div>
				<div className="flex items-center gap-4">
					<TextInput icon="search" placeholder="SEARCH_PROVIDERS..." />
				</div>
			</div>

			<FeaturedProviderBanner />

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				<ProviderCard
					title="GOG"
					description="Connect to your GOG library. Download offline installers and manage your DRM-free catalog directly."
					icon="shopping_bag"
				/>
				<ProviderCard
					title="Epic Games"
					description="Access your Epic Games catalog via the community Legendary runner integration."
					icon="public"
				/>
				<ProviderCard
					title="Itch.io"
					description="Browse and install indie titles from your Itch.io collection. Supports both native Linux and Windows builds."
					icon="gamepad"
				/>
				<AddProviderCard />
			</div>
		</>
	);
}
