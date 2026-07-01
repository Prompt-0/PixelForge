# Handoff Report: Codebase Analysis and Testing Setup

This report contains a read-only investigation and analysis of the PixelForge Image Manipulator codebase. It details the utility functions, existing components, layout, state integration, missing components, interface conflicts, and Vitest testing setup.

---

## 1. Observation

### Utility Files in `src/utils/`
The project contains 7 utility files in `src/utils/` that export the following helper functions and interfaces:

1. **`src/utils/helpers.ts`**
   - `fileToDataUrl(file: File): Promise<string>`: Converts a File object to a base64 data URL.
   - `dataUrlToBlob(dataUrl: string): Blob`: Converts a base64 data URL to a Blob.
   - `blobToFile(blob: Blob, filename: string): File`: Wraps a Blob as a File.
   - `formatFileSize(bytes: number): string`: Formats a byte size into KB/MB.
   - `getFileExtension(format: string): string`: Maps MIME types (e.g. `image/jpeg`) to extensions (`jpg`).
   - `createImageElement(source: string | File): Promise<HTMLImageElement>`: Creates a pre-loaded HTML image element.
   - `downloadBlob(blob: Blob, filename: string): void`: Prompts browser file download of a Blob.
   - `generateOutputFilename(originalName: string, suffix: string, newExtension?: string): string`: Appends suffix and optionally replaces the extension.

2. **`src/utils/imageAdjustments.ts`**
   - Interface `AdjustmentOptions`:
     ```typescript
     export interface AdjustmentOptions {
       brightness?: number;   // -100 to 100
       contrast?: number;     // -100 to 100
       saturation?: number;   // -100 to 100
       exposure?: number;     // -100 to 100
       temperature?: number;  // -100 to 100
       sharpness?: number;    // 0 to 100
       blur?: number;         // 0 to 20
       grayscale?: boolean;   // boolean
       sepia?: boolean;       // boolean
       invert?: boolean;      // boolean
       hue?: number;          // 0 to 360
       vignette?: number;     // 0 to 100
     }
     ```
   - `applyAdjustments(file: File, adjustments: AdjustmentOptions): Promise<Blob>`: Applies CSS filters and pixel-level algorithms (exposure, temperature, unsharp mask, and vignette radial overlay) using Canvas.
   - `getDefaultAdjustments(): AdjustmentOptions`: Returns neutral values.
   - `buildFilterString(adjustments: AdjustmentOptions): string`: Builds a CSS filter string (e.g., `brightness(1.2) contrast(0.9)`).

3. **`src/utils/imageCompressor.ts`**
   - Interface `CompressOptions`:
     ```typescript
     export interface CompressOptions {
       targetSizeKB?: number;
       quality?: number;
       format: 'image/jpeg' | 'image/webp' | 'image/png';
       maxWidth?: number;
       maxHeight?: number;
       stripMetadata?: boolean;
     }
     ```
   - `compressImage(file: File, options: CompressOptions): Promise<Blob>`: Performs dimension scaling and format compression. If `targetSizeKB` is supplied, it performs a binary search (up to 15 steps) on image quality to match the target.
   - `estimateCompressedSize(file: File, quality: number, format: string): Promise<number>`: Helper to check compressed blob size for previewing.

4. **`src/utils/imageConverter.ts`**
   - Interface `ConvertOptions`:
     ```typescript
     export interface ConvertOptions {
       targetFormat: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | 'image/bmp';
       quality?: number;
       stripMetadata?: boolean;
     }
     ```
   - Interface `FormatInfo`: `{ format: string; name: string; lossy: boolean }`.
   - `convertImage(file: File, options: ConvertOptions): Promise<Blob>`: Converts format, automatically filling a white background for non-transparent targets like JPEG or BMP.
   - `loadHeicImage(file: File): Promise<Blob>`: Integrates `heic2any` to convert HEIC/HEIF to PNG.
   - `getSupportedFormats(): FormatInfo[]`: Array of MIME/name metadata.
   - `getFileFormat(file: File): Promise<string>`: Detects mime type using file header bytes (magic numbers) with fallback to file name.
   - `isHeicFile(file: File): Promise<boolean>`: Helper that inspects magic bytes for HEIC formats.

