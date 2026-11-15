import path from 'path';
import { BrowserAuditClient } from './comprehensive-browser-audit.mjs';

async function main() {
  const client = new BrowserAuditClient(9230);
  console.log('Launching headless Chrome for Stage Evidence Capture...');
  await client.launch();
  await client.setViewport(1440, 960);

  const previewPath = 'file:///' + path.resolve('scripts/test-loader-preview.html').replace(/\\/g, '/');
  console.log('Navigating to:', previewPath);
  await client.navigate(previewPath, 1500);

  // Capture Dark Mode Storyboard Sequence
  console.log('Capturing sparovia-loader-storyboard-sequence.png...');
  await client.screenshot('sparovia-loader-storyboard-sequence.png');

  // Toggle to Light Theme
  console.log('Switching to light theme...');
  await client.evaluate(`document.body.classList.add('light-theme')`);
  await new Promise(r => setTimeout(r, 600));

  // Capture Light Mode Storyboard Sequence
  console.log('Capturing sparovia-loader-storyboard-light.png...');
  await client.screenshot('sparovia-loader-storyboard-light.png');

  await client.close();
  console.log('All stage evidence screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Error in stage capture:', err);
  process.exit(1);
});
