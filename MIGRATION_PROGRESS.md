# Workshift PyQt6 -> Tauri + Next.js Migration Progress

Last updated: 2026-05-21

## Legend
- [ ] Not started
- [~] In progress
- [x] Finished

## Master Checklist
- [x] App architecture analysis
- [~] UI/UX mapping
- [x] Tauri setup
- [x] Next.js setup
- [~] shadcn customization
- [~] Component migration
- [~] State management
- [~] Backend/native command migration
- [~] Export feature replacement
- [~] File system/native APIs
- [~] Styling parity
- [~] Testing
- [~] Final cleanup

## 1) App Architecture Analysis
Status: [x] Finished

### Scope Inventory
- [x] Entry/bootstrap flow identified (`main.py` -> `src/app/bootstrap.py` -> `MainWindow`)
- [x] State/controller layer identified (`src/app/controller.py`, `src/app/state.py`)
- [x] Domain models identified (`Employee`, `Shift`, `Schedule`)
- [x] Service layer identified (`calculations`, `calendar`, `validation`, `formatting`, `export`)
- [x] UI layer identified (`main_window`, `panels`, `widgets`, `dialogs`, `theme`)

### Behavior Mapping
- [x] Windows identified
  - `MainWindow` only top-level window.
- [x] Dialogs identified
  - `EmployeeDialog`, `ShiftDialog`, `DeleteConfirmDialog`, `InfoDialog`, `ExportDialog`.
- [x] Widgets identified
  - Employee/Shift rows, calendar day cell, workload card, color swatch, custom employee combobox.
- [x] Layouts identified
  - Main layout: horizontal splitter (employees | calendar | shifts) + vertical splitter (top area | workload recap).
- [x] Signals/slots identified
  - UI emits add/edit/delete/select/nav/export signals.
  - `WorkshiftController.changed` triggers full `MainWindow.refresh()`.
- [x] Commands identified
  - Controller mutators: add/edit/delete employee/shift, month navigation, day selection, export.
- [x] Export logic identified
  - Python `openpyxl` workbook with 3 sheets: `Shifts_Data`, `Monthly_View`, `Summary`.
- [x] Filesystem usage identified
  - Export path chosen via dialog, default path `Path.home()/workshift_YYYY-MM.xlsx`.
- [x] Settings/config storage identified
  - No persistent settings/config or schedule save/load found in current codebase.

### Architecture Notes (PyQt6 Baseline)
- Controller is the single source of truth in memory (`SessionState`).
- View updates are full refreshes, not incremental diffing.
- Schedule data lifecycle is session-only unless exported.
- Validation is domain-level and user-facing via `WorkshiftError` messages.

## 2) UI/UX Mapping
Status: [~] In progress

### Visual Tokens Extracted
- [x] Core colors mapped
  - Base bg `#eef2f7`, surfaces `#ffffff`, primary `#2563eb`, text `#0f172a`, secondary text `#64748b`, borders around `#d8e0ea`/`#d9e0ea`.
- [x] Typography mapped
  - Primary stack: `Avenir Next`, `Segoe UI`, `Inter`, `Helvetica Neue`, `Arial`; base size `12px`.
- [x] Radius and spacing mapped
  - Panels/cards/dialog cards radius `16px`; inputs/buttons radius `8px`; consistent 8/10/12/14 spacing rhythm.
- [x] Interaction states mapped
  - Hover/pressed/disabled variants for button, checkbox, scrollbars, focus border, selected calendar cells.
- [x] Layout constraints mapped
  - Main window default `1500x960`, minimum `1280x700`, panel min widths and splitter defaults captured.

### UX Flow Mapping
- [x] Employee CRUD flow mapped.
- [x] Shift CRUD flow mapped.
- [x] Month navigation and day-selection behavior mapped.
- [x] Workload recap behavior mapped.
- [x] Export dialog/feedback flow mapped.
- [ ] Pixel-level parity pass with side-by-side runtime screenshots (pending during React polish).

### Migration Notes
- Original behavior is strongly card-based with subtle borders and dense desktop spacing.
- Calendar day cells have conditional visuals (`selected`, `today`, `outside month`) and color chips (+overflow badge).
- Dialogs are card-wrapped, with explicit save/cancel/delete semantics and inline helper text.
- Current phase intentionally uses baseline shadcn visual language (including dark mode) while keeping UX flow and interaction behavior unchanged.

## 3) Tauri Setup
Status: [x] Finished
- [x] Initialized Tauri scaffold in `src-tauri` (originally created under `frontend/src-tauri` and later moved to root).
- [x] Configured desktop window to PyQt baseline (`1500x960`) with stronger usable minimum (`1360x780`) to prevent cramped layouts.
- [x] Set static frontend dist (`../out`) and dev/build hooks in `tauri.conf.json`.
- [x] Added Rust plugins for dialog and filesystem (`tauri-plugin-dialog`, `tauri-plugin-fs`).
- [x] Updated Tauri capability permissions (`dialog:default`, `fs:default`).

