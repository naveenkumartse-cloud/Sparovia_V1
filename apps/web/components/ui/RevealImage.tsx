'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface RevealImageProps extends Omit<ImageProps, 'alt'> {
  alt: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide' | 'tall' | 'cinema' | 'auto';
  direction?: 'up' | 'down' | 'left' | 'right' | 'expand';
  delay?: number;
  duration?: number;
  className?: string;
  imageClassName?: string;
}

export function RevealImage({
  src,
  alt,
  aspectRatio = 'auto',
  direction = 'up',
  delay = 0,
  duration = 1.1,
  className,
  imageClassName,
  priority = false,
  ...props
}: RevealImageProps) {
  const shouldReduceMotion = useReducedMotion();

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[4/5]',
    tall: 'aspect-[3/4]',
    wide: 'aspect-[16/9]',
    cinema: 'aspect-[21/9]',
    auto: 'min-h-[300px]',
  };

  const clipVariants = {
    up: {
      initial: { clipPath: 'inset(100% 0 0 0)' },
      animate: { clipPath: 'inset(0% 0 0 0)' },
    },
    down: {
      initial: { clipPath: 'inset(0 0 100% 0)' },
      animate: { clipPath: 'inset(0 0 0% 0)' },
    },
    left: {
      initial: { clipPath: 'inset(0 100% 0 0)' },
      animate: { clipPath: 'inset(0 0% 0 0)' },
    },
    right: {
      initial: { clipPath: 'inset(0 0 0 100%)' },
      animate: { clipPath: 'inset(0 0 0 0%)' },
    },
    expand: {
      initial: { clipPath: 'inset(15% 15% 15% 15% round 12px)' },
      animate: { clipPath: 'inset(0% 0% 0% 0% round 0px)' },
    },
  };

  const selectedClip = clipVariants[direction];

  if (shouldReduceMotion) {
    return (
      <div className={cn('relative overflow-hidden w-full h-full bg-charcoal-900', aspectClasses[aspectRatio], className)}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={cn('object-cover', imageClassName)}
          {...props}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={selectedClip.initial}
      whileInView={selectedClip.animate}
      viewport={{ once: true, margin: '-8%' }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn('relative overflow-hidden w-full h-full bg-charcoal-900 group', aspectClasses[aspectRatio], className)}
    >
      <motion.div
        initial={{ scale: 1.15 }}
        whileInView={{ scale: 1.0 }}
        viewport={{ once: true, margin: '-8%' }}
        transition={{
          duration: duration * 1.2,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="w-full h-full relative"
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={cn('object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105', imageClassName)}
          {...props}
        />
      </motion.div>
    </motion.div>
  );
}
