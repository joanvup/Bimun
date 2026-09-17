/**
 * Compresses an image file in the browser to WebP / JPEG format.
 * Returns a data URL string.
 */
export async function compressImage(
  file: File,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.85
): Promise<{ dataUrl: string; sizeKb: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo seleccionado'));
    reader.onload = () => {
      const img = document.createElement('img');
      img.onerror = () => reject(new Error('Formato de imagen no soportado'));
      img.onload = () => {
        let { width, height } = img;

        // Calculate proportional scale
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: reader.result as string,
            sizeKb: Math.round(file.size / 1024),
            width: img.width,
            height: img.height,
          });
          return;
        }

        // Draw image smoothly
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first, fallback to jpeg
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Calculate size in KB
        const head = 'data:image/webp;base64,';
        const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
        const approxBytes = (base64Length * 3) / 4;
        const sizeKb = Math.round(approxBytes / 1024);

        resolve({
          dataUrl,
          sizeKb,
          width,
          height,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
