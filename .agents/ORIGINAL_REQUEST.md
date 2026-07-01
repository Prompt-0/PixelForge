# Original User Request

## Initial Request — 2026-07-01T17:03:47Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Build the React UI components for a client-side Image Manipulation Web App. The core utilities are already built, and the global CSS design system is in place. The components need to be beautiful, dark-themed, glassmorphic, and feature-rich.

Working directory: /home/ritesh/Projects/Active/Image_Manipulator
Integrity mode: development

Note: The utility modules in `src/utils/` are already completely built, and the CSS variables are available in `src/index.css`. `App.tsx` and `App.css` are also set up. You just need to build the 11 missing UI components in `src/components/`.

## Requirements

### R1. Implement UI Components
Create 11 specific React components in `src/components/`:
1. `UploadZone`: Drag-and-drop file upload.
2. `ImagePreview`: Side-by-side comparison with a draggable slider.
3. `AdjustmentPanel`: Sliders for brightness, contrast, etc.
4. `MetadataEditor`: EXIF inspector and editor.
5. `OcrPanel`: Text extraction interface.
6. `ResizePanel`: Dimensions, cropping, and rotation controls.
7. `CompressPanel`: Target size compression UI.
8. `ConvertPanel`: Format conversion buttons.
9. `BatchProcessor`: Multi-file upload and processing dashboard.
10. `Toolbar`: Main navigation tab bar.
11. `ExportPanel`: Download controls.

### R2. Styling and Theming
Implement a premium, dark-mode, glassmorphic aesthetic using standard CSS (no Tailwind). You must use the CSS custom properties already defined in `src/index.css` (e.g., `--bg-primary`, `--bg-glass`, `--accent-primary`).

### R3. Testing
Install and configure Vitest and React Testing Library. Write unit tests for every component to ensure they render correctly and handle user interactions.

## Acceptance Criteria

### Build Verification
- [.] `npm run build` executes successfully with zero TypeScript compilation errors.

### Test Verification
- [ ] Vitest is successfully configured in the Vite project.
- [ ] `npm run test` executes and passes all test suites.
- [ ] Every created component has a corresponding `.test.tsx` file.

### Agent Verification
- [ ] An independent agent reviews the codebase and confirms that components use `backdrop-filter` for glassmorphism and correctly reference the global CSS variables.

## 2026-07-01T22:22:32Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Implement Live Previews and UI Layout improvements

Implement UI/UX improvements to the client-side Image Manipulation Web App.

Working directory: /home/ritesh/Projects/Active/Image_Manipulator
Integrity mode: development

## Requirements

### R1. Implement Live Previews with Toggle
- Modify the application state so that adjusting sliders (e.g., AdjustmentPanel, CompressPanel) updates the `ImagePreview` in real-time.
- Add a visible checkbox/toggle UI element allowing the user to enable or disable the Live Preview feature.

### R2. Fix Workspace Layout
- Adjust the layout in single-image mode. Currently, `ImagePreview` takes up ~70% of the screen.
- Redesign the CSS layout to give the control panels more space (e.g., 50/50 split or a wider fixed sidebar), ensuring the controls aren't squished.

### R3. Fix Upload Zone Layout
- Add a reasonable `max-width` to the `UploadZone` component on the home screen so it doesn't stretch awkwardly across wide monitors.

## Acceptance Criteria

### Verification
- [ ] The app compiles successfully with `npm run build` with zero TypeScript errors.
- [ ] All existing test suites pass with `npm run test` (and tests are updated if the layout changes break existing queries).
- [ ] A checkbox exists in the UI to toggle Live Preview.
- [ ] When Live Preview is enabled, slider adjustments update the image immediately without requiring an explicit "Apply" click.
- [ ] In single-image mode, the control panels take up at least 40-50% of the screen width on desktop layouts.
- [ ] The home screen upload box is visually bounded by a `max-width`.


## 2026-07-02T04:42:26Z

# Teamwork Project Prompt

Perform a comprehensive audit of the Image Manipulator project to identify and fix any functional bugs, UI glitches, or edge cases. The goal is to ensure all recently added features (Draw, Select, Watermark, Filter, Cyber) and core functionalities work flawlessly.

Working directory: /home/ritesh/Projects/Active/Image_Manipulator
Integrity mode: benchmark

## Requirements

### R1. Deep Codebase Audit and Remediation
Perform a manual and systematic audit of the recent "Mega Expansion" features (Draw, Select, Watermark, Filter, Cyber). Identify and fix any functional bugs, unhandled edge cases, or UI glitches. 

### R2. Expand Unit Testing
Expand the existing Vitest unit test suite to improve code coverage, specifically targeting edge cases and complex interactions within the new utility engines.

### R3. Implement End-to-End (E2E) Testing
Introduce and configure an End-to-End testing framework (e.g., Playwright) to systematically test browser UI interactions and visual workflows across the various image manipulation panels.

## Acceptance Criteria

### Comprehensive Verification
- [ ] A systematic review of the codebase is documented, and all identified functional bugs or UI issues are fixed.
- [ ] The Vitest test suite runs successfully with no errors, demonstrating increased test coverage for edge cases.
- [ ] A modern E2E testing framework (e.g. Playwright) is successfully installed and configured.
- [ ] At least one core E2E test suite is implemented covering a critical UI flow, and it passes successfully on the local development server.
