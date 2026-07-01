# Implementation Plan — Live Previews and Layout Fixes

This plan outlines the implementation of Live Previews with Toggle (R1), Workspace Layout fixes (R2), and Upload Zone Layout fixes (R3).

## Milestones

| Milestone | Target | Description | Verification Method |
|-----------|--------|-------------|---------------------|
| **M1** | Code Changes | Implement the Live Preview state/toggle, debounced live adjustments/compression, 45% workspace sidebar layout, and max-width UploadZone. | Code review, manual inspection, build check |
| **M2** | Test Updates | Update unit tests to check for the Live Preview toggle, real-time update logic, and layout requirements. | Run `npm run test` and verify 100% pass |
| **M3** | Final Verification | Verify that `npm run build` succeeds and the Forensic Auditor gives a clean verdict. | Run audit tool |

---

## Detailed Specifications

### 1. R1: Live Previews with Toggle
- **Toggle State**: Add a state variable `livePreviewEnabled` (boolean, defaulted to `true`) in `src/App.tsx`.
- **Toggle UI**: Add a glassmorphic toggle/checkbox container at the top of the `.app-side-panel` in `src/App.tsx`.
  - Use Lucide icon or simple styled input checkbox.
  - Label: "Live Preview".
- **Adjustment Panel Real-time Update**:
  - In `src/App.tsx`, implement a `useEffect` that listens to `adjustments` and `originalFile`.
  - When `livePreviewEnabled` is true, apply adjustments to the canvas and update `processedBlob` using a debounced handler (e.g., 150ms).
  - To prevent double-application of CSS filters in `ImagePreview`:
    - Track the source tool that generated `processedBlob` (e.g., `processedSourceTool: 'adjust' | 'compress' | 'resize' | ...`).
    - If `processedSourceTool === 'adjust'`, do not pass the `liveFilter` string to `ImagePreview` (or pass `undefined`).
    - If `livePreviewEnabled` is false, fallback to manual "Apply" button and pass `liveFilter={liveFilterString}` to CSS preview layer.
- **Compress Panel Real-time Update**:
  - In `src/components/CompressPanel/CompressPanel.tsx`, add `livePreviewEnabled` and `onChange` to props.
  - Add a `useEffect` inside `CompressPanel` to trigger `onChange` with current options on any state change.
  - In `src/App.tsx`, capture `onChange` in `CompressPanel` and trigger a debounced compression handler (e.g., 200ms) to update `processedBlob` and set `processedSourceTool` to `'compress'`.
  - Pass `estimatedSize={processedSourceTool === 'compress' ? processedInfo?.size : undefined}` from `App.tsx` back to `CompressPanel` so the "Estimated Output" size updates dynamically in real-time.

### 2. R2: Workspace Layout
- Update `src/App.css`:
  - Change `.app-side-panel` width to `45%` (on desktop screens, e.g. inside a media query or by default on desktop layout).
  - Ensure it has a reasonable `min-width` (e.g. `380px`).

### 3. R3: Upload Zone Layout
- Update `src/components/UploadZone/UploadZone.css`:
  - Set `.upload-zone` `max-width` to `640px` and `width: 100%` so it centers and is bounded on wide screens.

---

## Delegation Strategy
1. Dispatch `teamwork_preview_worker` to apply all code changes (M1) and verify with build/test.
2. Dispatch `teamwork_preview_reviewer` to review code modifications.
3. Run `teamwork_preview_auditor` to audit the integrity and correctness of the solution.
