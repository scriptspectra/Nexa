"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function LandingPage() {
  const threeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threeRef.current) return;
    const container = threeRef.current;

    // Dynamically load Three.js from CDN to avoid bundling issues
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => {
      const THREE = (window as any).THREE;
      const width = container.clientWidth || 600;
      const height = container.clientHeight || 600;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 10;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const mainGroup = new THREE.Group();
      scene.add(mainGroup);

      // Central Core
      const coreGeo = new THREE.IcosahedronGeometry(1.2, 15);
      const coreMat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      mainGroup.add(core);

      // Core Halo
      const haloGeo = new THREE.SphereGeometry(1.4, 32, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide,
      });
      mainGroup.add(new THREE.Mesh(haloGeo, haloMat));

      // Orbital Rings
      const rings: any[] = [];
      for (let i = 0; i < 5; i++) {
        const radius = 2.5 + i * 0.8;
        const ringGeo = new THREE.TorusGeometry(radius, 0.005, 16, 128);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.15 - i * 0.02,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.random() * Math.PI;
        ring.rotation.y = Math.random() * Math.PI;
        mainGroup.add(ring);
        rings.push({
          mesh: ring,
          speedX: (Math.random() - 0.5) * 0.005,
          speedY: (Math.random() - 0.5) * 0.005,
          radius,
        });
      }

      // Data Packets
      const packets: any[] = [];
      const packetGeo = new THREE.SphereGeometry(0.025, 8, 8);
      const packetMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      for (let i = 0; i < 40; i++) {
        const packet = new THREE.Mesh(packetGeo, packetMat);
        const orbit = rings[Math.floor(Math.random() * rings.length)];
        mainGroup.add(packet);
        packets.push({ mesh: packet, orbit, angle: Math.random() * Math.PI * 2, speed: 0.01 + Math.random() * 0.02 });
      }

      // Particle Cloud
      const partCount = 1000;
      const partGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(partCount * 3);
      for (let i = 0; i < partCount; i++) {
        const r = 8 + Math.random() * 4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
      partGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const points = new THREE.Points(
        partGeo,
        new THREE.PointsMaterial({ color: 0xffffff, size: 0.015, transparent: true, opacity: 0.3 })
      );
      scene.add(points);

      scene.add(Object.assign(new THREE.PointLight(0xffffff, 2, 20), { position: { x: 5, y: 5, z: 5 } }));
      scene.add(Object.assign(new THREE.PointLight(0xffffff, 1, 20), { position: { x: -5, y: -5, z: 5 } }));

      let mouseX = 0, mouseY = 0;
      const onMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX - window.innerWidth / 2) / 500;
        mouseY = (e.clientY - window.innerHeight / 2) / 500;
      };
      window.addEventListener("mousemove", onMouseMove);

      let animId: number;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const time = Date.now() * 0.001;
        mainGroup.rotation.y += 0.002;
        mainGroup.rotation.x += (mouseY - mainGroup.rotation.x) * 0.05;
        mainGroup.rotation.z += (mouseX - mainGroup.rotation.z) * 0.05;
        const pulse = 0.8 + Math.sin(time * 2) * 0.2;
        core.scale.setScalar(pulse);
        coreMat.emissiveIntensity = 0.5 + pulse * 0.5;
        rings.forEach((r) => { r.mesh.rotation.x += r.speedX; r.mesh.rotation.y += r.speedY; });
        packets.forEach((p) => {
          p.angle += p.speed;
          const x = Math.cos(p.angle) * p.orbit.radius;
          const y = Math.sin(p.angle) * p.orbit.radius;
          p.mesh.position.set(x, y, 0);
          p.mesh.position.applyQuaternion(p.orbit.mesh.quaternion);
          p.mesh.scale.setScalar(0.5 + Math.abs(Math.sin(time * 5 + p.angle)) * 1.5);
        });
        points.rotation.y -= 0.0005;
        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        const w = container.clientWidth || 600;
        const h = container.clientHeight || 600;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      // Store cleanup refs on the script element
      (script as any).__cleanup = () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      };
    };
    document.head.appendChild(script);

    return () => {
      if ((script as any).__cleanup) (script as any).__cleanup();
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#0d0e0f",
        color: "#ffffff",
        fontFamily: "'Geist', sans-serif",
        overflowX: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/geist');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-size: inherit;
          line-height: 1;
          display: inline-block;
          vertical-align: middle;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .anim-1 { animation: fadeInUp 0.8s ease-out 0.0s forwards; opacity: 0; }
        .anim-2 { animation: fadeInUp 0.8s ease-out 0.1s forwards; opacity: 0; }
        .anim-3 { animation: fadeInUp 0.8s ease-out 0.2s forwards; opacity: 0; }
        .anim-4 { animation: fadeInUp 0.8s ease-out 0.3s forwards; opacity: 0; }
        .anim-5 { animation: fadeInUp 0.8s ease-out 0.4s forwards; opacity: 0; }

        .feature-box {
          background: #1b1c1c;
          border: 1px solid #343535;
          transition: all 0.3s ease;
        }
        .feature-box:hover {
          border-color: #8e9192;
          background: #1f2020;
        }

        .glass-card {
          background: rgba(27,28,28,0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(68,71,72,0.4);
        }

        .mesh-grid {
          background-image: linear-gradient(#444748 1px, transparent 1px),
                            linear-gradient(90deg, #444748 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.05;
        }

        .grayscale-int { filter: grayscale(1); transition: filter 0.3s; }
        .grayscale-int:hover { filter: grayscale(0); }

        .void-gradient {
          background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 70%);
        }

        .nav-link {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          color: #c4c7c8;
          text-decoration: none;
          transition: color 0.2s;
          cursor: pointer;
        }
        .nav-link:hover { color: #ffffff; }
        .nav-link-active { color: #ffffff; border-bottom: 1px solid #ffffff; }
      `}</style>

      {/* ── NAV ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 50,
          backgroundColor: "rgba(18,20,20,0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(68,71,72,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "64px",
            padding: "0 32px",
            maxWidth: "1280px",
            margin: "0 auto",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>diamond</span>
            </div>
            <span
              style={{
                fontFamily: "'Geist', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#fff",
              }}
            >
              Zephyra
            </span>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
            <a className="nav-link nav-link-active" href="#">Platform</a>
            <a className="nav-link" href="#">Features</a>
            <a className="nav-link" href="#">Integrations</a>
            <a className="nav-link" href="#">Pricing</a>
          </div>

          {/* Auth buttons — FUNCTIONALITY UNCHANGED */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <SignedOut>
              <Link
                href="/sign-in"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  color: "#c4c7c8",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#121414",
                  padding: "8px 16px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: "2px",
                  textDecoration: "none",
                  transition: "opacity 0.2s",
                }}
              >
                Deploy Now
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/conversations"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#121414",
                  padding: "8px 16px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: "2px",
                  textDecoration: "none",
                }}
              >
                Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          paddingTop: "96px",
          overflow: "hidden",
        }}
      >
        <div className="void-gradient" style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.5 }} />
        <div
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 32px",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 3fr",
              gap: "48px",
              alignItems: "center",
            }}
          >
            {/* Left copy */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="anim-1">
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#1f2020",
                    border: "1px solid #444748",
                    padding: "4px 12px",
                    borderRadius: "999px",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#aec6ff",
                      boxShadow: "0 0 8px rgba(174,198,255,0.8)",
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#c4c7c8",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                    }}
                  >
                    Watch. Analyze. Improve.
                  </span>
                </div>
              </div>

              <h1
                className="anim-2"
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontSize: 40,
                  fontWeight: 700,
                  lineHeight: "48px",
                  letterSpacing: "-0.04em",
                  color: "#ffffff",
                  margin: 0,
                }}
              >
                Conversational Commerce,<br />
                <span style={{ color: "#c4c7c8" }}>Synchronized.</span>
              </h1>

              <p
                className="anim-3"
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontSize: 18,
                  lineHeight: "28px",
                  color: "#c4c7c8",
                  margin: 0,
                  maxWidth: "480px",
                }}
              >
                The AI engine for Shopify that masters your catalog. Real-time sync. Voice-ready support. Seamless intelligence.
              </p>

              <div
                className="anim-4"
                style={{ display: "flex", gap: "16px", paddingTop: "8px", flexWrap: "wrap" }}
              >
                <Link
                  href="/sign-up"
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#121414",
                    padding: "16px 32px",
                    fontFamily: "'Geist', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    borderRadius: "2px",
                    textDecoration: "none",
                    transition: "background 0.2s",
                  }}
                >
                  Deploy for Free
                </Link>
                <button
                  style={{
                    backgroundColor: "transparent",
                    color: "#ffffff",
                    border: "1px solid #444748",
                    padding: "16px 32px",
                    fontFamily: "'Geist', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    borderRadius: "2px",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                >
                  View Docs
                </button>
              </div>
            </div>

            {/* Right — Three.js */}
            <div
              className="anim-5"
              style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
            >
              <div
                ref={threeRef}
                style={{ width: "100%", height: "600px", backgroundColor: "transparent" }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── FEATURES GRID ── */}
      <section style={{ padding: "80px 0", backgroundColor: "#121414" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto 64px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid #444748",
                padding: "4px 12px",
                marginBottom: "24px",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>diamond</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#c4c7c8",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                }}
              >
                Premium Capabilities
              </span>
            </div>
            <h2
              style={{
                fontFamily: "'Geist', sans-serif",
                fontSize: 32,
                fontWeight: 600,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                marginBottom: "16px",
              }}
            >
              Unified Commerce Engine
            </h2>
            <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 16, color: "#c4c7c8", lineHeight: "24px" }}>
              Experience the full power of synchronized intelligence with our core feature suite.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "24px",
            }}
          >
            {[
              { icon: "smart_toy", title: "AI Customer Support", desc: "Intelligent automated responses 24/7 with zero latency." },
              { icon: "record_voice_over", title: "AI Voice Agent", desc: "Natural voice conversations with customers via low-latency streaming." },
              { icon: "phone_in_talk", title: "Phone System", desc: "Full inbound & outbound calling capabilities integrated into your CRM." },
              { icon: "menu_book", title: "Knowledge Base", desc: "Train AI on your documentation, PDFs, and website content instantly." },
              { icon: "group", title: "Team Access", desc: "Shared inbox and collaboration tools for your support operators." },
              { icon: "palette", title: "Widget Customization", desc: "Customize your chat widget appearance to match your brand DNA." },
            ].map((f) => (
              <div key={f.title} className="feature-box" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: "#1f2020",
                    border: "1px solid #444748",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#fff" }}>{f.icon}</span>
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "'Geist', sans-serif",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#ffffff",
                      marginBottom: "4px",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 14, color: "#c4c7c8", lineHeight: "20px" }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO ── */}
      <section
        style={{
          padding: "80px 0",
          backgroundColor: "#0d0e0f",
          borderTop: "1px solid rgba(68,71,72,0.2)",
          borderBottom: "1px solid rgba(68,71,72,0.2)",
        }}
      >
        <div style={{ maxWidth: "896px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span
              style={{
                display: "block",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                fontWeight: 500,
                color: "#aec6ff",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: "8px",
              }}
            >
              Live Simulation
            </span>
            <h2
              style={{
                fontFamily: "'Geist', sans-serif",
                fontSize: 32,
                fontWeight: 600,
                color: "#ffffff",
                letterSpacing: "-0.02em",
              }}
            >
              Experience the Sync.
            </h2>
          </div>

          <div className="glass-card" style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
            {/* Chat header */}
            <div
              style={{
                backgroundColor: "#292a2a",
                padding: "16px 24px",
                borderBottom: "1px solid #444748",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#121414" }}>bolt</span>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, color: "#fff" }}>
                  Zephyra AI Assistant
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#444748" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#444748" }} />
              </div>
            </div>

            {/* Chat body */}
            <div style={{ padding: "32px", minHeight: "400px", backgroundColor: "#090909", display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* User message */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                  style={{
                    backgroundColor: "#1f2020",
                    border: "1px solid #444748",
                    padding: "16px",
                    borderRadius: "8px 8px 0 8px",
                    maxWidth: "80%",
                  }}
                >
                  <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 16, color: "#fff", margin: 0 }}>
                    Is the Midnight Puffer Jacket in Large available?
                  </p>
                </div>
              </div>

              {/* AI reply */}
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#121414",
                    padding: "16px",
                    borderRadius: "8px 8px 8px 0",
                    maxWidth: "80%",
                    boxShadow: "0 4px 20px rgba(255,255,255,0.1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#121414" }}>verified</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                      In Stock
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 16, margin: 0 }}>
                    Yes! We have 4 left in stock in our primary warehouse. Would you like to add it to your cart or check for matching beanies?
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ paddingTop: "24px", borderTop: "1px solid rgba(68,71,72,0.3)" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  {["Add to Cart", "Show Similar"].map((label) => (
                    <button
                      key={label}
                      style={{
                        backgroundColor: "#1f2020",
                        border: "1px solid #444748",
                        padding: "4px 12px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#c4c7c8",
                        cursor: "pointer",
                        transition: "border-color 0.2s",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                    backgroundColor: "#1b1c1c",
                    padding: "16px",
                    border: "1px solid #444748",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#8e9192" }}>sentiment_satisfied</span>
                  <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 16, color: "rgba(196,199,200,0.5)" }}>
                    Type your question...
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#fff", marginLeft: "auto" }}>send</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section style={{ padding: "80px 0", backgroundColor: "#121414" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "48px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontSize: 32,
                  fontWeight: 600,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                  marginBottom: "8px",
                }}
              >
                Works where you do.
              </h2>
              <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 16, color: "#c4c7c8" }}>
                Connect your favorite tools in minutes.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "32px" }}>
              {[
                { icon: "shopping_bag", label: "Shopify" },
                { icon: "chat", label: "Slack" },
                { icon: "forum", label: "Discord" },
                { icon: "bolt", label: "Zapier" },
              ].map((t) => (
                <div
                  key={t.label}
                  className="grayscale-int"
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer" }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      backgroundColor: "#121414",
                      border: "1px solid #444748",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "8px",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#fff" }}>{t.icon}</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, color: "#fff" }}>
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "80px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "80px 32px", textAlign: "center", position: "relative", zIndex: 10 }}>
          <h2
            style={{
              fontFamily: "'Geist', sans-serif",
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: "#fff",
              marginBottom: "24px",
            }}
          >
            Ready to scale your store&apos;s intelligence?
          </h2>
          <Link
            href="/sign-up"
            style={{
              display: "inline-block",
              backgroundColor: "#ffffff",
              color: "#121414",
              padding: "24px 48px",
              fontFamily: "'Geist', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              borderRadius: "2px",
              textDecoration: "none",
              boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
              transition: "transform 0.2s",
            }}
          >
            Get Started with Zephyra
          </Link>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              fontWeight: 500,
              color: "#c4c7c8",
              marginTop: "32px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            No credit card required • 14-day free trial
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          backgroundColor: "#0d0e0f",
          width: "100%",
          padding: "80px 0",
          borderTop: "1px solid rgba(68,71,72,0.2)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "24px",
            padding: "0 32px",
            maxWidth: "1280px",
            margin: "0 auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#fff" }}>diamond</span>
              <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>Zephyra</span>
            </div>
            <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 14, color: "#c4c7c8" }}>
              © 2024 Zephyra Inc. All rights reserved.
            </p>
          </div>

          {[
            {
              heading: "Product",
              links: ["Documentation", "Changelog", "Status"],
            },
            {
              heading: "Legal",
              links: ["Privacy Policy", "Terms of Service"],
            },
            {
              heading: "Marketplace",
              links: ["Shopify App Store"],
            },
          ].map((col) => (
            <div key={col.heading} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: "8px" }}>
                {col.heading}
              </span>
              {col.links.map((l) => (
                <a
                  key={l}
                  href="#"
                  style={{
                    fontFamily: "'Geist', sans-serif",
                    fontSize: 14,
                    color: "#c4c7c8",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                >
                  {l}
                </a>
              ))}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
