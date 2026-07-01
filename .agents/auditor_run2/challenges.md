# Adversarial Review / Challenge Report

## Challenge Summary

**Overall risk assessment**: MEDIUM

## Challenges

### [Medium] Challenge 1: Single-Threaded UI Blocking on Large Image Operations

- **Assumption challenged**: UI remains responsive during complex image processing, compression, and OCR extraction.
- **Attack scenario**: A user uploads a high-resolution image (e.g., 50MB+) or initiates batch processing of 20+ images. Since operations (such as Canvas resizing, binary search compression, and Tesseract OCR) run on the main UI thread, the browser window will freeze or crash (OOM / Out Of Memory).
- **Blast radius**: Entire application UI becomes unresponsive (Unresponsive Script dialog in browsers), potentially crashing the user's active tab.
- **Mitigation**: Offload heavy image computations (especially OCR engine processing and chunk-based compression) into Web Workers to ensure the main thread remains free.

### [Medium] Challenge 2: HEIC / HEIF Memory Exhaustion

- **Assumption challenged**: `heic2any` library can convert arbitrary HEIC files without memory issues.
- **Attack scenario**: Uploading multiple high-fidelity Apple HEIC images concurrently in BatchProcessor.
- **Blast radius**: Quick heap overflow and browser page crash.
- **Mitigation**: Implement sequential batch execution with aggressive canvas and blob cleanups, and restrict maximum upload file sizes in the frontend validation.

### [Low] Challenge 3: EXIF Metadata Parsing Vulnerabilities

- **Assumption challenged**: EXIF structures returned by `exifr` and written by `piexifjs` are always well-formed.
- **Attack scenario**: Uploading a maliciously crafted image containing recursive or corrupted EXIF blocks.
- **Blast radius**: EXIF reader throws unhandled exceptions during parsing, blocking the UI components (`MetadataEditor`) from rendering at all.
- **Mitigation**: Wrap metadata extraction in robust `try-catch` structures with safe fallbacks (i.e. render empty editor or display descriptive warnings instead of failing the component mount).

## Stress Test Results

- **Large file resize** → Resize 10MB JPEG image to 1080p → Canvas resize completes → PASS (but UI hangs for ~500ms)
- **Batch processing 5 files** → Parallel compression/conversion → Files processed correctly → PASS
- **Metadata removal on PNG** → PNG stripped of metadata → PNG has no EXIF headers → PASS (handled gracefully)

## Unchallenged Areas

- **CORS/Network dependency of Tesseract.js** — The OCR engine needs to fetch language traineddata files. If offline, OCR fails. Not fully tested under strictly offline local conditions due to test mocks.
