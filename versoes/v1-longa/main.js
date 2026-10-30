/* AdBrain.ai — LP premium · GSAP + ScrollTrigger + Lenis */
gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const target = $(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { offset: -40, duration: 1.6 }) : target.scrollIntoView({ behavior: "smooth" });
  })
);

/* ---------- text splitting ---------- */
$$(".split").forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words
    .map((w) => `<span style="display:inline-block;white-space:nowrap">${[...w].map((c) => `<span class="ch">${c}</span>`).join("")}</span>`)
    .join(" ");
});
/* gradient spans the whole word even though each char is its own layer */
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

$$(".reveal-words").forEach((el) => {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else {
            const s = document.createElement("span");
            s.className = "w";
            s.textContent = part;
            frag.appendChild(s);
          }
        });
        n.replaceWith(frag);
      } else walk(n);
    });
  };
  walk(el);
});

/* ---------- loader + hero intro ---------- */
function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(".hero__title .ch", { yPercent: 115, rotate: 6, duration: 1.4, stagger: 0.022 })
    .from(".hero__meta span", { y: 16, opacity: 0, duration: 1, stagger: 0.08 }, 0.2)
    .from(".mascot-wrap", { scale: 0.6, opacity: 0, y: 60, duration: 1.8, ease: "elastic.out(1, 0.6)" }, 0.25)
    .from(".orbit", { scale: 0.4, opacity: 0, duration: 1.6, stagger: 0.1 }, 0.3)
    .from(".chip", { y: 30, opacity: 0, scale: 0.9, duration: 1.2, stagger: 0.12 }, 0.7)
    .from(".hero .fade-up", { y: 30, opacity: 0, duration: 1.2, stagger: 0.12 }, 0.6)
    .from(".nav", { y: -80, opacity: 0, duration: 1.2 }, 0.4)
    .from(".hero__foot", { opacity: 0, duration: 1 }, 1);
  return tl;
}

if (reduce) {
  $(".loader").remove();
} else {
  document.body.classList.add("is-loading");
  lenis && lenis.stop();
  const words = $$(".loader__words span");
  const counter = { v: 0 };
  gsap
    .timeline()
    .from(".loader__inner", { opacity: 0, y: 20, duration: 0.6, ease: "power3.out" })
    .to(counter, {
      v: 100,
      duration: 1.8,
      ease: "power2.inOut",
      onUpdate() {
        const v = Math.round(counter.v);
        $(".loader__count").textContent = String(v).padStart(3, "0");
        gsap.set(".loader__bar span", { scaleX: v / 100 });
        words.forEach((w, i) => w.classList.toggle("on", v >= i * 40));
      },
    })
    .to(".loader__inner", { opacity: 0, y: -30, duration: 0.5, ease: "power3.in" })
    .to(".loader", { yPercent: -100, duration: 1, ease: "expo.inOut" }, "-=0.1")
    .add(() => {
      document.body.classList.remove("is-loading");
      lenis && lenis.start();
      $(".loader").remove();
    })
    .add(heroIntro(), "-=0.75");
}

/* ---------- cursor ---------- */
if (finePointer && !reduce) {
  const ring = $(".cursor"), dot = $(".cursor-dot"), label = $(".cursor__label");
  const rx = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3" });
  const ry = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3" });
  const dx = gsap.quickTo(dot, "x", { duration: 0.12 });
  const dy = gsap.quickTo(dot, "y", { duration: 0.12 });
  addEventListener("mousemove", (e) => { rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); });
  $$("[data-cursor], a, button").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      const view = el.dataset.cursor === "view";
      ring.classList.add(view ? "is-view" : "is-hover");
      label.textContent = view ? "Ver" : "";
    });
    el.addEventListener("mouseleave", () => ring.classList.remove("is-view", "is-hover"));
  });

  /* magnetic */
  $$(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.6, ease: "power3" });
    });
    el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.35)" }));
  });

  /* tile spotlight */
  $$(".tile").forEach((t) =>
    t.addEventListener("mousemove", (e) => {
      const r = t.getBoundingClientRect();
      t.style.setProperty("--mx", `${e.clientX - r.left}px`);
      t.style.setProperty("--my", `${e.clientY - r.top}px`);
    })
  );
}

/* ---------- scroll progress + nav hide ---------- */
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

