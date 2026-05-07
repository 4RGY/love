import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

const MESSAGES = [
  {
    step: "01",
    title: "Kamu Berharga",
    body: "Bukan karena apa yang kamu capai atau seberapa kuat kamu terlihat. Tapi karena siapa kamu apa adanya — itu sudah lebih dari cukup.",
    quote: '"You are enough, always."',
  },
  {
    step: "02",
    title: "Aku Lihat Usahamu",
    body: "Setiap kali kamu mencoba, bahkan di hari-hari yang berat sekalipun — aku selalu melihatnya. Dan itu, bukan hal kecil.",
    quote: '"Your effort is seen and it matters."',
  },
  {
    step: "03",
    title: "Kamu Luar Biasa",
    body: "Caramu menghadapi hal-hal yang sulit, cara kamu tetap baik di tengah keadaan yang tidak mudah — itu sesuatu yang tidak semua orang punya.",
    quote: '"Quietly strong, genuinely kind."',
  },
  {
    step: "04",
    title: "Aku Mencintaimu",
    body: "Bukan karena sempurna. Tapi karena kamu nyata, kamu jujur, dan kamu ada. Aku bersyukur atas itu setiap hari.",
    quote: "\"Real love, not perfect — and that's enough.\"",
  },
  {
    step: "05",
    title: "Selalu",
    body: "Di hari-hari yang biasa maupun yang sulit, kamu tetap jadi orang yang aku pilih. Kemarin, hari ini, dan nanti.",
    quote: '"I choose you, over and over."',
  },
];

