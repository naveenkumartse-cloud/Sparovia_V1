import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B3FD1 100%)',
          borderRadius: '7px',
          color: 'white',
          fontSize: '20px',
          fontWeight: 900,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
        }}
      >
        S
      </div>
    ),
    {
      ...size,
    }
  );
}
