import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, ContactShadows, Environment, AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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

function Loader() {
  return (
    <mesh>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshBasicMaterial color="#111114" wireframe />
    </mesh>
  );
}

function Helmet() {
  const group = useRef();
  const { scene } = useGLTF("/helmet.glb");
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    scene.position.x -= center.x;
    scene.position.y -= center.y;
    scene.position.z -= center.z;
    scene.scale.setScalar(1);

    // Auto-fit: target the helmet's longest dimension to ~1.1 world units
    // instead of a hardcoded scale, so it's not "too big" regardless of
    // how the source file was authored/exported.
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    setFitScale(1.1 / maxDim);

    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Slightly lighter than pure black so the metal actually has
        // something to reflect off the fill/key lights below — at
        // metalness 0.98 a near-black base with no fill light just
        // reads as a dark blob with two hot spots.
        child.material.roughness = 0.3;
        child.material.metalness = 0.9;
        child.material.color.setHex(0x2a2a30);
        child.material.envMapIntensity = 1.2;
        child.material.needsUpdate = true;
      }
    });
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

function PremiumLaserLighting() {
  return (
    <>
      {/* Cheap, always-on base fill so the helmet reads as a 3D shape
          instead of a silhouette — sky/ground tint keeps it moody
          without costing a render pass. */}
      <hemisphereLight
        color="#3a4a6b"
        groundColor="#0a0a0d"
        intensity={0.6}
      />

      {/* Soft key light from front-above — this is what actually
          reveals the form; the neon lights below are accents on top
          of it, not the only light source. */}
      <directionalLight
        position={[1.5, 3, 3]}
        intensity={1.1}
        color="#e8ecf5"
      />

      {/* Neon rim/kicker lights, pulled down to accent levels now that
          there's a real key light doing the work */}
      <spotLight
        position={[-3, 2, -1]}
        color="#00f0ff"
        intensity={6}
        angle={0.35}
        penumbra={0.9}
      />
      <spotLight
        position={[3, 1, -1]}
        color="#ff5500"
        intensity={5}
        angle={0.3}
        penumbra={0.8}
      />
      
      {/* Absolute minimal dark blue backing so the depth isn't entirely lost */}
      <directionalLight position={[0, 4, -3]} intensity={0.15} color="#112244" />
    </>
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

          <color attach="background" args={["#040406"]} />

          <ambientLight intensity={0.0} />

          <PremiumLaserLighting />

          {/* A 0.9-metalness material with nothing to reflect just looks
              flat/dead, so even mobile gets an environment — just baked
              at a much cheaper resolution than desktop. */}
          <Environment preset="night" intensity={0.35} resolution={isMobile ? 32 : 256} />

          <Suspense fallback={<Loader />}>
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
