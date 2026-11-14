import * as THREE from 'three';

/**
 * Generates an intricate antique dark leather cover texture with embossed
 * gold filigree borders, corner flourishes, and an astrolabe medallion.
 */
export function createLeatherCoverTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Rich midnight-indigo leather base
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#140f24');
  bg.addColorStop(0.5, '#1d1533');
  bg.addColorStop(1, '#0e0a1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Subtle leather grain noise
  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle =
      Math.random() > 0.5 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.18)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Gold filigree frame
  const goldGrad = ctx.createLinearGradient(0, 0, size, size);
  goldGrad.addColorStop(0, '#FDE68A');
  goldGrad.addColorStop(0.45, '#D97706');
  goldGrad.addColorStop(0.75, '#FBBF24');
  goldGrad.addColorStop(1, '#92400E');

  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 5;
  ctx.strokeRect(24, 24, size - 48, size - 48);

  ctx.lineWidth = 2;
  ctx.strokeRect(38, 38, size - 76, size - 76);

  // Corner mandala arcs
  const corners = [
    [38, 38],
    [size - 38, 38],
    [38, size - 38],
    [size - 38, size - 38],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Central celestial rings
  const cx = size / 2;
  const cy = size / 2;
  [120, 96, 68].forEach((r, idx) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = idx === 1 ? '#FBBF24' : 'rgba(251, 191, 36, 0.65)';
    ctx.lineWidth = idx === 1 ? 3 : 1.5;
    ctx.stroke();
  });

  // 8-point golden star geometry
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(0, -116);
    ctx.lineTo(10, -40);
    ctx.lineTo(0, 0);
    ctx.lineTo(-10, -40);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates glowing violet arcane runes & literary symbols for the book cover emissive map.
 */
export function createRuneEmissiveTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  ctx.strokeStyle = '#8B5CF6';
  ctx.shadowColor = '#A78BFA';
  ctx.shadowBlur = 16;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 108, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#C4B5FD';
  ctx.font = '600 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const glyphs = ['✦', 'क', 'Ω', 'अ', '∞', '✧', 'S', 'W'];
  glyphs.forEach((glyph, idx) => {
    const angle = (idx / glyphs.length) * Math.PI * 2;
    const x = cx + Math.cos(angle) * 144;
    const y = cy + Math.sin(angle) * 144;
    ctx.fillText(glyph, x, y);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates warm antique parchment manuscript texture for open pages.
 */
export function createParchmentTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#F5EFE2');
  grad.addColorStop(0.5, '#EDE2CC');
  grad.addColorStop(1, '#DFCFAE');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle manuscript script lines
  ctx.strokeStyle = 'rgba(88, 66, 44, 0.22)';
  ctx.lineWidth = 1.6;
  for (let y = 74; y < size - 56; y += 22) {
    const lineWidth = size - 110 - ((y * 17) % 60);
    ctx.beginPath();
    ctx.moveTo(54, y);
    ctx.lineTo(54 + lineWidth, y);
    ctx.stroke();
  }

  // Luminous violet script flourish near the center
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, size - 64, size - 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Soft radial sprite for cosmic star particles and light flares.
 */
export function createRadialGlowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(235, 224, 255, 0.85)');
  grad.addColorStop(0.55, 'rgba(139, 92, 246, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * 4x4 sprite atlas of luminous multilingual letters & glowing literary words
 * that rise from the opening book and swirl into the portal.
 */
export function createGlyphAtlasTexture(): THREE.CanvasTexture {
  const size = 1024;
  const cell = size / 4;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  const glyphs = [
    'S', 'STORY', 'क', '✦',
    'W', 'DREAM', 'অ', '∞',
    'A', 'MYTH', 'த', '✧',
    'Ω', 'TALE', 'कथा', 'গল্প',
  ];

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#FFFFFF';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#FFFFFF';

  glyphs.forEach((glyph, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const x = col * cell + cell / 2;
    const y = row * cell + cell / 2;
    const isWord = glyph.length > 1;
    ctx.font = isWord
      ? '600 44px Georgia, "Times New Roman", serif'
      : '600 108px Georgia, "Times New Roman", serif';
    ctx.fillText(glyph, x, y, cell - 24);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