5. **`src/utils/imageResizer.ts`**
   - Interface `ResizeOptions`:
     ```typescript
     export interface ResizeOptions {
       width?: number;
       height?: number;
       maintainAspectRatio?: boolean;
       resizeMode: 'contain' | 'cover' | 'stretch' | 'exact';
       backgroundColor?: string;
     }
     ```
   - `resizeImage(file: File, options: ResizeOptions): Promise<Blob>`: Resizes the image. Halves the canvas size repeatedly (multi-step downscaling) when reducing dimensions by >50% to prevent aliasing.
   - `cropImage(imageDataUrl: string, cropRect: { x: number; y: number; width: number; height: number }): Promise<Blob>`: Crops an image to coordinates.
   - `rotateImage(file: File, degrees: number): Promise<Blob>`: Clockwise rotation.
   - `flipImage(file: File, direction: 'horizontal' | 'vertical'): Promise<Blob>`: Vertical/Horizontal mirroring.
   - `getImageDimensions(file: File): Promise<{ width: number; height: number }>`: Reads pixel sizes.

6. **`src/utils/metadataHandler.ts`**
   - Interface `MetadataResult`: Struct containing EXIF, IPTC, XMP, ICC, and GPS objects.
   - `readMetadata(file: File): Promise<MetadataResult>`: Reads metadata utilizing `exifr`.
   - `stripMetadata(file: File, fieldsToStrip?: string[]): Promise<Blob>`: Strips all metadata by canvas redraw, or selectively strips tags using `piexifjs`.
   - `updateMetadata(file: File, updates: Record<string, any>): Promise<Blob>`: Modifies/injects EXIF tags using `piexifjs`.
   - `metadataToJson(metadata: MetadataResult): string`: Converts metadata to JSON string.
   - `getMetadataFields(): MetadataFieldCategory[]`: Categories and field descriptions.

7. **`src/utils/ocrEngine.ts`**
   - Interface `OcrResult`: `{ text: string; confidence: number; blocks: OcrBlock[] }`.
   - `initOcrEngine(lang?: string): Promise<void>`: Inits a `tesseract.js` worker.
   - `recognizeText(imageSource: string | Blob, region?: { x: number; y: number; width: number; height: number }): Promise<OcrResult>`: Evaluates image or region.
   - `getAvailableLanguages(): OcrLanguage[]`: Supported language profiles.
   - `terminateOcrEngine(): Promise<void>`: Disposes worker.

---

### Configuration Files and Manifests
1. **`index.html`**
   - References font imports (`Inter` from Google Fonts), description meta tags emphasizing client-side local privacy, and the entry script `/src/main.tsx`. Contains `<div id="root"></div>`.
2. **`package.json`**
   - **React Version**: `react: ^19.2.7` and `react-dom: ^19.2.7`.
   - **Dependencies**: `exifr: ^7.1.3`, `heic2any: ^0.0.4`, `jszip: ^3.10.1`, `lucide-react: ^1.23.0`, `piexifjs: ^1.0.6`, `tesseract.js: ^7.0.0`.
   - **Build Tool**: `vite: ^8.1.1` with `@vitejs/plugin-react: ^6.0.3` and typescript compiler `typescript: ~6.0.2`.
   - **Scripts**: `dev`, `build`, `lint` (`oxlint`), `preview`. No `test` script exists.
3. **`tsconfig*.json`**
   - `tsconfig.json` acts as a solution file containing references to `tsconfig.app.json` and `tsconfig.node.json`.
   - `tsconfig.app.json` target is `es2023`, moduleResolution is `bundler`, and it has linting rules. It includes `src`.

---

### Existing Components Directory Structure (`src/components/`)
A folder-by-folder list of `src/components/` shows only **6 components** exist in physical folders:
1. `src/components/AdjustmentPanel/` (`AdjustmentPanel.tsx`, `AdjustmentPanel.css`)
2. `src/components/ImagePreview/` (`ImagePreview.tsx`, `ImagePreview.css`)
3. `src/components/MetadataEditor/` (`MetadataEditor.tsx`, `MetadataEditor.css`)
4. `src/components/OcrPanel/` (`OcrPanel.tsx`, `OcrPanel.css`)
5. `src/components/ResizePanel/` (`ResizePanel.tsx`, `ResizePanel.css`)
6. `src/components/UploadZone/` (`UploadZone.tsx`, `UploadZone.css`)

