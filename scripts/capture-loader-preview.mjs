import path from 'path';
import { BrowserAuditClient } from './comprehensive-browser-audit.mjs';

async function main() {
  const client = new BrowserAuditClient(9228);
  console.log('Launching headless Chrome...');
  await client.launch();
  console.log('Setting viewport 1400x1000...');
  await client.setViewport(1400, 1000);

  const previewPath = 'file:///' + path.resolve('scripts/test-loader-preview.html').replace(/\\/g, '/');
  console.log('Navigating to:', previewPath);
  await client.navigate(previewPath, 1500);

  console.log('Taking screenshot of sequence board...');
  const shotPath = await client.screenshot('sparovia-logo-loader-stages-audit.png');
  console.log('Screenshot saved to:', shotPath);

  await client.close();
  console.log('Done!');
}

main().catch((err) => {
  console.error('Error in capture:', err);
  process.exit(1);
});
