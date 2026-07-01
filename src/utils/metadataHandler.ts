/**
 * EXIF/IPTC/XMP/ICC metadata reading and manipulation.
 * Uses exifr for comprehensive metadata reading and piexifjs
 * for targeted EXIF field updates and stripping.
 */

import exifr from 'exifr';
import piexif from 'piexifjs';
import { createImageElement, fileToDataUrl } from './helpers';

/** Structured metadata result from reading an image file. */
export interface MetadataResult {
  /** EXIF metadata key-value pairs. */
  exif: Record<string, any>;
  /** IPTC metadata key-value pairs. */
  iptc: Record<string, any>;
  /** XMP metadata key-value pairs. */
  xmp: Record<string, any>;
  /** ICC color profile metadata. */
  icc: Record<string, any>;
  /** GPS coordinates if available. */
  gps: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  } | null;
}

/** Describes a single metadata field for UI display. */
export interface MetadataFieldInfo {
  /** Internal key name. */
  key: string;
  /** Human-readable label. */
  label: string;
  /** Whether this field can be edited via piexifjs. */
  editable: boolean;
}

/** A category of metadata fields. */
export interface MetadataFieldCategory {
  /** Category name (e.g., "Camera", "Date", "GPS"). */
  category: string;
  /** Fields in this category. */
  fields: MetadataFieldInfo[];
}

/**
 * Reads all available metadata from an image file.
 * Extracts EXIF, IPTC, XMP, ICC, and GPS data using exifr.
 *
 * @param file - The image file to read metadata from
 * @returns A promise resolving to structured metadata
 * @throws Error if the file cannot be read
 */
