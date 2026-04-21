# CONTRIBUTING.md

Contribution guide for humans and LLMs working on OpenLauncher.

## Read This First

Before making changes, read:

1. `AGENTS.md`
2. this file

`AGENTS.md` defines the project direction and hard constraints.

This file defines contribution behavior.

## Contribution Standard

Every change should satisfy all of the following:

- solves a real problem
- keeps the codebase understandable
- avoids unnecessary abstraction
- respects the Linux-first direction
- does not turn planning into runtime code

## Expected Engineering Style

Write code that is:

- explicit
- readable
- small in scope
- easy to change later

Use Object Calisthenics as a practical guardrail, not as dogma.

## File and Function Size

Do not create:

- giant files
- giant React components
- giant orchestration functions
- utility files full of unrelated logic

Prefer:

- one clear responsibility per module
- one clear purpose per function
- direct names over generic names

## Naming

Names must describe intent clearly.

Avoid vague names such as:

- `data`
- `utils`
- `manager`
- `service`
- `handler`
- `misc`

unless the local context makes the meaning exact and unavoidable.

## Comments

Do not add filler comments.

Bad comments:

- explain what the next line already says
- narrate obvious assignments
- compensate for poor naming

Acceptable comments:

- external tool quirks
- Linux runtime constraints
- safety-critical behavior
- unusual Electrobun behavior that is not obvious from code alone

## Overengineering Checklist

Stop and simplify if a change introduces:

- abstractions for one implementation
- indirection without benefit
- framework-like internal systems
- configuration layers no one uses
- multiple patterns for the same simple task

If a plain function and a clear type solve the problem, use that.

## UI Contributions

Until the actual design system and screens are ready:

- keep UI changes minimal
- avoid building speculative product UI
- avoid adding dashboards for internal planning
- avoid mock data-driven screens that imply nonexistent features

## Documentation Contributions

Put guidance where it belongs:

- project rules in `AGENTS.md`
- contributor instructions in `CONTRIBUTING.md`
- user-facing setup or product notes in `README.md`

Do not hide key project decisions inside random source files.

## External Integrations

When integrating Linux gaming tools:

- prefer community-maintained tools with visible maintenance
- keep adapters thin
- document real constraints
- avoid binding the whole architecture to one external tool

Store integrations must not take control of the runtime model.

## Pull Request Mindset

A good contribution is small enough to review and strong enough to keep.

Before considering a change done, verify:

- the code still builds
- the change is locally coherent
- names are clear
- complexity did not increase without a direct reason
- the implementation matches the project direction in `AGENTS.md`
