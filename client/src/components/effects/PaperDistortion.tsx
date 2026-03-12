import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * PaperDistortion — WebGL background that distorts the crumpled-paper
 * texture wherever the cursor moves, simulating physically pressing
 * into paper. Uses Three.js DataTexture (pixel grid) approach inspired
 * by tympanus.net/Development/DistortedPixels.
 *
 * Each cell in a low-res grid stores XY displacement values.
 * Mouse movement writes velocity into nearby cells → the fragment
 * shader offsets the paper UVs by those values → paper "crumbles".
 * Cells relax toward 0 each frame so the paper smooths back out.
 */

// ── GLSL Shaders ─────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform sampler2D uDataTexture;
  uniform vec2 uResolution;
  uniform float uDistortionStrength;
  uniform float uImageAspect;

  varying vec2 vUv;

  // Mirror-wrap: keeps UVs bouncing inside [0,1] so we
  // never sample outside the texture (no black edges).
  vec2 mirrorUV(vec2 uv) {
    vec2 m = mod(uv, 2.0);
    return mix(m, 2.0 - m, step(1.0, m));
  }

  void main() {
    float screenAspect = uResolution.x / uResolution.y;
    vec2 coverUV = vUv;

    // background-size: cover — scale image to fill, crop overflow
    if (screenAspect > uImageAspect) {
      float ratio = uImageAspect / screenAspect;
      coverUV.y = vUv.y * ratio + (1.0 - ratio) * 0.5;
    } else {
      float ratio = screenAspect / uImageAspect;
      coverUV.x = vUv.x * ratio + (1.0 - ratio) * 0.5;
    }

    // Read displacement from the DataTexture grid
    vec4 offset = texture2D(uDataTexture, vUv);

    // Fade distortion near screen edges so UVs stay in safe zone
    float edgeFade = smoothstep(0.0, 0.1, vUv.x)
                   * smoothstep(1.0, 0.9, vUv.x)
                   * smoothstep(0.0, 0.1, vUv.y)
                   * smoothstep(1.0, 0.9, vUv.y);

    // Apply distortion with edge fade
    vec2 distortedUV = coverUV - uDistortionStrength * offset.rg * edgeFade;

    // Mirror-wrap guarantees we always sample valid texture data
    distortedUV = mirrorUV(distortedUV);

    gl_FragColor = texture2D(uTexture, distortedUV);
  }
`;

// ── Component ────────────────────────────────────────────────────────

interface PaperDistortionProps {
  /** Path to the paper texture image */
  imagePath?: string;
  /** Grid resolution — lower = chunkier pixels, higher = smoother */
  gridSize?: number;
  /** How far the mouse influence reaches (0–1, fraction of screen) */
  mouseRadius?: number;
  /** Distortion intensity multiplier */
  strength?: number;
  /** How quickly distortion relaxes back (0–1, higher = faster) */
  relaxation?: number;
}

const PaperDistortion: React.FC<PaperDistortionProps> = ({
  imagePath = '/images/background.avif',
  gridSize = 128,
  mouseRadius = 0.15,
  strength = 0.06,
  relaxation = 0.9,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // ── Scene + Camera ──
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
    camera.position.z = 1;

    // ── DataTexture (distortion grid) ──
    const rows = gridSize;
    const cols = gridSize;
    const size = rows * cols;
    const data = new Float32Array(4 * size).fill(0); // RGBA
    const dataTexture = new THREE.DataTexture(
      data,
      cols,
      rows,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    dataTexture.magFilter = THREE.LinearFilter;
    dataTexture.minFilter = THREE.LinearFilter;
    dataTexture.needsUpdate = true;

    // ── Load paper texture ──
    const loader = new THREE.TextureLoader();
    const texture = loader.load(imagePath, (tex) => {
      // Once loaded, update the image aspect ratio uniform
      const img = tex.image as HTMLImageElement;
      material.uniforms.uImageAspect.value = img.width / img.height;
    });
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.MirroredRepeatWrapping;
    texture.wrapT = THREE.MirroredRepeatWrapping;

    // ── Material ──
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: texture },
        uDataTexture: { value: dataTexture },
        uResolution: {
          value: new THREE.Vector2(container.clientWidth, container.clientHeight),
        },
        uDistortionStrength: { value: strength },
        uImageAspect: { value: 1.5 }, // fallback, updated on load
      },
    });

    // ── Fullscreen quad ──
    const geometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // ── Mouse tracking ──
    const mouse = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = 1.0 - (e.clientY - rect.top) / rect.height; // flip Y for GL
      mouse.vX = mouse.x - mouse.prevX;
      mouse.vY = mouse.y - mouse.prevY;
    };
    window.addEventListener('mousemove', onMouseMove);

    // ── Touch tracking ──
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.x = (touch.clientX - rect.left) / rect.width;
      mouse.y = 1.0 - (touch.clientY - rect.top) / rect.height;
      mouse.vX = mouse.x - mouse.prevX;
      mouse.vY = mouse.y - mouse.prevY;
    };
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // ── Animation loop ──
    let animFrameId: number;

    // Max accumulated displacement per cell — keeps UV offsets
    // small so warping looks like smooth paper movement.
    const MAX_DISP = 0.6;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      const d = dataTexture.image.data as Float32Array;

      // Write mouse velocity into nearby grid cells
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const cellX = j / cols;
          const cellY = i / rows;
          const dx = cellX - mouse.x;
          const dy = cellY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseRadius) {
            const idx = 4 * (i * cols + j);
            const power = 1.0 - dist / mouseRadius;
            const powerCurve = power * power;

            d[idx]     += mouse.vX * 25 * powerCurve;
            d[idx + 1] += mouse.vY * 25 * powerCurve;
          }
        }
      }

      // Relax all cells toward zero & hard-clamp accumulated values
      for (let i = 0; i < d.length; i += 4) {
        d[i]     *= relaxation;
        d[i + 1] *= relaxation;

        // Clamp keeps displacement bounded
        if (d[i]     >  MAX_DISP) d[i]     =  MAX_DISP;
        if (d[i]     < -MAX_DISP) d[i]     = -MAX_DISP;
        if (d[i + 1] >  MAX_DISP) d[i + 1] =  MAX_DISP;
        if (d[i + 1] < -MAX_DISP) d[i + 1] = -MAX_DISP;
      }

      // Dampen mouse velocity so it doesn't keep writing when stationary
      mouse.vX *= 0.8;
      mouse.vY *= 0.8;

      dataTexture.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    // ── Resize handler ──
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      material.uniforms.uResolution.value.set(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      dataTexture.dispose();
      texture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [imagePath, gridSize, mouseRadius, strength, relaxation]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
};

export default PaperDistortion;
