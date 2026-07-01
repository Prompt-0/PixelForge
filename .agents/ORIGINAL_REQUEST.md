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

