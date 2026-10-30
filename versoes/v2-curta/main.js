/* AdBrain.ai — LP v2 · GSAP + ScrollTrigger + Lenis */
gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const target = $(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { offset: -20, duration: 1.4 }) : target.scrollIntoView({ behavior: "smooth" });
  })
);

/* ---------- text splitting ---------- */
$$(".split").forEach((el) => {
  el.innerHTML = el.textContent.trim().split(/\s+/)
    .map((w) => `<span style="display:inline-block;white-space:nowrap">${[...w].map((c) => `<span class="ch">${c}</span>`).join("")}</span>`)
    .join(" ");
});
/* gradient spans the whole phrase even though each char is its own layer */
const paintGradients = () =>
  $$(".split.grad").forEach((el) => {
    const w = el.offsetWidth;
    $$(".ch", el).forEach((c) => {
      c.style.backgroundSize = `${w}px 100%`;
      c.style.backgroundPosition = `${-c.offsetLeft}px 0`;
    });
  });
document.fonts ? document.fonts.ready.then(paintGradients) : paintGradients();
addEventListener("resize", paintGradients);

/* ---------- hero intro (no preloader: content first) ---------- */
if (!reduce) {
  gsap.timeline({ defaults: { ease: "expo.out" } })
    .from(".hero__title .ch", { yPercent: 115, duration: 1.2, stagger: 0.014 })
    .from(".hero .fade-up", { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, 0.15)
    .from(".brain", { opacity: 0, scale: 0.85, duration: 1.8 }, 0.1)
    .from(".chip", { y: 30, opacity: 0, duration: 1, stagger: 0.15 }, 0.7)
    .from(".nav", { y: -80, opacity: 0, duration: 1 }, 0.2);
}

/* ---------- cursor + magnetic ---------- */
if (finePointer && !reduce) {
  const ring = $(".cursor"), dot = $(".cursor-dot");
  const rx = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3" });
  const ry = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3" });
  const dx = gsap.quickTo(dot, "x", { duration: 0.12 });
  const dy = gsap.quickTo(dot, "y", { duration: 0.12 });
  addEventListener("mousemove", (e) => { rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); });
  $$("[data-cursor], a").forEach((el) => {
    el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
  });
  $$(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.6, ease: "power3" });
    });
    el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.35)" }));
  });
} else {
  $$(".cursor, .cursor-dot").forEach((el) => el.remove());
}

/* ---------- progress + nav hide ---------- */
gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
let navHidden = false;
ScrollTrigger.create({
  start: 200,
  end: "max",
  onUpdate: (self) => {
    const hide = self.direction === 1 && self.scroll() > 600;
    if (hide === navHidden) return;
    navHidden = hide;
    gsap.to(".nav", { yPercent: hide ? -160 : 0, duration: 0.6, ease: "expo.out", overwrite: "auto" });
  },
});

