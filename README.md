# Image Manipulator Web Application

A powerful, 100% client-side web application for advanced image manipulation, editing, and analysis. Built with React and TypeScript, this application provides a suite of professional-grade tools that run entirely in the browser, ensuring user privacy and data security.

## 🌟 Key Philosophy & Architecture
- **Client-Side Only**: All processing (including AI background removal and OCR) runs locally in the browser. No images are ever uploaded to a server.
- **Privacy-First**: Ideal for sensitive documents and personal photos.
- **State Architecture**: Uses a robust, unified state management system (`App.tsx`) with modular, highly-specialized engine utilities for distinct features.
- **Live Preview System**: Instant visual feedback for operations with the ability to toggle live previews on or off for better performance on large images.

---

## 🛠️ Feature Breakdown

### 1. Core Editing & Adjustments
* **Basic Operations**: Crop, rotate, horizontal/vertical flip, and aspect-ratio constrained resizing.
* **Tuning Sliders**: Fine-tune Brightness, Contrast, Saturation, Blur, Exposure, and Hue.
* **Format Conversion & Compression**: Compress images on the fly to `JPEG` or `WEBP` formats with an interactive quality slider to hit specific file-size targets.

### 2. Advanced Selection Tools (`selectionEngine.ts`)
* **AI Background Removal**: Uses `@xenova/transformers` with the `briaai/RMBG-1.4` model to seamlessly cut out subjects from their backgrounds. (Downloads model once locally, then runs offline).
* **Magic Wand**: A custom stack-based flood fill algorithm that selects and erases contiguous areas of similar color, with adjustable tolerance.

### 3. Annotation & Drawing (`annotationEngine.ts`)
* **Shapes & Text**: Overlay custom text, rectangles, and ellipses.
* **Freehand Drawing**: Paint directly onto the image with adjustable brush sizes and colors.
* **Redaction/Blur Tool**: Censor sensitive information by drawing localized blur boxes.
* **Non-Destructive Stack**: Supports full undo/redo capabilities for drawings before applying them to the image.

### 4. Color Analytics & Filters (`filterEngine.ts`)
* **Live Histograms**: Real-time rendering of RGB and Luma channels to visualize the image's tonal distribution.
* **Preset Filters**: Instagram-style LUT presets including `Grayscale`, `Sepia`, `Vintage`, `Cool`, `Warm`, `Dramatic`, and `Invert`.

### 5. Watermarking (`watermarkEngine.ts`)
* **Text Overlays**: Add copyright or custom text.
* **Image Compositing**: Overlay logos (e.g., PNGs with transparency).
* **Controls**: Granular control over Opacity, Scale, Rotation, and Position (Top-Left, Center, Bottom-Right, etc.).

### 6. OCR (Optical Character Recognition) (`ocrEngine.ts`)
* Extract text directly from images using `Tesseract.js`.
* Supports multiple languages and provides confidence scores for the recognized text.

### 7. Cybersecurity & Forensics (`cyberSecurity.ts`)
* **Steganography**: Encode hidden text messages into image pixels (LSB steganography), and decode them back.
* **Error Level Analysis (ELA)**: Highlight discrepancies in JPEG compression rates to detect digitally manipulated or spliced images.
* **Payload Scanner**: Scans image buffers for malicious scripts or hidden executable signatures (e.g., PHP, JS, Shell scripts).
* **Deep Scrubbing**: Sanitizes the image by stripping all EXIF metadata and purging any embedded payloads, ensuring the output file is completely safe to share.

---

## 🏗️ Technical Stack

- **Framework**: React 18, TypeScript, Vite
- **Styling**: Vanilla CSS with modern UI/UX design patterns (glassmorphism, clean layouts).
- **Icons**: Lucide React
- **AI/ML**: Xenova Transformers.js (for local background removal)
- **Image Processing**: Native HTML5 Canvas API (for performance and zero-dependency pixel manipulation)
- **Testing**: Vitest with JSDOM for robust unit testing across all specialized engines.

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js installed.

### Installation
1. Navigate to the project directory:
   ```bash
   cd Image_Manipulator
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production
To create a production-ready bundle:
```bash
npm run build
```
This will compile the TypeScript code and generate static files in the `dist` directory.

### Running Tests
To run the automated test suite (which covers UI components and the processing engines):
```bash
npm run test
```
