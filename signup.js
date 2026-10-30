/* AdBrain.ai · cadastro */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- plano escolhido na LP (?plano=agencia&ciclo=anual) ---------- */
const PLANS = {
  "gestor-solo": { name: "Gestor Solo", m: 147, a: 124.95, year: "1.499,40", limits: "Até 3 clientes ativos" },
  "agencia": { name: "Agência", m: 297, a: 252.45, year: "3.029,40", limits: "Até 10 clientes e 3 usuários" },
  "agencia-pro": { name: "Agência Pro", m: 497, a: 422.45, year: "5.069,40", limits: "Até 25 clientes e 5 usuários" },
};
const brl = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
const params = new URLSearchParams(location.search);
const plan = PLANS[params.get("plano")];
if (plan) {
  const annual = params.get("ciclo") === "anual";
  $(".su-plan__t").textContent = `${plan.name} · R$ ${brl(annual ? plan.a : plan.m)}/mês`;
  $(".su-plan__s").textContent = `${plan.limits} · ${annual ? `R$ ${plan.year} cobrado por ano` : "cobrado mensalmente"}`;
  $(".su-plan").hidden = false;
}

/* ---------- no celular os passos vão para baixo do card ---------- */
const after = $(".su-after");
after.append($(".su-steps").cloneNode(true), $(".su-trust").cloneNode(true));

/* ---------- validação ---------- */
const form = $("#signup");
const f = { name: $("#fullName"), email: $("#email"), pw: $("#password"), cpf: $("#cpf") };
const RULES = { len: (v) => v.length >= 8, up: (v) => /[A-Z]/.test(v), low: (v) => /[a-z]/.test(v), num: (v) => /\d/.test(v) };

const cpfValid = (raw) => {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dig = (n) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += +d[i] * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dig(9) === +d[9] && dig(10) === +d[10];
};

const checks = {
  fullName: () => (f.name.value.trim().split(/\s+/).length >= 2 ? "" : "Digite nome e sobrenome."),
  email: () => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim()) ? "" : "Confira o e-mail."),
  password: () => (Object.values(RULES).every((r) => r(f.pw.value)) ? "" : "A senha ainda não cumpre todas as regras."),
  cpf: () => (cpfValid(f.cpf.value) ? "" : "Confira o CPF."),
};
const show = (id, msg) => {
  const el = $(`#${id}`).closest(".sf");
  el.classList.toggle("is-bad", !!msg);
  el.classList.toggle("is-ok", !msg);
  $(`.sf__e[data-for="${id}"]`).textContent = msg;
};
// validate a field when the person leaves it, and re-check live once it was flagged
Object.keys(checks).forEach((id) => {
  const input = $(`#${id}`);
  input.addEventListener("blur", () => input.value && show(id, checks[id]()));
  input.addEventListener("input", () => input.closest(".sf").classList.contains("is-bad") && show(id, checks[id]()));
});

// password rules light up while typing
f.pw.addEventListener("input", () => {
  Object.entries(RULES).forEach(([k, test]) => $(`.rules [data-rule="${k}"]`).classList.toggle("ok", test(f.pw.value)));
});
$(".sf__eye").addEventListener("click", (e) => {
  const on = f.pw.type === "password";
  f.pw.type = on ? "text" : "password";
  e.currentTarget.setAttribute("aria-pressed", on);
  e.currentTarget.setAttribute("aria-label", on ? "Esconder senha" : "Mostrar senha");
});

// CPF mask: 000.000.000-00
f.cpf.addEventListener("input", () => {
  const d = f.cpf.value.replace(/\D/g, "").slice(0, 11);
  f.cpf.value = d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
});

/* ---------- envio ----------
   Este cadastro é a versão de LP. Para criar a conta de verdade, `createAccount`
   precisa chamar o mesmo signup do app (Supabase Auth) que hoje roda em
   adbrain.com.br/signup, passando nome, CPF, e-mail, senha e o plano escolhido. */
async function createAccount(data) {
  return data;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const bad = Object.keys(checks).filter((id) => { const m = checks[id](); show(id, m); return m; });
  if (bad.length) { $(`#${bad[0]}`).focus(); return; }
  const btn = $(".su-submit");
  btn.disabled = true;
  try {
    await createAccount({
      fullName: f.name.value.trim(), email: f.email.value.trim(), password: f.pw.value, cpf: f.cpf.value,
      plano: params.get("plano"), ciclo: params.get("ciclo"),
    });
    $(".su-done__n").textContent = f.name.value.trim().split(/\s+/)[0];
    form.hidden = true;
    $(".su-card__h").hidden = true;
    $(".su-card__p").hidden = true;
    const done = $(".su-done");
    done.hidden = false;
    if (!reduce) gsap.from(done.children, { y: 16, opacity: 0, duration: 0.7, stagger: 0.08, ease: "expo.out" });
  } finally {
    btn.disabled = false;
  }
});

/* ---------- entrada ---------- */
if (!reduce && window.gsap) {
  gsap.timeline({ defaults: { ease: "expo.out" } })
    .from(".su-aside > *", { y: 24, opacity: 0, duration: 1, stagger: 0.08 })
    .from(".su-card", { y: 30, opacity: 0, duration: 1.1 }, 0.1)
    .from(".beam", { opacity: 0, duration: 2 }, 0);
}
