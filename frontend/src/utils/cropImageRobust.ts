/**
 * More robust crop function that calculates coordinates from crop area percentage
 * and actual image dimensions to avoid mobile scaling issues
 */
export async function getCroppedImgRobust(
  imageSrc: string,
  croppedArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
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
      console.log('Image loaded for robust cropping:', {
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        croppedArea,
        croppedAreaPixels
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Calculate crop coordinates from percentage (more reliable for mobile)
      const cropX = Math.round((croppedArea.x / 100) * image.naturalWidth);
      const cropY = Math.round((croppedArea.y / 100) * image.naturalHeight);
      const cropWidth = Math.round((croppedArea.width / 100) * image.naturalWidth);
      const cropHeight = Math.round((croppedArea.height / 100) * image.naturalHeight);

      // Ensure coordinates are within bounds
      const finalCropX = Math.max(0, Math.min(cropX, image.naturalWidth));
      const finalCropY = Math.max(0, Math.min(cropY, image.naturalHeight));
      const finalCropWidth = Math.min(cropWidth, image.naturalWidth - finalCropX);
      const finalCropHeight = Math.min(cropHeight, image.naturalHeight - finalCropY);

      console.log('Calculated crop from percentage:', {
        originalDimensions: { width: image.naturalWidth, height: image.naturalHeight },
        croppedAreaPercentage: croppedArea,
        calculatedPixels: { cropX, cropY, cropWidth, cropHeight },
        finalCoordinates: { finalCropX, finalCropY, finalCropWidth, finalCropHeight }
      });

      // Set canvas to the final crop dimensions
      canvas.width = finalCropWidth;
      canvas.height = finalCropHeight;

      // Draw the cropped portion
      ctx.drawImage(
        image,
        finalCropX,
        finalCropY,
        finalCropWidth,
        finalCropHeight,
        0,
        0,
        finalCropWidth,
        finalCropHeight
      );

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('Robust cropped blob created:', {
              size: blob.size,
              type: blob.type,
              dimensions: { width: canvas.width, height: canvas.height }
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
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
  });
}