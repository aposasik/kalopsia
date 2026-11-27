/** Οι διαστάσεις μιας εικόνας ώστε η μεγάλη πλευρά να μην ξεπερνά το max. Οι αναλογίες μένουν. Δεν μεγαλώνει ποτέ. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) {
    return { width, height };
  }
  const scale = max / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Μικραίνει μια φωτογραφία σε JPEG με μεγάλη πλευρά έως max. Τρέχει στη συσκευή, πριν ανέβει οτιδήποτε. */
export async function shrink(photo: Blob, max = 1280, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(photo);
  const { width, height } = fitWithin(bitmap.width, bitmap.height, max);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/jpeg', quality),
  );
}