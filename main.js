/* AdBrain.ai · LP v4 · GSAP + ScrollTrigger + Lenis */
gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: 0.085 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const target = $(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { duration: 1.4 }) : target.scrollIntoView({ behavior: "smooth" });
  })
);

/* ---------- text splitting ---------- */
$$(".split").forEach((el) => {
  el.innerHTML = el.textContent.trim().split(/\s+/)
    .map((w) => `<span style="display:inline-block;white-space:nowrap">${[...w].map((c) => `<span class="ch">${c}</span>`).join("")}</span>`)
    .join(" ");
});
/* gradient spans the whole phrase even though each char is its own layer;
   lines of the same block share one width so the gradient reads continuous */
const paintGradients = () => {
  const groups = new Map();
  $$(".split.grad").forEach((el) => {
    const key = el.closest("h1, p, h2") || el;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(el);
  });
  groups.forEach((els) => {
    const w = Math.max(...els.map((el) => el.offsetWidth));
    els.forEach((el) => $$(".ch", el).forEach((c) => {
      c.style.backgroundSize = `${w}px 100%`;
      c.style.backgroundPosition = `${-c.offsetLeft}px 0`;
    }));
  });
};
document.fonts ? document.fonts.ready.then(paintGradients) : paintGradients();
addEventListener("resize", paintGradients);

/* ---------- cursor + magnetic ---------- */
if (finePointer && !reduce) {
  const cur = $(".cursor");
  const cx = gsap.quickTo(cur, "x", { duration: 0.25, ease: "power3" });
  const cy = gsap.quickTo(cur, "y", { duration: 0.25, ease: "power3" });
  addEventListener("mousemove", (e) => { cx(e.clientX); cy(e.clientY); });
  $$("a, .who__row").forEach((el) => {
    el.addEventListener("mouseenter", () => cur.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cur.classList.remove("is-hover"));
  });
  $$(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.6, ease: "power3" });
    });
    el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.35)" }));
  });
} else {
  $(".cursor").remove();
}

/* ---------- progress + chapter indicator ---------- */
gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
const chN = $(".chapter__n"), chT = $(".chapter__t");
$$("[data-chapter]").forEach((sec) =>
  ScrollTrigger.create({
    trigger: sec, start: "top 55%", end: "bottom 55%",
    onToggle: (s) => {
      if (!s.isActive) return;
      chN.textContent = sec.dataset.chapter;
      chT.textContent = sec.dataset.title;
      gsap.fromTo(".chapter__l", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "expo.out" });
    },
  })
);

/* ---------- hero ---------- */
const tiles = $$(".hero .tile");
const startHero = () => {
  if (reduce) return;
  tiles.forEach((t) => {
    const v = (n) => parseFloat(getComputedStyle(t).getPropertyValue(n)) || 0;
    gsap.set(t, { transformPerspective: 700, rotationX: v("--rx"), rotationY: v("--ry") });
  });
  gsap.timeline({ defaults: { ease: "expo.out" } })
    .from(".hero__title .ch", { yPercent: 110, duration: 1.3, stagger: 0.015 })
    .from(".hero .fade-up", { y: 24, opacity: 0, duration: 1, stagger: 0.1 }, 0.3)
    .from(".nav", { y: -40, opacity: 0, duration: 1 }, 0.2)
    .from(".beam", { opacity: 0, duration: 2.4, ease: "power2.out" }, 0)
    .from(".floor", { opacity: 0, yPercent: 20, duration: 2 }, 0.2)
    .from(tiles, { opacity: 0, scale: 0.4, z: -400, duration: 1.6, stagger: 0.07 }, 0.3)
    .from(".chapter", { opacity: 0, x: -20, duration: 1 }, 0.8);

  // idle float, each tile on its own rhythm
  tiles.forEach((t) => {
    gsap.to(t, { y: gsap.utils.random(-22, 22), rotation: gsap.utils.random(-6, 6), duration: gsap.utils.random(3, 5), ease: "sine.inOut", yoyo: true, repeat: -1 });
  });
  // mouse parallax by depth (--d)
  const movers = tiles.map((t) => {
    const d = parseFloat(getComputedStyle(t).getPropertyValue("--d")) || 1;
    const wrap = document.createElement("span");
    t.parentNode.insertBefore(wrap, t); wrap.appendChild(t);
    wrap.style.cssText = "position:absolute;inset:0";
    return { d, x: gsap.quickTo(wrap, "x", { duration: 1.4, ease: "power3" }), y: gsap.quickTo(wrap, "y", { duration: 1.4, ease: "power3" }), wrap };
  });
  addEventListener("mousemove", (e) => {
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    movers.forEach((m) => { m.x(nx * -60 * m.d); m.y(ny * -40 * m.d); });
  });
  // scroll: tiles fly up at different speeds, copy drifts
  movers.forEach((m) => gsap.to(m.wrap.firstChild, { yPercent: -220 * m.d, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } }));
  gsap.to(".hero__copy, .hero__side", { yPercent: -20, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true } });
};
document.fonts ? document.fonts.ready.then(startHero) : startHero();

