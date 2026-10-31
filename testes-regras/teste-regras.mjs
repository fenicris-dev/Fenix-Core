// Testes das regras do Firestore (firestore.rules) com o emulador local.
// Rode com:  npm install   (uma vez)   e depois   npm test
// Nada aqui toca o banco real: o projeto é "demo-fenix" e tudo roda na sua máquina.
import { test, before, after, beforeEach } from "node:test";
import fs from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";

let env;
const regras = fs.readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");

before(async () => {
  env = await initializeTestEnvironment({ projectId: "demo-fenix", firestore: { rules: regras, host: "127.0.0.1", port: 8080 } });
});
after(async () => { await env.cleanup(); });

// Dados de partida (gravados sem regras): empresa e1 com dono (dono1) e técnico (tec1),
// um usuário pendente, um convite válido, um administrador e uma segunda empresa (e2).
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "empresas/e1"), { nome: "Empresa 1", donoUid: "dono1" });
    await setDoc(doc(db, "empresas/e2"), { nome: "Empresa 2", donoUid: "dono2" });
    await setDoc(doc(db, "empresas/e1/membros/dono1"), { papel: "dono" });
    await setDoc(doc(db, "empresas/e1/membros/tec1"), { papel: "tecnico" });
    await setDoc(doc(db, "usuarios_empresa/dono1"), { empresaId: "e1", papel: "dono", status: "aprovado" });
    await setDoc(doc(db, "usuarios_empresa/tec1"), { empresaId: "e1", papel: "tecnico", status: "aprovado" });
    await setDoc(doc(db, "usuarios_empresa/dono2"), { empresaId: "e2", papel: "dono", status: "aprovado" });
    await setDoc(doc(db, "usuarios_empresa/pend1"), { empresaId: "e1", papel: "tecnico", status: "pendente" });
    await setDoc(doc(db, "convites/tok1"), { empresaId: "e1", usado: false });
    await setDoc(doc(db, "licencas/h1"), { licenca: "definitiva" });
    await setDoc(doc(db, "admins/adm1"), { ativo: true });
    await setDoc(doc(db, "perfis/user1"), { status: "pendente" });
    await setDoc(doc(db, "empresas/e1/materiais/m1"), { nome: "Cabo" });
    await setDoc(doc(db, "pessoas_fisicas/12345678900"), { nome: "Fulano" });
    await setDoc(doc(db, "dados_pessoais/uA/gestor/t1"), { titulo: "tarefa" });
  });
});

const como = (uid) => env.authenticatedContext(uid).firestore();
const anonimo = () => env.unauthenticatedContext().firestore();

// ---------- empresas (v4.3 licença, v4.4 leitura restrita) ----------
test("empresas: dono lê a própria empresa", () => assertSucceeds(getDoc(doc(como("dono1"), "empresas/e1"))));
test("empresas: técnico aprovado lê a empresa", () => assertSucceeds(getDoc(doc(como("tec1"), "empresas/e1"))));
test("empresas: logado de outra empresa NÃO lê", () => assertFails(getDoc(doc(como("dono2"), "empresas/e1"))));
test("empresas: anônimo NÃO lê", () => assertFails(getDoc(doc(anonimo(), "empresas/e1"))));
test("empresas: criar sem o campo licenca é permitido", () => assertSucceeds(setDoc(doc(como("novo1"), "empresas/e9"), { nome: "Nova", donoUid: "novo1", testeInicio: serverTimestamp() })));
test("empresas: criar com licenca = teste é permitido", () => assertSucceeds(setDoc(doc(como("novo1"), "empresas/e9"), { nome: "Nova", donoUid: "novo1", licenca: "teste", testeInicio: serverTimestamp() })));
test("empresas: criar com licenca = definitiva é NEGADO", () => assertFails(setDoc(doc(como("novo1"), "empresas/e9"), { nome: "Nova", donoUid: "novo1", licenca: "definitiva", testeInicio: serverTimestamp() })));
test("empresas: ninguém altera a empresa (nem o dono)", () => assertFails(updateDoc(doc(como("dono1"), "empresas/e1"), { licenca: "definitiva" })));
test("empresas: ninguém apaga a empresa", () => assertFails(deleteDoc(doc(como("dono1"), "empresas/e1"))));