The following **5 components** are imported in `src/App.tsx` but do not exist anywhere in the filesystem:
1. `Toolbar` (`src/components/Toolbar/Toolbar`)
2. `CompressPanel` (`src/components/CompressPanel/CompressPanel`)
3. `ConvertPanel` (`src/components/ConvertPanel/ConvertPanel`)
4. `ExportPanel` (`src/components/ExportPanel/ExportPanel`)
5. `BatchProcessor` (`src/components/BatchProcessor/BatchProcessor`)

*Note: This results in immediate compilation failure on building the project in its current state.*

---

### Global Styles and Variables
1. **`src/index.css`**
   - Declares design system tokens on `:root` including color variables (`--bg-primary: #0a0a0f`, `--accent-gradient: linear-gradient(135deg, #8b5cf6, #06b6d4)`), border radiuses, z-index layers, spacing, and typography.
   - Defines body backgrounds with radial visual glows, scrollbar overrides, button variants (`.btn-primary`, `.btn-secondary`, `.btn-ghost`), form styles (`.input`, `.select`, toggle switches), loading animations, and tooltip descriptors.
2. **`src/App.css`**
   - Governs the application grid framework:
     - `.app` is a flex container.
     - `.app-workspace` is a flexbox laying out the `.app-canvas-area` and `.app-side-panel`.
     - Side panel defaults to `--sidebar-width: 380px`. Under `1024px` viewport width, it wraps vertically.
     - Includes styles for `.processing-overlay` and `.toast-container`.

---

### App Core Integration (`src/App.tsx`)
`src/App.tsx` establishes the orchestrator containing:
- State tracks: `mode` (single vs batch), `activeTab` (resize, compress, convert, adjust, metadata, ocr).
- Image pipelines: `originalFile`, `originalDataUrl`, `originalInfo`, `processedBlob`, `processedDataUrl`, and `processedInfo`.
- Utility hooks: runs HEIC conversions on file drop, schedules canvas alterations, updates EXIF metadata edits, initializes OCR worker threads, and provides download and reset routines.

---

## 2. Logic Chain

1. **Compilation Errors**:
   - `src/App.tsx` imports `Toolbar` (line 3), `CompressPanel` (line 10), `ConvertPanel` (line 11), `ExportPanel` (line 12), and `BatchProcessor` (line 13).
   - A `list_dir` of `src/components/` yields only 6 directories; the 5 imported folders are absent.
   - **Conclusion**: The application cannot compile or run in dev mode until skeleton structures are created for these 5 missing components.

2. **Inconsistency - CSS adjustments types**:
   - `src/utils/imageAdjustments.ts` specifies the adjustments `grayscale`, `sepia`, and `invert` as `boolean` types (lines 28–33).
   - In contrast, `src/components/AdjustmentPanel/AdjustmentPanel.tsx` declares `grayscale`, `sepia`, and `invert` in `AdjustmentOptions` as `number` types from 0 to 100 (lines 24–26).
   - **Conclusion**: This creates a type conflict. When these number fields are passed to `applyAdjustments` or `buildFilterString`, typescript will flag it, or they will be evaluated as truthy booleans, causing incorrect CSS rules like `grayscale(1)` instead of progressive values like `grayscale(0.5)`.

3. **Inconsistency - `AdjustmentPanel` Apply Button & `onApply` prop**:
   - `src/App.tsx` passes `onApply={handleApplyAdjustments}` to `<AdjustmentPanel />` (line 369).
   - However, `AdjustmentPanelProps` (line 95 in `AdjustmentPanel.tsx`) does not accept `onApply`, nor is an "Apply" button rendered inside the component.
   - **Conclusion**: The user has no UI element to trigger the baking of adjustments into a processed Blob unless the component is updated to receive and invoke `onApply`.