/* ---------- hero network: platforms → AdBrain → decisions ---------- */
const net = (() => {
  const box = $(".net"), svg = $(".net__wires");
  const srcs = $$('[data-node="src"]'), core = $('[data-node="core"]'), outs = $$('[data-node="out"]');
  const NS = "http://www.w3.org/2000/svg";
  let tweens = [];
  // layout box (offset*), so intro transforms don't skew the lines
  const rect = (el) => {
    let left = 0, top = 0, n = el;
    while (n && n !== box) { left += n.offsetLeft; top += n.offsetTop; n = n.offsetParent; }
    return { cx: left + el.offsetWidth / 2, cy: top + el.offsetHeight / 2, r: el.offsetWidth / 2 };
  };
  const build = () => {
    tweens.forEach((t) => t.kill()); tweens = [];
    svg.innerHTML = `<defs><linearGradient id="netGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${box.offsetWidth}" y2="0"><stop offset="0" stop-color="hsl(190 95% 55%)" stop-opacity=".25"/><stop offset=".5" stop-color="hsl(200 95% 60%)" stop-opacity=".8"/><stop offset="1" stop-color="hsl(250 85% 72%)" stop-opacity=".45"/></linearGradient></defs>`;
    const vertical = box.offsetWidth < 560;
    const c = rect(core);
    // edge points on the circles, so lines start and end at the rim
    const edge = (n, toward) => {
      const dx = toward.cx - n.cx, dy = toward.cy - n.cy, d = Math.hypot(dx, dy) || 1;
      return { x: n.cx + (dx / d) * (n.r + 4), y: n.cy + (dy / d) * (n.r + 4) };
    };
    const curve = (a, b) => vertical
      ? `M${a.x},${a.y} C${a.x},${(a.y + b.y) / 2} ${b.x},${(a.y + b.y) / 2} ${b.x},${b.y}`
      : `M${a.x},${a.y} C${(a.x + b.x) / 2},${a.y} ${(a.x + b.x) / 2},${b.y} ${b.x},${b.y}`;
    const lines = [];
    srcs.forEach((s) => { const n = rect(s); lines.push({ d: curve(edge(n, c), edge(c, n)), kind: "in" }); });
    outs.forEach((o, i) => { const n = rect(o); lines.push({ d: curve(edge(c, n), edge(n, c)), kind: "out", i }); });
    lines.forEach((l) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", l.d); p.setAttribute("class", "net__line");
      svg.appendChild(p);
      l.el = p;
    });
    return lines;
  };
  const animate = (lines, delay) => {
    lines.forEach((l, k) => {
      const L = l.el.getTotalLength();
      gsap.set(l.el, { strokeDasharray: L, strokeDashoffset: L });
      tweens.push(gsap.to(l.el, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", delay: delay + (l.kind === "in" ? 0 : 0.6) + k * 0.08 }));
      if (reduce) return;
      // a signal runs along each line; reaching a client, its dot pulses
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("r", 3.2); dot.setAttribute("class", "net__pulse"); dot.setAttribute("opacity", 0);
      svg.appendChild(dot);
      const s = { t: 0 }, target = l.kind === "out" ? outs[l.i] : null;
      tweens.push(gsap.to(s, {
        t: 1, duration: 1.5, ease: "power1.inOut", repeat: -1, repeatDelay: 1.6,
        delay: delay + 1.6 + (l.kind === "in" ? k * 0.35 : 1.1 + l.i * 0.4),
        onUpdate: () => { const pt = l.el.getPointAtLength(s.t * L); dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y); dot.setAttribute("opacity", Math.sin(s.t * Math.PI)); },
        onRepeat: () => target && gsap.fromTo(target, { scale: 1.9 }, { scale: 1, duration: 0.9, ease: "elastic.out(1, 0.4)" }),
      }));
    });
  };
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => animate(build(), 0), 200); });
  return { start: (delay) => animate(build(), delay) };
})();
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  net.start(reduce ? 0 : 0.8);
  if (reduce) return;
  gsap.timeline({ delay: 0.4, defaults: { ease: "expo.out" } })
    .from(".nsrc", { x: -20, opacity: 0, duration: 0.9, stagger: 0.12 })
    .from(".net__rings img", { scale: 0.6, opacity: 0, duration: 1, ease: "back.out(2)" }, 0.3)
    .from(".net__rings i", { scale: 0.5, opacity: 0, duration: 1.2, stagger: 0.1 }, 0.4)
    .from(".net__k, .nout", { x: 20, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.9)
    .from(".partners > *", { y: 10, opacity: 0, duration: 0.7, stagger: 0.06 }, 0.4);
});
gsap.from(".logos-band > *", { y: 20, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".logos-band", start: "top 90%" } });