/* ---------- hero: neural canvas ---------- */
(() => {
  const cv = $(".hero__canvas"), ctx = cv.getContext("2d");
  let w, h, nodes, mouse = { x: -999, y: -999 }, running = true;
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const resize = () => {
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * DPR; cv.height = h * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.round(Math.min(90, (w * h) / 16000));
    nodes = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.4 + 0.6 }));
  };
  resize(); addEventListener("resize", resize);
  $(".hero").addEventListener("mousemove", (e) => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  $(".hero").addEventListener("mouseleave", () => { mouse.x = mouse.y = -999; });
  ScrollTrigger.create({ trigger: ".hero", start: "top top", end: "bottom top", onToggle: (s) => (running = s.isActive) });
  const LINK = 140;
  const draw = () => {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of nodes) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      const mx = p.x - mouse.x, my = p.y - mouse.y, md = Math.hypot(mx, my);
      if (md < 160) { p.x += (mx / md) * 0.8; p.y += (my / md) * 0.8; }
    }
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `hsla(190,95%,55%,${(1 - d / LINK) * 0.22})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const near = Math.hypot(a.x - mouse.x, a.y - mouse.y) < 200;
      ctx.fillStyle = near ? "hsla(190,95%,65%,.95)" : "hsla(205,80%,70%,.45)";
      ctx.beginPath(); ctx.arc(a.x, a.y, near ? a.r * 1.8 : a.r, 0, Math.PI * 2); ctx.fill();
    }
  };
  if (reduce) draw(); else gsap.ticker.add(draw);
})();

/* ---------- hero: mascot float + parallax ---------- */
if (!reduce) {
  gsap.to(".mascot-wrap", { y: -18, rotate: 1.5, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
  gsap.to(".mascot-halo", { scale: 1.25, opacity: 0.7, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
  gsap.to(".orbit--2", { rotate: 360, duration: 60, ease: "none", repeat: -1 });
  gsap.to(".orbit--1", { rotate: -360, duration: 26, ease: "none", repeat: -1 });
  const layers = [
    [".mascot", 18], [".chip--a", 40], [".chip--b", 55], [".chip--c", 30], [".orbit--3", 10],
  ].map(([s, d]) => ({ d, x: gsap.quickTo(s, "x", { duration: 1.2, ease: "power3" }), y: gsap.quickTo(s, "y", { duration: 1.2, ease: "power3" }) }));
  $(".hero").addEventListener("mousemove", (e) => {
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    layers.forEach((l) => { l.x(nx * l.d); l.y(ny * l.d); });
  });
  /* hero exits with depth on scroll */
  gsap.to(".hero__copy", { yPercent: -18, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__visual", { yPercent: 14, scale: 0.92, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
}

/* ---------- marquee (velocity-reactive) ---------- */
$$(".marquee__track").forEach((track) => {
  const row = $(".marquee__row", track);
  track.appendChild(row.cloneNode(true));
  const dir = Number(track.dataset.dir);
  const tween = gsap.fromTo(track, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: dir < 0 ? 38 : 46, ease: "none", repeat: -1 });
  if (reduce) tween.pause();
  ScrollTrigger.create({
    trigger: ".marquee",
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      const v = self.getVelocity() / 300;
      gsap.to(tween, { timeScale: 1 + Math.min(Math.abs(v), 6), duration: 0.2, overwrite: true });
      gsap.to(tween, { timeScale: 1, duration: 1.2, delay: 0.2, ease: "power2.out" });
      gsap.to(track, { skewX: gsap.utils.clamp(-8, 8, -v * 1.2), duration: 0.4, overwrite: "auto" });
      gsap.to(track, { skewX: 0, duration: 1, delay: 0.3 });
    },
  });
});

/* ---------- section titles: char reveal ---------- */
$$("section:not(.hero) .h2").forEach((h) => {
  const chars = $$(".ch", h);
  if (!chars.length) return;
  gsap.from(chars, { yPercent: 115, rotate: 5, duration: 1.2, ease: "expo.out", stagger: 0.012, scrollTrigger: { trigger: h, start: "top 85%" } });
});
$$("section:not(.hero) .fade-up, .label").forEach((el) =>
  gsap.from(el, { y: 24, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } })
);

/* ---------- manifesto: word scrub ---------- */
gsap.to(".manifesto__text .w", {
  opacity: 1, stagger: 0.1, ease: "none",
  scrollTrigger: { trigger: ".manifesto__text", start: "top 78%", end: "bottom 55%", scrub: true },
});

/* ---------- method index ---------- */
$$(".index__row").forEach((row, i) =>
  gsap.from(row, { y: 40, opacity: 0, duration: 1, ease: "expo.out", delay: (i % 4) * 0.05, scrollTrigger: { trigger: row, start: "top 92%" } })
);
if (finePointer && innerWidth > 1024) {
  const pv = $(".preview"), panels = $$(".pv");
  const px = gsap.quickTo(pv, "x", { duration: 0.7, ease: "power3" });
  const py = gsap.quickTo(pv, "y", { duration: 0.7, ease: "power3" });
  const pr = gsap.quickTo(pv, "rotate", { duration: 0.8, ease: "power3" });
  let lastX = 0;
  addEventListener("mousemove", (e) => {
    px(e.clientX + 30); py(e.clientY - 115);
    pr(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.4)); lastX = e.clientX;
  });
  $$(".index__row").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      panels.forEach((p) => p.classList.toggle("on", p.dataset.i === row.dataset.preview));
      gsap.to(pv, { opacity: 1, scale: 1, duration: 0.5, ease: "expo.out" });
    });
  });
  $(".index").addEventListener("mouseleave", () => gsap.to(pv, { opacity: 0, scale: 0.85, duration: 0.4, ease: "power3.out" }));
} else {
  $$(".index__row").forEach((row) => row.removeAttribute("data-cursor"));
}

/* ---------- diagnóstico ---------- */
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
    gsap.set([".diagnose", ".rec"], { opacity: 0, y: 60 });
    gsap.set([".diagnose__chips span", ".rec__f", ".rec__actions .pill"], { opacity: 0, y: 14 });
    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: {
        trigger: ".diag__pin", start: "top top", end: "+=240%", pin: true, scrub: 0.8,
        onUpdate: (self) => {
          setStep(self.progress < 0.34 ? 0 : self.progress < 0.67 ? 1 : 2);
          gsap.set(".diag__track i", { scaleX: self.progress });
        },
      },
    });
    tl.to(spark, { strokeDashoffset: 0, duration: 1 })
      .to(".signal", { scale: 0.96, opacity: 0.55, duration: 0.5 }, 1.1)
      .to(".diagnose", { opacity: 1, y: 0, duration: 0.6 }, 1.1)
      .to(".diagnose__chips span", { opacity: 1, y: 0, stagger: 0.15, duration: 0.4 }, 1.4)
      .to(".diagnose", { scale: 0.97, opacity: 0.6, duration: 0.5 }, 2.2)
      .to(".rec", { opacity: 1, y: 0, duration: 0.6 }, 2.2)
      .to(".rec__f", { opacity: 1, y: 0, stagger: 0.15, duration: 0.4 }, 2.5)
      .to(".rec__actions .pill", { opacity: 1, y: 0, stagger: 0.1, duration: 0.3 }, 3.1)
      .to({}, { duration: 0.4 });
  },
  "(max-width: 1024px)": () => {
    gsap.to(spark, { strokeDashoffset: 0, duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: ".signal", start: "top 80%" } });
    [".signal", ".diagnose", ".rec"].forEach((sel, i) => {
      gsap.from(sel, { y: 50, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: sel, start: "top 85%", onEnter: () => setStep(i), onLeaveBack: () => setStep(Math.max(0, i - 1)) } });
    });
  },
});

/* ---------- princípios ---------- */
gsap.from(".tile", { y: 60, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".grid6", start: "top 80%" } });

/* ---------- ecossistema ---------- */
gsap.fromTo(".eco__spin", { "--r": "0deg" }, { "--r": "-140deg", ease: "none", scrollTrigger: { trigger: ".eco", start: "top bottom", end: "bottom top", scrub: 1 } });
gsap.from(".eco__node", { opacity: 0, scale: 0.5, duration: 1, ease: "back.out(2)", stagger: 0.1, scrollTrigger: { trigger: ".eco__stage", start: "top 75%" } });
gsap.from(".eco__core", { scale: 0.6, opacity: 0, duration: 1.4, ease: "elastic.out(1, 0.6)", scrollTrigger: { trigger: ".eco__stage", start: "top 75%" } });
if (!reduce) gsap.to(".eco__core img", { y: -12, duration: 2.8, ease: "sine.inOut", yoyo: true, repeat: -1 });
gsap.from(".eco__list li", { x: -30, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: ".eco__list", start: "top 85%" } });

/* ---------- para quem / segurança ---------- */
gsap.from(".who__row", { y: 50, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".who__rows", start: "top 85%" } });
gsap.from(".sec__inner", { scale: 0.94, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".sec", start: "top 85%" } });
gsap.from(".sec__i", { y: 30, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".sec__grid", start: "top 90%" } });

/* ---------- planos ---------- */
gsap.from(".plan", { y: 80, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: ".plans__grid", start: "top 82%" } });
$$(".count").forEach((el) => {
  const o = { v: 0 }, to = Number(el.dataset.to);
  ScrollTrigger.create({
    trigger: el, start: "top 90%", once: true,
    onEnter: () => gsap.to(o, { v: to, duration: 1.6, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(o.v)) }),
  });
});

/* ---------- final + footer ---------- */
gsap.timeline({ scrollTrigger: { trigger: ".final", start: "top 80%", end: "center center", scrub: 1 } })
  .from(".final__a", { yPercent: 60, opacity: 0, scale: 0.85 })
  .from(".final__b", { yPercent: 80, opacity: 0, scale: 0.85 }, 0.15)
  .from(".final .btn", { y: 40, opacity: 0 }, 0.3);
gsap.from(".foot__word span", { yPercent: 100, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: true } });

addEventListener("load", () => ScrollTrigger.refresh());
