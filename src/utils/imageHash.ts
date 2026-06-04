import { encode } from 'blurhash';

export async function createImageBlurhash(imageUrl: string): Promise<string | null> {
  const image = new Image();
  image.crossOrigin = 'Anonymous';
  image.src = imageUrl;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Unable to load image for hashing'));
  }).catch(() => undefined);

  if (!image.width || !image.height) return null;

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(image, 0, 0, 32, 32);
  const data = context.getImageData(0, 0, 32, 32);
  return encode(data.data, 32, 32, 4, 3);
}

export function blurhashSimilarity(a: string, b: string) {
  if (!a || !b) return 0;
  const length = Math.min(a.length, b.length);
  let matches = 0;
  for (let index = 0; index < length; index += 1) {
    if (a[index] === b[index]) matches += 1;
  }
  return matches / Math.max(a.length, b.length);
}