## 4) Next.js Setup
Status: [x] Finished
- [x] Created Next.js TypeScript app (originally in `frontend/`, then relocated to repository root).
- [x] Configured static export (`output: "export"`) for Tauri packaging.
- [x] Added Tauri CLI npm script and dependencies.
- [x] Replaced starter page with Workshift app entry component.
- [x] Pinned project Node runtime with `.nvmrc` to the local macOS-installed `v24.14.0` to avoid Node 26 deprecation-noise in dev/build output.

## 5) shadcn Customization
Status: [~] In progress
- [x] Initialized shadcn (`base-nova`) and component registry.
- [x] Added component primitives: button, card, dialog, input, label, select, checkbox, progress, scroll-area, resizable.
- [x] Reset global theme variables to baseline shadcn tokens (`:root` + `.dark`) for a clean visual starting point.
- [x] Added app-wide theme-provider integration with runtime light/dark toggle.
- [x] Increased contrast/readability tokens in both light and dark themes and aligned card/dialog radius behavior.
- [x] Reverted color/radius token overrides back to stock shadcn default tokens for both light and dark mode.
- [x] Re-aligned core card/dialog primitives to default shadcn-style visual structure.
- [~] Custom variant tuning for exact PyQt hover/focus/disabled parity is intentionally deferred until baseline UX validation is complete.
- [x] Replaced `next-themes` with an internal theme provider to eliminate React 19 dev warnings and hydration mismatch around theme icon rendering.

## 6) Component Migration
Status: [~] In progress
- [x] Migrated main split layout using resizable panels (horizontal + vertical groups).
- [x] Migrated employee panel + CRUD dialogs.
- [x] Migrated monthly calendar panel + day cell visuals and tooltip text.
- [x] Migrated daily shift panel + CRUD dialogs.
- [x] Migrated workload recap panel + progress cards.
- [x] Migrated confirm/error/info dialog flows.
- [x] Removed top application title bar to recover dashboard space and moved theme toggle into in-panel controls.
- [x] Added stricter resizable panel constraints (min/max sizes) to avoid unusable narrow sections.
- [x] Fixed panel sizing regression caused by `react-resizable-panels` v4 unit semantics (numeric sizes interpreted as pixels); migrated panel sizing constraints to percentage strings.
- [x] Fixed calendar clipping when the bottom recap panel is expanded by making the day-grid area internally scrollable.
- [x] Reworked calendar grid to be fully responsive inside its panel (6 fixed rows that shrink with available height) to avoid inner scrolling and keep all days visible.
- [x] Tightened inter-panel spacing around resizers for more proportional section separation.
- [x] Improved employee and shift dialogs for faster input:
  - Lunch-break duration now has quick select options.
  - Shift start/end time now use structured time selects + quick presets.
  - Employee color selection now includes fast swatch buttons plus manual picker/input.
- [x] Simplified Add Shift flow to reduce entry mistakes:
  - No default employee preselection; explicit employee choice required.
  - Removed date field from the shift dialog (date is the currently selected calendar day).
  - Removed quick-shift preset buttons for a cleaner, minimal dialog.
- [x] Fixed Add Shift employee select visualization:
  - Keep shadcn Select dropdown behavior.
  - Trigger now displays employee full name instead of internal ID value.
- [~] Fine-grain visual parity polish and interaction micro-details remaining.

## 7) State Management
Status: [~] In progress
- [x] Ported core models, view models, and validation errors to TypeScript.
- [x] Ported calendar, workload, shift-row, and formatting logic from Python.
- [x] Implemented reducer-driven in-memory session state and controller-like actions.
- [~] Additional edge-case parity pass against Python runtime behavior pending.

## 8) Backend/Native Command Migration
Status: [~] In progress
- [x] Added native plugin integration points in Rust for filesystem/dialog.
- [x] Preserved frontend-first business logic execution model.
- [ ] Evaluate whether any remaining logic should move to Rust commands for stronger native encapsulation.

## 9) Export Feature Replacement
Status: [~] In progress
- [x] Replaced Python export invocation path with TypeScript workbook generation (`xlsx`).
- [x] Preserved sheet names and data model parity: `Shifts_Data`, `Monthly_View`, `Summary`.
- [x] Wired export action to native save path + file write in Tauri.
- [~] Styling parity with the old `openpyxl` workbook is partial (see differences log).

## 10) File System/Native APIs
Status: [~] In progress
- [x] Implemented native save dialog via `@tauri-apps/plugin-dialog`.
- [x] Implemented `.xlsx` path normalization and write via `@tauri-apps/plugin-fs`.
- [x] Implemented success/error feedback dialogs after export.
- [~] Additional platform-path behavior checks pending in packaged app runs.

