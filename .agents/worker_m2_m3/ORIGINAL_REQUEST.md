## 2026-07-02T02:26:56Z
You are the Component Implementation and Fixes Worker.
Your working directory is /home/ritesh/Projects/Active/Image_Manipulator/.agents/worker_m2_m3.
Your task is to fix type and implementation discrepancies in existing components and implement the 5 missing components, ensuring the project builds successfully and passes its test suite.

Here is the exact work required:

1. Update `src/components/AdjustmentPanel/AdjustmentPanel.tsx` and its CSS if needed:
   - Accept `onApply: () => void` (or `onApply?: () => void`) in `AdjustmentPanelProps`.
   - Add an "Apply Adjustments" button at the bottom of the adjustment panel (using glassmorphic styling, e.g., `.btn-primary` or `.btn-secondary` or a custom glass button matching the panel) that calls `onApply`.
   - Ensure sliders are mapped correctly (the sliders for brightness, contrast, exposure, saturation, temperature, hue, sharpness, blur, vignette, grayscale, sepia, invert already map numbers 0-100 to state, which is correct since `imageAdjustments.ts` expects numbers, so ensure no typescript compilation errors exist here).

2. Update `src/components/ImagePreview/ImagePreview.tsx`:
   - Accept `liveFilter?: string` in `ImagePreviewProps`.
   - Apply this `liveFilter` style to the preview img elements (specifically the single preview image and the processed overlay image in comparison mode) using `style={{ transform: `scale(${zoom})`, filter: liveFilter || 'none' }}`.

3. Update `src/App.tsx`:
   - In `App.tsx` (around lines 416-421), pass the `liveFilter` prop to `<ImagePreview>` as:
     `liveFilter={activeTab === 'adjust' ? liveFilterString : undefined}` (or simply `liveFilter={liveFilterString}`).

4. Implement the following 5 missing components inside `src/components/`:
   - **`Toolbar`** (`src/components/Toolbar/Toolbar.tsx` and `src/components/Toolbar/Toolbar.css`):
     - Props:
       `activeTab: string`, `onTabChange: (tab: string) => void`, `mode: 'single' | 'batch'`, `onModeChange: (mode: 'single' | 'batch') => void`, `hasImage: boolean`, `onClear: () => void`
     - Renders a clean glassmorphic bar (e.g. at the top or left as defined in index.css and layout, height `var(--toolbar-height)`).
     - Renders a logo/title ("PixelForge").
     - Renders a mode toggle or switcher between "Single Image" and "Batch Processing".
     - Renders navigation tab buttons for the single-image tools: Resize, Compress, Convert, Adjust, Metadata, OCR. These tabs should only be enabled when `mode === 'single'` and `hasImage` is true.
     - Renders a "Clear/Reset" button (with a trash icon or clear text) that calls `onClear` when `hasImage` is true.
   - **`CompressPanel`** (`src/components/CompressPanel/CompressPanel.tsx` and `src/components/CompressPanel/CompressPanel.css`):
     - Props:
       `originalSize: number`, `onCompress: (options: CompressOptions) => void`
     - Allows setting target file size (KB), format ('image/jpeg' | 'image/webp' | 'image/png'), quality slider (0-100%), max width/height limits, and metadata stripping.
     - Calls `onCompress` on click of "Compress" button.
   - **`ConvertPanel`** (`src/components/ConvertPanel/ConvertPanel.tsx` and `src/components/ConvertPanel/ConvertPanel.css`):
     - Props:
       `currentFormat: string`, `onConvert: (options: ConvertOptions) => void`
     - Target formats: JPEG, PNG, WebP, AVIF, BMP.
     - Quality slider (0-100%) visible only for lossy formats (JPEG, WebP, AVIF).
     - Strip metadata toggle.
     - Calls `onConvert` on click of "Convert" button.
   - **`ExportPanel`** (`src/components/ExportPanel/ExportPanel.tsx` and `src/components/ExportPanel/ExportPanel.css`):
     - Props:
       `outputBlob: Blob`, `originalFile: File`, `outputInfo?: ImageInfo`, `onDownload: () => void`
     - Displays original vs processed sizes and the percentage reduction.
     - Displays output filename.
     - prominent "Download Image" CTA button calling `onDownload`.
   - **`BatchProcessor`** (`src/components/BatchProcessor/BatchProcessor.tsx` and `src/components/BatchProcessor/BatchProcessor.css`):
     - Props: None (rendered as `<BatchProcessor />`).
     - Internal states: file list (queue of uploaded Files, each with its process status, name, size, type, progress, and processedBlob).
     - Drag-and-drop file upload zone (or click to select).
     - Configuration section: choice of operation (Resize, Compress, Convert, Strip Metadata) and their respective parameters.
     - A "Process Queue" button that runs the chosen operation on all pending files in the queue using the respective helper utilities:
       * `resizeImage(file, options)` from `src/utils/imageResizer`
       * `compressImage(file, options)` from `src/utils/imageCompressor`
       * `convertImage(file, options)` from `src/utils/imageConverter`
       * `stripMetadata(file)` from `src/utils/metadataHandler`
     - Individual progress / status indicators for files in queue.
     - A "Download all as ZIP" button that creates and triggers download of a ZIP containing all processed files using `JSZip` (which is already imported and available).

5. Verify that `npm run build` compiles with zero typescript compilation errors.
6. Verify that `npm run test:run` executes and passes successfully.
7. Write your `handoff.md` and `progress.md` files in your working directory (.agents/worker_m2_m3/).