4. **Inconsistency - `ImagePreview` missing `liveFilter` prop**:
   - `src/App.tsx` renders `<ImagePreview ... liveFilter={activeTab === 'adjust' ? liveFilterString : undefined} />` (line 421).
   - However, `ImagePreviewProps` in `ImagePreview.tsx` (lines 12–17) does not list `liveFilter`, and the component does not apply this filter CSS string on its `<img>` elements.
   - **Conclusion**: Live preview of adjustments via CSS filter is broken because `ImagePreview` ignores the `liveFilter` prop.

5. **Vitest Setup Needs**:
   - `package.json` contains no test dependencies (`vitest`, `jsdom`, or `@testing-library/react`) or scripts.
   - **Conclusion**: To establish a test suite, we must install packages that support React 19 and configure Vitest in `vite.config.ts`.

---

## 3. Caveats

- **Network-Restricted OCR**: `tesseract.js` relies on loading translation files (`traineddata`) from cdns. In offline or CODE_ONLY environments, it will throw network timeout errors unless configured to load files from local asset locations.
- **Large Image Heap Overloads**: Processing large images in browser canvases can trigger heap memory exhaustion, particularly on mobile browsers. This is not mitigated in the current core helpers.

---

## 4. Conclusion

Below is the implementation plan and detailed requirements.

### UI Components Specification Matrix

| Component | Props | Essential Imports | Rationale / User Interaction | State Connection |
|---|---|---|---|---|
| **`Toolbar`** *(Missing)* | `activeTab: TabId`, `onTabChange: (tab: TabId) => void`, `mode: AppMode`, `onModeChange: (mode: AppMode) => void`, `hasImage: boolean`, `onClear: () => void` | Lucide React icons | Switches between single-image & batch modes. Selects the active sidebar tool tab. Disables tools when no image is loaded. Reset triggers workspace cleanup. | Updates `activeTab`, `mode`, and triggers `handleClear` in `App.tsx`. |
| **`UploadZone`** *(Existing)* | `onFileSelect: (files: File[]) => void`, `multiple?: boolean`, `accept?: string` | `Upload`, `Image`, `FileImage` | Renders file dragover region. Clicking opens system file selector. Validates files are images, handles HEIC formats. | Calls parent `handleFileSelect` callback with array of Files. |
| **`ImagePreview`** *(Existing)* | `originalSrc: string`, `processedSrc?: string`, `originalInfo: ImageInfo`, `processedInfo?: ImageInfo`, `liveFilter?: string` *(Needs Addition)* | Zoom/Fit icons | Displays image checkerboard workspace. If `processedSrc` exists, enables split comparison slider. Integrates zoom/fit. Needs to apply `liveFilter` style to image preview element. | Displays file info, binds mouse-drag state, reads live CSS adjustments. |
| **`AdjustmentPanel`** *(Existing)* | `adjustments: AdjustmentOptions`, `onChange: (adjustments: AdjustmentOptions) => void`, `onApply: () => void` *(Needs Addition)* | `Sun`, `Palette`, `Sparkles`, `RotateCcw` | Displays collapsible sections with sliders for Brightness, Exposure, Blur, Contrast, Saturation, Temp, Hue, Vignette, Sharpness, Grayscale, Sepia, and Invert. Needs "Apply" button at bottom. | Fires `onChange` on slider drag, updates live CSS filters. Triggers parent canvas bake on `onApply`. |
| **`MetadataEditor`** *(Existing)* | `metadata: MetadataResult \| null`, `onStripFields: (fields: string[]) => void`, `onUpdateFields: (updates: Record<string, any>) => void`, `onExportJson: () => void` | `Search`, `Trash2`, `Download` icons | Displays metadata fields categorized (Camera, Date, GPS, etc.). Filter search input. Checkbox multi-select for stripping. Inputs allow inline value overrides. | Pulls metadata state, triggers strips/updates, calls JSON exporter. |
| **`OcrPanel`** *(Existing)* | `imageSrc: string \| null`, `isProcessing: boolean`, `result: OcrResult \| null`, `onExtract: (lang: string) => void` | `ScanText`, `Copy` icons | Selecting OCR language. "Extract" fires Tesseract extraction. Extracted textbox includes copy button and block confidence stats list. | Reads image paths, drives loading overlays, calls extraction script. |
| **`ResizePanel`** *(Existing)* | `originalWidth: number`, `originalHeight: number`, `onResize: (options: ResizeOptions) => void`, `onRotate: (degrees: number) => void`, `onFlip: (direction: 'horizontal' \| 'vertical') => void` | `Maximize`, `Link`, presets list | Size text inputs (Width, Height) with optional lock aspect ratio link. Choice dropdown of preset layouts. Rotation slider and flip commands. | Fires canvas modifications for dimension, rotation, and mirror axes. |
| **`CompressPanel`** *(Missing)* | `originalSize: number`, `onCompress: (options: CompressOptions) => void` | `CompressOptions`, `estimateCompressedSize` from imageCompressor | Input box for target KB size or percentage slide. Formats choice card (JPEG/PNG/WebP). Dimensions limiter max width/height inputs. Strips metadata toggle. Shows estimated size. | Triggers binary search compression methods based on size configs. |
| **`ConvertPanel`** *(Missing)* | `currentFormat: string`, `onConvert: (options: ConvertOptions) => void` | `ConvertOptions`, `getSupportedFormats` | Select target format (JPEG, PNG, WebP, AVIF, BMP). Details format traits. Quality slider (0-100%) visible only for lossy. Metadata strip checkbox. | Fires conversion routine passing target format and compression. |
| **`ExportPanel`** *(Missing)* | `outputBlob: Blob`, `originalFile: File`, `outputInfo?: ImageInfo`, `onDownload: () => void` | `formatFileSize` from helpers | Displays size reduction comparison metrics. Previews output filename. Single primary "Download Image" CTA button. | Renders after blob results are generated. Calls `handleDownload`. |
| **`BatchProcessor`** *(Missing)* | *(None)* | `JSZip`, file utilities, processors | Bulk file upload list showing queue. Operational dropdown (Resize, Compress, Convert, Strip). Processing queue lists statuses. Download ZIP output. | Runs operations sequentially on a local array of files, constructs ZIP. |

