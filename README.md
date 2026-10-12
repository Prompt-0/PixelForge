# PixelForge

[![Live Demo](https://img.shields.io/badge/demo-live%20app-success?style=for-the-badge&logo=github)](https://prompt-0.github.io/PixelForge/)
[![Tests](https://img.shields.io/badge/tests-89%2F89%20passing-brightgreen?style=for-the-badge&logo=vitest)](https://github.com/Prompt-0/PixelForge)
[![E2E](https://img.shields.io/badge/e2e-playwright%20verified-blue?style=for-the-badge&logo=playwright)](https://github.com/Prompt-0/PixelForge)
[![Stack](https://img.shields.io/badge/stack-React%2019%20•%20TypeScript%20•%20Vite-61dafb?style=for-the-badge)](https://github.com/Prompt-0/PixelForge)
[![Privacy](https://img.shields.io/badge/privacy-100%25%20client--side-orange?style=for-the-badge)](https://prompt-0.github.io/PixelForge/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

A privacy-first, 100% browser-native image editing, forensic analysis, and neural processing studio. PixelForge runs entirely inside the client sandbox using WebAssembly and Web Workers—zero images, buffers, or metadata are ever uploaded to a remote server.

### 🌐 [Launch Live Demo](https://prompt-0.github.io/PixelForge/)

---

## ⚡ Key Capabilities

### 1. Neural & Vision Tools (100% Offline)
- **Local AI Background Removal**: Executes the `briaai/RMBG-1.4` neural network locally via `@xenova/transformers` in WebAssembly/Web Workers. Runs offline after initial cache.
- **Optical Character Recognition (OCR)**: Extracts text blocks and confidence scores directly from document images using `Tesseract.js`.
- **Magic Wand Selection**: Stack-based flood fill algorithm with dynamic color distance thresholding for contiguous pixel segment isolation.

### 2. Digital Forensics & Steganography
- **LSB Steganography**: Encodes and decodes encrypted payload strings directly into image least-significant bits.
- **Error Level Analysis (ELA)**: Resaves at calibrated quantization tables to highlight compression inconsistencies and detect digital splicing or manipulation.
- **Payload & Script Scanner**: Scans binary buffers for concealed executable signatures, shell scripts, or embedded polyglots.
- **EXIF Scrubbing**: Deep-cleans image headers, stripping geolocation, camera serial numbers, and device tags before export.

### 3. Professional Editing & Enhancements
- **Color & Channel Analytics**: Real-time RGB and Luma tonal distribution histograms rendered on high-frequency canvas loops.
- **Parametric Adjustments**: Brightness, Contrast, Saturation, Exposure, Hue, and Gaussian blur with real-time preview toggling.
- **Watermarking & Compositing**: Alpha-blended text and logo overlays with rotation, positioning matrix, and opacity controls.
- **Vector Annotations & Redaction**: Freehand brush strokes, geometric primitives, and localized blur/censorship masks with undo/redo history.
- **Format Conversion & Compression**: Live multi-format transcode to JPEG, PNG, WebP, AVIF, and BMP with targeted compression quality sliders.

---

## 🏛️ Architecture & Verification

```
┌──────────────────────────────────────────────────────────┐
│                   React 19 Workspace UI                  │
└──────────────┬────────────────────────────┬──────────────┘
               │                            │
   ┌───────────▼──────────┐      ┌──────────▼───────────┐
   │ Canvas Manipulation  │      │   Forensic Engine    │
   │ • Image adjustments  │      │ • LSB steganography  │
   │ • Watermark & Draw   │      │ • ELA error analysis │
   │ • Channel Histograms │      │ • EXIF sanitization  │
   └───────────┬──────────┘      └──────────┬───────────┘
               │                            │
   ┌───────────▼────────────────────────────▼───────────┐
   │             Off-Thread Worker Pipelines            │
   │  • Transformers.js (RMBG-1.4 Neural Segmentation)  │
   │  • Tesseract.js (WASM Multilingual OCR)            │
   └────────────────────────────────────────────────────┘
```

- **Zero-Network Invariant**: Network activity is restricted solely to static asset hydration. All image processing pipelines execute against in-memory `Blob` and `HTMLCanvasElement` targets.
- **Automated Test Coverage**:
  - **89 unit & integration tests** in Vitest validating adjustment math, conversion codecs, steganographic bit-packing, and UI component state.
  - **Playwright E2E suite** verifying file upload lifecycles, live preview toggles, and multi-format exports in headless Chromium.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm

### Installation & Local Development
```bash
# Clone the repository
git clone https://github.com/Prompt-0/PixelForge.git

# Navigate into project directory
cd PixelForge

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

### Verification & Testing
```bash
# Run the complete unit test suite (89 tests)
npm run test:run

# Run code linter
npm run lint

# Run Playwright end-to-end tests
npm run test:e2e

# Build production bundle
npm run build
```

---

## 📄 License
This project is licensed under the MIT License.