/* ---------- statement: words fill with the blue > purple gradient on scroll ---------- */
$$(".gw").forEach((el, i) => {
  if (reduce) { el.style.setProperty("--p", 1); return; }
  ScrollTrigger.create({
    trigger: ".statement", start: `top+=${i * 12}% 70%`, end: `top+=${i * 12 + 18}% 70%`, scrub: true,
    onUpdate: (s) => el.style.setProperty("--p", s.progress),
  });
});
gsap.from(".statement__t, .statement__s, .statement__cta", { y: 40, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.15, scrollTrigger: { trigger: ".statement", start: "top 70%" } });

/* ---------- scroll story ---------- */
const scenes = $$(".scene"), dots = $$(".stage__dots i"), chapters = $$(".story .chap");
const PARTS = ".plat, .sc-int__core, .sc-kpis > div, .sc-ctx__sig, .sc-ctx__list li, .sc-rec .pill, .sc-rec h3, .sc-rec dl > div, .sc-flow li, .sc-port > div, .sc-doc, .sc-doc li, .sc-note";
/* mobile: no sticky panel. Each chapter gets its own copy of its scene right
   under the text, so the story reads top to bottom with nothing overlapping.
   Cloned before setScene() so the copies carry no inline animation styles. */
chapters.forEach((c, i) => {
  const wrap = document.createElement("div");
  wrap.className = "chap__scene";
  wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML = `<div class="stage__bar"><i></i><i></i><i></i><span class="mono">AdBrain · Loja Aurora</span></div>`;
  const sc = scenes[i].cloneNode(true);
  sc.classList.add("is-on");
  wrap.appendChild(sc);
  c.insertBefore(wrap, $(".chap__cta", c));
});
ScrollTrigger.matchMedia({
  "(max-width: 1000px)": () => {
    if (reduce) return;
    $$(".chap__scene").forEach((w) => {
      gsap.from(w, { y: 30, opacity: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: w, start: "top 88%" } });
      gsap.from($$(PARTS, w), { y: 14, opacity: 0, duration: 0.7, ease: "expo.out", stagger: 0.06, delay: 0.15, scrollTrigger: { trigger: w, start: "top 85%" } });
      $$(".scene path", w).forEach((p) => {
        const L = p.getTotalLength();
        gsap.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut", scrollTrigger: { trigger: w, start: "top 80%" } });
      });
    });
  },
});