---

### Testing Setup & Configurations

#### 1. devDependencies to Install
Run the following command to install Vitest and Testing Library packages:
```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

*Note: Since the codebase uses React 19, `@testing-library/react` must be version 16.0.0 or higher.*

#### 2. Suggested `package.json` Updates
Add the following scripts to `package.json`:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "oxlint",
  "preview": "vite preview",
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

#### 3. Suggested `vite.config.ts` Updates
Configure Vitest to compile tests inside the Vite lifecycle. Add the `/// <reference types="vitest" />` comment to allow TypeScript validation of Vitest configs:
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
  },
})
```

#### 4. Suggested `src/setupTests.ts` Creation
Create `src/setupTests.ts` to extend jest-dom matchers automatically before tests execute:
```typescript
import '@testing-library/jest-dom';
```

#### 5. TypeScript Typings Setup
Ensure tests recognizing Vitest globals compiles without TS flags. In `tsconfig.app.json`, append `"vitest/globals"` to compiler options types:
```json
"types": ["vite/client", "vitest/globals"]
```
Alternatively, if preferring explicit imports over global namespace injection, test files can explicitly import methods:
```typescript
import { describe, test, expect, beforeAll } from 'vitest';
```

---

## 5. Verification Method

To verify project configurations and component states:
1. **Directory Inspection**: Check that skeleton component files are generated inside `src/components/` under:
   - `Toolbar/Toolbar.tsx`
   - `CompressPanel/CompressPanel.tsx`
   - `ConvertPanel/ConvertPanel.tsx`
   - `ExportPanel/ExportPanel.tsx`
   - `BatchProcessor/BatchProcessor.tsx`
2. **Typescript Compilation Check**: Run `npm run build` or `npx tsc -b`. Verify there are no import failures, parameter mismatches, or missing prop definition types.
3. **Vitest Runner Check**: Run `npm run test` or `npx vitest run`. Test runner must boot in a jsdom environment, execute any created `*.test.tsx` or `*.test.ts` test files, and exit correctly.
