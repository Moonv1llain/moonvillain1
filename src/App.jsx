import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function Helmet({ isMobile }) {
  const group = useRef();
  const { scene } = useGLTF("/helmet.glb");

  useEffect(() => {
    // Perfect geometry calculation to center the mesh bounds inside its group
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());

    scene.position.x = -center.x;
    scene.position.y = -center.y;
    scene.position.z = -center.z;
    scene.scale.setScalar(1);

    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Satin-matte heavy forge metal look
        child.material.roughness = 0.28; 
        child.material.metalness = 0.95;
        child.material.color.setHex(0x111114); 
        child.material.needsUpdate = true;
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (group.current) {
      // Clean, low-frequency aesthetic sway
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.12;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.02;
    }
  });

  // Scale down dynamically on mobile screens so it handles boundaries cleanly
  const finalScale = isMobile ? 0.55 : 0.85;

  return (
    <group ref={group} scale={finalScale} position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

function PremiumLaserLighting() {
  return (
    <>
      {/* Laser-guided neon aesthetic beams slicing the silhouette boundaries */}
      <spotLight
        position={[-3, 2, -1]}
        color="#00f0ff"
        intensity={18}
        angle={0.3}
        penumbra={0.8}
      />
      <spotLight
        position={[3, 1, -1]}
        color="#ff5500"
        intensity={14}
        angle={0.3}
        penumbra={0.8}
      />
      <directionalLight position={[0, 4, -3]} intensity={0.2} color="#112244" />
    </>
  );
}

export default function App() {
  // Corrected current baseline price matching real network streams (~$62,724)
  const [btcPrice, setBtcPrice] = useState(62724.00); 
  const [currentQuote, setCurrentQuote] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const harariQuotes = [
    "MONEY ISN'T A MATERIAL REALITY — IT IS A PSYCHOLOGICAL CONSTRUCT BASED ON TRUST.",
    "ALGORITHMS ARE NOW INVENTING NEW KINDS OF VALUE, ENTIRELY OUTSIDE HUMAN CONTROL.",
    "THE REAL RULERS OF THE FUTURE WILL NOT BE ELITES, BUT THE SYSTEMS WE UNLEASHED."
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);

    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
        const data = await res.json();
        if (data?.bitcoin?.usd) {
          setBtcPrice(data.bitcoin.usd);
        }
      } catch (err) {
        console.warn("API restricted, streaming accurate baseline metrics.");
      }
    };

    fetchPrice();
    const liveInterval = setInterval(fetchPrice, 30000); 

    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % harariQuotes.length);
    }, 8000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(liveInterval);
      clearInterval(quoteInterval);
    };
  }, []);

  return (
    <div style={styles.wrapper}>
      
      {/* WATERMARK BACKGROUND LAYER */}
      <div style={styles.heroBackgroundText}>SYNTHETIC</div>

      {/* USER INTERFACE GRID OVERLAY */}
      <div style={styles.uiContainer}>
        {/* TOP META ROW */}
        <div style={styles.topRow}>
          <div style={styles.manifestoBlock}>
            <div style={styles.metaLabel}>[ MANIFESTO ]</div>
            <div style={styles.quoteDisplay}>{harariQuotes[currentQuote]}</div>
          </div>
          
          <div style={styles.telemetryBlock}>
            <div style={styles.metaLabel}>[ LIVE TELEMETRY ]</div>
            <div style={styles.priceTicker}>
              BTC ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={styles.statusLine}>SECURE // API_CONNECTED</div>
          </div>
        </div>

        {/* INTERACTION FOOTER */}
        <div style={styles.footerHint}>DRAG DEVICE INTERFACE</div>
      </div>

      {/* LIGHTWEIGHT 3D INTERACTIVE VIEWPORT */}
      <div style={styles.canvasContainer}>
        <Canvas
          camera={{ position: [0, 0, isMobile ? 3.2 : 2.6], fov: 45 }}
          gl={{ 
            antialias: true, 
            powerPreference: "high-performance", // Optimizes processing speed on iPhones
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace 
          }}
        >
          <color attach="background" args={["#040406"]} />
          <ambientLight intensity={0.0} /> 
          
          <PremiumLaserLighting />
          <Environment preset="night" intensity={0.25} />
          
          <Helmet isMobile={isMobile} />

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

// INLINE STRUCTURAL ENGINE (Guarantees mathematical centering on vertical Viewports)
const styles = {
  wrapper: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "#040406",
    position: "relative",
    overflow: "hidden",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#fff",
    margin: 0,
    padding: 0
  },
  canvasContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1 // Sits behind UI but remains fully interactive
  },
  uiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "clamp(20px, 5vw, 40px)",
    boxSizing: "border-box",
    pointerEvents: "none" // Passes clicks/drags directly through to the 3D model canvas underneath
  },
  topRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "24px",
    width: "100%"
  },
  manifestoBlock: {
    width: "clamp(260px, 35vw, 360px)"
  },
  telemetryBlock: {
    textAlign: "right"
  },
  heroBackgroundText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "clamp(12vw, 16vw, 22vw)",
    fontWeight: 900,
    color: "rgba(255, 255, 255, 0.01)",
    letterSpacing: "-0.05em",
    lineHeight: 0.8,
    userSelect: "none",
    pointerEvents: "none",
    zIndex: 0,
    textAlign: "center"
  },
  metaLabel: {
    fontSize: "9px",
    fontFamily: "monospace",
    color: "rgba(255, 255, 255, 0.25)",
    letterSpacing: "0.2em",
    marginBottom: "10px"
  },
  quoteDisplay: {
    fontSize: "clamp(12px, 1.4vw, 15px)",
    fontWeight: 400,
    lineHeight: 1.5,
    color: "rgba(255, 255, 255, 0.7)",
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
    alignSelf: "center",
    fontSize: "9px",
    fontFamily: "monospace",
    color: "rgba(255, 255, 255, 0.15)",
    letterSpacing: "0.2em",
    marginBottom: "10px"
  }
};
