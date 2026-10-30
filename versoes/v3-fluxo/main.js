/* AdBrain.ai — LP v3 · GSAP + ScrollTrigger + Lenis */
gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const SVGNS = "http://www.w3.org/2000/svg";

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

/* ---------- cursor + magnetic + spotlight ---------- */
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
  $$(".persona").forEach((t) =>
    t.addEventListener("mousemove", (e) => {
      const r = t.getBoundingClientRect();
      t.style.setProperty("--mx", `${e.clientX - r.left}px`);
      t.style.setProperty("--my", `${e.clientY - r.top}px`);
    })
  );
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

/* ---------- hero flow: plataformas → AdBrain → decisões ---------- */
const flow = (() => {
  const box = $(".flow"), svg = $(".flow__wires");
  const srcs = $$('[data-node="src"]'), core = $('[data-node="core"] img'), outs = $$('[data-node="out"]');
  let wires = [], pulses = [];

  const build = () => {
    pulses.forEach((p) => p.tween.kill());
    svg.innerHTML = `<defs><linearGradient id="wireGrad" x1="0" x2="1"><stop offset="0" stop-color="hsl(190 95% 55%)" stop-opacity=".15"/><stop offset=".5" stop-color="hsl(190 95% 55%)" stop-opacity=".9"/><stop offset="1" stop-color="hsl(250 85% 72%)" stop-opacity=".5"/></linearGradient></defs>`;
    wires = []; pulses = [];
    // layout boxes (offset*), so intro transforms don't skew the wires
    const rect = (el) => {
      let left = 0, top = 0, n = el;
      while (n && n !== box) { left += n.offsetLeft; top += n.offsetTop; n = n.offsetParent; }
      return { left, top, right: left + el.offsetWidth, bottom: top + el.offsetHeight, width: el.offsetWidth, height: el.offsetHeight };
    };
    const pt = (el, side) => {
      const r = rect(el);
      const x = side === "r" ? r.right : side === "l" ? r.left : r.left + r.width / 2;
      const y = side === "b" ? r.bottom : side === "t" ? r.top : r.top + r.height / 2;
      return { x, y };
    };
    const stacked = getComputedStyle(box).gridTemplateColumns.split(" ").length === 1;
    const curve = (a, b) => stacked
      ? `M${a.x},${a.y} L${b.x},${b.y}`
      : `M${a.x},${a.y} C${a.x + (b.x - a.x) * 0.55},${a.y} ${b.x - (b.x - a.x) * 0.55},${b.y} ${b.x},${b.y}`;
    const add = (d, kind) => {
      const base = document.createElementNS(SVGNS, "path");
      base.setAttribute("d", d); base.setAttribute("class", "wire");
      const lit = document.createElementNS(SVGNS, "path");
      lit.setAttribute("d", d); lit.setAttribute("class", "wire wire--lit");
      svg.append(base, lit);
      wires.push({ lit, kind });
      return lit;
    };
    if (stacked) {
      // single column: one rail down the left edge, behind the cards
      const top = pt(srcs[0], "c"), bottom = pt(outs[outs.length - 1], "c");
      add(`M22,${top.y} L22,${bottom.y}`, "in");
    } else {
      const c = rect(core);
      const cl = { x: c.left - 6, y: c.top + c.height / 2 };
      const cr = { x: c.right + 6, y: cl.y };
      srcs.forEach((s) => add(curve(pt(s, "r"), cl), "in"));
      outs.forEach((o, i) => add(curve(cr, pt(o, "l")), "out").dataset.i = i);
    }
    wires.forEach(({ lit }) => {
      const L = lit.getTotalLength();
      gsap.set(lit, { strokeDasharray: L, strokeDashoffset: L });
    });
  };

  const animate = (delay = 0) => {
    const ins = wires.filter((w) => w.kind === "in"), outsW = wires.filter((w) => w.kind === "out");
    const tl = gsap.timeline({ delay });
    tl.to(ins.map((w) => w.lit), { strokeDashoffset: 0, duration: 1, ease: "power2.inOut", stagger: 0.15 })
      .to(outsW.map((w) => w.lit), { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.12 }, "-=0.3");
    if (reduce) return;
    tl.add(() => {
      // pulses travel along every wire; when one reaches a client, that card pings
      wires.forEach((w, i) => {
        const dotEl = document.createElementNS(SVGNS, "circle");
        dotEl.setAttribute("r", 3); dotEl.setAttribute("class", "pulse"); dotEl.setAttribute("opacity", 0);
        svg.appendChild(dotEl);
        const L = w.lit.getTotalLength(), s = { t: 0 };
        const card = w.kind === "out" ? outs[+w.lit.dataset.i] : null;
        const tween = gsap.to(s, {
          t: 1, duration: 1.6, ease: "power1.inOut", repeat: -1, repeatDelay: 1.4,
          delay: w.kind === "in" ? i * 0.3 : 1 + i * 0.35,
          onUpdate: () => {
            const p = w.lit.getPointAtLength(s.t * L);
            dotEl.setAttribute("cx", p.x); dotEl.setAttribute("cy", p.y);
            dotEl.setAttribute("opacity", Math.sin(s.t * Math.PI));
          },
          onRepeat: () => card && gsap.fromTo(card, { borderColor: "hsl(190 95% 55%)", boxShadow: "0 0 30px hsl(190 95% 55% / .35)" }, { borderColor: "hsl(222 30% 22%)", boxShadow: "0 0 0px hsl(190 95% 55% / 0)", duration: 1.2, ease: "power2.out" }),
        });
        pulses.push({ tween });
      });
    });
  };

  let started = false;
  const init = (delay) => { build(); animate(delay); started = true; };
  let rt;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (started) { build(); animate(0); } }, 200);
  });
  return { init };
})();

