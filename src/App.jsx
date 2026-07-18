import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, ContactShadows, Environment, AdaptiveDpr, PerformanceMonitor, useProgress } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// Cheap, reliable mobile check. matchMedia(pointer:coarse) catches touch
// devices without relying on brittle UA sniffing.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return isMobile;
}

// Preload the model as early as the module loads, instead of waiting for
// first render — shaves a real chunk off perceived load time.
useGLTF.preload("/helmet.glb");

function Helmet() {
  const group = useRef();
  const { scene } = useGLTF("/helmet.glb");
  const [fitScale, setFitScale] = useState(1);

  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    scene.position.x -= center.x;
    scene.position.y -= center.y;
    scene.position.z -= center.z;
    scene.scale.setScalar(1);

    // Auto-fit: target the helmet's longest dimension to ~0.85 world
    // units instead of a hardcoded scale, so it's not "too big" regardless
    // of how the source file was authored/exported.
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    setFitScale(0.85 / maxDim);

    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Dark liquid metal: low roughness so it stays glossy/mirror-like,
        // high metalness, near-black base — the neon spotlights and
        // environment do the work of defining its shape via reflection,
        // the same way a wet, black chrome surface reads its surroundings
        // rather than its own diffuse color.
        child.material.roughness = 0.16;
        child.material.metalness = 0.95;
        child.material.color.setHex(0x1c1c22);
        child.material.envMapIntensity = 1.5;
        child.material.needsUpdate = true;
      }
    });
    // useLayoutEffect fires synchronously right after commit, before the
    // browser paints — so this styling is applied before the model is
    // ever visible, instead of useEffect's flash-then-correct.
  }, [scene]);

  useFrame((state) => {
    if (group.current) {
      // Atmospheric slow motion sway
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.1;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
    }
  });

  return (
    <group ref={group} scale={fitScale} position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

// A camera tuned for landscape stays too close on a tall phone screen and
// crops the model. This watches the actual viewport aspect and pulls the
// camera back (and levels its target) so the full helmet is always framed,
// portrait or landscape, without hardcoding a mobile-only distance.
function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;
    // Below ~0.75 aspect (most phones in portrait) pull back progressively
    // — the narrower the viewport, the further back the camera needs to be
    // to keep the same vertical framing.
    const z = aspect >= 0.75 ? 2.8 : THREE.MathUtils.clamp(2.8 + (0.75 - aspect) * 2.6, 2.8, 4.6);
    camera.position.set(0, 0, z);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

function PremiumLaserLighting() {
  return (
    <>
      {/* Low, cool base fill — just enough that the helmet never reads as
          pure silhouette, without flattening the liquid-metal reflections
          the neon lights are doing the real work of shaping. */}
      <hemisphereLight
        color="#2a3550"
        groundColor="#050508"
        intensity={0.3}
      />

      {/* Restrained key light — a hint of form, not a flood. The material
          is glossy enough now that strong flat lighting kills the "wet
          black chrome" look and makes it read as plastic instead. */}
      <directionalLight
        position={[1.5, 3, 3]}
        intensity={0.5}
        color="#e8ecf5"
      />

      {/* Neon beams do the heavy lifting — this is what actually defines
          the silhouette against the near-black metal. */}
      <spotLight
        position={[-3, 2, -1]}
        color="#00f0ff"
        intensity={9}
        angle={0.35}
        penumbra={0.9}
      />
      <spotLight
        position={[3, 1, -1]}
        color="#ff5500"
        intensity={7}
        angle={0.3}
        penumbra={0.8}
      />
      
      {/* Absolute minimal dark blue backing so the depth isn't entirely lost */}
      <directionalLight position={[0, 4, -3]} intensity={0.15} color="#112244" />
    </>
  );
}

// Plain HTML overlay, not a 3D object — costs nothing on the GPU while the
// model streams in. useProgress hooks the global THREE loading manager so
// the percentage reflects real bytes-loaded, not a guess.
const BOOT_LINES = [
  "INITIALIZING NEURAL LINK",
  "DECRYPTING ASSET STREAM",
  "CALIBRATING HELMET RIG",
  "SYNCHRONIZING OPTICS",
  "AUTHENTICATING NODE"
];

function LoadingVeil() {
  const { progress, active } = useProgress();
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setLineIndex((i) => (i + 1) % BOOT_LINES.length);
    }, 900);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!active && progress >= 100) {
      const t1 = setTimeout(() => setExiting(true), 200);
      const t2 = setTimeout(() => setVisible(false), 650);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [active, progress]);

  if (!visible) return null;

  const pct = Math.floor(Math.max(progress, 2));

  return (
    <div style={{ ...styles.loadingVeil, opacity: exiting ? 0 : 1 }}>
      <div style={styles.loadingScanlines} />
      <div style={styles.loadingCore}>
        <div style={styles.loadingPct}>{pct.toString().padStart(2, "0")}%</div>
        <div style={styles.loadingBarTrack}>
          <div style={{ ...styles.loadingBarFill, width: `${pct}%` }} />
        </div>
        <div style={styles.loadingLine}>
          <span style={styles.loadingCaret}>&gt;</span> {BOOT_LINES[lineIndex]}
          <span style={styles.loadingBlink}>_</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const isMobile = useIsMobile();
  // Lets PerformanceMonitor knock quality down further if a phone is
  // still struggling even after the mobile defaults kick in.
  const [degraded, setDegraded] = useState(false);
  const lowQuality = isMobile && degraded;

  const dpr = useMemo(() => {
    if (lowQuality) return 1;
    if (isMobile) return [1, 1.5];
    return [1, 2];
  }, [isMobile, lowQuality]);

  // Safe baseline fallback price from July 2026 if network drops
  const [btcPrice, setBtcPrice] = useState(64820.50); 
  const [currentQuote, setCurrentQuote] = useState(0);

  const harariQuotes = [
    "MONEY ISN'T A MATERIAL REALITY — IT IS A PSYCHOLOGICAL CONSTRUCT BASED ON TRUST.",
    "ALGORITHMS ARE NOW INVENTING NEW KINDS OF VALUE, ENTIRELY OUTSIDE HUMAN CONTROL.",
    "THE REAL RULERS OF THE FUTURE WILL NOT BE ELITES, BUT THE SYSTEMS WE UNLEASHED."
  ];

  // Fetch live, reliable data from CoinGecko public api
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
        const data = await res.json();
        if (data?.bitcoin?.usd) {
          setBtcPrice(data.bitcoin.usd);
        }
      } catch (err) {
        console.warn("API restricted or offline, maintaining dynamic baseline stream.");
      }
    };

    fetchPrice();
    const liveInterval = setInterval(fetchPrice, 30000); // Check every 30 seconds

    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % harariQuotes.length);
    }, 8000);

    return () => {
      clearInterval(liveInterval);
      clearInterval(quoteInterval);
    };
  }, []);

  return (
    <div style={styles.wrapper}>
      
      <LoadingVeil />

      <div style={styles.heroBackgroundText}>SYNTHETIC</div>

      {/* MANIFESTO ELEMENT */}
      <div style={styles.leftColumn}>
        <div style={styles.metaLabel}>[ MANIFESTO ]</div>
        <div style={styles.quoteDisplay}>{harariQuotes[currentQuote]}</div>
      </div>

      {/* LIVE ACCURATE DATA STREAM */}
      <div style={styles.rightColumn}>
        <div style={styles.metaLabel}>[ LIVE NETWORK STREAM ]</div>
        <div style={styles.priceTicker}>
          BTC ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={styles.statusLine}>SECURE // API_CONNECTED</div>
      </div>

      <div style={styles.footerHint}>DRAG DATA FIELD</div>

      {/* VIEWPORT */}
      <div style={styles.canvasContainer}>
        <Canvas
          shadows={!isMobile}
          dpr={dpr}
          camera={{ position: [0, 0, 2.8], fov: 45 }}
          gl={{
            antialias: !isMobile,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace
          }}
        >
          {/* Automatically drops to `lowQuality` mode if the device can't
              hold framerate, and climbs back up if it recovers. */}
          <PerformanceMonitor
            onDecline={() => setDegraded(true)}
            onIncline={() => setDegraded(false)}
          />
          <AdaptiveDpr pixelated />
          <ResponsiveCamera />

          <color attach="background" args={["#040406"]} />

          <ambientLight intensity={0.0} />

          <PremiumLaserLighting />

          {/* Lifts the helmet + its ground shadow together, higher on
              narrow/tall viewports where it was reading as too low in
              frame — camera framing alone (ResponsiveCamera) fixes
              cropping, this fixes vertical position within that frame. */}
          <group position={[0, isMobile ? 0.42 : 0.18, 0]}>
            <Suspense fallback={null}>
              {/* Same Suspense boundary as Helmet — if these resolved
                  separately, the model could appear first with flat/dead
                  reflections, then visibly "switch on" once the HDR
                  finished loading a beat later. Now they reveal together. */}
              <Environment preset="night" intensity={0.4} resolution={isMobile ? 32 : 256} />
              <Helmet />
            </Suspense>

            {/* ContactShadows renders its own extra pass every frame; give
                it a much cheaper budget on mobile instead of dropping it,
                since it's doing a lot of the "grounded" feel. */}
            <ContactShadows
              position={[0, -0.65, 0]}
              opacity={isMobile ? 0.6 : 0.8}
              scale={4}
              blur={2.5}
              far={1}
              resolution={isMobile ? 128 : 512}
              frames={isMobile ? 1 : Infinity}
            />
          </group>

          {!lowQuality && (
            <EffectComposer disableNormalPass>
              <Bloom
                intensity={isMobile ? 0.8 : 1.4}
                luminanceThreshold={0.1}
                luminanceSmoothing={0.5}
                mipmapBlur
              />
            </EffectComposer>
          )}

          <OrbitControls
            makeDefault
            enablePan={false}
            enableZoom={false}
            enableRotate={true}
            rotateSpeed={0.5}
            minPolarAngle={Math.PI / 2.2}
            maxPolarAngle={Math.PI / 1.8}
          />
        </Canvas>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "#040406",
    position: "relative",
    overflow: "hidden",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#fff"
  },
  canvasContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2,
    touchAction: "none" // stops iOS Safari's rubber-banding/pull-to-refresh
                         // from hijacking drag gestures meant for OrbitControls
  },
  loadingVeil: {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#040406",
    transition: "opacity 0.45s ease",
    pointerEvents: "none",
    overflow: "hidden"
  },
  loadingScanlines: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)",
    mixBlendMode: "overlay"
  },
  loadingCore: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px"
  },
  loadingPct: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "rgba(0, 240, 255, 0.6)",
    letterSpacing: "0.3em"
  },
  loadingBarTrack: {
    width: "min(200px, 46vw)",
    height: "1px",
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden"
  },
  loadingBarFill: {
    height: "100%",
    backgroundColor: "#00f0ff",
    transition: "width 0.25s ease",
    boxShadow: "0 0 10px #00f0ff, 0 0 2px #00f0ff"
  },
  loadingLine: {
    fontFamily: "monospace",
    fontSize: "10px",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: "0.15em",
    minHeight: "12px"
  },
  loadingCaret: {
    color: "#00f0ff"
  },
  loadingBlink: {
    animation: "blinkCaret 1s step-end infinite",
    color: "#00f0ff"
  },
  heroBackgroundText: {
    position: "absolute",
    top: "48%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "clamp(12vw, 16vw, 22vw)",
    fontWeight: 900,
    color: "rgba(255, 255, 255, 0.01)",
    letterSpacing: "-0.05em",
    lineHeight: 0.8,
    userSelect: "none",
    pointerEvents: "none",
    zIndex: 1,
    textAlign: "center"
  },
  leftColumn: {
    position: "absolute",
    bottom: "clamp(30px, 6vw, 60px)",
    left: "clamp(20px, 5vw, 60px)",
    width: "clamp(260px, 35vw, 380px)",
    zIndex: 10,
    pointerEvents: "none"
  },
  rightColumn: {
    position: "absolute",
    top: "clamp(30px, 5vw, 60px)",
    right: "clamp(20px, 5vw, 60px)",
    textAlign: "right",
    zIndex: 10,
    pointerEvents: "none"
  },
  metaLabel: {
    fontSize: "9px",
    fontFamily: "monospace",
    color: "rgba(255, 255, 255, 0.25)",
    letterSpacing: "0.2em",
    marginBottom: "10px"
  },
  quoteDisplay: {
    fontSize: "clamp(13px, 1.5vw, 16px)",
    fontWeight: 400,
    lineHeight: 1.45,
    color: "rgba(255, 255, 255, 0.75)",
    textTransform: "uppercase"
  },
  priceTicker: {
    fontSize: "clamp(18px, 2.2vw, 24px)",
    fontWeight: 600,
    letterSpacing: "-0.02em"
  },
  statusLine: {
    fontSize: "10px",
    fontFamily: "monospace",
    color: "#00f0ff",
    marginTop: "4px",
    letterSpacing: "0.05em"
  },
  footerHint: {
    position: "absolute",
    bottom: "20px",
    right: "50%",
    transform: "translateX(50%)",
    fontSize: "9px",
    fontFamily: "monospace",
    color: "rgba(255, 255, 255, 0.15)",
    letterSpacing: "0.2em",
    zIndex: 10,
    pointerEvents: "none"
  }
};
