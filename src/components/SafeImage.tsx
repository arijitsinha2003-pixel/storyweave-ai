import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function SafeImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel = 'StoryWeave Illustration',
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#19192D] via-[#121225] to-[#0B0B14] text-[#A78BFA] p-6 text-center"
      >
        <div className="w-11 h-11 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-[#A78BFA]" />
        </div>
        <span className="text-xs font-medium text-[#F8FAFC]/75">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