// ---------- licencas (espelho da regra 58) ----------
test("licencas: ler um documento (get) é público", () => assertSucceeds(getDoc(doc(anonimo(), "licencas/h1"))));
test("licencas: listar é NEGADO", () => assertFails(getDocs(collection(anonimo(), "licencas"))));
test("licencas: gravar é NEGADO", () => assertFails(setDoc(doc(como("dono1"), "licencas/h2"), { licenca: "definitiva" })));

// ---------- base de pessoas ----------
test("pessoas_fisicas: vínculo aprovado lê e grava", async () => {
  await assertSucceeds(getDoc(doc(como("tec1"), "pessoas_fisicas/12345678900")));
  await assertSucceeds(setDoc(doc(como("tec1"), "pessoas_fisicas/99999999999"), { nome: "Beltrano" }));
});
test("pessoas_fisicas: vínculo pendente NÃO lê", () => assertFails(getDoc(doc(como("pend1"), "pessoas_fisicas/12345678900"))));
test("pessoas_fisicas: anônimo NÃO lê", () => assertFails(getDoc(doc(anonimo(), "pessoas_fisicas/12345678900"))));

// ---------- usuarios_empresa ----------
test("usuarios_empresa: o próprio usuário lê o seu vínculo", () => assertSucceeds(getDoc(doc(como("tec1"), "usuarios_empresa/tec1"))));
test("usuarios_empresa: o dono lê o vínculo de um técnico da empresa", () => assertSucceeds(getDoc(doc(como("dono1"), "usuarios_empresa/tec1"))));
test("usuarios_empresa: dono de outra empresa NÃO lê", () => assertFails(getDoc(doc(como("dono2"), "usuarios_empresa/tec1"))));
test("usuarios_empresa: técnico NÃO se promove a dono", () => assertFails(updateDoc(doc(como("tec1"), "usuarios_empresa/tec1"), { papel: "dono" })));

// ---------- convites ----------
test("convites: logado lê um convite pelo token", () => assertSucceeds(getDoc(doc(como("novo1"), "convites/tok1"))));
test("convites: anônimo NÃO lê", () => assertFails(getDoc(doc(anonimo(), "convites/tok1"))));
test("convites: dono cria convite da própria empresa", () => assertSucceeds(setDoc(doc(como("dono1"), "convites/tok2"), { empresaId: "e1", usado: false })));
test("convites: técnico NÃO cria convite", () => assertFails(setDoc(doc(como("tec1"), "convites/tok2"), { empresaId: "e1", usado: false })));
test("convites: dono de outra empresa NÃO cria convite para e1", () => assertFails(setDoc(doc(como("dono2"), "convites/tok2"), { empresaId: "e1", usado: false })));
test("convites: usar o convite com o próprio uid é permitido", () =>
  assertSucceeds(updateDoc(doc(como("novo1"), "convites/tok1"), { usado: true, usadoPorUid: "novo1", usadoEm: "2026-10-24" })));
test("convites: usar o convite em nome de outro uid é NEGADO", () =>
  assertFails(updateDoc(doc(como("novo1"), "convites/tok1"), { usado: true, usadoPorUid: "outro", usadoEm: "2026-10-24" })));
test("convites: o dono cancela o convite", () => assertSucceeds(updateDoc(doc(como("dono1"), "convites/tok1"), { cancelado: true })));

