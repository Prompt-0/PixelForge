# Context - Image Manipulation Web App Components

## Existing Codebase
- **Workspace**: `/home/ritesh/Projects/Active/Image_Manipulator`
- **UI Components in `src/components/`**:
  - `UploadZone`: Present.
  - `ImagePreview`: Present. Has missing `liveFilter` prop.
  - `AdjustmentPanel`: Present. Has type discrepancy for `grayscale`, `sepia`, and `invert` (expects booleans in `imageAdjustments.ts` but receives numbers in `AdjustmentPanel.tsx`). Missing `onApply` prop and button.
  - `MetadataEditor`: Present.
  - `OcrPanel`: Present.
  - `ResizePanel`: Present.
- **Missing UI Components**:
  - `Toolbar`
  - `CompressPanel`
  - `ConvertPanel`
  - `ExportPanel`
  - `BatchProcessor`

## Configuration
- `App.tsx` imports all 11 components. The missing ones must be created to resolve build compilation failures.
- Global styles and variables are in `src/index.css`.
- Grid framework and page layout styles are in `src/App.css`.

## Test Setup Requirements
- Packages needed: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
- Configuration additions in `vite.config.ts`, `tsconfig.app.json`, and `package.json`.
- A global `src/setupTests.ts` is required.
