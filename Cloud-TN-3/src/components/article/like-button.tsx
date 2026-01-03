'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import confetti from 'canvas-confetti';

/**
 * Like Button with Confetti Explosion
 * 
 * When user likes, don't just change icon color.
 * Make it pop with confetti.
 */

export function LikeButton({ articleId, initialLiked }: { articleId: number; initialLiked: boolean }) {
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    setLoading(true);
    try {
      // Toggle like state
      setLiked(!liked);

      // Call backend to toggle like
      await fetch(`/api/articles/${articleId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liked: !liked }),
      });

      // Trigger confetti explosion
      triggerConfetti();

    } catch (err) {
      console.error('Failed to like article:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#ff0000', '#ff4400', '#ff8800', '#ffcc00', '#ffff00'],
    };

    // Fire confetti from button position
    const button = document.getElementById(`like-button-${articleId}`);
    if (button) {
      const rect = button.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x, y },
        colors: defaults.colors,
        ...defaults,
      });
    }
  };

  return (
    <Button
      id={`like-button-${articleId}`}
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={loading}
      className="relative group"
    >
      <Heart
        className={`h-5 w-5 transition-transform group-active:scale-125 ${
          liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
        }`}
      />
      {liked && <span className="absolute -top-1 -right-1 flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      </span>}
    </Button>
  );
}