// ---------- membros ----------
test("membros: o dono cria o próprio registro de membro", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), "empresas/e3"), { nome: "E3", donoUid: "novo3" }); });
  await assertSucceeds(setDoc(doc(como("novo3"), "empresas/e3/membros/novo3"), { papel: "dono" }));
});
test("membros: estranho NÃO se cadastra como dono de empresa alheia", () => assertFails(setDoc(doc(como("intruso"), "empresas/e1/membros/intruso"), { papel: "dono" })));
test("membros: técnico entra com convite válido", () => assertSucceeds(setDoc(doc(como("novo1"), "empresas/e1/membros/novo1"), { papel: "tecnico", conviteToken: "tok1" })));
test("membros: técnico SEM convite válido é NEGADO", () => assertFails(setDoc(doc(como("novo1"), "empresas/e1/membros/novo1"), { papel: "tecnico", conviteToken: "inexistente" })));

// ---------- coleções da empresa ----------
test("coleção da empresa: membro aprovado lê e grava", async () => {
  await assertSucceeds(getDoc(doc(como("tec1"), "empresas/e1/materiais/m1")));
  await assertSucceeds(setDoc(doc(como("tec1"), "empresas/e1/materiais/m2"), { nome: "Conector" }));
});
test("coleção da empresa: membro de outra empresa NÃO lê", () => assertFails(getDoc(doc(como("dono2"), "empresas/e1/materiais/m1"))));
test("coleção da empresa: vínculo pendente NÃO lê", () => assertFails(getDoc(doc(como("pend1"), "empresas/e1/materiais/m1"))));
test("membros: técnico NÃO altera o papel de outro membro", () => assertFails(updateDoc(doc(como("tec1"), "empresas/e1/membros/dono1"), { papel: "tecnico" })));

// ---------- cadastro com aprovação (v4.5) ----------
test("admins: o próprio uid lê o seu documento", () => assertSucceeds(getDoc(doc(como("adm1"), "admins/adm1"))));
test("admins: outro uid NÃO lê", () => assertFails(getDoc(doc(como("user1"), "admins/adm1"))));
test("admins: listar é NEGADO", () => assertFails(getDocs(collection(como("adm1"), "admins"))));
test("perfis: usuário cria o próprio perfil como pendente", () => assertSucceeds(setDoc(doc(como("user2"), "perfis/user2"), { status: "pendente" })));
test("perfis: usuário NÃO cria o próprio perfil já aprovado", () => assertFails(setDoc(doc(como("user2"), "perfis/user2"), { status: "aprovado" })));
test("perfis: usuário NÃO cria perfil de outro", () => assertFails(setDoc(doc(como("user2"), "perfis/user3"), { status: "pendente" })));
test("perfis: usuário lê o próprio perfil", () => assertSucceeds(getDoc(doc(como("user1"), "perfis/user1"))));
test("perfis: usuário comum NÃO lista os perfis", () => assertFails(getDocs(collection(como("user1"), "perfis"))));
test("perfis: administrador lista e aprova", async () => {
  await assertSucceeds(getDocs(collection(como("adm1"), "perfis")));
  await assertSucceeds(updateDoc(doc(como("adm1"), "perfis/user1"), { status: "aprovado" }));
});
test("perfis: usuário comum NÃO se aprova sozinho", () => assertFails(updateDoc(doc(como("user1"), "perfis/user1"), { status: "aprovado" })));

// ---------- dados pessoais ----------
test("dados_pessoais: o dono do uid lê e grava", async () => {
  await assertSucceeds(getDoc(doc(como("uA"), "dados_pessoais/uA/gestor/t1")));
  await assertSucceeds(setDoc(doc(como("uA"), "dados_pessoais/uA/gestor/t2"), { titulo: "nova" }));
});
test("dados_pessoais: outro usuário NÃO lê", () => assertFails(getDoc(doc(como("uB"), "dados_pessoais/uA/gestor/t1"))));
test("dados_pessoais: anônimo NÃO lê", () => assertFails(getDoc(doc(anonimo(), "dados_pessoais/uA/gestor/t1"))));

// ---------- cidades (leitura pública) ----------
test("cidades: leitura pública, gravação só logado", async () => {
  await assertSucceeds(getDoc(doc(anonimo(), "cidades/2800308")));
  await assertSucceeds(setDoc(doc(como("tec1"), "cidades/2800308"), { nome: "Aracaju" }));
  await assertFails(setDoc(doc(anonimo(), "cidades/2800308"), { nome: "Aracaju" }));
});

