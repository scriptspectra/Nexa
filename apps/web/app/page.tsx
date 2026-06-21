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

      // Central Core — green tint
      const coreGeo = new THREE.IcosahedronGeometry(1.2, 15);
      const coreMat = new THREE.MeshPhongMaterial({
        color: 0x00e676,
        emissive: 0x00e676,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      mainGroup.add(core);

      // Core Halo
      const haloGeo = new THREE.SphereGeometry(1.4, 32, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x00c853,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
      });
      mainGroup.add(new THREE.Mesh(haloGeo, haloMat));

      // Orbital Rings
      const rings: any[] = [];
      for (let i = 0; i < 5; i++) {
        const radius = 2.5 + i * 0.8;
        const ringGeo = new THREE.TorusGeometry(radius, 0.005, 16, 128);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x69f0ae,
          transparent: true,
          opacity: 0.18 - i * 0.02,
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
        new THREE.PointsMaterial({ color: 0x69f0ae, size: 0.015, transparent: true, opacity: 0.3 })
      );
      scene.add(points);

      scene.add(Object.assign(new THREE.PointLight(0x00e676, 2, 20), { position: { x: 5, y: 5, z: 5 } }));
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
        backgroundColor: "#080a08",
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

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0,230,118,0.3), 0 0 40px rgba(0,230,118,0.1); }
          50% { box-shadow: 0 0 40px rgba(0,230,118,0.6), 0 0 80px rgba(0,230,118,0.2); }
        }

        @keyframes borderFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .feature-box {
          background: #0f110f;
          border: 1px solid #1a2e1a;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .feature-box::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0,230,118,0.03) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .feature-box:hover {
          border-color: rgba(0,230,118,0.4);
          background: #111811;
        }
        .feature-box:hover::before { opacity: 1; }

        .glass-card {
          background: rgba(10,14,10,0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0,230,118,0.15);
        }

        .mesh-grid {
          background-image: linear-gradient(rgba(0,230,118,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,230,118,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .grayscale-int { filter: grayscale(1) brightness(0.6); transition: filter 0.3s; }
        .grayscale-int:hover { filter: grayscale(0) brightness(1); }

        .void-gradient {
          background: radial-gradient(circle at 50% 50%, rgba(0,230,118,0.06) 0%, rgba(0,0,0,0) 70%);
        }

        .nav-link {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          transition: color 0.2s;
          cursor: pointer;
        }
        .nav-link:hover { color: #00e676; }
        .nav-link-active { color: #00e676; border-bottom: 1px solid #00e676; }

        .green-btn {
          display: inline-block;
          background: #00e676;
          color: #080a08;
          padding: 16px 32px;
          font-family: 'Geist', sans-serif;
          font-size: 16px;
          font-weight: 700;
          border-radius: 2px;
          text-decoration: none;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          animation: glowPulse 3s ease-in-out infinite;
        }
        .green-btn:hover {
          background: #69f0ae;
          transform: translateY(-2px);
        }

        .outline-btn {
          display: inline-block;
          background: transparent;
          color: #ffffff;
          border: 1px solid rgba(0,230,118,0.4);
          padding: 16px 32px;
          font-family: 'Geist', sans-serif;
          font-size: 16px;
          font-weight: 700;
          border-radius: 2px;
          text-decoration: none;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .outline-btn:hover { border-color: #00e676; color: #00e676; }

        .stat-card {
          background: #0f110f;
          border: 1px solid #1a2e1a;
          padding: 24px;
          text-align: center;
          transition: border-color 0.3s;
        }
        .stat-card:hover { border-color: rgba(0,230,118,0.4); }

        .integration-icon {
          width: 64px;
          height: 64px;
          background: #0f110f;
          border: 1px solid #1a2e1a;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: border-color 0.3s;
        }
        .grayscale-int:hover .integration-icon { border-color: #00e676; }

        .terminal-cursor {
          display: inline-block;
          width: 8px;
          height: 16px;
          background: #00e676;
          animation: blink 1s step-end infinite;
          vertical-align: middle;
          margin-left: 2px;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .section-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(0,230,118,0.3);
          background: rgba(0,230,118,0.06);
          padding: 4px 12px;
          margin-bottom: 24px;
        }

        .divider-green {
          border: none;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,230,118,0.3), transparent);
        }
      `}</style>

      {/* ── NAV ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 50,
          backgroundColor: "rgba(8,10,8,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,230,118,0.12)",
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
                background: "linear-gradient(135deg, #00e676 0%, #00c853 100%)",
                borderRadius: "6px",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#080a08" }}>diamond</span>
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
                  color: "rgba(255,255,255,0.5)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                style={{
                  backgroundColor: "#00e676",
                  color: "#080a08",
                  padding: "8px 16px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: "2px",
                  textDecoration: "none",
                  transition: "background 0.2s",
                }}
              >
                Deploy Now
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/conversations"
                style={{
                  backgroundColor: "#00e676",
                  color: "#080a08",
                  padding: "8px 16px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 700,
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
        {/* Background grid */}
        <div
          className="mesh-grid"
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
        />
        <div className="void-gradient" style={{ position: "absolute", inset: 0, zIndex: 1, opacity: 0.8 }} />

        {/* Green glow orb */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: "10%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,230,118,0.08) 0%, transparent 70%)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

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
                <div className="section-tag">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#00e676",
                      boxShadow: "0 0 8px rgba(0,230,118,0.8)",
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#00e676",
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
                <span style={{ color: "#00e676" }}>Synchronized.</span>
              </h1>

              <p
                className="anim-3"
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontSize: 18,
                  lineHeight: "28px",
                  color: "rgba(255,255,255,0.55)",
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
                <Link href="/sign-up" className="green-btn">
                  Deploy for Free
                </Link>
                <button className="outline-btn">
                  View Docs
                </button>
              </div>

              {/* Trust badges */}
              <div className="anim-5" style={{ display: "flex", gap: "24px", paddingTop: "8px", flexWrap: "wrap" }}>
                {[
                  { icon: "verified", label: "SOC 2 Ready" },
                  { icon: "bolt", label: "99.9% Uptime" },
                  { icon: "language", label: "40+ Languages" },
                ].map((b) => (
                  <div key={b.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#00e676" }}>{b.icon}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Three.js (FUNCTIONALITY UNCHANGED) */}
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

      <hr className="divider-green" />

      {/* ── STATS STRIP ── */}
      <section style={{ padding: "40px 0", backgroundColor: "#0a0d0a" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "24px" }}>
            {[
              { icon: "group", value: "12K+", label: "Businesses Served" },
              { icon: "chat", value: "4.8M", label: "Conversations / Month" },
              { icon: "language", value: "40+", label: "Languages Supported" },
              { icon: "trending_up", value: "99.9%", label: "Uptime SLA" },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#00e676", marginBottom: "8px", display: "block" }}>{s.icon}</span>
                <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{s.value}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider-green" />

      {/* ── FEATURES GRID ── */}
      <section style={{ padding: "80px 0", backgroundColor: "#0d100d" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto 64px" }}>
            <div className="section-tag" style={{ justifyContent: "center", margin: "0 auto 24px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#00e676" }}>diamond</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#00e676",
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
            <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: "24px" }}>
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
                    backgroundColor: "rgba(0,230,118,0.08)",
                    border: "1px solid rgba(0,230,118,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#00e676" }}>{f.icon}</span>
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
                  <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: "20px" }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider-green" />

      {/* ── LIVE DEMO ── */}
      <section
        style={{
          padding: "80px 0",
          backgroundColor: "#080a08",
          borderTop: "1px solid rgba(0,230,118,0.06)",
          borderBottom: "1px solid rgba(0,230,118,0.06)",
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
                color: "#00e676",
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

          <div className="glass-card" style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.5), 0 0 40px rgba(0,230,118,0.04)" }}>
            {/* Chat header */}
            <div
              style={{
                backgroundColor: "#0f110f",
                padding: "16px 24px",
                borderBottom: "1px solid rgba(0,230,118,0.12)",
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
                    background: "linear-gradient(135deg, #00e676, #00c853)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#080a08" }}>bolt</span>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, color: "#fff" }}>
                  Zephyra AI Assistant
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#00e676", boxShadow: "0 0 6px rgba(0,230,118,0.8)" }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#00e676", textTransform: "uppercase", letterSpacing: "0.1em" }}>Online</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#1a2e1a", border: "1px solid #00e676" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#1a2e1a" }} />
              </div>
            </div>

            {/* Chat body */}
            <div style={{ padding: "32px", minHeight: "400px", backgroundColor: "#060806", display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* User message */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                  style={{
                    backgroundColor: "#0f110f",
                    border: "1px solid rgba(0,230,118,0.15)",
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
                    color: "#080a08",
                    padding: "16px",
                    borderRadius: "8px 8px 8px 0",
                    maxWidth: "80%",
                    boxShadow: "0 4px 20px rgba(0,230,118,0.15)",
                    border: "1px solid rgba(0,230,118,0.3)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#00c853" }}>verified</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#00a847" }}>
                      In Stock
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 16, margin: 0, color: "#080a08" }}>
                    Yes! We have 4 left in stock in our primary warehouse. Would you like to add it to your cart or check for matching beanies?
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ paddingTop: "24px", borderTop: "1px solid rgba(0,230,118,0.08)" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  {["Add to Cart", "Show Similar"].map((label) => (
                    <button
                      key={label}
                      style={{
                        backgroundColor: "rgba(0,230,118,0.08)",
                        border: "1px solid rgba(0,230,118,0.25)",
                        padding: "4px 12px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#00e676",
                        cursor: "pointer",
                        transition: "background 0.2s",
                        borderRadius: "2px",
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
                    backgroundColor: "#0f110f",
                    padding: "16px",
                    border: "1px solid rgba(0,230,118,0.1)",
                    borderRadius: "4px",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "rgba(255,255,255,0.3)" }}>sentiment_satisfied</span>
                  <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 16, color: "rgba(255,255,255,0.3)" }}>
                    Type your question...
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#00e676", marginLeft: "auto" }}>send</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="divider-green" />

      {/* ── INTEGRATIONS ── */}
      <section style={{ padding: "80px 0", backgroundColor: "#0d100d" }}>
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
              <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 16, color: "rgba(255,255,255,0.45)" }}>
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
                  <div className="integration-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#00e676" }}>{t.icon}</span>
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

      <hr className="divider-green" />

      {/* ── CTA ── */}
      <section style={{ padding: "80px 0", position: "relative", overflow: "hidden", backgroundColor: "#080a08" }}>
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 600,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,230,118,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "80px 32px", textAlign: "center", position: "relative", zIndex: 10 }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              border: "1px solid rgba(0,230,118,0.3)",
              background: "rgba(0,230,118,0.05)",
              marginBottom: "24px",
            }}
          >
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#00e676", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              No credit card required
            </span>
          </div>
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
          <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 18, color: "rgba(255,255,255,0.45)", marginBottom: "40px" }}>
            Join 12,000+ businesses using Zephyra. Average setup time: under 15 minutes.
          </p>
          <Link
            href="/sign-up"
            className="green-btn"
            style={{ fontSize: 18, padding: "24px 48px" }}
          >
            Get Started with Zephyra
          </Link>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(255,255,255,0.3)",
              marginTop: "32px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            No credit card required • 14-day free trial
          </p>
        </div>
      </section>

      <hr className="divider-green" />

      {/* ── FOOTER ── */}
      <footer
        style={{
          backgroundColor: "#060806",
          width: "100%",
          padding: "80px 0",
          borderTop: "1px solid rgba(0,230,118,0.08)",
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
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: "linear-gradient(135deg, #00e676, #00c853)",
                  borderRadius: "5px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#080a08" }}>diamond</span>
              </div>
              <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>Zephyra</span>
            </div>
            <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: "20px" }}>
              AI-powered conversational platform for businesses that demand results.
            </p>
            <p style={{ fontFamily: "'Geist', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.25)" }}>
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
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, color: "#00e676", marginBottom: "8px" }}>
                {col.heading}
              </span>
              {col.links.map((l) => (
                <a
                  key={l}
                  href="#"
                  style={{
                    fontFamily: "'Geist', sans-serif",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.35)",
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
