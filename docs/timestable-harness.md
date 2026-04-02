# TimesTable Harness

## Purpose
This harness defines how Codex should coordinate work for the TimesTable repository. The project is a static one-minute multiplication game for children, so the workflow should favor simple rules, mobile-first UI decisions, and fast manual validation.

## Recommended Pattern
Use `producer-reviewer` for most feature work.

- `planner` defines the game rule change, screen flow, and acceptance criteria.
- `developer` updates `index.html`, `src/app.js`, and `styles.css`.
- `tester` validates gameplay flow, wording clarity, score accuracy, and mobile usability before merge.

Use `fan-out/fan-in` only when planning, implementation, and test design can be split without overlapping file ownership.

## Role Ownership
### planner
- owns feature definition and task boundaries
- updates `docs/` when rules, wording, or screen flow change
- decides what must remain simple for elementary-school players

### developer
- owns game logic and UI implementation
- keeps the app static and dependency-free
- preserves simple state transitions and readable browser JavaScript

### tester
- owns manual verification and issue reporting
- checks first-run clarity, tap targets, progression, and result accuracy
- reports regressions separately from UX improvement ideas

## Standard Workflow
1. `planner` writes a short feature brief with goal, user-visible behavior, and edge cases.
2. `developer` implements the smallest complete version of the change.
3. `tester` runs manual checks in desktop and mobile-sized viewports.
4. If the change affects rules or UX, `planner` updates the related `docs/` file.

## Default Artifacts
- feature brief or rule change: `docs/`
- implementation: `src/app.js`, `styles.css`, `index.html`
- harness guidance: `docs/harness-team.md`, `docs/roles/`, `docs/timestable-harness.md`

## Validation Checklist
- Can a first-time player understand the next action quickly?
- Do timer, problem generation, answer handling, and result counting still work?
- Are buttons readable and easy to tap on a phone-sized screen?
- Did the change keep the app fully static for GitHub Pages deployment?
