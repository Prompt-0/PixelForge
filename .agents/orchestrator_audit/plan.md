# Project Audit Plan: Image Manipulator

## Architecture
- React 19 + Vite + TypeScript.
- Control panels in `src/components/`, processing engines in `src/utils/`.
- Features to audit: Draw (DrawPanel / annotationEngine), Select (SelectionPanel / selectionEngine), Watermark (WatermarkPanel / watermarkEngine), Filter (FilterPanel / filterEngine), Cyber (CyberPanel / cyberSecurity).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Exploration & Codebase Audit | Investigate Mega Expansion features for bugs, edge cases, and UI glitches. Run existing tests to verify baseline. | None | PLANNED |
| M2 | Remediate Identified Bugs | Fix all bugs/glitches found during audit. | M1 | PLANNED |
| M3 | Expand Unit Testing | Add Vitest coverage for the new utility engines and panels. | M2 | PLANNED |
| M4 | Playwright Installation & Configuration | Install and configure Playwright E2E testing framework. | M2 | PLANNED |
| M5 | Implement and Run E2E Tests | Implement E2E tests for a core UI flow and verify passing on local server. | M4 | PLANNED |

## Interface Contracts
- Components must interface cleanly with the App state.
- Canvas manipulations (draw, select, watermark, filters, cyber encoding) should not mutate the original image but produce a new processed image.
- Playwright tests will run against a local Vite dev server.
