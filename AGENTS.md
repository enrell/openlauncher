# AGENTS.md

Project rules for AI agents working on OpenLauncher.

## Identity

OpenLauncher is a Linux-first desktop game launcher.

It is built with:

- Electrobun
- Bun
- React 18
- Tailwind CSS
- Vite

This project is not Electron. Do not use Electron APIs, Electron assumptions, or Electron design patterns.

## Project Idea

OpenLauncher exists to provide a Linux-first launcher with reliable game execution, especially for Windows games running on Linux through Proton-compatible tooling.

The priority is runtime reliability and maintainability, not trying to support every game store as fast as possible.

The launcher should:

- treat Linux as the primary and only target platform for now
- support native Linux games as first-class citizens
- support Windows games on Linux through community-maintained runners
- keep store integration separate from game execution
- prefer open, community-maintained CLIs and tools over proprietary lock-in

## Project Direction

### Core direction

Early work should focus on:

1. local library management
2. manual game import
3. native Linux launch flow
4. Windows-on-Linux launch flow through `umu`
5. runtime integrations such as `gamescope`, `mangohud`, and related Linux gaming tools
6. metadata and artwork enhancement
7. store adapters only after the runtime path is stable

### Store direction

Store support is secondary.

If store support is added, it must follow this rule:

- stores are providers and installers
- OpenLauncher owns the runtime model
- running a game must not depend on store-specific launch logic unless strictly unavoidable

### Technical direction

Prefer:

- small, composable modules
- explicit data flow
- direct code over clever abstractions
- stable adapters around external CLIs

Avoid:

- speculative architecture
- generic plugin systems without real usage
- premature abstractions for stores or runners that do not exist yet
- fake infrastructure created only to “prepare for the future”

## What This Project Is Not

OpenLauncher is not:

- a Steam replacement
- a cross-platform launcher for Windows/macOS/Linux
- a browser wrapper around many store websites
- a clone of Heroic, Lutris, or Bottles
- a Proton manager for every edge case from day one
- a playground for sample dashboards, mock systems, or fake product UIs

Do not add:

- sample data committed as product architecture
- mock launch flows presented as real features
- placeholder dashboards that model future systems in the running app
- code whose only purpose is to document ideas better suited for repository docs

## Architecture

### Process model

- `src/bun/` is the Bun main process
- `src/mainview/` is the trusted application UI
- external or untrusted web content must be sandboxed

### Runtime model

The launcher architecture should separate:

- library/catalog
- metadata
- runtime execution
- store/provider integrations
- optional performance and overlay integrations

Execution must be modeled independently from stores.

### External tooling

Current preferred tooling direction:

- `umu` for Windows games on Linux
- `gamescope` for session wrapping when needed
- `mangohud` for performance overlay
- `goverlay` only as an optional companion tool
- community-maintained store CLIs where appropriate

## File Structure Expectations

Keep the repository structure clear and predictable.

Primary areas:

- `src/bun/` main process and native orchestration
- `src/mainview/` application UI
- `src/shared/` shared types and contracts, only when truly shared

Do not create deep folder trees without clear benefit.

Do not create “future-proof” directories for systems that do not exist yet.

## Coding Rules

Code in this repository must be:

- readable
- easy to maintain
- performant enough for desktop usage
- explicit rather than magical

Follow Object Calisthenics as a guiding principle where it improves clarity.

In practice, this means:

- keep functions small and focused
- keep files small enough to stay understandable
- use precise names
- avoid vague variables like `data`, `item`, `handler`, `manager`, `utils` unless context makes them unambiguous
- avoid functions that do many things at once
- avoid giant files and giant components
- avoid hidden side effects
- prefer narrow modules with one clear responsibility

## Comment Policy

Meaningless comments are not welcome.

Assume that code requiring constant explanation is poorly written code.

Do not add comments that restate the obvious.

Only add comments when they explain a non-obvious constraint, an external integration caveat, or a safety requirement that cannot be expressed cleanly through code structure alone.

## Complexity Rules

Avoid spaghetti code.

Avoid overengineering.

In the context of this project, overengineering includes:

- introducing multiple abstraction layers for one implementation
- building generic systems before the second real use case exists
- creating class hierarchies where plain values and functions are enough
- splitting logic into too many indirections that obscure the launch flow
- building a large internal framework around a simple feature

Good practice here means:

- clear launch paths
- explicit runtime configuration
- simple adapters over Linux tools
- small, testable logic units
- direct ownership of important decisions

## UI Rules

The final UI direction will come from dedicated design work.

Until then:

- keep the app shell minimal
- do not invent feature-heavy placeholder UIs
- do not turn product planning into runtime UI
- do not treat temporary screens as product direction

### Interface Style & Aesthetics

The frontend adopts a "SYNTH_OS" styling direction:
- **Theme:** Dark mode, synthwave/cyberpunk inspired interface.
- **Typography:**
  - `Space Grotesk` for headlines, labels, and general body text.
  - `JetBrains Mono` for monospace content, status labels, metrics, and terminal-like text.
- **Design Elements:**
  - Angular, "shatter-clip" shapes (`clip-path: polygon(...)`).
  - Scanline overlays and subtle grid backgrounds.
  - Glowing accents on active elements (`box-shadow` glows).
  - Upper-case text for headings and statuses.
- **Color Palette (Tailwind):**
  - **Primary (`#dfb7ff`, `#9d00ff`):** Purple hues, used for active accents, launch buttons, and glows.
  - **Secondary (`#dcfdff`, `#00f3ff`):** Cyan/neon blue hues, used for active navigation, secondary glows, and telemetry.
  - **Surface/Background (`#131315`, `#08080A`, `#201f22`):** Very dark grays with slight purple/blue undertones for depth.
  - **Outline Variant (`#4e4356`):** Used for inactive borders and subtle text.

## Documentation Rules

Repository direction belongs in repository documents, not in placeholder app code.

Use:

- `AGENTS.md` for AI-agent rules and project constraints
- `CONTRIBUTING.md` for contributor guidance for both humans and LLMs
- `docs/` for technology research and API documentation

If direction changes, update these documents first.

## Research Requirements

Before implementing features that depend on external libraries, SDKs, or APIs:

1. Research the library's actual API — do not rely on assumptions or prior knowledge of similar libraries
2. Document findings in `docs/` with:
   - API surface (classes, methods, options)
   - Limitations and known issues
   - Integration patterns relevant to this project
3. Specifically verify:
   - Native availability on target platforms (no extra dependencies for the user)
   - Actual feature support (e.g., bun:sqlite does NOT support SQLCipher encryption)
   - Rate limits, authentication requirements, ToS constraints

Do not implement based on guessed APIs. If research is inconclusive, document the uncertainty and create a stub that can be filled in once the API is verified.

## Commands

```bash
bun install
bun run dev
bun run dev:hmr
bun run build:canary
```

## Electrobun Rules

- use `electrobun/bun` in the main process
- use `electrobun/view` in the browser context only when needed
- use `views://` for bundled assets
- do not assume Electron-style preload or IPC conventions

## Final Constraint

Every contribution should make the codebase simpler, clearer, or more capable.

If a change adds complexity without delivering immediate value, it is probably the wrong change.