export async function readMetadata(file: File): Promise<MetadataResult> {
  try {
    const result: MetadataResult = {
      exif: {},
      iptc: {},
      xmp: {},
      icc: {},
      gps: null,
    };

    // Read all metadata with exifr
    const allMeta = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      iptc: true,
      xmp: true,
      icc: true,
      jfif: true,
      ihdr: true,
      interop: true,
      translateValues: true,
      translateKeys: true,
      reviveValues: true,
      mergeOutput: false,
    });

    if (allMeta) {
      // Extract EXIF fields
      if (allMeta.exif) {
        result.exif = { ...allMeta.exif };
      }

      // Merge TIFF/IFD0 into exif
      if (allMeta.ifd0 || allMeta.tiff) {
        const tiffData = allMeta.ifd0 || allMeta.tiff;
        result.exif = { ...tiffData, ...result.exif };
      }

      // IPTC
      if (allMeta.iptc) {
        result.iptc = { ...allMeta.iptc };
      }

      // XMP
      if (allMeta.xmp) {
        result.xmp = { ...allMeta.xmp };
      }

      // ICC
      if (allMeta.icc) {
        result.icc = { ...allMeta.icc };
      }
    }

    // Extract GPS separately for reliability
    try {
      const gpsData = await exifr.gps(file);
      if (gpsData) {
        result.gps = {
          latitude: gpsData.latitude,
          longitude: gpsData.longitude,
        };
      }

      // Try to get altitude from full GPS data
      const fullGps = await exifr.parse(file, { gps: true, pick: ['GPSAltitude'] });
      if (fullGps?.GPSAltitude != null) {
        if (!result.gps) {
          result.gps = {};
        }
        result.gps.altitude = fullGps.GPSAltitude;
      }
    } catch {
      // GPS data not available — leave as null
    }

    return result;
  } catch (error) {
    throw new Error(
      `Failed to read metadata: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Strips metadata from an image file.
 *
 * If `fieldsToStrip` is undefined, strips ALL metadata by re-drawing the
 * image on a clean canvas. If specific fields are provided, uses piexifjs
 * to remove only those EXIF fields.
 *
 * @param file - The image file to process
 * @param fieldsToStrip - Optional list of EXIF field names to strip. If omitted, all metadata is removed.
 * @returns A promise resolving to a Blob with metadata stripped
 * @throws Error if the image cannot be processed
 */
export async function stripMetadata(
  file: File,
  fieldsToStrip?: string[]
): Promise<Blob> {
  try {
    if (fieldsToStrip === undefined) {
      // Strip ALL metadata by re-drawing on clean canvas
      const img = await createImageElement(file);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;

      // Fill white background for JPEG
      if (file.type === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      return await canvasToBlob(canvas, file.type || 'image/jpeg', 0.95);
    }

    // Strip specific fields using piexifjs
    const dataUrl = await fileToDataUrl(file);
    let exifObj: any;

    try {
      exifObj = piexif.load(dataUrl);
    } catch {
      // If piexif can't load EXIF, return the original file as-is
      return file;
    }

    // Search and remove specified fields across all IFDs
    const ifds = ['0th', 'Exif', 'GPS', '1st', 'Interop'] as const;

    for (const fieldName of fieldsToStrip) {
      for (const ifdName of ifds) {
        const ifd = piexif.TAGS[ifdName];
        if (!ifd) continue;

        for (const tagCode of Object.keys(ifd)) {
          const tagInfo = ifd[tagCode as any];
          if (tagInfo && tagInfo.name === fieldName) {
            delete exifObj[ifdName][parseInt(tagCode, 10)];
          }
        }
      }
    }

    const newExifBytes = piexif.dump(exifObj);
    const newDataUrl = piexif.insert(newExifBytes, dataUrl);

    return dataUrlToBlob(newDataUrl);
  } catch (error) {
    throw new Error(
      `Failed to strip metadata: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Updates specific EXIF fields in an image file using piexifjs.
 *
 * @param file - The image file to update
 * @param updates - A record of EXIF field names to their new values
 * @returns A promise resolving to a Blob with updated metadata
 * @throws Error if the image cannot be processed or piexifjs fails
 */
export async function updateMetadata(
  file: File,
  updates: Record<string, any>
): Promise<Blob> {
  try {
    const dataUrl = await fileToDataUrl(file);
    let exifObj: any;

    try {
      exifObj = piexif.load(dataUrl);
    } catch {
      // Create empty EXIF structure if none exists
      exifObj = {
        '0th': {},
        Exif: {},
        GPS: {},
        '1st': {},
        Interop: {},
      };
    }

    // Map field names to tag codes and set values
    const ifds = ['0th', 'Exif', 'GPS', '1st', 'Interop'] as const;

    for (const [fieldName, value] of Object.entries(updates)) {
      let found = false;

      for (const ifdName of ifds) {
        const ifd = piexif.TAGS[ifdName];
        if (!ifd) continue;

        for (const tagCode of Object.keys(ifd)) {
          const tagInfo = ifd[tagCode as any];
          if (tagInfo && tagInfo.name === fieldName) {
            exifObj[ifdName][parseInt(tagCode, 10)] = value;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    const newExifBytes = piexif.dump(exifObj);
    const newDataUrl = piexif.insert(newExifBytes, dataUrl);

    return dataUrlToBlob(newDataUrl);
  } catch (error) {
    throw new Error(
      `Failed to update metadata: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Exports metadata as a formatted JSON string.
 *
 * @param metadata - The metadata result to serialize
 * @returns A pretty-printed JSON string
 */
export function metadataToJson(metadata: MetadataResult): string {
  try {
    // Create a serializable copy, handling non-serializable values
    const serializable = JSON.parse(
      JSON.stringify(metadata, (_key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
          return `[Binary data: ${value instanceof Uint8Array ? value.length : (value as ArrayBuffer).byteLength} bytes]`;
        }
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      })
    );

    return JSON.stringify(serializable, null, 2);
  } catch (error) {
    throw new Error(
      `Failed to serialize metadata: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Returns a structured list of known EXIF fields grouped by category.
 * Useful for building metadata editor UIs.
 *
 * @returns An array of categories, each containing an array of field descriptors
 */
export function getMetadataFields(): MetadataFieldCategory[] {
  return [
    {
      category: 'Camera',
      fields: [
        { key: 'Make', label: 'Camera Make', editable: true },
        { key: 'Model', label: 'Camera Model', editable: true },
        { key: 'LensModel', label: 'Lens Model', editable: true },
        { key: 'LensMake', label: 'Lens Make', editable: true },
        { key: 'BodySerialNumber', label: 'Serial Number', editable: false },
        { key: 'FocalLength', label: 'Focal Length', editable: false },
        { key: 'FocalLengthIn35mmFormat', label: 'Focal Length (35mm equiv.)', editable: false },
        { key: 'FNumber', label: 'Aperture (f-number)', editable: false },
        { key: 'ExposureTime', label: 'Shutter Speed', editable: false },
        { key: 'ISOSpeedRatings', label: 'ISO', editable: false },
        { key: 'ExposureProgram', label: 'Exposure Program', editable: false },
        { key: 'MeteringMode', label: 'Metering Mode', editable: false },
        { key: 'Flash', label: 'Flash', editable: false },
        { key: 'WhiteBalance', label: 'White Balance', editable: false },
      ],
    },
    {
      category: 'Date & Time',
      fields: [
        { key: 'DateTimeOriginal', label: 'Date Taken', editable: true },
        { key: 'DateTimeDigitized', label: 'Date Digitized', editable: true },
        { key: 'DateTime', label: 'Date Modified', editable: true },
        { key: 'OffsetTime', label: 'Timezone Offset', editable: true },
        { key: 'SubSecTimeOriginal', label: 'Sub-second Time', editable: false },
      ],
    },
    {
      category: 'GPS & Location',
      fields: [
        { key: 'GPSLatitude', label: 'Latitude', editable: true },
        { key: 'GPSLongitude', label: 'Longitude', editable: true },
        { key: 'GPSAltitude', label: 'Altitude', editable: true },
        { key: 'GPSLatitudeRef', label: 'Latitude Ref (N/S)', editable: true },
        { key: 'GPSLongitudeRef', label: 'Longitude Ref (E/W)', editable: true },
        { key: 'GPSAltitudeRef', label: 'Altitude Ref', editable: true },
        { key: 'GPSDateStamp', label: 'GPS Date', editable: false },
        { key: 'GPSTimeStamp', label: 'GPS Time', editable: false },
        { key: 'GPSSpeed', label: 'GPS Speed', editable: false },
        { key: 'GPSImgDirection', label: 'Image Direction', editable: false },
      ],
    },
    {
      category: 'Author & Copyright',
      fields: [
        { key: 'Artist', label: 'Artist / Author', editable: true },
        { key: 'Copyright', label: 'Copyright', editable: true },
        { key: 'ImageDescription', label: 'Description', editable: true },
        { key: 'UserComment', label: 'User Comment', editable: true },
        { key: 'XPAuthor', label: 'Windows Author', editable: true },
        { key: 'XPTitle', label: 'Windows Title', editable: true },
        { key: 'XPComment', label: 'Windows Comment', editable: true },
        { key: 'XPKeywords', label: 'Windows Keywords', editable: true },
        { key: 'XPSubject', label: 'Windows Subject', editable: true },
      ],
    },
    {
      category: 'Image',
      fields: [
        { key: 'ImageWidth', label: 'Width', editable: false },
        { key: 'ImageHeight', label: 'Height', editable: false },
        { key: 'XResolution', label: 'X Resolution (DPI)', editable: true },
        { key: 'YResolution', label: 'Y Resolution (DPI)', editable: true },
        { key: 'ResolutionUnit', label: 'Resolution Unit', editable: false },
        { key: 'Orientation', label: 'Orientation', editable: true },
        { key: 'ColorSpace', label: 'Color Space', editable: false },
        { key: 'BitsPerSample', label: 'Bits Per Sample', editable: false },
        { key: 'Compression', label: 'Compression', editable: false },
        { key: 'PhotometricInterpretation', label: 'Photometric Interpretation', editable: false },
      ],
    },
    {
      category: 'Software',
      fields: [
        { key: 'Software', label: 'Software', editable: true },
        { key: 'ProcessingSoftware', label: 'Processing Software', editable: true },
        { key: 'ExifVersion', label: 'EXIF Version', editable: false },
        { key: 'FlashpixVersion', label: 'Flashpix Version', editable: false },
      ],
    },
  ];
}

// ─── Internal Helpers ────────────────────────────────────────────────

/**
 * Converts a data URL string to a Blob.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const byteString = atob(parts[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([arrayBuffer], { type: mime });
}

/**
 * Converts a canvas to a Blob.
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob returned null'));
        }
      },
      type,
      quality
    );
  });
}
