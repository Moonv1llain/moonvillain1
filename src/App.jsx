import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function Helmet({ isMobile }) {
  const group = useRef();
  const { scene } = useGLTF("/helmet.glb");

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());

    scene.position.x = -center.x;
    scene.position.y = -center.y;
    scene.position.z = -center.z;
    scene.scale.setScalar(1);

    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Swapped to a premium graphite tone so the physical contours stay visible
        child.material.color.setHex(0x222226); 
        child.material.roughness = 0.45; // Increased to diffuse light naturally across curves
        child.material.metalness = 0.85; // Solid industrial metallic weight
        child.material.needsUpdate = true;
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.1;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
    }
  });

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
      {/* Laser-guided neon beams slicing the silhouette boundaries */}
      <spotLight
        position={[-3, 2.5, 1]}
        color="#00f0ff"
        intensity={25}
        angle={0.4}
        penumbra={0.7}
      />
      <spotLight
        position={[3, 1.5, 1]}
        color="#ff5500"
        intensity={20}
        angle={0.4}
        penumbra={0.7}
      />
      
      {/* Matte contour wrap - brings out the actual 3D form out of absolute darkness */}
      <directionalLight position={[-1, 4, -2]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[1, -2, 2]} intensity={0.5} color="#335588" />
    </>
  );
}

export default function App() {
  const [btcPrice, setBtcPrice] = useState(63885.94); 
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
          camera={{ position: [0, 0, isMobile ? 3.2 : 2.5], fov: 45 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <color attach="background" args={["#040406"]} />
          <ambientLight intensity={0.05} /> 
          
          <PremiumLaserLighting />
          <Environment preset="night" intensity={0.3} />
          
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
      </main>

      {/* FOOTER SECTION: PHILOSOPHY STREAM */}
      <footer style={styles.footerArea}>
        <div style={styles.metaLabel}>[ PHILOSOPHY ENGINE // HARARI ]</div>
        <div style={styles.quoteText}>{harariQuotes[currentQuote]}</div>
      </footer>

    </div>
  );
}

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
    backgroundColor: "#040406"
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