function useGoogleFonts() {
  useEffect(() => {
    const id = "ll-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Cinzel:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);
}

function useThreeScene(mountRef) {
  const burstRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 5;
    const col = new THREE.Color();

    // Heart
    const hPos = [], hCol = [];
    for (let t = 0; t < Math.PI * 2; t += 0.011) {
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      hPos.push(x * 0.048, y * 0.048, 0);
      col.setHSL(0.92 + Math.random() * 0.06, 1, 0.6 + Math.random() * 0.25);
      hCol.push(col.r, col.g, col.b);
    }
    for (let i = 0; i < 2600; i++) {
      const t = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
      const x = 16 * Math.pow(Math.sin(t), 3) * r;
      const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * r;
      hPos.push(x * 0.048, y * 0.048, (Math.random() - 0.5) * 0.35);
      col.setHSL(0.88 + Math.random() * 0.09, 0.85, 0.5 + Math.random() * 0.38);
      hCol.push(col.r, col.g, col.b);
    }
    const hGeo = new THREE.BufferGeometry();
    hGeo.setAttribute("position", new THREE.Float32BufferAttribute(hPos, 3));
    hGeo.setAttribute("color", new THREE.Float32BufferAttribute(hCol, 3));
    const heart = new THREE.Points(hGeo, new THREE.PointsMaterial({ size: 0.026, vertexColors: true, transparent: true, opacity: 0.92 }));
    heart.position.y = 0.25;
    scene.add(heart);

    // Stars
    const sPos = [], sCol = [];
    for (let i = 0; i < 700; i++) {
      sPos.push((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 11, (Math.random() - 0.5) * 7 - 3);
      col.setHSL(0.84 + Math.random() * 0.16, 0.5, 0.4 + Math.random() * 0.45);
      sCol.push(col.r, col.g, col.b);
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.Float32BufferAttribute(sPos, 3));
    sGeo.setAttribute("color", new THREE.Float32BufferAttribute(sCol, 3));
    scene.add(new THREE.Points(sGeo, new THREE.PointsMaterial({ size: 0.016, vertexColors: true, transparent: true, opacity: 0.45 })));

    // Ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.94, 0.005, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0xcc4477, transparent: true, opacity: 0.2 })
    );
    ring.position.y = 0.25;
    scene.add(ring);

    // Burst
    const burstPos = new Float32Array(150 * 3);
    const burstVel = [];
    for (let i = 0; i < 150; i++) {
      const theta = Math.random() * Math.PI * 2, phi = Math.random() * Math.PI;
      burstVel.push(Math.sin(phi) * Math.cos(theta) * 0.04, Math.sin(phi) * Math.sin(theta) * 0.04, Math.cos(phi) * 0.04);
    }
    const burstGeo = new THREE.BufferGeometry();
    burstGeo.setAttribute("position", new THREE.Float32BufferAttribute(burstPos, 3));
    const burstMat = new THREE.PointsMaterial({ size: 0.04, color: 0xff6699, transparent: true, opacity: 0 });
    const burstMesh = new THREE.Points(burstGeo, burstMat);
    scene.add(burstMesh);
    let burstActive = false, burstT = 0;

    burstRef.current = (wx, wy) => {
      const rect = mount.getBoundingClientRect();
      const nx = ((wx - rect.left) / rect.width) * 2 - 1;
      const ny = -((wy - rect.top) / rect.height) * 2 + 1;
      const vec = new THREE.Vector3(nx, ny, 0.5).unproject(camera);
      const dir = vec.sub(camera.position).normalize();
      const d = (0 - camera.position.z) / dir.z;
      burstMesh.position.copy(camera.position.clone().add(dir.multiplyScalar(d)));
      const p = burstGeo.attributes.position.array;
      for (let i = 0; i < 150; i++) { p[i * 3] = 0; p[i * 3 + 1] = 0; p[i * 3 + 2] = 0; }
      burstGeo.attributes.position.needsUpdate = true;
      burstActive = true; burstT = 0; burstMat.opacity = 0.8;
    };

    // Device orientation
    let tiltX = 0, tiltY = 0, targetTX = 0, targetTY = 0;
    const onOrient = (e) => { targetTX = (e.beta - 30) / 300; targetTY = e.gamma / 300; };
    window.addEventListener("deviceorientation", onOrient, { passive: true });

    const clock = new THREE.Clock();
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta(), t = clock.getElapsedTime();
      tiltX += (targetTX - tiltX) * 0.05;
      tiltY += (targetTY - tiltY) * 0.05;
      heart.rotation.y = Math.sin(t * 0.7) * 0.14 + tiltY;
      heart.rotation.x = Math.sin(t * 0.5) * 0.05 + tiltX;
      ring.rotation.z += dt * 0.4;
      ring.material.opacity = 0.15 + Math.sin(t * 1.8) * 0.07;
      if (burstActive) {
        burstT += dt;
        const p = burstGeo.attributes.position.array;
        for (let i = 0; i < 150; i++) {
          p[i * 3] += burstVel[i * 3];
          p[i * 3 + 1] += burstVel[i * 3 + 1];
          p[i * 3 + 2] += burstVel[i * 3 + 2];
        }
        burstGeo.attributes.position.needsUpdate = true;
        burstMat.opacity = Math.max(0, 0.8 - burstT * 1.4);
        if (burstT > 0.6) burstActive = false;
      }
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener("deviceorientation", onOrient);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [mountRef]);

  return burstRef;
}

export default function LoveLetter() {
  useGoogleFonts();
  const mountRef = useRef(null);
  const burstRef = useThreeScene(mountRef);
  const [phase, setPhase] = useState("intro");
  const [idx, setIdx] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const swipeStart = useRef(0);

  const fade = useCallback((cb) => {
    setOpacity(0);
    setTimeout(() => { cb(); setOpacity(1); }, 360);
  }, []);

  const handleNext = useCallback(() => {
    if (idx < MESSAGES.length - 1) fade(() => setIdx((i) => i + 1));
    else fade(() => setPhase("final"));
  }, [idx, fade]);

  const onTouchStart = (e) => { swipeStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (phase !== "letter") return;
    const dx = e.changedTouches[0].clientX - swipeStart.current;
    if (dx < -50) handleNext();
    else if (dx > 50 && idx > 0) fade(() => setIdx((i) => i - 1));
  };

  const onPointerDown = (e) => {
    if (e.target.closest("button")) return;
    burstRef.current?.(e.clientX, e.clientY);
  };

  const s = {
    root: { position: "relative", width: "100%", height: "100svh", minHeight: "600px", background: "#06030f", overflow: "hidden", fontFamily: "'Cormorant Garamond', Georgia, serif", WebkitTapHighlightColor: "transparent" },
    canvas: { position: "absolute", inset: 0, width: "100%", height: "100%" },
    vignette: { position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%,transparent 25%,rgba(6,3,15,.82) 100%)", pointerEvents: "none" },
    overlay: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", textAlign: "center", transition: "opacity .35s ease", opacity },
    tag: { color: "rgba(220,140,170,.65)", fontSize: "9px", letterSpacing: ".5em", textTransform: "uppercase", fontFamily: "'Cinzel',serif", marginBottom: "1rem" },
    title: { color: "#f5eaf0", fontSize: "clamp(1.5rem,5vw,2.3rem)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.3, margin: "0 0 .9rem" },
    body: { color: "rgba(240,210,225,.75)", fontSize: "clamp(.92rem,3.5vw,1.05rem)", lineHeight: 1.9, fontWeight: 300, maxWidth: "380px", margin: "0 0 1rem" },
    quote: { color: "rgba(200,130,160,.42)", fontSize: ".75rem", letterSpacing: ".12em", fontStyle: "italic", marginBottom: "1.6rem" },
    divider: { width: "30px", height: "1px", background: "rgba(200,130,160,.3)", margin: "0 auto 1.2rem" },
    stepNum: { color: "rgba(200,130,160,.4)", fontSize: "9px", letterSpacing: ".5em", fontFamily: "'Cinzel',serif", marginBottom: ".3rem" },
    btn: { background: "transparent", border: "1px solid rgba(200,130,160,.45)", color: "rgba(230,170,195,.9)", padding: "12px 36px", fontSize: "10px", letterSpacing: ".3em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cinzel',serif", borderRadius: "2px" },
    btnNext: { background: "rgba(200,130,160,.08)", border: "1px solid rgba(200,130,160,.3)", color: "rgba(230,170,195,.85)", padding: "12px 36px", fontSize: "10px", letterSpacing: ".3em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cinzel',serif", borderRadius: "2px" },
    hint: { position: "absolute", bottom: "36px", color: "rgba(200,130,160,.28)", fontSize: "9px", letterSpacing: ".25em", fontFamily: "'Cinzel',serif" },
    dots: { position: "absolute", bottom: "18px", display: "flex", gap: "6px", alignItems: "center" },
  };

  const m = MESSAGES[idx];

  return (
    <div style={s.root} onPointerDown={onPointerDown} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div ref={mountRef} style={s.canvas} />
      <div style={s.vignette} />
      <div style={s.overlay}>

        {phase === "intro" && <>
          <div style={s.tag}>Untuk kamu</div>
          <h1 style={{ ...s.title, fontSize: "clamp(1.8rem,6vw,2.8rem)" }}>Ada yang ingin<br />aku sampaikan</h1>
          <p style={{ ...s.body, margin: "0 0 2rem", color: "rgba(230,195,215,.55)" }}>Baca pelan-pelan, ya.</p>
          <button style={s.btn} onClick={() => fade(() => { setPhase("letter"); setIdx(0); })}>Mulai →</button>
        </>}

        {phase === "letter" && <>
          <div style={s.stepNum}>{m.step} / 0{MESSAGES.length}</div>
          <div style={s.divider} />
          <h2 style={s.title}>{m.title}</h2>
          <p style={s.body}>{m.body}</p>
          <div style={s.quote}>{m.quote}</div>
          <button style={s.btnNext} onClick={handleNext}>
            {idx < MESSAGES.length - 1 ? "Lanjut →" : "Selesai"}
          </button>
          <div style={s.hint}>← geser untuk kembali</div>
          <div style={s.dots}>
            {MESSAGES.map((_, i) => (
              <div key={i} style={{ height: "5px", borderRadius: "3px", transition: "all .3s", width: i === idx ? "20px" : "5px", background: i === idx ? "rgba(200,130,160,.7)" : "rgba(200,130,160,.2)" }} />
            ))}
          </div>
        </>}

        {phase === "final" && <>
          <div style={{ ...s.tag, fontSize: "14px", letterSpacing: ".1em", marginBottom: ".8rem" }}>♡</div>
          <div style={s.tag}>Terima kasih sudah membaca</div>
          <h2 style={{ ...s.title, fontSize: "clamp(1.7rem,5vw,2.5rem)" }}>Aku mencintaimu,<br />semudah itu.</h2>
          <p style={{ ...s.body, margin: "0 0 1.8rem" }}>
            Tidak ada yang perlu dibuktikan. Kamu sudah cukup —<br />
            persis seperti kamu apa adanya.
          </p>
          <div style={{ color: "rgba(200,130,160,.32)", fontSize: "9px", letterSpacing: ".4em", fontFamily: "'Cinzel',serif", marginBottom: "1.8rem" }}>
            SELALU MILIKMU
          </div>
          <button style={{ ...s.btn, fontSize: "9px", opacity: 0.6 }} onClick={() => fade(() => { setPhase("intro"); setIdx(0); })}>
            Ulangi ↺
          </button>
        </>}

      </div>
    </div>
  );
}