/* ---------- hero intro (content first, no preloader) ---------- */
const startHero = () => {
  if (reduce) { flow.init(0); return; }
  gsap.timeline({ defaults: { ease: "expo.out" } })
    .from(".hero__title .ch", { yPercent: 115, duration: 1.1, stagger: 0.01 })
    .from(".hero .fade-up", { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, 0.15)
    .from(".nav", { y: -80, opacity: 0, duration: 1 }, 0.2)
    .from(".flow", { y: 40, opacity: 0, duration: 1.2 }, 0.3)
    .from(".src", { x: -24, opacity: 0, duration: 0.9, stagger: 0.1 }, 0.55)
    .from(".flow__core", { scale: 0.6, opacity: 0, duration: 1.1, ease: "back.out(2)" }, 0.75)
    .from(".out", { x: 24, opacity: 0, duration: 0.9, stagger: 0.12 }, 1.0);
  flow.init(0.9);
};
document.fonts ? document.fonts.ready.then(startHero) : startHero();

/* ---------- section reveals ---------- */
$$("section:not(.hero) .h2").forEach((h) => {
  const chars = $$(".ch", h);
  if (chars.length) gsap.from(chars, { yPercent: 115, duration: 1.1, ease: "expo.out", stagger: 0.012, scrollTrigger: { trigger: h, start: "top 85%" } });
});
$$("section:not(.hero) .label, section:not(.hero) .fade-up").forEach((el) =>
  gsap.from(el, { y: 20, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } })
);

/* ---------- integrações ---------- */
gsap.from(".plat", { y: 60, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: ".int__grid", start: "top 82%" } });
$$(".plat").forEach((p) =>
  gsap.from($$(".plat__list li", p), { x: -16, opacity: 0, duration: 0.8, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: p, start: "top 70%" } })
);
gsap.from(".connect__steps li", { y: 24, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: ".connect", start: "top 85%" } });
gsap.from(".connect__n", { scale: 0, duration: 0.8, ease: "back.out(3)", stagger: 0.12, scrollTrigger: { trigger: ".connect", start: "top 85%" } });
gsap.from(".next > *", { y: 14, opacity: 0, duration: 0.7, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: ".next", start: "top 92%" } });

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
  "(min-width: 1101px)": () => {
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
  "(max-width: 1100px)": () => {
    gsap.to(spark, { strokeDashoffset: 0, duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: ".signal", start: "top 80%" } });
    [".signal", ".diagnose", ".rec"].forEach((sel, i) =>
      gsap.from(sel, { y: 40, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: sel, start: "top 85%", onEnter: () => setStep(i), onLeaveBack: () => setStep(Math.max(0, i - 1)) } })
    );
  },
});

/* ---------- para quem ---------- */
gsap.from(".persona", { y: 60, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: ".who__grid", start: "top 82%" } });
gsap.from(".feats li", { y: 12, opacity: 0, duration: 0.7, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: ".feats", start: "top 92%" } });

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
  .from(".final .btn, .final__s", { y: 30, opacity: 0 }, 0.3);
gsap.from(".foot__word span", { yPercent: 100, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: true } });

addEventListener("load", () => ScrollTrigger.refresh());
