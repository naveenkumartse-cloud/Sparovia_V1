'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ShieldCheck, Eye, Layers, RotateCw, VolumeX, SunMedium, Sparkles } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';

type FrameFinish = 'bronze' | 'charcoal' | 'white' | 'oak';
type GlassType = 'acoustic' | 'solar' | 'clear';

const FRAME_FINISHES: Record<FrameFinish, { name: string; color: number; metalness: number; roughness: number; hex: string }> = {
  bronze: { name: 'Architectural Bronze', color: 0x3e2723, metalness: 0.65, roughness: 0.28, hex: '#3E2723' },
  charcoal: { name: 'Matte Anthracite', color: 0x1c2331, metalness: 0.25, roughness: 0.45, hex: '#1C2331' },
  white: { name: 'Studio Pure White', color: 0xf8fafc, metalness: 0.08, roughness: 0.4, hex: '#F8FAFC' },
  oak: { name: 'Golden Teak Woodgrain', color: 0x795548, metalness: 0.05, roughness: 0.6, hex: '#795548' },
};

const GLASS_TYPES: Record<GlassType, { name: string; color: number; opacity: number; label: string; spec: string }> = {
  acoustic: { name: 'Acoustic Double Glazed', color: 0xd1f2f9, opacity: 0.45, label: '40 dB Noise Shield', spec: '24mm Argon cavity with acoustic interlayer' },
  solar: { name: 'Solar Reflective Grey', color: 0x263238, opacity: 0.65, label: 'SHGC 0.28 Heat Cut', spec: 'Reflective metal-oxide solar radiation barrier' },
  clear: { name: 'Clear Low-E Toughened', color: 0xffffff, opacity: 0.25, label: '92% Daylight VLT', spec: 'Ultra-clear toughened thermal-insulated glass' },
};