/* ---------- hero: neural brain (Crxate neural-field, 2D-projected) ---------- */
const brain = (() => {
  const cv = $(".brain"), ctx = cv.getContext("2d");
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const N = innerWidth < 640 ? 120 : 170;
  const LINK = 1.25;
  const state = { rotY: 0, extra: 0, tx: 0, ty: 0, px: 0, py: 0 };

  // two hemispheres with a fissure, slightly flattened — reads as "brain", not "sphere"
  const nodes = [];
  while (nodes.length < N) {
    const side = nodes.length % 2 ? 1 : -1;
    const x = (Math.random() * 2 - 1), y = (Math.random() * 2 - 1), z = (Math.random() * 2 - 1);
    if (x * x + y * y + z * z > 1) continue;
    const hx = side * (0.3 + Math.abs(x) * 1.05);
    nodes.push({ x: hx, y: y * 0.92 - (z > 0.4 ? 0.08 : 0), z: z * 1.35, side });
  }
  const links = [];
  nodes.forEach((a, i) => {
    let made = 0;
    for (let j = i + 1; j < N && made < 4; j++) {
      const b = nodes[j];
      if (a.side !== b.side && Math.random() > 0.08) continue; // keep the fissure readable
      if (Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < LINK * 0.62) { links.push([i, j]); made++; }
    }
  });
  const signals = Array.from({ length: 28 }, () => ({ l: links[(Math.random() * links.length) | 0], t: Math.random(), s: 0.004 + Math.random() * 0.01 }));

  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 64;
  const sg = sprite.getContext("2d"), g = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "hsla(190,95%,75%,1)"); g.addColorStop(0.35, "hsla(190,95%,60%,.55)"); g.addColorStop(1, "hsla(190,95%,55%,0)");
  sg.fillStyle = g; sg.fillRect(0, 0, 64, 64);

  let w, h, scale, running = true;
  const resize = () => {
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * DPR; cv.height = h * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    scale = Math.min(w, h) * 0.34;
  };
  resize(); addEventListener("resize", resize);
  addEventListener("mousemove", (e) => { state.tx = e.clientX / innerWidth - 0.5; state.ty = e.clientY / innerHeight - 0.5; });
  ScrollTrigger.create({ trigger: ".hero", start: "top top", end: "bottom top", onToggle: (s) => (running = s.isActive) });

  const proj = new Array(N);
  const draw = (time) => {
    if (!running) return;
    if (!reduce) state.rotY += 0.0025;
    state.px += (state.tx - state.px) * 0.04;
    state.py += (state.ty - state.py) * 0.04;
    const ry = state.rotY + state.extra + state.px * 0.8, rx = -0.25 + state.py * 0.5;
    const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    const breathe = 1 + Math.sin((time || 0) * 0.6) * 0.015;
    for (let i = 0; i < N; i++) {
      const n = nodes[i];
      const x1 = n.x * cy + n.z * sy, z1 = -n.x * sy + n.z * cy;
      const y1 = n.y * cx - z1 * sx, z2 = n.y * sx + z1 * cx;
      const p = 3.6 / (3.6 + z2);
      proj[i] = { x: w / 2 + x1 * scale * p * breathe, y: h / 2 + y1 * scale * p * breathe, z: z2, p };
    }
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 0.7;
    for (const [a, b] of links) {
      const A = proj[a], B = proj[b];
      const depth = 1 - ((A.z + B.z) / 2 + 1.4) / 2.8;
      ctx.strokeStyle = `hsla(195,90%,62%,${0.06 + depth * 0.28})`;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    }
    for (let i = 0; i < N; i++) {
      const P = proj[i], depth = 1 - (P.z + 1.4) / 2.8, s = (5 + depth * 9) * P.p;
      ctx.globalAlpha = 0.35 + depth * 0.65;
      ctx.drawImage(sprite, P.x - s / 2, P.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    for (const sig of signals) {
      if (!reduce) sig.t += sig.s;
      if (sig.t > 1) { sig.t = 0; sig.l = links[(Math.random() * links.length) | 0]; }
      const A = proj[sig.l[0]], B = proj[sig.l[1]];
      const x = A.x + (B.x - A.x) * sig.t, y = A.y + (B.y - A.y) * sig.t;
      ctx.drawImage(sprite, x - 9, y - 9, 18, 18);
    }
  };
  if (reduce) draw(0); else gsap.ticker.add(draw);
  return state;
})();

if (!reduce) {
  // scroll spins the brain a little — the hero reacts to the visitor
  gsap.to(brain, { extra: Math.PI * 0.9, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
  gsap.to(".hero__copy", { yPercent: -14, opacity: 0.25, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  const chipA = { x: gsap.quickTo(".chip--a", "x", { duration: 1.2, ease: "power3" }), y: gsap.quickTo(".chip--a", "y", { duration: 1.2, ease: "power3" }) };
  const chipB = { x: gsap.quickTo(".chip--b", "x", { duration: 1.2, ease: "power3" }), y: gsap.quickTo(".chip--b", "y", { duration: 1.2, ease: "power3" }) };
  addEventListener("mousemove", (e) => {
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    chipA.x(nx * 36); chipA.y(ny * 36); chipB.x(nx * -28); chipB.y(ny * -28);
  });
}

/* ---------- section reveals ---------- */
$$("section:not(.hero) .h2").forEach((h) => {
  const chars = $$(".ch", h);
  if (chars.length) gsap.from(chars, { yPercent: 115, duration: 1.1, ease: "expo.out", stagger: 0.012, scrollTrigger: { trigger: h, start: "top 85%" } });
});
$$("section:not(.hero) .label").forEach((el) =>
  gsap.from(el, { y: 20, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } })
);

/* ---------- como funciona ---------- */
gsap.to(".how__rail i", { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".how__steps", start: "top 85%", end: "top 45%", scrub: true } });
gsap.from(".step", { y: 40, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.15, scrollTrigger: { trigger: ".how__steps", start: "top 85%" } });

/* ---------- demo (pinned on desktop) ---------- */
const spark = $(".spark__path");
const sparkLen = spark.getTotalLength();
gsap.set(spark, { strokeDasharray: sparkLen, strokeDashoffset: sparkLen });
const steps = $$(".diag__step");
const setStep = (n) => {
  steps.forEach((s, i) => s.classList.toggle("is-on", i === n));
  $(".diag__num").textContent = String(n + 1).padStart(2, "0");
};

ScrollTrigger.matchMedia({
  "(min-width: 1025px)": () => {
    gsap.set([".diagnose", ".rec"], { opacity: 0, y: 50 });
    gsap.set(".rec__f", { opacity: 0, y: 12 });
    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: {
        trigger: ".diag__pin", start: "top top", end: "+=160%", pin: true, scrub: 0.8,
        onUpdate: (self) => {
          setStep(self.progress < 0.33 ? 0 : self.progress < 0.62 ? 1 : 2);
          gsap.set(".diag__track i", { scaleX: self.progress });
        },
      },
    });
    tl.to(spark, { strokeDashoffset: 0, duration: 1 })
      .to(".signal", { opacity: 0.5, duration: 0.4 }, 1.1)
      .to(".diagnose", { opacity: 1, y: 0, duration: 0.6 }, 1.1)
      .to(".diagnose", { opacity: 0.6, duration: 0.4 }, 2)
      .to(".rec", { opacity: 1, y: 0, duration: 0.6 }, 2)
      .to(".rec__f", { opacity: 1, y: 0, stagger: 0.12, duration: 0.4 }, 2.3)
      .to({}, { duration: 0.3 });
  },
  "(max-width: 1024px)": () => {
    gsap.to(spark, { strokeDashoffset: 0, duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: ".signal", start: "top 80%" } });
    [".signal", ".diagnose", ".rec"].forEach((sel, i) =>
      gsap.from(sel, { y: 40, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: sel, start: "top 85%", onEnter: () => setStep(i), onLeaveBack: () => setStep(Math.max(0, i - 1)) } })
    );
  },
});

/* ---------- planos ---------- */
gsap.from(".plan", { y: 60, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".plans__grid", start: "top 85%" } });
$$(".count").forEach((el) => {
  const o = { v: 0 }, to = Number(el.dataset.to);
  ScrollTrigger.create({
    trigger: el, start: "top 92%", once: true,
    onEnter: () => gsap.to(o, { v: to, duration: 1.4, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(o.v)) }),
  });
});

/* ---------- final + footer ---------- */
gsap.timeline({ scrollTrigger: { trigger: ".final", start: "top 80%", end: "center center", scrub: 1 } })
  .from(".final__a", { yPercent: 50, opacity: 0, scale: 0.9 })
  .from(".final__b", { yPercent: 70, opacity: 0, scale: 0.9 }, 0.15)
  .from(".final .btn", { y: 30, opacity: 0 }, 0.3);
gsap.from(".foot__word span", { yPercent: 100, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: true } });

addEventListener("load", () => ScrollTrigger.refresh());
