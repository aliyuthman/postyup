'use client';

import { usePosterStore } from '@/stores/posterStore';

export default function SocialShare() {
  const { finalPosterUrl } = usePosterStore();

  const handleDownload = async () => {
    console.log('Download button clicked');
    console.log('finalPosterUrl:', finalPosterUrl);
    
    if (!finalPosterUrl) {
      console.error('No final poster URL available');
      alert('No poster URL available. Please generate the poster first.');
      return;
    }

    try {
      console.log('Starting download from:', finalPosterUrl);
      const response = await fetch(finalPosterUrl);
      console.log('Fetch response:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Blob created:', blob.size, 'bytes');
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `political-poster-${Date.now()}.png`;
      document.body.appendChild(link);
      console.log('Triggering download...');
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      console.log('Download completed');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  return (
    <div className="mt-6">
      <button
        onClick={handleDownload}
        disabled={!finalPosterUrl}
        className={`w-full py-4 text-white rounded-lg transition-colors font-medium text-lg min-h-[44px] ${
          finalPosterUrl 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {finalPosterUrl ? 'Download Poster' : 'Poster Not Ready'}
      </button>
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500">
          Debug: {finalPosterUrl ? 'URL Available' : 'No URL'}
        </div>
      )}
    </div>
  );
}