export default function Upvc3DStudio() {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [finish, setFinish] = useState<FrameFinish>('charcoal');
  const [glass, setGlass] = useState<GlassType>('acoustic');
  const [isExploded, setIsExploded] = useState(false);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const glassMaterialsRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const leftSashGroupRef = useRef<THREE.Group | null>(null);
  const rightSashGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Rotation drag state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const modelRotationRef = useRef({ x: 0.1, y: -0.4 });
  const targetRotationRef = useRef({ x: 0.1, y: -0.4 });

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !mountRef.current) return;

    try {
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight || 460;

      // 1. Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(0x0a0f1d); // Deep architectural obsidian

      // 2. Camera
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 0.2, 5.2);
      cameraRef.current = camera;

      // 3. Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      // 4. Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
      keyLight.position.set(4, 6, 5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x90b0e0, 0.8);
      fillLight.position.set(-5, 2, -3);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xdfb95c, 1.2); // Warm gold rim light
      rimLight.position.set(0, -4, -4);
      scene.add(rimLight);

      // 5. Materials
      const currentFinishData = FRAME_FINISHES[finish];
      const frameMat = new THREE.MeshStandardMaterial({
        color: currentFinishData.color,
        metalness: currentFinishData.metalness,
        roughness: currentFinishData.roughness,
      });
      frameMaterialsRef.current = [frameMat];

      const currentGlassData = GLASS_TYPES[glass];
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: currentGlassData.color,
        transmission: 0.85,
        opacity: currentGlassData.opacity,
        transparent: true,
        roughness: 0.05,
        ior: 1.52,
        reflectivity: 0.6,
      });
      glassMaterialsRef.current = [glassMat];

      const hardwareMat = new THREE.MeshStandardMaterial({
        color: 0xce9e34,
        metalness: 0.85,
        roughness: 0.2,
      });

      // 6. Geometry construction: Precision Architectural Sliding Fenestration System
      const rootModel = new THREE.Group();
      scene.add(rootModel);

      // Outer Master Frame (Jambs, Head, Sill)
      const outerFrame = new THREE.Group();
      const frameThick = 0.12;
      const frameDepth = 0.24;
      const totalWidth = 3.4;
      const totalHeight = 2.4;

      // Head (top)
      const headGeom = new THREE.BoxGeometry(totalWidth, frameThick, frameDepth);
      const headMesh = new THREE.Mesh(headGeom, frameMat);
      headMesh.position.y = totalHeight / 2 - frameThick / 2;
      outerFrame.add(headMesh);

      // Sill (bottom multi-track threshold)
      const sillGeom = new THREE.BoxGeometry(totalWidth, frameThick * 1.2, frameDepth * 1.1);
      const sillMesh = new THREE.Mesh(sillGeom, frameMat);
      sillMesh.position.y = -totalHeight / 2 + (frameThick * 1.2) / 2;
      outerFrame.add(sillMesh);

      // Left Jamb
      const jambGeom = new THREE.BoxGeometry(frameThick, totalHeight, frameDepth);
      const leftJambMesh = new THREE.Mesh(jambGeom, frameMat);
      leftJambMesh.position.x = -totalWidth / 2 + frameThick / 2;
      outerFrame.add(leftJambMesh);

      // Right Jamb
      const rightJambMesh = new THREE.Mesh(jambGeom, frameMat);
      rightJambMesh.position.x = totalWidth / 2 - frameThick / 2;
      outerFrame.add(rightJambMesh);

      rootModel.add(outerFrame);

      // Sash Builder Helper
      const createSash = (width: number, height: number, zOffset: number) => {
        const sashGroup = new THREE.Group();
        sashGroup.position.z = zOffset;
        const sashThick = 0.09;
        const sashDepth = 0.1;

        // Top rail
        const topRail = new THREE.Mesh(new THREE.BoxGeometry(width, sashThick, sashDepth), frameMat);
        topRail.position.y = height / 2 - sashThick / 2;
        sashGroup.add(topRail);

        // Bottom rail
        const botRail = new THREE.Mesh(new THREE.BoxGeometry(width, sashThick * 1.3, sashDepth), frameMat);
        botRail.position.y = -height / 2 + (sashThick * 1.3) / 2;
        sashGroup.add(botRail);

        // Left stile
        const stileGeom = new THREE.BoxGeometry(sashThick, height, sashDepth);
        const leftStile = new THREE.Mesh(stileGeom, frameMat);
        leftStile.position.x = -width / 2 + sashThick / 2;
        sashGroup.add(leftStile);

        // Right stile
        const rightStile = new THREE.Mesh(stileGeom, frameMat);
        rightStile.position.x = width / 2 - sashThick / 2;
        sashGroup.add(rightStile);

        // Glass Pane (Insulated Double Glazed Unit)
        const glassWidth = width - sashThick * 1.8;
        const glassHeight = height - sashThick * 2.2;
        const glassMesh = new THREE.Mesh(new THREE.BoxGeometry(glassWidth, glassHeight, 0.024), glassMat);
        sashGroup.add(glassMesh);

        // Architectural Handle
        const handleStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 16), hardwareMat);
        handleStem.rotation.z = Math.PI / 2;
        handleStem.position.set(width / 2 - sashThick * 1.4, 0, sashDepth / 2 + 0.035);
        sashGroup.add(handleStem);

        return sashGroup;
      };

      const sashWidth = totalWidth / 2 + 0.08;
      const sashHeight = totalHeight - frameThick * 2.4;

      // Left Sash (Track 1)
      const leftSash = createSash(sashWidth, sashHeight, -0.04);
      leftSash.position.x = -totalWidth / 4 + 0.04;
      leftSashGroupRef.current = leftSash;
      rootModel.add(leftSash);

      // Right Sash (Track 2)
      const rightSash = createSash(sashWidth, sashHeight, 0.05);
      rightSash.position.x = totalWidth / 4 - 0.04;
      rightSashGroupRef.current = rightSash;
      rootModel.add(rightSash);

      // Floor Shadow Plane
      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 6),
        new THREE.ShadowMaterial({ opacity: 0.35 })
      );
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -totalHeight / 2;
      shadowPlane.receiveShadow = true;
      scene.add(shadowPlane);

      // 7. Render Loop with Inertia Damping
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);

        // Interpolate rotation towards target
        modelRotationRef.current.x += (targetRotationRef.current.x - modelRotationRef.current.x) * 0.08;
        modelRotationRef.current.y += (targetRotationRef.current.y - modelRotationRef.current.y) * 0.08;

        rootModel.rotation.x = modelRotationRef.current.x;
        rootModel.rotation.y = modelRotationRef.current.y;

        // Auto-rotation idle drift when not interacting
        if (!isDraggingRef.current && !shouldReduceMotion) {
          targetRotationRef.current.y += 0.002;
        }

        renderer.render(scene, camera);
      };
      animate();

      // Resize observer
      const resizeObserver = new ResizeObserver((entries) => {
        if (!entries[0] || !rendererRef.current || !cameraRef.current) return;
        const newWidth = entries[0].contentRect.width;
        const newHeight = entries[0].contentRect.height;
        cameraRef.current.aspect = newWidth / newHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newWidth, newHeight);
      });
      resizeObserver.observe(mountRef.current);

      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        resizeObserver.disconnect();
        renderer.dispose();
      };
    } catch (e) {
      console.warn('WebGL initialization failed, falling back to 2D preview:', e);
      setWebGlSupported(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Frame Finish Materials Dynamically
  useEffect(() => {
    const finishData = FRAME_FINISHES[finish];
    frameMaterialsRef.current.forEach((mat) => {
      mat.color.setHex(finishData.color);
      mat.metalness = finishData.metalness;
      mat.roughness = finishData.roughness;
      mat.needsUpdate = true;
    });
  }, [finish]);

  // Update Glass Materials Dynamically
  useEffect(() => {
    const glassData = GLASS_TYPES[glass];
    glassMaterialsRef.current.forEach((mat) => {
      mat.color.setHex(glassData.color);
      mat.opacity = glassData.opacity;
      mat.needsUpdate = true;
    });
  }, [glass]);

  // Animate Exploded Profile View
  useEffect(() => {
    if (!leftSashGroupRef.current || !rightSashGroupRef.current) return;
    const targetZLeft = isExploded ? -0.45 : -0.04;
    const targetZRight = isExploded ? 0.55 : 0.05;
    const targetXLeft = isExploded ? -1.1 : -0.81;
    const targetXRight = isExploded ? 1.1 : 0.81;

    let progress = 0;
    const initialZLeft = leftSashGroupRef.current.position.z;
    const initialZRight = rightSashGroupRef.current.position.z;
    const initialXLeft = leftSashGroupRef.current.position.x;
    const initialXRight = rightSashGroupRef.current.position.x;

    const stepExplode = () => {
      progress += 0.08;
      if (leftSashGroupRef.current && rightSashGroupRef.current) {
        leftSashGroupRef.current.position.z = THREE.MathUtils.lerp(initialZLeft, targetZLeft, progress);
        rightSashGroupRef.current.position.z = THREE.MathUtils.lerp(initialZRight, targetZRight, progress);
        leftSashGroupRef.current.position.x = THREE.MathUtils.lerp(initialXLeft, targetXLeft, progress);
        rightSashGroupRef.current.position.x = THREE.MathUtils.lerp(initialXRight, targetXRight, progress);
      }
      if (progress < 1) {
        requestAnimationFrame(stepExplode);
      }
    };
    stepExplode();
  }, [isExploded]);

  // Pointer Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    targetRotationRef.current.y += deltaX * 0.008;
    targetRotationRef.current.x = Math.max(-0.4, Math.min(0.4, targetRotationRef.current.x + deltaY * 0.006));

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const resetView = () => {
    targetRotationRef.current = { x: 0.1, y: -0.4 };
    setIsExploded(false);
  };

  return (
    <div className="w-full bg-[#080C14] border border-[#CE9E34]/25 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Studio Header HUD */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-[#0E1422]/90 backdrop-blur-md gap-4 z-20 relative">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#CE9E34] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#CE9E34] font-bold">
              [KVN // ARCHITECTURAL 3D STUDIO]
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Precision Multi-Track Sliding Glazing Configurator
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Interact in 3D: Drag to rotate 360°, inspect profiles, and test architectural finishes.
          </p>
        </div>

        {/* Studio View Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsExploded(!isExploded)}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
              isExploded
                ? 'bg-[#CE9E34] text-charcoal-900 border-[#CE9E34] shadow-[0_0_12px_rgba(206,158,52,0.4)]'
                : 'bg-white/5 text-gray-300 border-white/15 hover:border-[#CE9E34] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isExploded ? 'Collapse Frame' : 'Explode Profile'}</span>
          </button>
          <button
            type="button"
            onClick={resetView}
            className="p-1.5 rounded-[6px] bg-white/5 text-gray-400 hover:text-white border border-white/15 hover:border-[#CE9E34] transition-colors"
            title="Reset 3D Camera"
            aria-label="Reset 3D Camera View"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Viewport Canvas Container */}
      <div
        ref={mountRef}
        className="relative w-full h-[380px] sm:h-[460px] lg:h-[520px] bg-[#080C14] cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Orbit Assist Watermark */}
        <div className="absolute top-4 left-4 pointer-events-none z-10 flex items-center gap-2 px-2.5 py-1 rounded bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-gray-300">
          <Eye className="w-3.5 h-3.5 text-[#CE9E34]" />
          <span>360° ORBIT ACTIVE • DRAG TO ROTATE</span>
        </div>

        {/* Live Active Specification Overlay */}
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none max-w-xs sm:max-w-sm">
          <div className="p-3 rounded-lg bg-[#0E1422]/90 backdrop-blur-md border border-white/15 text-xs text-white shadow-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#CE9E34] uppercase tracking-wider font-bold">
                Profile Architecture
              </span>
              <span className="text-[10px] text-gray-400">70mm Depth / 5-Chamber</span>
            </div>
            <div className="font-semibold text-white">
              {FRAME_FINISHES[finish].name}
            </div>
            <div className="text-[11px] text-gray-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#CE9E34] shrink-0" />
              <span>{GLASS_TYPES[glass].spec}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="p-4 sm:p-6 bg-[#0E1422] border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6 z-20 relative">
        {/* Frame Architectural Finishes */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#CE9E34] font-bold block mb-2.5">
            Select Frame Architectural Finish:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(FRAME_FINISHES) as FrameFinish[]).map((f) => {
              const item = FRAME_FINISHES[f];
              const isSelected = finish === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFinish(f)}
                  className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between h-16 ${
                    isSelected
                      ? 'bg-white/10 border-[#CE9E34] shadow-[0_0_12px_rgba(206,158,52,0.25)]'
                      : 'bg-white/5 border-white/10 hover:border-white/30 text-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shadow-xs"
                      style={{ backgroundColor: item.hex }}
                    />
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#CE9E34]" />}
                  </div>
                  <span className="text-[11px] font-bold text-white leading-tight">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Glass Specification Selector */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#CE9E34] font-bold block mb-2.5">
            Select Acoustic &amp; Thermal Glazing:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(Object.keys(GLASS_TYPES) as GlassType[]).map((g) => {
              const item = GLASS_TYPES[g];
              const isSelected = glass === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGlass(g)}
                  className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between h-16 ${
                    isSelected
                      ? 'bg-white/10 border-[#CE9E34] shadow-[0_0_12px_rgba(206,158,52,0.25)]'
                      : 'bg-white/5 border-white/10 hover:border-white/30 text-gray-400'
                  }`}
                >
                  <span className="text-[10px] font-mono text-[#CE9E34] font-bold">
                    {item.label}
                  </span>
                  <span className="text-[11px] font-bold text-white leading-tight">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
