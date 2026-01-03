'use client';

import { useEffect, useState } from 'react';

/**
 * Reading Progress Bar
 * 
 * Thin bar at top that fills up as you scroll.
 */

export function ReadingProgressBar({ articleId }: { articleId: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      if (docHeight > 0) {
        const newProgress = Math.min(100, (scrollTop / docHeight) * 100);
        setProgress(Math.round(newProgress));
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, [articleId]);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-50">
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      />
    </div>
  );
}
