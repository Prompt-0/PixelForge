# Plan - Image Manipulation Web App Components

This plan outlines the milestones and steps required to build, style, and test the 11 React UI components for the Image Manipulation Web App, and configure the Vitest/React Testing Library setup.

## Milestones

### Milestone 1: Test Infrastructure Setup
- **Status**: DONE
- **Tasks**:
  1. Install `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` as devDependencies. (Done)
  2. Update `package.json` with test scripts (`test`, `test:run`). (Done)
  3. Configure `vite.config.ts` to include Vitest settings. (Done)
  4. Create `src/setupTests.ts` with jest-dom imports. (Done)
  5. Update `tsconfig.app.json` with `"vitest/globals"` in types. (Done)
  6. Verify setup with a dummy test. (Done)
- **Verification**: `package.json` updated; dummy test exists in `src/components/__tests__/dummy.test.tsx`.

### Milestone 2: Fix Existing Components
- **Status**: DONE
- **Tasks**:
  1. Address `AdjustmentPanel` type discrepancy (booleans vs numbers for grayscale/sepia/invert) and add `onApply` callback prop and button. (Done)
  2. Update `ImagePreview` to accept and apply the `liveFilter` CSS style prop to the image element. (Done)
  3. Verify existing components (`UploadZone`, `MetadataEditor`, `OcrPanel`, `ResizePanel`) are compiling and integrate correctly with App.tsx. (Done)
- **Verification**: Linked in App.tsx.

### Milestone 3: Implement Missing Components
- **Status**: DONE
- **Tasks**:
  1. Implement `Toolbar` (Mode selector, tab selector, reset/clear). (Done)
  2. Implement `CompressPanel` (Target size compression UI, formats, width/height limits). (Done)
  3. Implement `ConvertPanel` (Target format selector, quality slider, strip metadata toggle). (Done)
  4. Implement `ExportPanel` (Size comparison, filename preview, download button). (Done)
  5. Implement `BatchProcessor` (Multi-file list, actions dropdown, progress, ZIP exporter). (Done)
- **Verification**: All 5 components exist in `src/components/` and are fully integrated.

### Milestone 4: Write Component Test Suites
- **Status**: DONE
- **Tasks**:
  1. Write unit and interaction tests for each of the 11 components. (Done)
  2. Ensure high coverage, testing initial renders, user changes (sliders, text inputs, clicks), and callbacks. (Done)
- **Verification**: 11 unit test suites created in `src/components/__tests__/`.

### Milestone 5: Full E2E Integration and Forensic Audit
- **Status**: DONE
- **Tasks**:
  1. Run a full clean build and run all tests. (Done)
  2. Dispatch Forensic Auditor to check for implementation integrity (no hardcoding, clean implementation). (Done)
- **Verification**: Forensic Auditor reports CLEAN. Build compilation and test runs successfully pass (67/67 tests passed).
