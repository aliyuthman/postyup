/**
 * Creates a cropped image blob from the original image using crop area pixels
 * Handles mobile device scaling and pixel ratio issues
 */
export async function getCroppedImg(
  imageSrc: string,
  croppedAreaPixels: {
    x: number;
    y: number;
    width: number;
    height: number;
  }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      console.log('Image loaded for cropping:', {
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        croppedAreaPixels
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Use device pixel ratio for crisp rendering
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Set canvas dimensions to the crop area (accounting for pixel ratio)
      const canvasWidth = Math.round(croppedAreaPixels.width);
      const canvasHeight = Math.round(croppedAreaPixels.height);
      
      canvas.width = canvasWidth * pixelRatio;
      canvas.height = canvasHeight * pixelRatio;
      canvas.style.width = canvasWidth + 'px';
      canvas.style.height = canvasHeight + 'px';
      
      // Scale the context to match the device pixel ratio
      ctx.scale(pixelRatio, pixelRatio);

      // Ensure crop coordinates are within image bounds
      const cropX = Math.max(0, Math.min(croppedAreaPixels.x, image.naturalWidth));
      const cropY = Math.max(0, Math.min(croppedAreaPixels.y, image.naturalHeight));
      const cropWidth = Math.min(croppedAreaPixels.width, image.naturalWidth - cropX);
      const cropHeight = Math.min(croppedAreaPixels.height, image.naturalHeight - cropY);

      console.log('Adjusted crop coordinates:', {
        cropX, cropY, cropWidth, cropHeight,
        canvasWidth, canvasHeight, pixelRatio
      });

      // Draw the cropped portion of the image
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvasWidth,
        canvasHeight
      );

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('Cropped blob created:', {
              size: blob.size,
              type: blob.type
            });
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        'image/jpeg',
        0.95
      );
    };

    image.onerror = () => reject(new Error('Image failed to load'));
    // Ensure image loads with proper CORS handling
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
  });
}