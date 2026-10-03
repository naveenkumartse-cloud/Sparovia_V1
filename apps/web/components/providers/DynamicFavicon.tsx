'use client';

import { useEffect } from 'react';
import { useWebsiteContent } from './WebsiteContentProvider';

function getFirstLetter(name?: string | null): string {
  if (!name) return 'S';
  const trimmed = name.trim();
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (/[a-zA-Z0-9]/.test(char)) {
      return char.toUpperCase();
    }
  }
  return trimmed[0]?.toUpperCase() || 'S';
}

function generateFaviconSvg(letter: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="clientGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#8B3FD1"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="24" fill="url(#clientGrad)"/>
  <text x="50" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="60" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${letter}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function generateFaviconPng(letter: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      const radius = 16;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(64 - radius, 0);
      ctx.quadraticCurveTo(64, 0, 64, radius);
      ctx.lineTo(64, 64 - radius);
      ctx.quadraticCurveTo(64, 64, 64 - radius, 64);
      ctx.lineTo(radius, 64);
      ctx.quadraticCurveTo(0, 64, 0, 64 - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 64, 64);
      grad.addColorStop(0, '#3B82F6');
      grad.addColorStop(1, '#8B3FD1');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, 32, 34);

      resolve(canvas.toDataURL('image/png'));
    } catch {
      resolve('');
    }
  });
}

export function DynamicFavicon() {
  const { website } = useWebsiteContent();

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const letter = getFirstLetter(website?.name);
    const svgUrl = generateFaviconSvg(letter);

    // Update document title if client business name exists
    if (website?.name?.trim()) {
      document.title = `${website.name.trim()} | Home Interiors & Architectural Systems`;
    }

    generateFaviconPng(letter).then((pngUrl) => {
      const existingIcons = document.querySelectorAll<HTMLLinkElement>(
        "link[rel*='icon'], link[rel='apple-touch-icon']"
      );

      if (existingIcons.length > 0) {
        existingIcons.forEach((link) => {
          const rel = link.getAttribute('rel') || '';
          if (rel.includes('apple')) {
            link.href = pngUrl || svgUrl;
          } else if (link.type === 'image/svg+xml') {
            link.href = svgUrl;
          } else {
            link.href = pngUrl || svgUrl;
          }
        });
      } else {
        const linkSvg = document.createElement('link');
        linkSvg.rel = 'icon';
        linkSvg.type = 'image/svg+xml';
        linkSvg.href = svgUrl;
        document.head.appendChild(linkSvg);

        if (pngUrl) {
          const linkPng = document.createElement('link');
          linkPng.rel = 'alternate icon';
          linkPng.type = 'image/png';
          linkPng.href = pngUrl;
          document.head.appendChild(linkPng);
        }
      }
    });
  }, [website?.name]);

  return null;
}
