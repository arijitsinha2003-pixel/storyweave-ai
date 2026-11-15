import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';
import {
  createGlyphAtlasTexture,
  createLeatherCoverTexture,
  createParchmentTexture,
  createRadialGlowTexture,
  createRuneEmissiveTexture,
} from './bookTextures';
import { CinematicAudioEngine } from './introAudio';

interface CinematicIntroProps {
  onComplete: () => void;
}

const TOTAL_DURATION = 15.0;

const SCENE_CHAPTERS = [
  { start: 0, label: 'I · Awakening of the Universe' },
  { start: 3, label: 'II · The Ancient Tome' },
  { start: 6, label: 'III · Birth of Stories' },
  { start: 9, label: 'IV · StoryWeave' },
  { start: 12, label: 'V · Entering the Studio' },
];

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<CinematicAudioEngine | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Direct DOM refs so 60fps animation never triggers React re-renders
  const rootRef = useRef<HTMLDivElement | null>(null);
  const washRef = useRef<HTMLDivElement | null>(null);
  const titleLayerRef = useRef<HTMLDivElement | null>(null);
  const sweepRef = useRef<HTMLDivElement | null>(null);
  const taglineRef = useRef<HTMLParagraphElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const topLetterboxRef = useRef<HTMLDivElement | null>(null);
  const bottomLetterboxRef = useRef<HTMLDivElement | null>(null);
  const fallbackGlowRef = useRef<HTMLDivElement | null>(null);
  const lastChapterIdxRef = useRef<number>(0);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sceneLabel, setSceneLabel] = useState(SCENE_CHAPTERS[0].label);
  const [overlayFadeOut, setOverlayFadeOut] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const userMutedRef = useRef(false);
  const isSkippingRef = useRef(false);
  const finishTimeoutRef = useRef<number | null>(null);

  const triggerFinish = () => {
    if (isSkippingRef.current) return;
    isSkippingRef.current = true;
    setOverlayFadeOut(true);
    audioRef.current?.disable();
    finishTimeoutRef.current = window.setTimeout(() => {
      finishTimeoutRef.current = null;
      audioRef.current?.dispose();
      onCompleteRef.current();
    }, 800);
  };

  const handleToggleSound = () => {
    if (!audioRef.current) {
      audioRef.current = new CinematicAudioEngine();
    }
    if (soundEnabled) {
      userMutedRef.current = true;
      audioRef.current.disable();
      setSoundEnabled(false);
    } else {
      userMutedRef.current = false;
      const started = audioRef.current.enable();
      setSoundEnabled(started);
    }
  };

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(prefersReduced);

    if (prefersReduced) {
      if (titleLayerRef.current) titleLayerRef.current.style.opacity = '1';
      if (taglineRef.current) taglineRef.current.style.opacity = '1';
      if (progressBarRef.current) progressBarRef.current.style.width = '100%';
      const timer = window.setTimeout(() => {
        triggerFinish();
      }, 2200);
      return () => window.clearTimeout(timer);
    }

    if (!audioRef.current) {
      audioRef.current = new CinematicAudioEngine();
    }
    if (!userMutedRef.current) {
      audioRef.current.enable();
    }

    const handleFirstInteraction = (event?: Event) => {
      const target = event?.target as HTMLElement | null;
      if (target?.closest('[data-intro-sound-toggle="true"]')) return;
      if (!userMutedRef.current) {
        audioRef.current?.resumeIfAllowed();
      }
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });

    const container = mountRef.current;
    if (!container) {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      return;
    }

    const isMobile = window.innerWidth < 768;

    // Detect software WebGL cleanly without altering scene content or layout
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      renderer = null;
    }

    // Fallback cosmic timeline if WebGL is unavailable on the device
    if (!renderer) {
      const fallbackStart = performance.now();
      let fallbackTimer = 0;
      let fallbackDisposed = false;

      const updateFallbackFrame = () => {
        if (fallbackDisposed) return;
        const elapsed = Math.min(TOTAL_DURATION, (performance.now() - fallbackStart) / 1000);
        const tNorm = elapsed / TOTAL_DURATION;

        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${(tNorm * 100).toFixed(1)}%`;
        }
        for (let i = SCENE_CHAPTERS.length - 1; i >= 0; i--) {
          if (elapsed >= SCENE_CHAPTERS[i].start) {
            if (lastChapterIdxRef.current !== i) {
              lastChapterIdxRef.current = i;
              setSceneLabel(SCENE_CHAPTERS[i].label);
            }
            break;
          }
        }
        audioRef.current?.updateTimeline(elapsed);

        if (fallbackGlowRef.current) {
          const pulse = smoothstep(0.3, 4.5, elapsed) * (1 - smoothstep(12.2, 14.8, elapsed));
          const scale = 0.7 + smoothstep(3.0, 9.0, elapsed) * 0.8 + smoothstep(12.0, 15.0, elapsed) * 1.4;
          fallbackGlowRef.current.style.opacity = (pulse * 0.85).toFixed(3);
          fallbackGlowRef.current.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;
        }

        const logoIn = smoothstep(9.1, 10.25, elapsed);
        const logoOut = smoothstep(13.2, 14.6, elapsed);
        if (titleLayerRef.current) {
          titleLayerRef.current.style.opacity = (logoIn * (1 - logoOut)).toFixed(3);
        }
        const tagIn = smoothstep(10.0, 11.1, elapsed);
        if (taglineRef.current) {
          taglineRef.current.style.opacity = (tagIn * (1 - logoOut)).toFixed(3);
        }
        const sweep = smoothstep(9.75, 11.65, elapsed);
        if (sweepRef.current) {
          sweepRef.current.style.transform = `translateX(${(sweep * 220 - 60).toFixed(1)}%) skewX(-20deg)`;
          sweepRef.current.style.opacity = sweep > 0.02 && sweep < 0.98 ? '0.92' : '0';
        }
        const washOp = smoothstep(12.2, 14.2, elapsed);
        if (washRef.current) {
          washRef.current.style.opacity = washOp.toFixed(3);
        }
        const barRetract = smoothstep(12.4, 14.6, elapsed);
        if (topLetterboxRef.current) {
          topLetterboxRef.current.style.transform = `translateY(-${(barRetract * 100).toFixed(1)}%)`;
        }
        if (bottomLetterboxRef.current) {
          bottomLetterboxRef.current.style.transform = `translateY(${(barRetract * 100).toFixed(1)}%)`;
        }
        const revealLanding = smoothstep(13.8, 15.0, elapsed);
        if (rootRef.current && !isSkippingRef.current) {
          rootRef.current.style.opacity = (1 - revealLanding * 0.72).toFixed(3);
        }

        if (elapsed >= TOTAL_DURATION) {
          triggerFinish();
          return;
        }
        fallbackTimer = window.requestAnimationFrame(updateFallbackFrame);
      };

      fallbackTimer = window.requestAnimationFrame(updateFallbackFrame);
      return () => {
        fallbackDisposed = true;
        window.cancelAnimationFrame(fallbackTimer);
        audioRef.current?.dispose();
      };
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04030a);
    scene.fog = new THREE.FogExp2(0x060411, 0.042);

    const baseFov = isMobile ? 54 : 46;
    const camera = new THREE.PerspectiveCamera(baseFov, width / height, 0.1, 120);
    camera.position.set(0, 0.45, isMobile ? 13.5 : 11.5);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2)
    );
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Studio environment map for metallic gold & leather highlights
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);

    // Procedural Textures
    const coverTex = createLeatherCoverTexture(maxAnisotropy);
    const runeTex = createRuneEmissiveTexture(maxAnisotropy);
    const parchmentTex = createParchmentTexture(maxAnisotropy);
    const radialTex = createRadialGlowTexture();
    const glyphAtlasTex = createGlyphAtlasTexture();

    // Lighting Rig: Warm key + cool cosmic hemisphere + electric blue rim + book core glow
    const hemiLight = new THREE.HemisphereLight(0xa78bfa, 0x090714, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.55);
    keyLight.position.set(4, 6, 7);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.25);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    const bookCoreLight = new THREE.PointLight(0xc4b5fd, 0, 15, 1.5);
    bookCoreLight.position.set(0, 0.55, 0.4);
    scene.add(bookCoreLight);

    // ------------------------------------------------------------
    // SCENE 1: Cosmic Universe Particle Field + Volumetric Core
    // ------------------------------------------------------------
    const starCount = isMobile ? 550 : 1500;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starBaseZ = new Float32Array(starCount);

    const palette = [
      new THREE.Color('#A78BFA'), // violet
      new THREE.Color('#8B5CF6'), // deep purple
      new THREE.Color('#38BDF8'), // electric blue
      new THREE.Color('#FBBF24'), // warm gold
      new THREE.Color('#F8FAFC'), // silver white
    ];

    for (let i = 0; i < starCount; i++) {
      const r = 1.4 + Math.random() * 14.5;
      const theta = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 34 - 4;
      starPositions[i * 3] = Math.cos(theta) * r;
      starPositions[i * 3 + 1] = Math.sin(theta) * r * 0.72;
      starPositions[i * 3 + 2] = z;
      starBaseZ[i] = z;

      const col = palette[Math.floor(Math.random() * palette.length)];
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: isMobile ? 0.24 : 0.21,
      map: radialTex,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // Dual-layer Volumetric Awakening Nebula Halos
    const centerGlowMat = new THREE.SpriteMaterial({
      map: radialTex,
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const centerGlowSprite = new THREE.Sprite(centerGlowMat);
    centerGlowSprite.scale.set(6.8, 6.8, 1);
    centerGlowSprite.position.set(0, 0, -2.5);
    scene.add(centerGlowSprite);

    const blueNebulaMat = new THREE.SpriteMaterial({
      map: radialTex,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const blueNebulaSprite = new THREE.Sprite(blueNebulaMat);
    blueNebulaSprite.scale.set(4.5, 4.5, 1);
    blueNebulaSprite.position.set(0.35, -0.2, -3.1);
    scene.add(blueNebulaSprite);

    // ------------------------------------------------------------
    // SCENE 2: Composite 3D Ancient Magical Book (10+ PBR parts)
    // ------------------------------------------------------------
    const bookGroup = new THREE.Group();
    bookGroup.position.set(0, -1.2, -1.5);
    bookGroup.rotation.set(0.55, -1.15, 0.04);
    bookGroup.scale.setScalar(0.01);
    scene.add(bookGroup);

    const leatherMat = new THREE.MeshPhysicalMaterial({
      map: coverTex,
      emissiveMap: runeTex,
      emissive: new THREE.Color(0x9d7bff),
      emissiveIntensity: 0.45,
      roughness: 0.48,
      metalness: 0.15,
      clearcoat: 0.38,
      clearcoatRoughness: 0.36,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.92,
      roughness: 0.2,
    });

    const paperMat = new THREE.MeshStandardMaterial({
      map: parchmentTex,
      roughness: 0.85,
      metalness: 0.02,
      emissive: new THREE.Color(0x7c3aed),
      emissiveIntensity: 0.09,
    });

    const gildedEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      metalness: 0.72,
      roughness: 0.3,
    });

    // Spine + gold ribs
    const spineGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.75, 16, 1, false, 0, Math.PI);
    const spineMesh = new THREE.Mesh(spineGeo, leatherMat);
    spineMesh.rotation.y = Math.PI;
    bookGroup.add(spineMesh);

    const bandGeo = new THREE.TorusGeometry(0.185, 0.022, 8, 20, Math.PI);
    [-1.0, -0.35, 0.35, 1.0].forEach((yPos) => {
      const band = new THREE.Mesh(bandGeo, goldMat);
      band.position.y = yPos;
      band.rotation.x = Math.PI / 2;
      band.rotation.z = Math.PI / 2;
      bookGroup.add(band);
    });

    // Hinged Left & Right Covers + Page Blocks
    const leftHinge = new THREE.Group();
    leftHinge.position.set(-0.08, 0, 0);
    bookGroup.add(leftHinge);

    const rightHinge = new THREE.Group();
    rightHinge.position.set(0.08, 0, 0);
    bookGroup.add(rightHinge);

    const coverW = 1.95;
    const coverH = 2.72;
    const coverT = 0.08;

    const coverGeo = new THREE.BoxGeometry(coverW, coverH, coverT);
    const leftCover = new THREE.Mesh(coverGeo, leatherMat);
    leftCover.position.set(-coverW / 2, 0, -0.11);
    leftHinge.add(leftCover);

    const rightCover = new THREE.Mesh(coverGeo, leatherMat);
    rightCover.position.set(coverW / 2, 0, -0.11);
    rightHinge.add(rightCover);

    // Gold corner clasps + glowing front emblem gem
    const claspGeo = new THREE.BoxGeometry(0.24, 0.24, 0.105);
    [
      [-coverW + 0.12, coverH / 2 - 0.12],
      [-coverW + 0.12, -coverH / 2 + 0.12],
    ].forEach(([cx, cy]) => {
      const clasp = new THREE.Mesh(claspGeo, goldMat);
      clasp.position.set(cx, cy, -0.11);
      leftHinge.add(clasp);
    });
    [
      [coverW - 0.12, coverH / 2 - 0.12],
      [coverW - 0.12, -coverH / 2 + 0.12],
    ].forEach(([cx, cy]) => {
      const clasp = new THREE.Mesh(claspGeo, goldMat);
      clasp.position.set(cx, cy, -0.11);
      rightHinge.add(clasp);
    });

    const gemGeo = new THREE.OctahedronGeometry(0.2, 0);
    const gemMat = new THREE.MeshPhysicalMaterial({
      color: 0xa78bfa,
      emissive: 0x8b5cf6,
      emissiveIntensity: 1.6,
      roughness: 0.1,
      metalness: 0.1,
    });
    const rightGem = new THREE.Mesh(gemGeo, gemMat);
    rightGem.position.set(coverW / 2, 0, -0.18);
    rightGem.scale.set(1, 1.3, 0.35);
    rightHinge.add(rightGem);

    // Parchment Page Blocks inside covers
    const pageBlockGeo = new THREE.BoxGeometry(coverW - 0.14, coverH - 0.18, 0.11);
    const leftPages = new THREE.Mesh(pageBlockGeo, [
      gildedEdgeMat,
      gildedEdgeMat,
      gildedEdgeMat,
      gildedEdgeMat,
      paperMat,
      gildedEdgeMat,
    ]);
    leftPages.position.set(-(coverW - 0.14) / 2, 0, -0.02);
    leftHinge.add(leftPages);

    const rightPages = new THREE.Mesh(pageBlockGeo, [
      gildedEdgeMat,
      gildedEdgeMat,
      gildedEdgeMat,
      gildedEdgeMat,
      paperMat,
      gildedEdgeMat,
    ]);
    rightPages.position.set((coverW - 0.14) / 2, 0, -0.02);
    rightHinge.add(rightPages);

    // Animated fanning inner parchment sheets
    const fanningSheets: THREE.Mesh[] = [];
    const sheetGeo = new THREE.PlaneGeometry(coverW - 0.2, coverH - 0.24);
    sheetGeo.translate((coverW - 0.2) / 2, 0, 0);
    for (let i = 0; i < 4; i++) {
      const sheet = new THREE.Mesh(
        sheetGeo,
        new THREE.MeshStandardMaterial({
          map: parchmentTex,
          side: THREE.DoubleSide,
          roughness: 0.78,
          emissive: new THREE.Color(0xc4b5fd),
          emissiveIntensity: 0.22,
        })
      );
      sheet.position.set(0, 0, 0.04 + i * 0.005);
      bookGroup.add(sheet);
      fanningSheets.push(sheet);
    }

    // Layered Volumetric Light Beam Cones emerging from open pages
    const beamGroup = new THREE.Group();
    bookGroup.add(beamGroup);

    const innerBeamMat = new THREE.MeshBasicMaterial({
      color: 0xe9d5ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const innerRayGeo = new THREE.ConeGeometry(1.45, 5.6, 24, 1, true);
    innerRayGeo.translate(0, 2.8, 0);
    const innerBeam = new THREE.Mesh(innerRayGeo, innerBeamMat);
    innerBeam.rotation.x = Math.PI / 2;
    beamGroup.add(innerBeam);

    const outerBeamMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const outerRayGeo = new THREE.ConeGeometry(2.6, 6.4, 24, 1, true);
    outerRayGeo.translate(0, 3.2, 0);
    const outerBeam = new THREE.Mesh(outerRayGeo, outerBeamMat);
    outerBeam.rotation.x = Math.PI / 2;
    beamGroup.add(outerBeam);

    // ------------------------------------------------------------
    // SCENE 3: Rising Luminous Letters + Flowing Light Trails + Portal
    // ------------------------------------------------------------
    const glyphCount = isMobile ? 220 : 520;
    const glyphPos = new Float32Array(glyphCount * 3);
    const glyphCol = new Float32Array(glyphCount * 3);
    const glyphTile = new Float32Array(glyphCount);
    const glyphSize = new Float32Array(glyphCount);
    const glyphSeed = new Float32Array(glyphCount * 3);

    for (let i = 0; i < glyphCount; i++) {
      glyphTile[i] = Math.floor(Math.random() * 16);
      glyphSize[i] = (isMobile ? 22 : 28) + Math.random() * 22;
      glyphSeed[i * 3] = Math.random() * Math.PI * 2;
      glyphSeed[i * 3 + 1] = 0.6 + Math.random() * 2.8;
      glyphSeed[i * 3 + 2] = Math.random();

      const c = palette[Math.floor(Math.random() * palette.length)];
      glyphCol[i * 3] = c.r;
      glyphCol[i * 3 + 1] = c.g;
      glyphCol[i * 3 + 2] = c.b;
    }

    const glyphGeo = new THREE.BufferGeometry();
    glyphGeo.setAttribute('position', new THREE.BufferAttribute(glyphPos, 3));
    glyphGeo.setAttribute('aColor', new THREE.BufferAttribute(glyphCol, 3));
    glyphGeo.setAttribute('aTile', new THREE.BufferAttribute(glyphTile, 1));
    glyphGeo.setAttribute('aSize', new THREE.BufferAttribute(glyphSize, 1));

    const glyphMat = new THREE.ShaderMaterial({
      uniforms: {
        uAtlas: { value: glyphAtlasTex },
        uOpacity: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float aTile;
        attribute float aSize;
        attribute vec3 aColor;
        uniform float uPixelRatio;
        varying float vTile;
        varying vec3 vColor;

        void main() {
          vTile = aTile;
          vColor = aColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio * (6.0 / max(1.0, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uAtlas;
        uniform float uOpacity;
        varying float vTile;
        varying vec3 vColor;

        void main() {
          float col = mod(floor(vTile + 0.5), 4.0);
          float row = floor((vTile + 0.5) / 4.0);
          vec2 uv = vec2(
            (col + gl_PointCoord.x) * 0.25,
            1.0 - (row + gl_PointCoord.y) * 0.25
          );
          vec4 tex = texture2D(uAtlas, uv);
          float alpha = tex.a * uOpacity;
          if (alpha < 0.02) discard;
          gl_FragColor = vec4(vColor * (0.95 + tex.rgb * 0.35), alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const glyphPoints = new THREE.Points(glyphGeo, glyphMat);
    glyphPoints.frustumCulled = false;
    scene.add(glyphPoints);

    // Flowing Light Trail Particles swirling around the book-to-portal corridor
    const trailCount = isMobile ? 240 : 620;
    const trailPos = new Float32Array(trailCount * 3);
    const trailCol = new Float32Array(trailCount * 3);
    const trailSeed = new Float32Array(trailCount * 3);

    for (let i = 0; i < trailCount; i++) {
      trailSeed[i * 3] = (i / trailCount) * Math.PI * 10; // spiral arm phase
      trailSeed[i * 3 + 1] = 0.5 + (i % 7) * 0.38; // ribbon radius
      trailSeed[i * 3 + 2] = Math.random();
      const c = palette[(i + 1) % palette.length];
      trailCol[i * 3] = c.r;
      trailCol[i * 3 + 1] = c.g;
      trailCol[i * 3 + 2] = c.b;
    }

    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setAttribute('color', new THREE.BufferAttribute(trailCol, 3));

    const trailMat = new THREE.PointsMaterial({
      size: isMobile ? 0.16 : 0.14,
      map: radialTex,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const trailPoints = new THREE.Points(trailGeo, trailMat);
    trailPoints.frustumCulled = false;
    scene.add(trailPoints);

    // Circular Luminous Portal at z = -6.2
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 0.1, -6.2);
    portalGroup.scale.setScalar(0.01);
    scene.add(portalGroup);

    const portalTorusMat = new THREE.MeshBasicMaterial({
      color: 0xa78bfa,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const portalTorus = new THREE.Mesh(
      new THREE.TorusGeometry(2.8, 0.065, 16, 96),
      portalTorusMat
    );
    portalGroup.add(portalTorus);

    const portalOuterMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const portalOuterRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.28, 0.032, 12, 96),
      portalOuterMat
    );
    portalGroup.add(portalOuterRing);

    const portalGoldMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const portalGoldRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.45, 0.022, 12, 84),
      portalGoldMat
    );
    portalGroup.add(portalGoldRing);

    const portalCoreHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: radialTex,
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    portalCoreHalo.scale.set(9.8, 9.8, 1);
    portalGroup.add(portalCoreHalo);

    // Pre-compile shaders on hardware GPUs
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const startTime = performance.now();
    let frameId = 0;
    let finished = false;
    let disposed = false;

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl?.fenceSync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const elapsed = Math.min(TOTAL_DURATION, (performance.now() - startTime) / 1000);
      const tNorm = elapsed / TOTAL_DURATION;

      // Update progress bar directly without React re-render
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${(tNorm * 100).toFixed(1)}%`;
      }

      // Only notify React when scene chapter index actually changes (5 times total)
      for (let i = SCENE_CHAPTERS.length - 1; i >= 0; i--) {
        if (elapsed >= SCENE_CHAPTERS[i].start) {
          if (lastChapterIdxRef.current !== i) {
            lastChapterIdxRef.current = i;
            setSceneLabel(SCENE_CHAPTERS[i].label);
          }
          break;
        }
      }

      audioRef.current?.updateTimeline(elapsed);

      // ----------------------------------------------------------
      // SCENE 1 (0 - 3s): Awakening Universe & Volumetric Stars
      // ----------------------------------------------------------
      const universeFade = smoothstep(0.15, 2.2, elapsed);
      const expansionScale = 1 + smoothstep(12.0, 15.0, elapsed) * 2.4;
      starMat.opacity =
        universeFade * (1 - smoothstep(13.2, 15.0, elapsed)) * 0.94;
      starPoints.rotation.z = elapsed * 0.045;
      starPoints.scale.setScalar(expansionScale);

      const posAttr = starGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < starCount; i++) {
        let z = starBaseZ[i] + elapsed * 1.15;
        if (z > 14) z -= 34;
        posAttr.setZ(i, z);
      }
      posAttr.needsUpdate = true;

      const glowFade =
        smoothstep(0.4, 2.5, elapsed) * (1 - smoothstep(8.2, 10.2, elapsed));
      centerGlowMat.opacity = glowFade * 0.68;
      blueNebulaMat.opacity = glowFade * 0.36;
      const glowPulse = 6.2 + Math.sin(elapsed * 1.6) * 0.45;
      centerGlowSprite.scale.set(glowPulse, glowPulse, 1);

      // ----------------------------------------------------------
      // SCENE 2 (3 - 6s): Ancient Magical Book Emerges & Opens
      // ----------------------------------------------------------
      const bookAppear = smoothstep(2.6, 4.3, elapsed);
      const bookExit = smoothstep(7.2, 8.8, elapsed);
      const bookVis = bookAppear * (1 - bookExit);

      bookGroup.visible = bookVis > 0.01;
      if (bookGroup.visible) {
        const openAmt = smoothstep(3.8, 5.9, elapsed);
        const s = (isMobile ? 0.72 : 0.96) * bookAppear * (1 + bookExit * 0.25);
        bookGroup.scale.setScalar(Math.max(0.01, s));
        bookGroup.position.y =
          THREE.MathUtils.lerp(-1.3, 0.08, bookAppear) + Math.sin(elapsed * 1.3) * 0.06;
        bookGroup.position.z = THREE.MathUtils.lerp(-1.8, 0.4, bookAppear);
        bookGroup.rotation.x = THREE.MathUtils.lerp(0.55, 0.36, openAmt);
        bookGroup.rotation.y =
          THREE.MathUtils.lerp(-1.15, 0.0, openAmt) + Math.sin(elapsed * 0.7) * 0.06;

        leftHinge.rotation.y = THREE.MathUtils.lerp(1.48, 0.24, openAmt);
        rightHinge.rotation.y = THREE.MathUtils.lerp(-1.48, -0.24, openAmt);

        fanningSheets.forEach((sheet, idx) => {
          const fanPhase = smoothstep(4.2 + idx * 0.16, 6.0 + idx * 0.15, elapsed);
          sheet.rotation.y = THREE.MathUtils.lerp(
            -1.42,
            0.22 - idx * 0.14,
            fanPhase
          );
        });

        leatherMat.emissiveIntensity = 0.48 + openAmt * 1.55;
        bookCoreLight.intensity = openAmt * 4.8 * (1 - bookExit);
        innerBeamMat.opacity = openAmt * 0.34 * (1 - bookExit);
        outerBeamMat.opacity = openAmt * 0.18 * (1 - bookExit);
      }

      // ----------------------------------------------------------
      // SCENE 3 (6 - 9s): Luminous Letters, Flowing Trails & Portal
      // ----------------------------------------------------------
      const birthProgress = smoothstep(5.4, 8.9, elapsed);
      const convergeToLogo = smoothstep(9.0, 11.4, elapsed);
      const explodeOut = smoothstep(12.1, 14.8, elapsed);

      const glyphFade =
        smoothstep(5.2, 6.2, elapsed) * (1 - smoothstep(12.4, 14.6, elapsed));
      glyphMat.uniforms.uOpacity.value = glyphFade;

      if (glyphFade > 0.01) {
        const gAttr = glyphGeo.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < glyphCount; i++) {
          const angle0 = glyphSeed[i * 3];
          const rad0 = glyphSeed[i * 3 + 1];
          const phase = glyphSeed[i * 3 + 2];

          const angle = angle0 + elapsed * (0.68 + phase * 0.42);
          const portalRadius = 2.4 + Math.sin(phase * Math.PI * 2 + elapsed) * 0.85;
          const r = THREE.MathUtils.lerp(
            rad0 * (0.25 + birthProgress * 1.15),
            portalRadius,
            smoothstep(6.2, 8.4, elapsed)
          );
          const finalR =
            r * (1 - convergeToLogo * 0.5) * (1 + explodeOut * 3.6);

          const targetZ = THREE.MathUtils.lerp(
            0.3 + phase * 1.2,
            -6.2 + (phase - 0.5) * 4.5,
            birthProgress
          );
          const logoZ = THREE.MathUtils.lerp(targetZ, -11.5 - phase * 2.5, convergeToLogo);

          gAttr.setXYZ(
            i,
            Math.cos(angle) * finalR,
            Math.sin(angle) * finalR * 0.72 + (1 - birthProgress) * 0.2,
            logoZ
          );
        }
        gAttr.needsUpdate = true;
      }

      // Flowing Light Trail Ribbon
      const trailFade =
        smoothstep(5.6, 6.8, elapsed) * (1 - smoothstep(12.6, 14.7, elapsed));
      trailMat.opacity = trailFade * 0.78;
      if (trailFade > 0.01) {
        const tAttr = trailGeo.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < trailCount; i++) {
          const theta0 = trailSeed[i * 3];
          const rad0 = trailSeed[i * 3 + 1];
          const phase = trailSeed[i * 3 + 2];
          const ang = theta0 + elapsed * 1.25;
          const swirlR =
            rad0 *
            (0.6 + birthProgress * 0.9) *
            (1 - convergeToLogo * 0.55) *
            (1 + explodeOut * 3.2);
          const z = THREE.MathUtils.lerp(0.2, -10.8, (phase + birthProgress) * 0.5);
          tAttr.setXYZ(
            i,
            Math.cos(ang) * swirlR,
            Math.sin(ang) * swirlR * 0.68,
            z - convergeToLogo * 2.0
          );
        }
        tAttr.needsUpdate = true;
      }

      // Circular Portal
      const portalAppear = smoothstep(5.9, 7.3, elapsed);
      const portalFadeOut = smoothstep(9.2, 10.6, elapsed);
      const portalVis = portalAppear * (1 - portalFadeOut);
      portalGroup.visible = portalVis > 0.01;
      if (portalGroup.visible) {
        portalGroup.scale.setScalar(0.35 + portalAppear * 0.88);
        portalTorus.rotation.z = elapsed * 0.9;
        portalOuterRing.rotation.z = -elapsed * 0.55;
        portalGoldRing.rotation.z = elapsed * 1.3;
        portalTorusMat.opacity = portalVis * 0.85;
        portalOuterMat.opacity = portalVis * 0.58;
        portalGoldMat.opacity = portalVis * 0.42;
        (portalCoreHalo.material as THREE.SpriteMaterial).opacity = portalVis * 0.46;
      }

      // Camera Flight Path across all 5 scenes
      const camZ =
        elapsed < 3.0
          ? THREE.MathUtils.lerp(isMobile ? 13.5 : 11.5, isMobile ? 8.8 : 7.3, smoothstep(0, 3.0, elapsed))
          : elapsed < 6.0
          ? THREE.MathUtils.lerp(isMobile ? 8.8 : 7.3, isMobile ? 6.6 : 5.2, smoothstep(3.0, 6.0, elapsed))
          : elapsed < 9.3
          ? THREE.MathUtils.lerp(isMobile ? 6.6 : 5.2, -7.8, smoothstep(6.0, 9.2, elapsed))
          : -7.8 - smoothstep(9.2, 15.0, elapsed) * 1.4;

      camera.position.z = camZ;
      camera.position.y =
        THREE.MathUtils.lerp(0.5, 0.12, smoothstep(0, 6.0, elapsed)) +
        Math.sin(elapsed * 0.55) * 0.04;
      camera.position.x = Math.sin(elapsed * 0.35) * 0.14;
      camera.lookAt(0, 0.05, camZ - 6.0);

      const portalWarp =
        smoothstep(6.8, 8.2, elapsed) * (1 - smoothstep(8.2, 9.8, elapsed));
      camera.fov = baseFov + portalWarp * 11;
      camera.updateProjectionMatrix();

      // ----------------------------------------------------------
      // SCENE 4 & 5 (9 - 15s): STORYWEAVE Reveal + Gradient Transition
      // ----------------------------------------------------------
      const logoIn = smoothstep(9.1, 10.25, elapsed);
      const logoOut = smoothstep(13.2, 14.6, elapsed);
      const titleOp = logoIn * (1 - logoOut);
      if (titleLayerRef.current) {
        titleLayerRef.current.style.opacity = titleOp.toFixed(3);
      }

      const tagIn = smoothstep(10.0, 11.1, elapsed);
      if (taglineRef.current) {
        taglineRef.current.style.opacity = (tagIn * (1 - logoOut)).toFixed(3);
      }

      const sweep = smoothstep(9.75, 11.65, elapsed);
      if (sweepRef.current) {
        sweepRef.current.style.transform = `translateX(${(sweep * 220 - 60).toFixed(1)}%) skewX(-20deg)`;
        sweepRef.current.style.opacity = sweep > 0.02 && sweep < 0.98 ? '0.92' : '0';
      }

      const washOp = smoothstep(12.2, 14.2, elapsed);
      if (washRef.current) {
        washRef.current.style.opacity = washOp.toFixed(3);
      }

      const barRetract = smoothstep(12.4, 14.6, elapsed);
      if (topLetterboxRef.current) {
        topLetterboxRef.current.style.transform = `translateY(-${(barRetract * 100).toFixed(1)}%)`;
      }
      if (bottomLetterboxRef.current) {
        bottomLetterboxRef.current.style.transform = `translateY(${(barRetract * 100).toFixed(1)}%)`;
      }
      const revealLanding = smoothstep(13.8, 15.0, elapsed);
      if (rootRef.current && !isSkippingRef.current) {
        rootRef.current.style.opacity = (1 - revealLanding * 0.72).toFixed(3);
      }

      renderer.render(scene, camera);

      if (elapsed >= TOTAL_DURATION && !finished) {
        finished = true;
        triggerFinish();
        return;
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      renderer.render(scene, camera);
      afterDraw(tick);
    } else {
      frameId = window.requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      if (finishTimeoutRef.current !== null) {
        window.clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      audioRef.current?.dispose();

      starGeo.dispose();
      starMat.dispose();
      glyphGeo.dispose();
      glyphMat.dispose();
      trailGeo.dispose();
      trailMat.dispose();
      coverTex.dispose();
      runeTex.dispose();
      parchmentTex.dispose();
      radialTex.dispose();
      glyphAtlasTex.dispose();
      envTarget.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`fixed inset-0 z-[100] overflow-hidden select-none transition-opacity duration-700 ease-out ${
        overlayFadeOut ? '!opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#04030A' }}
      aria-label="StoryWeave Cinematic Introduction"
    >
      {/* Isolated WebGL Container */}
      {!reducedMotion && (
        <div
          ref={mountRef}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        />
      )}

      {/* Fallback Cosmic Nebula (visible only when WebGL canvas is unavailable) */}
      <div
        ref={fallbackGlowRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 w-[540px] h-[540px] rounded-full"
        style={{
          opacity: 0,
          transform: 'translate(-50%, -50%) scale(0.8)',
          background:
            'radial-gradient(circle, rgba(167,139,250,0.45) 0%, rgba(56,189,248,0.22) 38%, rgba(251,191,36,0.08) 60%, transparent 78%)',
        }}
      />

      {/* Widescreen Cinema Letterbox Framing (retracts smoothly in Scene 5) */}
      <div
        ref={topLetterboxRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 inset-x-0 h-8 sm:h-11 z-10 border-b border-[#A78BFA]/10"
        style={{ backgroundColor: '#020106' }}
      />
      <div
        ref={bottomLetterboxRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 inset-x-0 h-8 sm:h-11 z-10 border-t border-[#A78BFA]/10"
        style={{ backgroundColor: '#020106' }}
      />

      {/* Scene 5 Purple Radial Gradient Transition Wash */}
      <div
        ref={washRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0,
          background:
            'radial-gradient(circle at 50% 45%, rgba(167,139,250,0.44) 0%, rgba(99,102,241,0.34) 40%, rgba(11,11,20,0.96) 85%)',
        }}
      />

      {/* Scene 4 Center Typography Reveal */}
      <div
        ref={titleLayerRef}
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none"
        style={{ opacity: 0 }}
      >
        <p className="text-[11px] sm:text-xs tracking-[0.28em] uppercase text-[#C4B5FD]/85 mb-4 font-medium">
          Every story begins with imagination
        </p>

        <div className="relative inline-block">
          <h1
            className="font-display font-extrabold tracking-[0.22em] sm:tracking-[0.28em] text-4xl sm:text-6xl md:text-7xl text-transparent bg-clip-text"
            style={{
              backgroundImage:
                'linear-gradient(125deg, #F8FAFC 12%, #C4B5FD 48%, #F8FAFC 88%)',
              filter: 'drop-shadow(0 0 28px rgba(139, 92, 246, 0.72))',
            }}
          >
            STORYWEAVE
          </h1>

          {/* Golden Light Sweep Across the Letters */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none overflow-hidden"
          >
            <div
              ref={sweepRef}
              className="h-full w-24 sm:w-36"
              style={{
                opacity: 0,
                background:
                  'linear-gradient(90deg, transparent, rgba(251,191,36,0.48), rgba(255,255,255,0.6), transparent)',
              }}
            />
          </div>
        </div>

        <p
          ref={taglineRef}
          className="mt-5 text-sm sm:text-lg md:text-xl font-medium text-[#E2E8F0] tracking-wide max-w-2xl"
          style={{ opacity: 0 }}
        >
          Your Imagination. Our Intelligence. Infinite Stories.
        </p>
      </div>

      {/* Top-Right Controls: Sound Toggle + Skip Intro (solid rgba, zero backdrop-filter over WebGL) */}
      <div className="absolute top-10 right-4 sm:top-14 sm:right-6 z-20 flex items-center gap-2.5">
        {!reducedMotion && (
          <button
            type="button"
            data-intro-sound-toggle="true"
            onClick={handleToggleSound}
            aria-label={soundEnabled ? 'Disable intro sound' : 'Sound disabled'}
            aria-pressed={!soundEnabled}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#E2E8F0] border border-[#A78BFA]/25 hover:border-[#A78BFA]/60 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(11, 11, 20, 0.8)' }}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[#FBBF24]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-[#A78BFA]" />
            )}
            <span>
              {soundEnabled ? 'Disable Sound' : 'Sound Off'}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={triggerFinish}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#F8FAFC] border border-[#A78BFA]/35 hover:border-[#A78BFA] hover:bg-[#8B5CF6]/25 transition-colors cursor-pointer"
          style={{ backgroundColor: 'rgba(11, 11, 20, 0.84)' }}
        >
          <span>Skip Intro</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Subtle Progress & Scene Chapter Indicator */}
      <div className="absolute bottom-11 sm:bottom-14 left-1/2 -translate-x-1/2 w-[min(420px,88vw)] z-20 flex flex-col items-center gap-2 pointer-events-none">
        <div className="text-[11px] font-medium tracking-wider uppercase text-[#C4B5FD]/85">
          {sceneLabel}
        </div>
        <div
          className="w-full h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(167, 139, 250, 0.16)' }}
        >
          <div
            ref={progressBarRef}
            className="h-full rounded-full"
            style={{
              width: '0%',
              background: 'linear-gradient(90deg, #8B5CF6, #38BDF8, #FBBF24)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
