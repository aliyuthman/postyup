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

  // Social sharing functions removed - keeping only download functionality

  return (
    <div className="mt-4 sm:mt-6">
      {/* Primary Download Button */}
      <button
        onClick={handleDownload}
        disabled={!finalPosterUrl}
        className={`flex items-center justify-center gap-3 w-full py-4 sm:py-5 rounded-2xl transition-all duration-300 font-semibold text-base sm:text-lg min-h-[56px] ${
          finalPosterUrl 
            ? 'bg-[#FAFAFA] text-[#0A0A0A] hover:bg-[#E5E5E5] hover:scale-105 shadow-lg hover:shadow-xl' 
            : 'bg-[#404040] text-[#737373] cursor-not-allowed'
        }`}
      >
        <div className={`p-2 rounded-full ${finalPosterUrl ? 'bg-[#0A0A0A]' : 'bg-[#737373]'}`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-6 8h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        {finalPosterUrl ? 'Download High-Quality Poster' : 'Poster Not Ready'}
      </button>

      {/* Success Message */}
      {finalPosterUrl && (
        <div className="mt-3 text-center">
          <p className="text-[#A3A3A3] text-sm">
            Your poster is ready for download in high quality
          </p>
        </div>
      )}
      
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-[#737373] text-center">
          Debug: {finalPosterUrl ? 'URL Available' : 'No URL'}
        </div>
      )}
    </div>
  );
}