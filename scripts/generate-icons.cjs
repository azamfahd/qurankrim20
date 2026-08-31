const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Full-bleed SVG for Standard & iOS Icons (Square background, no transparency on edges so iOS doesn't make black corners)
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="glow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#047857" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#022c22" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#021c15"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
    <linearGradient id="gold-bright" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Full bleed Background for crisp rendering on iOS & Android -->
  <rect width="512" height="512" fill="url(#bg-grad)"/>
  <rect width="512" height="512" fill="url(#glow)"/>

  <!-- Islamic Geometric Pattern Accent Rings -->
  <circle cx="256" cy="256" r="216" stroke="url(#gold)" stroke-width="2.5" stroke-dasharray="12 8" fill="none" opacity="0.3"/>
  <circle cx="256" cy="256" r="200" stroke="url(#gold)" stroke-width="5" fill="none" opacity="0.45"/>
  <circle cx="256" cy="256" r="182" stroke="url(#gold)" stroke-width="1.5" stroke-dasharray="6 6" fill="none" opacity="0.3"/>

  <!-- Star of Al-Quds / 8-pointed star subtle back decoration -->
  <g transform="translate(256 256) scale(0.9) translate(-256 -256)" opacity="0.15">
    <rect x="146" y="146" width="220" height="220" fill="none" stroke="url(#gold)" stroke-width="6"/>
    <rect x="146" y="146" width="220" height="220" transform="rotate(45 256 256)" fill="none" stroke="url(#gold)" stroke-width="6"/>
  </g>

  <!-- Main Icon Group with Drop Shadow -->
  <g filter="url(#shadow)">
    <!-- Crescent & Star -->
    <path d="M256 90 A 42 42 0 0 0 286 150 A 46 46 0 1 1 236 100 A 42 42 0 0 0 256 90 Z" fill="url(#gold-bright)"/>
    <polygon points="278,108 283,118 294,119 286,126 288,137 278,131 268,137 270,126 262,119 273,118" fill="url(#gold-bright)"/>

    <!-- Open Quran Book (Rahlah / Mushaf) -->
    <!-- Quran Pages Outline -->
    <path d="M256 370 C 205 330 135 335 90 365 V 205 C 135 175 205 170 256 210 C 307 170 377 175 422 205 V 365 C 377 335 307 330 256 370 Z" 
          fill="#064e3b" stroke="url(#gold)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Quran Central Spine -->
    <line x1="256" y1="210" x2="256" y2="370" stroke="url(#gold)" stroke-width="18" stroke-linecap="round"/>

    <!-- Gold Page Lines Left -->
    <path d="M125 242 C 160 220 210 216 235 238" stroke="url(#gold)" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.85"/>
    <path d="M125 278 C 160 256 210 252 235 274" stroke="url(#gold)" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.85"/>
    <path d="M125 314 C 160 292 210 288 235 310" stroke="url(#gold)" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.85"/>

    <!-- Gold Page Lines Right -->
    <path d="M387 242 C 352 220 302 216 277 238" stroke="url(#gold)" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.85"/>
    <path d="M387 278 C 352 256 302 252 277 274" stroke="url(#gold)" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.85"/>
    <path d="M387 314 C 352 292 302 288 277 310" stroke="url(#gold)" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.85"/>

    <!-- Base / Wooden Stand (Rahlah Base) -->
    <path d="M180 380 L 130 435 M 332 380 L 382 435 M 210 395 L 302 395" stroke="url(#gold)" stroke-width="16" stroke-linecap="round"/>
  </g>
</svg>`;

// 2. Maskable SVG for Android Adaptive Icons (Safe zone centered at 72% scale)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="glow-m" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#047857" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#022c22" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="bg-grad-m" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#021c15"/>
    </linearGradient>
    <linearGradient id="gold-m" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
    <linearGradient id="gold-bright-m" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
    <filter id="shadow-m" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Full Bleed Background for Safe Zone -->
  <rect width="512" height="512" fill="url(#bg-grad-m)"/>
  <rect width="512" height="512" fill="url(#glow-m)"/>

  <!-- Scaled content inside safe zone (72% centered) -->
  <g transform="translate(256 256) scale(0.72) translate(-256 -256)">
    <!-- Accent Rings -->
    <circle cx="256" cy="256" r="216" stroke="url(#gold-m)" stroke-width="3" stroke-dasharray="12 8" fill="none" opacity="0.35"/>
    <circle cx="256" cy="256" r="200" stroke="url(#gold-m)" stroke-width="6" fill="none" opacity="0.5"/>
    <circle cx="256" cy="256" r="182" stroke="url(#gold-m)" stroke-width="2" stroke-dasharray="6 6" fill="none" opacity="0.35"/>

    <!-- Star of Al-Quds -->
    <g transform="translate(256 256) scale(0.9) translate(-256 -256)" opacity="0.2">
      <rect x="146" y="146" width="220" height="220" fill="none" stroke="url(#gold-m)" stroke-width="6"/>
      <rect x="146" y="146" width="220" height="220" transform="rotate(45 256 256)" fill="none" stroke="url(#gold-m)" stroke-width="6"/>
    </g>

    <!-- Main Icon Group -->
    <g filter="url(#shadow-m)">
      <!-- Crescent & Star -->
      <path d="M256 90 A 42 42 0 0 0 286 150 A 46 46 0 1 1 236 100 A 42 42 0 0 0 256 90 Z" fill="url(#gold-bright-m)"/>
      <polygon points="278,108 283,118 294,119 286,126 288,137 278,131 268,137 270,126 262,119 273,118" fill="url(#gold-bright-m)"/>

      <!-- Open Quran Book -->
      <path d="M256 370 C 205 330 135 335 90 365 V 205 C 135 175 205 170 256 210 C 307 170 377 175 422 205 V 365 C 377 335 307 330 256 370 Z" 
            fill="#064e3b" stroke="url(#gold-m)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>

      <!-- Spine -->
      <line x1="256" y1="210" x2="256" y2="370" stroke="url(#gold-m)" stroke-width="18" stroke-linecap="round"/>

      <!-- Left Lines -->
      <path d="M125 242 C 160 220 210 216 235 238" stroke="url(#gold-m)" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.85"/>
      <path d="M125 278 C 160 256 210 252 235 274" stroke="url(#gold-m)" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.85"/>
      <path d="M125 314 C 160 292 210 288 235 310" stroke="url(#gold-m)" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.85"/>

      <!-- Right Lines -->
      <path d="M387 242 C 352 220 302 216 277 238" stroke="url(#gold-m)" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.85"/>
      <path d="M387 278 C 352 256 302 252 277 274" stroke="url(#gold-m)" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.85"/>
      <path d="M387 314 C 352 292 302 288 277 310" stroke="url(#gold-m)" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.85"/>

      <!-- Rahlah Stand -->
      <path d="M180 380 L 130 435 M 332 380 L 382 435 M 210 395 L 302 395" stroke="url(#gold-m)" stroke-width="16" stroke-linecap="round"/>
    </g>
  </g>
</svg>`;

async function generate() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  const publicDir = path.join(__dirname, '..', 'public');

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Update public/app-icon.svg
  fs.writeFileSync(path.join(publicDir, 'app-icon.svg'), standardSvg);
  console.log('Saved public/app-icon.svg');

  const standardBuffer = Buffer.from(standardSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  const targets = [
    // Standard PWA & General
    { file: 'icon-512.png', size: 512, buffer: standardBuffer },
    { file: 'icon-384.png', size: 384, buffer: standardBuffer },
    { file: 'icon-256.png', size: 256, buffer: standardBuffer },
    { file: 'icon-192.png', size: 192, buffer: standardBuffer },
    { file: 'icon-152.png', size: 152, buffer: standardBuffer },
    { file: 'icon-144.png', size: 144, buffer: standardBuffer },
    { file: 'icon-128.png', size: 128, buffer: standardBuffer },
    { file: 'icon-96.png', size: 96, buffer: standardBuffer },
    { file: 'icon-72.png', size: 72, buffer: standardBuffer },
    { file: 'icon-48.png', size: 48, buffer: standardBuffer },
    { file: 'favicon-32x32.png', size: 32, buffer: standardBuffer },
    { file: 'favicon-16x16.png', size: 16, buffer: standardBuffer },

    // Maskable icons for Android Adaptive Icons
    { file: 'icon-maskable-512.png', size: 512, buffer: maskableBuffer },
    { file: 'icon-maskable-192.png', size: 192, buffer: maskableBuffer },

    // Apple Touch Icons for iOS
    { file: 'apple-touch-icon.png', size: 180, buffer: standardBuffer },
    { file: 'apple-touch-icon-180x180.png', size: 180, buffer: standardBuffer },
    { file: 'apple-touch-icon-167x167.png', size: 167, buffer: standardBuffer },
    { file: 'apple-touch-icon-152x152.png', size: 152, buffer: standardBuffer },
    { file: 'apple-touch-icon-120x120.png', size: 120, buffer: standardBuffer },
  ];

  for (const t of targets) {
    const dest = path.join(iconsDir, t.file);
    await sharp(t.buffer)
      .resize(t.size, t.size, { fit: 'contain' })
      .png({ quality: 95, compressionLevel: 9 })
      .toFile(dest);
    console.log(`Generated ${t.file} (${t.size}x${t.size})`);
  }

  // Also copy apple-touch-icon to public root for old iOS safari crawler compatibility
  await sharp(standardBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Also create a favicon.ico / favicon.png in public root
  await sharp(standardBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
