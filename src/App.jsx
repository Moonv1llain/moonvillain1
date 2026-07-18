import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function CoreGeometry() {
  const meshRef = useRef();

  // Clean kinetic movement to animate the geometry contours smoothly
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.25;
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* Dynamic procedural geometry load - 0ms network latency */}
      <torusKnotGeometry args={[0.55, 0.16, 120, 12, 3, 4]} />
      <meshStandardMaterial
        color="#08080c"
        roughness={0.15}
        metalness={0.95}
      />
    </mesh>
  );
}

export default function App() {
  const [btcPrice, setBtcPrice] = useState(63895.82);
  const [currentQuote, setCurrentQuote] = useState(0);

  const harariQuotes = [
    "MONEY ISN'T A MATERIAL REALITY — IT IS A PSYCHOLOGICAL CONSTRUCT BASED ON TRUST.",
    "ALGORITHMS ARE NOW INVENTING NEW KINDS OF VALUE, ENTIRELY OUTSIDE HUMAN CONTROL.",
    "THE REAL RULERS OF THE FUTURE WILL NOT BE ELITES, BUT THE SYSTEMS WE UNLEASHED."
  ];

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
        const data = await res.json();
        if (data?.bitcoin?.usd) {
          setBtcPrice(data.bitcoin.usd);
        }
      } catch (err) {
        console.warn("API fallback active.");
      }
    };

    fetchPrice();
    const liveInterval = setInterval(fetchPrice, 30000);
    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % harariQuotes.length);
    }, 7000);

    return () => {
      clearInterval(liveInterval);
      clearInterval(quoteInterval);
    };
  }, []);

  return (
    <div style={styles.gridContainer}>
      
      {/* HEADER SECTION: TELEMETRY STREAM */}
      <header style={styles.headerArea}>
        <div style={styles.metaLabel}>[ NETWORK TELEMETRY ]</div>
        <div style={styles.priceDisplay}>
          BTC ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </header>

      {/* CORE DISPLAY SECTION: PERFECTLY CENTERED 3D VIEWPORT */}
      <main style={styles.canvasArea}>
        <Canvas
          camera={{ position: [0, 0, 2.2], fov: 45 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <color attach="background" args={["#020203"]} />
          <ambientLight intensity={0.02} />
          
          {/* Saturated High-Contrast Laser Accent Lights */}
          <spotLight position={[-2, 2, 1]} color="#00f0ff" intensity={15} angle={0.5} penumbra={0.5} />
          <spotLight position={[2, -1, 1]} color="#ff4500" intensity={10} angle={0.5} penumbra={0.5} />
          <directionalLight position={[0, 2, -2]} intensity={0.4} color="#112244" />
          
          <CoreGeometry />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            minPolarAngle={Math.PI / 2.5}
            maxPolarAngle={Math.PI / 1.6}
          />
        </Canvas>
      </main>

      {/* FOOTER SECTION: PHILOSOPHY STREAM */}
      <footer style={styles.footerArea}>
        <div style={styles.metaLabel}>[ PHILOSOPHY ENGINE // HARARI ]</div>
        <div style={styles.quoteText}>{harariQuotes[currentQuote]}</div>
      </footer>

    </div>
  );
}

// STRUCTURAL GRID ENGINE (Guarantees centering across iOS Safari and Desktop viewports)
const styles = {
  gridContainer: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "#000000",
    color: "#ffffff",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    margin: 0,
    padding: 0
  },
  headerArea: {
    padding: "24px",
    borderBottom: "1px solid #111116",
    backgroundColor: "#000000",
    zIndex: 10
  },
  canvasArea: {
    flex: 1,
    width: "100%",
    position: "relative",
    backgroundColor: "#020203"
  },
  footerArea: {
    padding: "24px",
    borderTop: "1px solid #111116",
    backgroundColor: "#000000",
    zIndex: 10,
    minHeight: "80px"
  },
  metaLabel: {
    fontSize: "10px",
    fontFamily: "monospace",
    color: "rgba(255, 255, 255, 0.3)",
    letterSpacing: "0.15em",
    marginBottom: "6px",
    textTransform: "uppercase"
  },
  priceDisplay: {
    fontSize: "24px",
    fontWeight: 700,
    letterSpacing: "-0.02em"
  },
  quoteText: {
    fontSize: "14px",
    lineHeight: "1.45",
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: "-0.01em"
  }
};
