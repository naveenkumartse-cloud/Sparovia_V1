import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Image generation
export default function AppleIcon() {
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
          borderRadius: '38px',
          color: 'white',
          fontSize: '110px',
          fontWeight: 900,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
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
