/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isConfigured } from './supabase';

export interface ProcessedImageResult {
  url: string;
  source: 'upload_storage' | 'data_url';
  fileSizeKb: number;
  width: number;
  height: number;
  fileName: string;
}

/**
 * Resizes and compresses an image file from a phone camera/gallery or PC file
 * to an optimized WebP or JPEG format suitable for mobile and desktop display.
 */
export async function processAndUploadImage(
  file: File,
  maxDimension = 1200,
  quality = 0.85
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    // 1. Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image. Please choose a JPG, PNG, or WebP photo.'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file from device storage.'));
    };

    reader.onload = async (event) => {
      try {
        const rawDataUrl = event.target?.result as string;
        const img = new Image();

        img.onerror = () => {
          reject(new Error('Failed to load image for processing.'));
        };

        img.onload = async () => {
          try {
            // Calculate proportional dimensions
            let targetWidth = img.width;
            let targetHeight = img.height;

            if (targetWidth > maxDimension || targetHeight > maxDimension) {
              if (targetWidth > targetHeight) {
                targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
                targetWidth = maxDimension;
              } else {
                targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
                targetHeight = maxDimension;
              }
            }

            // Draw to offscreen canvas for crisp compression
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              reject(new Error('Canvas rendering context not available.'));
              return;
            }

            // Smooth high-quality downsampling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // Export as WebP if supported, otherwise JPEG
            const outputMime = 'image/jpeg';
            const compressedDataUrl = canvas.toDataURL(outputMime, quality);
            const approxSizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

            // Attempt Supabase Storage upload if client is configured
            if (supabase && isConfigured) {
              try {
                // Convert dataUrl to blob
                const res = await fetch(compressedDataUrl);
                const blob = await res.blob();
                const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const uniquePath = `menu/${Date.now()}_${cleanName}.jpg`;

                // Try uploading to 'menu-images' or 'public' bucket
                const { data: uploadData, error: uploadErr } = await supabase.storage
                  .from('menu-images')
                  .upload(uniquePath, blob, {
                    contentType: 'image/jpeg',
                    upsert: true
                  });

                if (!uploadErr && uploadData?.path) {
                  const { data: publicUrlData } = supabase.storage
                    .from('menu-images')
                    .getPublicUrl(uploadData.path);

                  if (publicUrlData?.publicUrl) {
                    resolve({
                      url: publicUrlData.publicUrl,
                      source: 'upload_storage',
                      fileSizeKb: approxSizeKb,
                      width: targetWidth,
                      height: targetHeight,
                      fileName: file.name
                    });
                    return;
                  }
                }
              } catch (storageErr) {
                // Storage upload bucket may not exist or require specific RLS; fall back to dataUrl gracefully
                console.info('Supabase Storage bucket fallback to optimized data URL:', storageErr);
              }
            }

            // Fallback: return the compressed, high-fidelity data URL
            resolve({
              url: compressedDataUrl,
              source: 'data_url',
              fileSizeKb: approxSizeKb,
              width: targetWidth,
              height: targetHeight,
              fileName: file.name
            });
          } catch (err: any) {
            reject(new Error(`Image compression failed: ${err.message}`));
          }
        };

        img.src = rawDataUrl;
      } catch (err: any) {
        reject(err);
      }
    };

    reader.readAsDataURL(file);
  });
}