// =====================================================================
// v4.9 — teste de 15 dias, licença, somente leitura e equipe Fênix
// =====================================================================
const RAIZ1 = "fenicris@gmail.com", RAIZ2 = "fenicris.dev@gmail.com";
const comEmail = (uid, email, verificado = true) => env.authenticatedContext(uid, { email, email_verified: verificado }).firestore();
const dias = (n) => Timestamp.fromMillis(Date.now() + n * 86400000);
const semRegras = (fn) => env.withSecurityRulesDisabled(async (ctx) => { await fn(ctx.firestore()); });
// Coloca a empresa e1 num estado de licença/teste e devolve o contexto do técnico tec1.
async function estado(campos) { await semRegras((db) => setDoc(doc(db, "empresas/e1"), { nome: "Empresa 1", donoUid: "dono1", ...campos })); }
const gravarMaterial = () => setDoc(doc(como("tec1"), "empresas/e1/materiais/novo"), { nome: "X" });

// ---------- criação da empresa ----------
test("v4.9 empresa: criar SEM testeInicio é NEGADO", () => assertFails(setDoc(doc(como("novo1"), "empresas/e9"), { nome: "N", donoUid: "novo1" })));
test("v4.9 empresa: criar com testeInicio no passado é NEGADO", () => assertFails(setDoc(doc(como("novo1"), "empresas/e9"), { nome: "N", donoUid: "novo1", testeInicio: dias(-30) })));
test("v4.9 empresa: criar com testeInicio = hora do servidor é permitido", () => assertSucceeds(setDoc(doc(como("novo1"), "empresas/e9"), { nome: "N", donoUid: "novo1", testeInicio: serverTimestamp() })));

// ---------- gravação conforme o estado ----------
test("v4.9 grava: teste com 3 dias → permitido", async () => { await estado({ testeInicio: dias(-3) }); await assertSucceeds(gravarMaterial()); });
test("v4.9 grava: teste com 14 dias → permitido", async () => { await estado({ testeInicio: dias(-14) }); await assertSucceeds(gravarMaterial()); });
test("v4.9 grava: teste com 20 dias → NEGADO (só leitura)", async () => { await estado({ testeInicio: dias(-20) }); await assertFails(gravarMaterial()); });
test("v4.9 lê: teste vencido ainda LÊ", async () => { await estado({ testeInicio: dias(-20) }); await assertSucceeds(getDoc(doc(como("tec1"), "empresas/e1/materiais/m1"))); });
test("v4.9 grava: teste vencido NÃO apaga", async () => { await estado({ testeInicio: dias(-20) }); await assertFails(deleteDoc(doc(como("tec1"), "empresas/e1/materiais/m1"))); });
test("v4.9 grava: teste vencido + licença por tempo válida → permitido", async () => { await estado({ testeInicio: dias(-20), licenca: "tempo", licencaAte: dias(10) }); await assertSucceeds(gravarMaterial()); });
test("v4.9 grava: teste vencido + licença por tempo vencida → NEGADO", async () => { await estado({ testeInicio: dias(-60), licenca: "tempo", licencaAte: dias(-1) }); await assertFails(gravarMaterial()); });
test("v4.9 grava: licença definitiva (sem prazo) → permitido", async () => { await estado({ testeInicio: dias(-400), licenca: "definitiva" }); await assertSucceeds(gravarMaterial()); });
test("v4.9 grava: empresa antiga sem testeInicio → permitido (até carimbar)", async () => { await assertSucceeds(gravarMaterial()); });
test("v4.9 pessoas_fisicas: teste vencido NEGA gravar", async () => { await estado({ testeInicio: dias(-20) }); await assertFails(setDoc(doc(como("tec1"), "pessoas_fisicas/11111111111"), { nome: "Z" })); });
test("v4.9 pessoas_fisicas: teste vencido ainda LÊ", async () => { await estado({ testeInicio: dias(-20) }); await assertSucceeds(getDoc(doc(como("tec1"), "pessoas_fisicas/12345678900"))); });
test("v4.9 dados_pessoais: teste vencido NEGA gravar", async () => { await estado({ testeInicio: dias(-20) }); await assertFails(setDoc(doc(como("tec1"), "dados_pessoais/tec1/gestor/t9"), { titulo: "x" })); });
test("v4.9 dados_pessoais: o documento 'relogio' grava mesmo vencido", async () => { await estado({ testeInicio: dias(-20) }); await assertSucceeds(setDoc(doc(como("tec1"), "dados_pessoais/tec1/gestor/relogio"), { t: 1 })); });
test("v4.9 dados_pessoais: usuário sem empresa grava normalmente", () => assertSucceeds(setDoc(doc(como("solo1"), "dados_pessoais/solo1/gestor/t1"), { titulo: "x" })));
test("v4.9 cidades continua fechada para gravação", () => assertFails(setDoc(doc(como("tec1"), "empresas/e1/cidades/2800308"), { nome: "Aracaju" })));