## 11) Styling Parity
Status: [~] In progress
- [x] Ported core structural layout (panels/dialogs/sections) with shadcn primitives while preserving behavior flow.
- [x] Applied baseline shadcn styling consistently across major screens and dialogs.
- [x] Enabled both light and dark mode using standard shadcn token sets.
- [x] Improved practical text legibility (larger secondary text where needed, stronger muted contrast, clearer selected-state/background separation).
- [x] Reverted dashboard section wrapper cards to default shadcn card framing (thin border + default shadow) to remove ring/corner artifact and align with baseline style.
- [x] Removed shadow from the four main dashboard section wrapper cards to eliminate corner gray artifacts while keeping thin border separation.
- [x] Restored full-height flex behavior on the four main dashboard cards so the central calendar panel stretches/shrinks correctly with resizable layout changes.
- [x] Aligned outer dashboard edge spacing with inter-section spacing by increasing shell padding to match panel-gap + handle rhythm.
- [x] Simplified section titles to `Employee`, `Shifts`, and `Recap` and slightly reduced card inner padding to improve content density.
- [x] Renamed center section title to `Calendar` and standardized pointer cursor behavior on clickable buttons for clearer affordance.
- [~] PyQt-exact visual parity (palette, typography, spacing micro-details, control states) remains pending after this intentional baseline reset.

## 12) Testing
Status: [~] In progress
- [x] Frontend static build passes (`npm run build`).
- [x] Frontend lint passes (`npm run lint`).
- [x] Rust/Tauri compile check passes (`cargo check` in `src-tauri`).
- [x] Desktop app bundle build passes (`npm run tauri build -- --debug --bundles app`).
- [x] Revalidated lint/build/native compile after shadcn baseline + theme-provider transition (2026-05-21).
- [x] Revalidated lint/build/native compile after contrast/radius/resizing updates and top-bar removal (2026-05-21).
- [x] Revalidated lint/build after theme-provider replacement and hydration-mismatch fix (2026-05-21).
- [x] Revalidated lint/build after panel-size unit fix for resizable layout (2026-05-21).
- [x] Revalidated lint/build after calendar scrollability fix under constrained vertical space (2026-05-21).
- [x] Revalidated lint/build after responsive non-scrolling calendar grid + chip-only resizer handles update (2026-05-21).
- [x] Revalidated lint/build using pinned Node `v24.14.0` runtime (2026-05-21).
- [x] Revalidated lint/build after default-shadcn visual reset + dialog UX refactor (2026-05-21).
- [x] Revalidated lint/build after section-separation contrast tune + simplified Add Shift dialog flow (2026-05-21).
- [x] Revalidated lint after Add Shift employee-label visualization fix (2026-05-21).
- [x] Revalidated lint/build after restoring default shadcn card wrappers for the four main sections (2026-05-21).
- [x] Revalidated lint/build after fixing main-card corner artifact and calendar stretch regression (2026-05-21).
- [x] Revalidated lint/build after edge-spacing parity adjustment between outer shell and section gaps (2026-05-22).
- [x] Revalidated lint/build after section-title simplification and card-padding density tune (2026-05-22).
- [x] Revalidated lint/build after calendar-title rename + pointer-cursor affordance update (2026-05-22).
- [ ] Add dedicated unit tests for migrated logic.
- [ ] Add integration tests for full CRUD + export flows.
- [ ] Perform side-by-side manual QA against PyQt app.

## 13) Final Cleanup
Status: [~] In progress
- [x] Relocate migrated app from `frontend/` to repository root (`workshift/`) and remove old nested folder.
- [x] Remove legacy PyQt6 runtime/build files from repository:
  - Deleted `src/` legacy PyQt6 codebase.
  - Deleted `main.py`, `requirements.txt`, `.python-version`.
  - Deleted old PyInstaller CI workflow `.github/workflows/build.yml`.
- [ ] Remove migration scaffolding and dead code.
- [x] Adjust ESLint ignore scope for generated/non-project artifacts (`.venv/**`, `src-tauri/target/**`) to keep lint focused on project code.
- [ ] Final type/lint pass.
- [ ] Final parity review and residual differences log.
- [ ] Update README and developer run instructions.

## Open Differences / Risks Log
- [~] In-memory-only schedule state remains intentional (matches current PyQt behavior; no save/load persistence yet).
- [~] Export workbook style parity is currently partial:
  - Data parity and sheet structure are implemented.
  - Advanced formatting from `openpyxl` (merged title rows, detailed cell styles, borders/fills, freeze panes, print setup) is not fully replicated yet.
- [~] Employee color selection improved with swatch shortcuts but still uses web color input (no native desktop color-picker dialog yet).
- [~] UI is functionally migrated and now aligned to baseline shadcn look; exact PyQt visual matching is temporarily deferred for the next customization phase.
- [x] Theme-toggle hydration mismatch fixed by removing server/client divergent icon rendering.
- [~] Full DMG installer bundling (`tauri build --bundles dmg`) failed in this environment; app bundle (`.app`) builds successfully.

## Current Implementation Notes (New in Tauri/React)
- Original PyQt behavior: signal/slot driven full refresh with in-memory `SessionState`.
- New implementation: reducer-driven state with derived view models and full render refresh semantics.
- Original export: Python `openpyxl` implementation.
- New export: TypeScript `xlsx` generation + Tauri native dialog/fs write.
- Remaining TODOs:
  - Export style parity pass.
  - Resume PyQt visual parity pass from the current baseline shadcn theme (colors, spacing, typography, states).
  - Targeted tests for migrated business rules.

## Next Milestone
- Validate UX flow against the baseline shadcn dual-mode UI, then begin incremental customization toward PyQt visual parity and export formatting parity.
