// Teste de fumaça de app Fênix (regra 68). Modelo: copie para a pasta do app e ajuste o bloco CONFIG.
// Rode com:  npm install playwright   (uma vez)   e depois   node fumaca-modelo.mjs
// Não grava no banco real: rode com o banco desligado (FENIX_BANCO_ATIVO = false) ou com o core simulado.
import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";

// ---------------- CONFIG (ajuste para o app) ----------------
const CONFIG = {
  arquivo: process.argv[2] || "fenix-nome-do-app-v1.0.html", // o HTML do app
  // Passos de uso, em ordem. Cada passo é { acao, seletor, valor?, esperar? }.
  // acao: "clicar" | "digitar" | "existe" | "naoExiste" | "texto" (valor = trecho que deve aparecer)
  roteiro: [
    // { acao: "clicar",  seletor: "#btNovo" },
    // { acao: "digitar", seletor: "#campoNome", valor: "Registro de teste" },
    // { acao: "clicar",  seletor: "#btSalvar" },
    // { acao: "texto",   seletor: "#lista", valor: "Registro de teste" },
  ],
  larguras: [360, 768],     // regra 51: 360 px e uma tela maior
  toqueMinimo: 44,          // regra 17: área de toque mínima, em px
};
// ------------------------------------------------------------

const falhas = [], avisos = [];
const ok = (m) => console.log("OK     " + m);
const falha = (m) => { falhas.push(m); console.log("FALHA  " + m); };
const aviso = (m) => { avisos.push(m); console.log("AVISO  " + m); };

const url = pathToFileURL(path.resolve(CONFIG.arquivo)).href;
const navegador = await chromium.launch();
const contexto = await navegador.newContext({ viewport: { width: CONFIG.larguras[0], height: 800 } });
const pagina = await contexto.newPage();
const erros = [];
pagina.on("pageerror", (e) => erros.push(String(e)));
pagina.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|net::ERR/.test(m.text())) erros.push(m.text()); });

// 1) abre e não dá erro de JavaScript
await pagina.goto(url, { waitUntil: "load" });
await pagina.waitForTimeout(800);
erros.length ? falha("erros ao abrir: " + erros.join(" | ")) : ok("abre sem erro de JavaScript");

// 2) cada largura: sem rolagem horizontal; toque de 44 px; campos com rótulo; imagens com alt
for (const w of CONFIG.larguras) {
  await pagina.setViewportSize({ width: w, height: 800 });
  await pagina.waitForTimeout(200);
  const r = await pagina.evaluate((minimo) => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
    const pequenos = [...document.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea, [role=button]")]
      .filter(vis).filter((e) => { const b = e.getBoundingClientRect(); return b.height < minimo - 0.5; })
      .map((e) => (e.id ? "#" + e.id : e.tagName.toLowerCase() + (e.textContent ? "(" + e.textContent.trim().slice(0, 18) + ")" : "")));
    const semRotulo = [...document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea")]
      .filter(vis).filter((e) => !(e.labels && e.labels.length) && !e.getAttribute("aria-label") && !e.getAttribute("aria-labelledby") && !e.getAttribute("placeholder") && !e.title)
      .map((e) => e.id || e.name || e.tagName.toLowerCase());
    const semAlt = [...document.querySelectorAll("img")].filter((e) => !e.hasAttribute("alt")).map((e) => (e.getAttribute("src") || "").slice(0, 30));
    return { rolagem: document.documentElement.scrollWidth > innerWidth + 1, pequenos, semRotulo, semAlt };
  }, CONFIG.toqueMinimo);
  r.rolagem ? falha(`${w}px: há rolagem horizontal`) : ok(`${w}px: sem rolagem horizontal`);
  r.pequenos.length ? aviso(`${w}px: ${r.pequenos.length} item(ns) com menos de ${CONFIG.toqueMinimo}px de altura: ${r.pequenos.slice(0, 6).join(", ")}`) : ok(`${w}px: toques de ${CONFIG.toqueMinimo}px ou mais`);
  r.semRotulo.length ? aviso(`${w}px: campo(s) sem rótulo: ${r.semRotulo.slice(0, 6).join(", ")}`) : ok(`${w}px: campos com rótulo`);
  r.semAlt.length ? aviso(`${w}px: imagem(ns) sem alt: ${r.semAlt.slice(0, 4).join(", ")}`) : ok(`${w}px: imagens com alt`);
}
await pagina.setViewportSize({ width: CONFIG.larguras[0], height: 800 });

// 3) roteiro de uso (criar, editar, apagar...)
for (const [i, p] of CONFIG.roteiro.entries()) {
  const nome = `passo ${i + 1} (${p.acao} ${p.seletor})`;
  try {
    const el = pagina.locator(p.seletor).first();
    if (p.acao === "clicar") await el.click({ timeout: 4000 });
    else if (p.acao === "digitar") await el.fill(String(p.valor ?? ""), { timeout: 4000 });
    else if (p.acao === "existe") await el.waitFor({ state: "visible", timeout: 4000 });
    else if (p.acao === "naoExiste") await el.waitFor({ state: "detached", timeout: 4000 });
    else if (p.acao === "texto") { const t = await el.innerText({ timeout: 4000 }); if (!t.includes(p.valor)) throw new Error("texto não encontrado: " + p.valor); }
    else throw new Error("ação desconhecida: " + p.acao);
    ok(nome);
  } catch (e) { falha(nome + ": " + (e.message || e).split("\n")[0]); }
}
if (CONFIG.roteiro.length === 0) aviso("roteiro vazio: preencha CONFIG.roteiro com criar, editar e apagar um registro");

// 4) texto de usuário não vira código (regra 64): o app não pode executar o que o usuário digita
const marca = await pagina.evaluate(() => { window.__xss = 0; return true; });
const campo = pagina.locator("input[type=text], input:not([type]), textarea").first();
if (await campo.count()) {
  try { await campo.fill('<img src=x onerror="window.__xss=1">', { timeout: 2000 }); await pagina.keyboard.press("Tab"); await pagina.waitForTimeout(300); } catch (e) {}
  (await pagina.evaluate(() => window.__xss)) === 1 ? falha("texto digitado virou código (use FenixCore.seguranca ou textContent)") : ok("texto digitado em campo não executa código (confira também depois de salvar)");
}

// 5) recarrega sem internet: o app ainda abre (regras 3 e 51)
await contexto.setOffline(true);
try { await pagina.reload({ waitUntil: "load", timeout: 8000 }); await pagina.waitForTimeout(500); const corpo = await pagina.evaluate(() => document.body && document.body.innerText.length); corpo > 0 ? ok("abre sem internet") : falha("tela vazia sem internet"); }
catch (e) { aviso("sem internet o arquivo local ainda abre, mas confira no navegador com o app publicado: " + (e.message || e).split("\n")[0]); }
await contexto.setOffline(false);

await navegador.close();
console.log(`\n${falhas.length} falha(s), ${avisos.length} aviso(s).`);
process.exit(falhas.length ? 1 : 0);
