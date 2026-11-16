import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface ImageFrameProps extends Omit<ImageProps, 'alt'> {
  alt: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide' | 'tall' | 'auto';
  overlay?: boolean;
  hoverEffect?: boolean;
  doubleBezel?: boolean;
  className?: string;
  imageClassName?: string;
}

export function ImageFrame({
  src,
  alt,
  aspectRatio = 'auto',
  overlay = false,
  hoverEffect = true,
  doubleBezel = false,
  className,
  imageClassName,
  priority = false,
  ...props
}: ImageFrameProps) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[4/5]',
    tall: 'aspect-[3/4]',
    wide: 'aspect-[16/9]',
    auto: 'min-h-[300px]',
  };

  const imageElement = (
    <div
      className={cn(
        'relative overflow-hidden bg-surface group w-full h-full',
        doubleBezel ? 'rounded-[7px]' : 'rounded-panel border border-gray-100 shadow-soft-sm',
        aspectClasses[aspectRatio],
        !doubleBezel && className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        decoding="async"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className={cn(
          'object-cover transition-transform duration-700 ease-out',
          hoverEffect && 'motion-safe:group-hover:scale-105',
          imageClassName
        )}
        {...props}
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/70 via-charcoal-900/20 to-transparent" />
      )}
    </div>
  );

  if (doubleBezel) {
    return (
      <div className={cn('double-bezel', className)}>
        {imageElement}
      </div>
    );
  }

  return imageElement;
}