// ---------- administradores raiz ----------
test("v4.9 raiz: fenicris@gmail.com verificado altera a licença", () => assertSucceeds(updateDoc(doc(comEmail("r1", RAIZ1), "empresas/e1"), { licenca: "definitiva" })));
test("v4.9 raiz: fenicris.dev@gmail.com verificado altera a licença", () => assertSucceeds(updateDoc(doc(comEmail("r2", RAIZ2), "empresas/e1"), { licenca: "definitiva" })));
test("v4.9 raiz: e-mail em maiúsculas também vale", () => assertSucceeds(updateDoc(doc(comEmail("r3", "FeniCris@Gmail.com"), "empresas/e1"), { licenca: "definitiva" })));
test("v4.9 raiz: e-mail NÃO verificado é NEGADO", () => assertFails(updateDoc(doc(comEmail("r4", RAIZ1, false), "empresas/e1"), { licenca: "definitiva" })));
test("v4.9 raiz: e-mail parecido (fenicris@gmail.com.evil) é NEGADO", () => assertFails(updateDoc(doc(comEmail("r5", "fenicris@gmail.com.evil"), "empresas/e1"), { licenca: "definitiva" })));
test("v4.9 raiz: sem e-mail no token é NEGADO", () => assertFails(updateDoc(doc(como("r6"), "empresas/e1"), { licenca: "definitiva" })));
test("v4.9 raiz: lê empresa de qualquer cliente", () => assertSucceeds(getDoc(doc(comEmail("r1", RAIZ1), "empresas/e2"))));
test("v4.9 raiz: não apaga empresa", () => assertFails(deleteDoc(doc(comEmail("r1", RAIZ1), "empresas/e1"))));

