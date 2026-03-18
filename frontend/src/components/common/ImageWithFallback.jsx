import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

export default function ImageWithFallback({ src, alt, className, ...props }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/30 text-muted-foreground/40 border border-dashed border-border/50 gap-2 ${className}`}>
        <ImageOff size={40} strokeWidth={1.5} />
        <span className="text-[10px] font-black uppercase tracking-widest">Image Missing</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
}
