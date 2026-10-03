export interface ProcessedImage {
  full: Blob
  thumb: Blob
  width: number
  height: number
}

async function toJpeg(bitmap: ImageBitmap, maxSize: number, quality: number) {
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('resize failed'))), 'image/jpeg', quality),
  )
  return { blob, width: canvas.width, height: canvas.height }
}

// Re-encoding also strips EXIF (including GPS) from what gets published.
export async function processImage(file: File): Promise<ProcessedImage> {
  const bitmap = await createImageBitmap(file)
  const full = await toJpeg(bitmap, 2000, 0.85)
  const thumb = await toJpeg(bitmap, 800, 0.8)
  bitmap.close()
  return { full: full.blob, thumb: thumb.blob, width: full.width, height: full.height }
}