// ---------- equipe_fenix ----------
const equipe = (email, nivel, ativo = true) => semRegras((db) => setDoc(doc(db, "equipe_fenix/" + email), { email, nivel, ativo, nome: email }));
test("v4.9 equipe: raiz cria membro comercial", () => assertSucceeds(setDoc(doc(comEmail("r1", RAIZ1), "equipe_fenix/ana@x.com"), { email: "ana@x.com", nivel: "comercial", ativo: true })));
test("v4.9 equipe: nível inválido é NEGADO", () => assertFails(setDoc(doc(comEmail("r1", RAIZ1), "equipe_fenix/ana@x.com"), { email: "ana@x.com", nivel: "chefe", ativo: true })));
test("v4.9 equipe: id diferente do e-mail é NEGADO", () => assertFails(setDoc(doc(comEmail("r1", RAIZ1), "equipe_fenix/ana@x.com"), { email: "outro@x.com", nivel: "suporte", ativo: true })));
test("v4.9 equipe: comercial NÃO cria membro", async () => { await equipe("com@x.com", "comercial"); await assertFails(setDoc(doc(comEmail("c1", "com@x.com"), "equipe_fenix/zed@x.com"), { email: "zed@x.com", nivel: "admin", ativo: true })); });
test("v4.9 equipe: admin da equipe cria membro", async () => { await equipe("adm@x.com", "admin"); await assertSucceeds(setDoc(doc(comEmail("a1", "adm@x.com"), "equipe_fenix/zed@x.com"), { email: "zed@x.com", nivel: "suporte", ativo: true })); });
test("v4.9 equipe: admin da equipe lista", async () => { await equipe("adm@x.com", "admin"); await assertSucceeds(getDocs(collection(comEmail("a1", "adm@x.com"), "equipe_fenix"))); });
test("v4.9 equipe: suporte NÃO lista", async () => { await equipe("sup@x.com", "suporte"); await assertFails(getDocs(collection(comEmail("s1", "sup@x.com"), "equipe_fenix"))); });
test("v4.9 equipe: o próprio membro lê o seu documento", async () => { await equipe("sup@x.com", "suporte"); await assertSucceeds(getDoc(doc(comEmail("s1", "sup@x.com"), "equipe_fenix/sup@x.com"))); });
test("v4.9 equipe: membro NÃO lê o documento de outro (se não for suporte)", () => assertFails(getDoc(doc(comEmail("u1", "qualquer@x.com"), "equipe_fenix/sup@x.com"))));
test("v4.9 equipe: usuário comum NÃO se cadastra", () => assertFails(setDoc(doc(comEmail("u1", "qualquer@x.com"), "equipe_fenix/qualquer@x.com"), { email: "qualquer@x.com", nivel: "admin", ativo: true })));

// ---------- níveis sobre empresas e licenças ----------
test("v4.9 comercial: altera só campos de licença", async () => { await equipe("com@x.com", "comercial"); await assertSucceeds(updateDoc(doc(comEmail("c1", "com@x.com"), "empresas/e1"), { licenca: "tempo", licencaAte: dias(30), testeInicio: dias(0) })); });
test("v4.9 comercial: NÃO altera nome nem dono", async () => { await equipe("com@x.com", "comercial"); await assertFails(updateDoc(doc(comEmail("c1", "com@x.com"), "empresas/e1"), { donoUid: "c1" })); });
test("v4.9 comercial: grava o espelho em licencas", async () => { await equipe("com@x.com", "comercial"); await assertSucceeds(setDoc(doc(comEmail("c1", "com@x.com"), "licencas/h9"), { licenca: "definitiva" })); });
test("v4.9 suporte: lê empresa e lista licencas", async () => { await equipe("sup@x.com", "suporte"); await assertSucceeds(getDoc(doc(comEmail("s1", "sup@x.com"), "empresas/e1"))); await assertSucceeds(getDocs(collection(comEmail("s1", "sup@x.com"), "licencas"))); });
test("v4.9 suporte: NÃO altera empresa nem licencas", async () => { await equipe("sup@x.com", "suporte"); await assertFails(updateDoc(doc(comEmail("s1", "sup@x.com"), "empresas/e1"), { licenca: "tempo" })); await assertFails(setDoc(doc(comEmail("s1", "sup@x.com"), "licencas/h9"), { licenca: "tempo" })); });
test("v4.9 inativo: membro desativado perde o acesso", async () => { await equipe("com@x.com", "comercial", false); await assertFails(updateDoc(doc(comEmail("c1", "com@x.com"), "empresas/e1"), { licenca: "tempo" })); });
test("v4.9 equipe sem e-mail verificado é NEGADO", async () => { await equipe("com@x.com", "comercial"); await assertFails(updateDoc(doc(comEmail("c1", "com@x.com", false), "empresas/e1"), { licenca: "tempo" })); });
test("v4.9 licencas: cliente comum continua sem gravar", () => assertFails(setDoc(doc(como("dono1"), "licencas/h2"), { licenca: "definitiva" })));
test("v4.9 perfis: administrador da equipe também aprova perfis", async () => { await equipe("adm@x.com", "admin"); await assertSucceeds(updateDoc(doc(comEmail("a1", "adm@x.com"), "perfis/user1"), { status: "aprovado" })); });
