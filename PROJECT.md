# Project: Image Manipulation Web App UI

## Architecture
This is a client-side React 19 web application built with TypeScript, Vite, and CSS.
The app allows users to load, adjust, crop/resize, convert, compress, and run OCR on images completely in-browser.
- **Entry point**: `src/main.tsx` loads `src/App.tsx` and imports `src/index.css`.
- **Global State**: Managed in `src/App.tsx` (selected image, processed image blob, processing states, active tools).
- **Core Utilities**: Resizing, adjustments, conversion, compression, metadata, and OCR logic are modularized in `src/utils/`.
- **UI Components**: Declared in `src/components/`, styled with glassmorphic aesthetic referencing custom CSS properties.

## Code Layout
- `src/components/` — Holds the React components and their corresponding styles:
  - `UploadZone/` — Upload handling
  - `ImagePreview/` — Interactive previewing
  - `AdjustmentPanel/` — Adjustment sliders
  - `MetadataEditor/` — EXIF inspector and editor
  - `OcrPanel/` — Text extraction interface
  - `ResizePanel/` — Width, height, crop, rotation controls
  - `CompressPanel/` — File size target compression
  - `ConvertPanel/` — Format conversion
  - `ExportPanel/` — Output downloading
  - `Toolbar/` — Layout navigation
  - `BatchProcessor/` — Bulk operation dashboard
- `src/utils/` — Holds pure utility files:
  - `helpers.ts` — Common helpers
  - `imageAdjustments.ts` — Brightness, contrast, filters
  - `imageCompressor.ts` — Size compression
  - `imageConverter.ts` — Image format conversion
  - `imageResizer.ts` — Aspect ratio resizing, rotation, flip
  - `metadataHandler.ts` — EXIF reading and writing
  - `ocrEngine.ts` — Tesseract wrapper
- `src/setupTests.ts` — Vitest setup file for jest-dom matchers

## Interface Contracts
All components interface with `App.tsx` or run independently. Key boundaries:
1. **`App` ↔ `Toolbar`**:
   - Switches between single & batch mode.
   - Binds selected tool navigation tab.
2. **`App` ↔ `ImagePreview`**:
   - Shows original vs. processed images side-by-side using a draggable slider.
   - Applies live CSS filter strings for instant feedback.
3. **`App` ↔ `AdjustmentPanel`**:
   - Drives adjustments state and applies canvas-based rendering on click.
4. **`App` ↔ `ResizePanel`**:
   - Adjusts canvas dimensions, rotation, or mirroring.
5. **`App` ↔ `CompressPanel`**:
   - Triggers binary search for target file size compression.
6. **`App` ↔ `ConvertPanel`**:
   - Selects target output format and triggers conversion.
7. **`App` ↔ `ExportPanel`**:
   - Compares sizes and triggers download of final processed blob.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Testing Infrastructure | Install vitest, RTL, config vite.config.ts, tsconfig.app.json, setupTests.ts | None | PLANNED |
| M2 | Style and Theming Audit | Verify global CSS usages and glassmorphism styling | M1 | PLANNED |
| M3 | Fix/Update Existing Components | Resolve AdjustmentPanel and ImagePreview mismatches | M1 | PLANNED |
| M4 | Implement Missing Components | Build Toolbar, CompressPanel, ConvertPanel, ExportPanel, BatchProcessor | M2, M3 | PLANNED |
| M5 | Component Unit Testing | Write and execute *.test.tsx test suites for all 11 components | M4 | PLANNED |
| M6 | End-to-End Verification | Verify npm run build and npm run test pass successfully | M5 | PLANNED |
