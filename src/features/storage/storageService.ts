/**
 * storageService.ts
 *
 * Helpers for Firebase Storage:
 *  - compressImage  — canvas-based compression loop, targeting ≤800 KB
 *  - uploadInstrumentPhoto      — instruments/{id}/photo
 *  - uploadMaintenanceDamagePhoto — maintenance/{id}/damage-photos/{uuid}
 *  - deleteStorageFile          — delete by full download URL
 */

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'
import { storage } from '@/config/firebase'

const MAX_BYTES = 800_000 // 800 KB

// ---------------------------------------------------------------------------
// Image compression
// ---------------------------------------------------------------------------

/**
 * Compress an image file using a canvas draw/toBlob loop.
 * Starts at quality=0.85, drops by 0.1 each iteration until the result fits
 * within maxBytes or quality reaches 0.1.
 *
 * For non-JPEG formats the canvas will output JPEG (smaller) unless the file
 * is already a PNG that is small enough.
 */
export async function compressImage(
  file: File,
  maxBytes = MAX_BYTES,
): Promise<Blob> {
  // If the file is already small enough, return it as-is.
  if (file.size <= maxBytes) return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const canvas = document.createElement('canvas')
      // Cap the longest edge at 1920 px to reduce canvas area before compression.
      const maxDim = 1920
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height / width) * maxDim)
          width = maxDim
        } else {
          width = Math.round((width / height) * maxDim)
          height = maxDim
        }
      }
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      let quality = 0.85

      function tryBlob() {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob returned null'))
              return
            }
            if (blob.size <= maxBytes || quality <= 0.1) {
              resolve(blob)
            } else {
              quality = Math.max(0.1, quality - 0.1)
              tryBlob()
            }
          },
          'image/jpeg',
          quality,
        )
      }

      tryBlob()
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image for compression'))
    }

    img.src = objectUrl
  })
}

// ---------------------------------------------------------------------------
// Upload helpers
// ---------------------------------------------------------------------------

/**
 * Compress and upload an instrument photo.
 * Stored at: instruments/{instrumentId}/photo
 * Returns the public download URL.
 */
export async function uploadInstrumentPhoto(
  instrumentId: string,
  file: File,
): Promise<string> {
  const blob = await compressImage(file)
  const storageRef = ref(storage, `instruments/${instrumentId}/photo`)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(storageRef)
}

/**
 * Compress and upload a maintenance damage photo.
 * Stored at: maintenance/{maintenanceId}/damage-photos/{uuid}
 * Returns the public download URL.
 */
export async function uploadMaintenanceDamagePhoto(
  maintenanceId: string,
  file: File,
): Promise<string> {
  const blob = await compressImage(file)
  const uuid = crypto.randomUUID()
  const storageRef = ref(
    storage,
    `maintenance/${maintenanceId}/damage-photos/${uuid}`,
  )
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(storageRef)
}

/**
 * Delete a file from Storage by its full HTTPS download URL.
 * Silently ignores "object-not-found" errors so cleanup is idempotent.
 */
export async function deleteStorageFile(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'storage/object-not-found'
    ) {
      return
    }
    throw err
  }
}