let current = -1;
const draw = (scene) => $$("path", scene).forEach((p) => {
  if (p.closest(".stage__bar")) return;
  const L = p.getTotalLength();
  gsap.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut", delay: 0.2 });
});
const setScene = (i) => {
  if (i === current) return;
  const prev = scenes[current];
  current = i;
  chapters.forEach((c, k) => c.classList.toggle("is-on", k === i));
  dots.forEach((d, k) => d.classList.toggle("on", k === i));
  const next = scenes[i];
  if (prev) {
    gsap.to(prev, { opacity: 0, y: -16, duration: 0.35, ease: "power2.in", onComplete: () => prev.classList.remove("is-on") });
  }
  next.classList.add("is-on");
  gsap.fromTo(next, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out", delay: prev ? 0.2 : 0 });
  if (!reduce) {
    gsap.fromTo($$(PARTS, next), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.06, delay: prev ? 0.3 : 0.1 });
    draw(next);
  }
};
setScene(0);
chapters.forEach((c, i) =>
  ScrollTrigger.create({
    trigger: c, start: () => (innerWidth < 1000 ? "top 80%" : "top 60%"), end: () => (innerWidth < 1000 ? "bottom 80%" : "bottom 60%"), invalidateOnRefresh: true,
    onToggle: (s) => s.isActive && setScene(i),
  })
);

/* ---------- section reveals ---------- */
$$("section:not(.hero) .h2, .final__t").forEach((h) => {
  const chars = $$(".ch", h);
  if (chars.length) gsap.from(chars, { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.012, scrollTrigger: { trigger: h, start: "top 85%" } });
});
$$(".kicker").forEach((k) => gsap.from(k, { y: 16, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: k, start: "top 90%" } }));
gsap.from(".who__row", { y: 40, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".who__rows", start: "top 85%" } });
gsap.from(".plan", { y: 50, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".plans__cols", start: "top 85%" } });
/* prices: count up on enter, then tween between monthly and annual */
const fmt = (v, dec) => v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
let bill = "m";
const counters = $$(".count").map((el) => ({ el, o: { v: 0 } }));
const showPrices = (dur) => counters.forEach(({ el, o }) => {
  const to = Number(el.dataset[bill]), dec = to % 1 ? 2 : 0;
  gsap.to(o, { v: to, duration: dur, ease: "power3.out", overwrite: true, onUpdate: () => (el.textContent = fmt(o.v, dec)) });
});
ScrollTrigger.create({ trigger: ".plans__cols", start: "top 92%", once: true, onEnter: () => showPrices(1.4) });

const pill = $(".billing__pill"), opts = $$(".billing__opt");
const movePill = () => {
  const on = $(".billing__opt.is-on");
  pill.style.width = `${on.offsetWidth}px`;
  pill.style.transform = `translateX(${on.offsetLeft - 4}px)`;
};
opts.forEach((b) => b.addEventListener("click", () => {
  bill = b.dataset.bill;
  opts.forEach((o) => { o.classList.toggle("is-on", o === b); o.setAttribute("aria-checked", o === b); });
  $$(".plan__bill").forEach((p) => (p.textContent = p.dataset[bill]));
  movePill();
  showPrices(0.7);
  $$("[data-plan-link]").forEach((a) => {
    const url = new URL(a.getAttribute("href"), location.href);
    url.searchParams.set("ciclo", bill === "a" ? "anual" : "mensal");
    a.setAttribute("href", `signup.html${url.search}`);
  });
}));
(document.fonts ? document.fonts.ready : Promise.resolve()).then(movePill);
addEventListener("resize", movePill);

gsap.from(".enterprise", { y: 30, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".enterprise", start: "top 92%" } });

/* ---------- mobile: fixed CTA bar after the hero ---------- */
const mbar = $(".mbar");
ScrollTrigger.create({
  trigger: ".hero", start: "bottom 80%", endTrigger: ".foot", end: "top bottom",
  onToggle: (s) => mbar.classList.toggle("is-on", s.isActive),
});

gsap.from(".final .btn, .final__s", { y: 30, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".final .btn", start: "top 92%" } });
gsap.fromTo(".beam--center", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 0.7, ease: "none", scrollTrigger: { trigger: ".final", start: "top bottom", end: "center center", scrub: true } });

addEventListener("load", () => ScrollTrigger.refresh());
