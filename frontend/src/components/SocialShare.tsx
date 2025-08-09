'use client';

import { usePosterStore } from '@/stores/posterStore';

export default function SocialShare() {
  const { finalPosterUrl } = usePosterStore();

  const handleDownload = async () => {
    if (!finalPosterUrl) return;

    try {
      const response = await fetch(finalPosterUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `political-poster-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="mt-6">
      <button
        onClick={handleDownload}
        className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg min-h-[44px]"
      >
        Download Poster
      </button>
    </div>
  );
}