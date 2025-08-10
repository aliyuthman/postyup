'use client';

import { useState } from 'react';
import { usePosterStore } from '@/stores/posterStore';

export default function SocialShare() {
  const { finalPosterUrl } = usePosterStore();
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');

  const handleDownload = async () => {
    console.log('Download button clicked');
    console.log('finalPosterUrl:', finalPosterUrl);
    
    // Prevent multiple downloads
    if (downloadState === 'downloading') {
      return;
    }
    
    if (!finalPosterUrl) {
      console.error('No final poster URL available');
      setDownloadState('error');
      setTimeout(() => setDownloadState('idle'), 3000);
      return;
    }

    // Set downloading state immediately for instant feedback
    setDownloadState('downloading');

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
      
      // Show success state briefly
      setDownloadState('success');
      setTimeout(() => setDownloadState('idle'), 2000);
      
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadState('error');
      setTimeout(() => setDownloadState('idle'), 3000);
    }
  };

  // Social sharing functions removed - keeping only download functionality

  // Get button content based on state
  const getButtonContent = () => {
    switch (downloadState) {
      case 'downloading':
        return {
          text: 'Downloading...',
          icon: (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          ),
          disabled: true,
          className: 'bg-[#FAFAFA] text-[#0A0A0A] cursor-not-allowed'
        };
      case 'success':
        return {
          text: 'Downloaded!',
          icon: (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          disabled: true,
          className: 'bg-green-500 text-white'
        };
      case 'error':
        return {
          text: 'Download Failed',
          icon: (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          disabled: true,
          className: 'bg-red-500 text-white'
        };
      default:
        return {
          text: finalPosterUrl ? 'Download High-Quality Poster' : 'Poster Not Ready',
          icon: (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-6 8h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
          disabled: !finalPosterUrl,
          className: finalPosterUrl 
            ? 'bg-[#FAFAFA] text-[#0A0A0A] hover:bg-[#E5E5E5] hover:scale-105 shadow-lg hover:shadow-xl' 
            : 'bg-[#404040] text-[#737373] cursor-not-allowed'
        };
    }
  };

  const buttonContent = getButtonContent();

  return (
    <div className="mt-4 sm:mt-6">
      {/* Primary Download Button */}
      <button
        onClick={handleDownload}
        disabled={buttonContent.disabled}
        className={`flex items-center justify-center gap-3 w-full py-4 sm:py-5 rounded-2xl transition-all duration-300 font-semibold text-base sm:text-lg min-h-[56px] ${buttonContent.className}`}
      >
        <div className={`p-2 rounded-full ${
          downloadState === 'downloading' ? 'bg-[#0A0A0A]' :
          downloadState === 'success' ? 'bg-green-600' :
          downloadState === 'error' ? 'bg-red-600' :
          finalPosterUrl ? 'bg-[#0A0A0A]' : 'bg-[#737373]'
        }`}>
          {buttonContent.icon}
        </div>
        {buttonContent.text}
      </button>

      {/* Dynamic Status Message */}
      {finalPosterUrl && downloadState !== 'idle' && (
        <div className="mt-3 text-center">
          <p className={`text-sm ${
            downloadState === 'downloading' ? 'text-[#FAFAFA]' :
            downloadState === 'success' ? 'text-green-400' :
            downloadState === 'error' ? 'text-red-400' :
            'text-[#A3A3A3]'
          }`}>
            {downloadState === 'downloading' && 'Preparing your high-quality poster...'}
            {downloadState === 'success' && '✓ Poster saved to your downloads!'}
            {downloadState === 'error' && 'Download failed. Please try again.'}
          </p>
        </div>
      )}
      
      {/* Default Message */}
      {finalPosterUrl && downloadState === 'idle' && (
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