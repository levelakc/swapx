import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

export default function ImageWithFallback({ src, alt, className, ...props }) {
  const [error, setError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setError(false);
  }, [src]);

  const isInvalidSrc = !src || src === '' || src === 'undefined' || src === 'null';

  if (error || isInvalidSrc) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-muted/30 text-muted-foreground/40 border border-dashed border-border/50 gap-2 min-h-[100px] ${className?.replace('object-cover', '') || ''}`}
        {...props}
      >
        <ImageOff size={24} strokeWidth={1.5} />
        <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Image Missing</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        setError(true);
      }}
      {...props}
    />
  );
}
