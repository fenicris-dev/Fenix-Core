// Testes das regras do Firestore (firestore.rules) com o emulador local.
// Rode com:  npm install   (uma vez)   e depois   npm test
// Nada aqui toca o banco real: o projeto é "demo-fenix" e tudo roda na sua máquina.
import { test, before, after, beforeEach } from "node:test";
import fs from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";

let env;
const regras = fs.readFileSync(new URL("./firestore.rules", import.meta.url), "utf8");

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
test("v4.9 equipe: raiz cria membro comercial", () => assertSucceeds(setDoc(doc(comEmail("r1", RAIZ1), "equipe_fenix/ana@x.com"), { email: "ana@x.com", nivel: "comercial", ativo: true, criadoPor: RAIZ1 })));
test("v4.9 equipe: nível inválido é NEGADO", () => assertFails(setDoc(doc(comEmail("r1", RAIZ1), "equipe_fenix/ana@x.com"), { email: "ana@x.com", nivel: "chefe", ativo: true })));
test("v4.9 equipe: id diferente do e-mail é NEGADO", () => assertFails(setDoc(doc(comEmail("r1", RAIZ1), "equipe_fenix/ana@x.com"), { email: "outro@x.com", nivel: "suporte", ativo: true })));
test("v4.9 equipe: comercial NÃO cria membro", async () => { await equipe("com@x.com", "comercial"); await assertFails(setDoc(doc(comEmail("c1", "com@x.com"), "equipe_fenix/zed@x.com"), { email: "zed@x.com", nivel: "admin", ativo: true })); });
test("v4.9 equipe: admin da equipe cria membro", async () => { await equipe("adm@x.com", "admin"); await assertSucceeds(setDoc(doc(comEmail("a1", "adm@x.com"), "equipe_fenix/zed@x.com"), { email: "zed@x.com", nivel: "suporte", ativo: true, criadoPor: "adm@x.com" })); });
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

// =====================================================================
// v5.4 — Compartilhe e ganhe: config/indicacoes, indicadoPor e prêmio por app
// =====================================================================
const hex10 = "abcdef0123";
// config/indicacoes
test("v5.4 config: qualquer um lê o documento da campanha (get)", () => assertSucceeds(getDoc(doc(anonimo(), "config/indicacoes"))));
test("v5.4 config: listar é NEGADO", () => assertFails(getDocs(collection(anonimo(), "config"))));
test("v5.4 config: administrador raiz liga a campanha", () => assertSucceeds(setDoc(doc(comEmail("r1", RAIZ1), "config/indicacoes"), { ativa: true, por: RAIZ1 })));
test("v5.4 config: 'ativa' precisa ser verdadeiro ou falso", () => assertFails(setDoc(doc(comEmail("r1", RAIZ1), "config/indicacoes"), { ativa: "sim" })));
test("v5.4 config: outro documento além de 'indicacoes' é NEGADO", () => assertFails(setDoc(doc(comEmail("r1", RAIZ1), "config/outro"), { ativa: true })));
test("v5.4 config: comercial NÃO liga a campanha", async () => { await equipe("com@x.com", "comercial"); await assertFails(setDoc(doc(comEmail("c1", "com@x.com"), "config/indicacoes"), { ativa: true })); });
test("v5.4 config: cliente comum NÃO liga a campanha", () => assertFails(setDoc(doc(como("dono1"), "config/indicacoes"), { ativa: true })));
// criar empresa por indicação
test("v5.4 empresa: criar com indicadoPor válido é permitido", () => assertSucceeds(setDoc(doc(como("novo1"), "empresas/e9"), { nome: "N", donoUid: "novo1", testeInicio: serverTimestamp(), indicadoPor: hex10 })));
test("v5.4 empresa: indicadoPor fora do formato é NEGADO", () => assertFails(setDoc(doc(como("novo1"), "empresas/e9"), { nome: "N", donoUid: "novo1", testeInicio: serverTimestamp(), indicadoPor: "<script>" })));
test("v5.4 empresa: criar já com premios é NEGADO", () => assertFails(setDoc(doc(como("novo1"), "empresas/e9"), { nome: "N", donoUid: "novo1", testeInicio: serverTimestamp(), premios: { "fenix-gestor-do-tempo": dias(365) } })));
test("v5.4 empresa: criar já marcada como premiada é NEGADO", () => assertFails(setDoc(doc(como("novo1"), "empresas/e9"), { nome: "N", donoUid: "novo1", testeInicio: serverTimestamp(), indicacaoPremiada: true })));
// quem libera o prêmio
test("v5.4 prêmio: administrador grava premios na empresa", () => assertSucceeds(setDoc(doc(comEmail("r1", RAIZ1), "empresas/e1"), { premios: { "fenix-gestor-do-tempo": dias(365) } }, { merge: true })));
test("v5.4 prêmio: comercial NÃO grava premios", async () => { await equipe("com@x.com", "comercial"); await assertFails(updateDoc(doc(comEmail("c1", "com@x.com"), "empresas/e1"), { premios: { "fenix-gestor-do-tempo": dias(365) } })); });
test("v5.4 prêmio: dono NÃO se dá prêmio", () => assertFails(updateDoc(doc(como("dono1"), "empresas/e1"), { premios: { "fenix-gestor-do-tempo": dias(365) } })));
// efeito do prêmio na gravação (dados pessoais do app premiado)
test("v5.4 prêmio: vencido o teste, prêmio do app libera gravar nesse app", async () => { await estado({ testeInicio: dias(-20), premios: { "fenix-gestor-do-tempo": dias(100) } }); await assertSucceeds(setDoc(doc(como("tec1"), "dados_pessoais/tec1/fenix-gestor-do-tempo/t9"), { titulo: "x" })); });
test("v5.4 prêmio: também vale em coleção {app}_{coleção}", async () => { await estado({ testeInicio: dias(-20), premios: { "fenix-gestor-do-tempo": dias(100) } }); await assertSucceeds(setDoc(doc(como("tec1"), "dados_pessoais/tec1/fenix-gestor-do-tempo_tarefas/t9"), { titulo: "x" })); });
test("v5.4 prêmio: NÃO libera gravar em outro app", async () => { await estado({ testeInicio: dias(-20), premios: { "fenix-gestor-do-tempo": dias(100) } }); await assertFails(setDoc(doc(como("tec1"), "dados_pessoais/tec1/fenix-capsula-do-tempo/t9"), { titulo: "x" })); });
test("v5.4 prêmio: prêmio vencido NÃO libera", async () => { await estado({ testeInicio: dias(-20), premios: { "fenix-gestor-do-tempo": dias(-1) } }); await assertFails(setDoc(doc(como("tec1"), "dados_pessoais/tec1/fenix-gestor-do-tempo/t9"), { titulo: "x" })); });
test("v5.4 prêmio: sem prêmio e teste vencido continua NEGADO", async () => { await estado({ testeInicio: dias(-20) }); await assertFails(setDoc(doc(como("tec1"), "dados_pessoais/tec1/fenix-gestor-do-tempo/t9"), { titulo: "x" })); });
test("v5.4 prêmio: teste em dia grava normalmente (sem prêmio)", async () => { await estado({ testeInicio: dias(-3) }); await assertSucceeds(setDoc(doc(como("tec1"), "dados_pessoais/tec1/fenix-gestor-do-tempo/t9"), { titulo: "x" })); });

// =====================================================================
// v6.0 — Salas online (regra 80): match /salas/{codigo}
// =====================================================================
const semear = async (sala, extras = {}) => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "salas/S1"), Object.assign({ host: "hostA", n: 3, modo: "jogo", estado: "andamento", idx: 0, liberadas: 0, tempoTotalMin: 0 }, sala));
    await setDoc(doc(db, "salas/S1/perguntas/0"), { texto: "P0" });
    await setDoc(doc(db, "salas/S1/gabarito/0"), { certa: 2 });
    await setDoc(doc(db, "salas/S1/gabarito/1"), { certa: 1 });
    await setDoc(doc(db, "salas/S1/jogadores/jog1"), { apelido: "Ana", pontos: 0, acertos: 0 });
    if (extras.inicioPerg) await setDoc(doc(db, "salas/S1"), { inicioPerg: extras.inicioPerg }, { merge: true });
  });
};
test("v6.0 salas: logado (anônimo) lê a sala pelo código (get)", async () => { await semear({}); await assertSucceeds(getDoc(doc(como("jog1"), "salas/S1"))); });
test("v6.0 salas: sem login NÃO lê a sala", async () => { await semear({}); await assertFails(getDoc(doc(anonimo(), "salas/S1"))); });
test("v6.0 salas: listar as salas é NEGADO", async () => { await semear({}); await assertFails(getDocs(collection(como("jog1"), "salas"))); });
test("v6.0 salas: criar sala como anfitrião (host = o próprio uid, n <= 50) é permitido", () => assertSucceeds(setDoc(doc(como("hostB"), "salas/S2"), { host: "hostB", n: 10 })));
test("v6.0 salas: criar sala com host de outra pessoa é NEGADO", () => assertFails(setDoc(doc(como("hostB"), "salas/S2"), { host: "hostA", n: 10 })));
test("v6.0 salas: criar sala com mais de 50 perguntas é NEGADO", () => assertFails(setDoc(doc(como("hostB"), "salas/S2"), { host: "hostB", n: 51 })));
test("v6.0 salas: só o anfitrião atualiza a sala", async () => { await semear({}); await assertSucceeds(updateDoc(doc(como("hostA"), "salas/S1"), { idx: 1 })); await assertFails(updateDoc(doc(como("jog1"), "salas/S1"), { idx: 1 })); });
test("v6.0 salas: o anfitrião NÃO passa a sala para outro host", async () => { await semear({}); await assertFails(updateDoc(doc(como("hostA"), "salas/S1"), { host: "jog1" })); });
test("v6.0 salas: só o anfitrião apaga a sala", async () => { await semear({}); await assertFails(deleteDoc(doc(como("jog1"), "salas/S1"))); await assertSucceeds(deleteDoc(doc(como("hostA"), "salas/S1"))); });
test("v6.0 salas: participante lê as perguntas, mas não grava", async () => { await semear({}); await assertSucceeds(getDoc(doc(como("jog1"), "salas/S1/perguntas/0"))); await assertFails(setDoc(doc(como("jog1"), "salas/S1/perguntas/9"), { texto: "x" })); });
test("v6.0 salas: gabarito NEGADO antes de liberar", async () => { await semear({ liberadas: 0 }); await assertFails(getDoc(doc(como("jog1"), "salas/S1/gabarito/0"))); });
test("v6.0 salas: gabarito liberado (liberadas > n) é lido; a pergunta seguinte continua fechada", async () => { await semear({ liberadas: 1 }); await assertSucceeds(getDoc(doc(como("jog1"), "salas/S1/gabarito/0"))); await assertFails(getDoc(doc(como("jog1"), "salas/S1/gabarito/1"))); });
test("v6.0 salas: anfitrião lê o gabarito a qualquer hora", async () => { await semear({ liberadas: 0 }); await assertSucceeds(getDoc(doc(como("hostA"), "salas/S1/gabarito/0"))); });
test("v6.0 salas: listar o gabarito é NEGADO", async () => { await semear({ liberadas: 3 }); await assertFails(getDocs(collection(como("jog1"), "salas/S1/gabarito"))); });
test("v6.0 salas: jogador entra com o próprio uid, pontos 0 e apelido até 16 letras", async () => { await semear({}); await assertSucceeds(setDoc(doc(como("jog2"), "salas/S1/jogadores/jog2"), { apelido: "Beto", pontos: 0, acertos: 0 })); });
test("v6.0 salas: jogador NÃO entra já com pontos", async () => { await semear({}); await assertFails(setDoc(doc(como("jog2"), "salas/S1/jogadores/jog2"), { apelido: "Beto", pontos: 50, acertos: 0 })); });
test("v6.0 salas: jogador NÃO entra no lugar de outro uid", async () => { await semear({}); await assertFails(setDoc(doc(como("jog2"), "salas/S1/jogadores/jog3"), { apelido: "Beto", pontos: 0, acertos: 0 })); });
test("v6.0 salas: apelido com mais de 16 letras é NEGADO", async () => { await semear({}); await assertFails(setDoc(doc(como("jog2"), "salas/S1/jogadores/jog2"), { apelido: "x".repeat(17), pontos: 0, acertos: 0 })); });
test("v6.0 salas: jogador troca só o apelido; NÃO muda os próprios pontos", async () => { await semear({}); await assertSucceeds(updateDoc(doc(como("jog1"), "salas/S1/jogadores/jog1"), { apelido: "Aninha" })); await assertFails(updateDoc(doc(como("jog1"), "salas/S1/jogadores/jog1"), { pontos: 999 })); });
test("v6.0 salas: anfitrião grava os pontos; só pontos e acertos", async () => { await semear({}); await assertSucceeds(updateDoc(doc(como("hostA"), "salas/S1/jogadores/jog1"), { pontos: 10, acertos: 1 })); await assertFails(updateDoc(doc(como("hostA"), "salas/S1/jogadores/jog1"), { apelido: "Outro" })); });
test("v6.0 salas: resposta válida (id n_uid, ts do servidor, alt 0 a 4, pergunta atual) é permitida", async () => { await semear({}); await assertSucceeds(setDoc(doc(como("jog1"), "salas/S1/respostas/0_jog1"), { n: 0, uid: "jog1", alt: 2, ts: serverTimestamp() })); });
test("v6.0 salas: resposta com hora do aparelho (não do servidor) é NEGADA", async () => { await semear({}); await assertFails(setDoc(doc(como("jog1"), "salas/S1/respostas/0_jog1"), { n: 0, uid: "jog1", alt: 2, ts: Timestamp.fromDate(new Date()) })); });
test("v6.0 salas: resposta em nome de outro uid é NEGADA", async () => { await semear({}); await assertFails(setDoc(doc(como("jog1"), "salas/S1/respostas/0_jog2"), { n: 0, uid: "jog2", alt: 2, ts: serverTimestamp() })); });
test("v6.0 salas: jogo: resposta de pergunta que não é a atual é NEGADA", async () => { await semear({ idx: 1 }); await assertFails(setDoc(doc(como("jog1"), "salas/S1/respostas/0_jog1"), { n: 0, uid: "jog1", alt: 2, ts: serverTimestamp() })); });
test("v6.0 salas: resposta com sala encerrada é NEGADA", async () => { await semear({ estado: "encerrada" }); await assertFails(setDoc(doc(como("jog1"), "salas/S1/respostas/0_jog1"), { n: 0, uid: "jog1", alt: 2, ts: serverTimestamp() })); });
test("v6.0 salas: resposta de quem não entrou na sala (sem jogador) é NEGADA", async () => { await semear({}); await assertFails(setDoc(doc(como("jog9"), "salas/S1/respostas/0_jog9"), { n: 0, uid: "jog9", alt: 2, ts: serverTimestamp() })); });
test("v6.0 salas: alternativa fora de 0 a 4 é NEGADA", async () => { await semear({}); await assertFails(setDoc(doc(como("jog1"), "salas/S1/respostas/0_jog1"), { n: 0, uid: "jog1", alt: 7, ts: serverTimestamp() })); });
test("v6.0 salas: jogo: trocar a resposta já dada é NEGADO", async () => { await semear({}); await assertSucceeds(setDoc(doc(como("jog1"), "salas/S1/respostas/0_jog1"), { n: 0, uid: "jog1", alt: 2, ts: serverTimestamp() })); await assertFails(setDoc(doc(como("jog1"), "salas/S1/respostas/0_jog1"), { n: 0, uid: "jog1", alt: 3, ts: serverTimestamp() })); });
test("v6.0 salas: simulado: o aluno pode trocar a resposta até o fim do tempo", async () => { await semear({ modo: "simulado", tempoTotalMin: 0 }); await assertSucceeds(setDoc(doc(como("jog1"), "salas/S1/respostas/0_jog1"), { n: 0, uid: "jog1", alt: 2, ts: serverTimestamp() })); await assertSucceeds(setDoc(doc(como("jog1"), "salas/S1/respostas/0_jog1"), { n: 0, uid: "jog1", alt: 3, ts: serverTimestamp() })); });
test("v6.0 salas: simulado: resposta depois do tempo total é NEGADA", async () => { await semear({ modo: "simulado", tempoTotalMin: 5 }, { inicioPerg: Timestamp.fromMillis(Date.now() - 20 * 60000) }); await assertFails(setDoc(doc(como("jog1"), "salas/S1/respostas/0_jog1"), { n: 0, uid: "jog1", alt: 2, ts: serverTimestamp() })); });

// =====================================================================
// v6.5 — Mescla com as regras publicadas no console (linhagem v5.9 e Controle de Compras) e Laudos Técnicos
// NÃO foram executados por mim (sem emulador no meu ambiente): rode npm install e npm test no seu computador.
// =====================================================================
const RAIZ3 = "trampodofenix@gmail.com";
// ---------- [v5.9] reforços ----------
test("v6.5 pessoas_fisicas: ID com letras ou pontuação é NEGADO", async () => {
  await assertFails(setDoc(doc(como("tec1"), "pessoas_fisicas/123.456.789-00"), { nome: "X" }));
  await assertFails(setDoc(doc(como("tec1"), "pessoas_fisicas/1234567890"), { nome: "X" }));
});
test("v6.5 pessoas_juridicas: CNPJ com 14 dígitos é permitido; com 13 é NEGADO", async () => {
  await assertSucceeds(setDoc(doc(como("tec1"), "pessoas_juridicas/12345678000199"), { razaoSocial: "X" }));
  await assertFails(setDoc(doc(como("tec1"), "pessoas_juridicas/1234567800019"), { razaoSocial: "X" }));
});
test("v6.5 pessoas_fisicas: técnico NÃO apaga; administrador raiz apaga", async () => {
  await assertFails(deleteDoc(doc(como("tec1"), "pessoas_fisicas/12345678900")));
  await assertSucceeds(deleteDoc(doc(comEmail("r1", RAIZ1), "pessoas_fisicas/12345678900")));
});
test("v6.5 produtos_servicos: logado cria e lê; só administrador apaga", async () => {
  await assertSucceeds(setDoc(doc(como("tec1"), "produtos_servicos/p1"), { nome: "Cabo" }));
  await assertSucceeds(getDoc(doc(como("tec1"), "produtos_servicos/p1")));
  await assertFails(deleteDoc(doc(como("tec1"), "produtos_servicos/p1")));
  await assertSucceeds(deleteDoc(doc(comEmail("r1", RAIZ1), "produtos_servicos/p1")));
});
test("v6.5 cidades: logado CRIA uma nova, mas NÃO altera nem apaga uma existente", async () => {
  await semRegras((db) => setDoc(doc(db, "cidades/2800308"), { nome: "Aracaju" }));
  await assertSucceeds(setDoc(doc(como("tec1"), "cidades/3550308"), { nome: "São Paulo" }));
  await assertFails(setDoc(doc(como("tec1"), "cidades/2800308"), { nome: "Outra" }));
  await assertFails(deleteDoc(doc(como("tec1"), "cidades/2800308")));
});
test("v6.5 bairros: criar logado; alterar NEGADO", async () => {
  await semRegras((db) => setDoc(doc(db, "cidades/2800308/bairros/centro"), { nomeOriginal: "Centro" }));
  await assertSucceeds(setDoc(doc(como("tec1"), "cidades/2800308/bairros/jardins"), { nomeOriginal: "Jardins" }));
  await assertFails(setDoc(doc(como("tec1"), "cidades/2800308/bairros/centro"), { nomeOriginal: "X" }));
});
test("v6.5 empresas: criar com donoUid de outra pessoa é NEGADO", () => assertFails(setDoc(doc(como("novo1"), "empresas/e9"), { nome: "N", donoUid: "outro", testeInicio: serverTimestamp() })));
test("v6.5 dados_pessoais: nomes reservados _fenix_* NÃO caem no curinga", () => assertFails(setDoc(doc(como("_fenix_equipe"), "dados_pessoais/_fenix_equipe/qualquer/x"), { a: 1 })));
// ---------- [v5.9] administração raiz ----------
const adm = "novoadm@x.com";
test("v6.5 fx: raiz (3 e-mails) cria administrador vinculado a um raiz", async () => {
  await assertSucceeds(setDoc(doc(comEmail("r3", RAIZ3), "dados_pessoais/_fenix_equipe/admins/" + adm), { dados: { ativo: true, vinculadoA: RAIZ3 } }));
});
test("v6.5 fx: administrador vinculado a e-mail que não é raiz é NEGADO", () => assertFails(setDoc(doc(comEmail("r1", RAIZ1), "dados_pessoais/_fenix_equipe/admins/" + adm), { dados: { ativo: true, vinculadoA: "qualquer@x.com" } })));
test("v6.5 fx: e-mail raiz NÃO verificado é NEGADO", () => assertFails(setDoc(doc(comEmail("r1", RAIZ1, false), "dados_pessoais/_fenix_equipe/admins/" + adm), { dados: { ativo: true, vinculadoA: RAIZ1 } })));
test("v6.5 fx: a pessoa lê o próprio documento de administrador; outro NÃO", async () => {
  await semRegras((db) => setDoc(doc(db, "dados_pessoais/_fenix_equipe/admins/" + adm), { dados: { ativo: true, vinculadoA: RAIZ1 } }));
  await assertSucceeds(getDoc(doc(comEmail("a1", adm), "dados_pessoais/_fenix_equipe/admins/" + adm)));
  await assertFails(getDoc(doc(comEmail("b1", "outro@x.com"), "dados_pessoais/_fenix_equipe/admins/" + adm)));
});
test("v6.5 fx arquivo: usuário cria a cópia dos próprios itens, mas NÃO a lê; administrador lê", async () => {
  const chave = "u1__app1";
  await assertSucceeds(setDoc(doc(como("u1"), "dados_pessoais/_fenix_admin/arquivo/" + chave), { dados: { uid: "u1", appId: "app1" } }));
  await assertFails(getDoc(doc(como("u1"), "dados_pessoais/_fenix_admin/arquivo/" + chave)));
  await assertSucceeds(getDoc(doc(comEmail("r1", RAIZ1), "dados_pessoais/_fenix_admin/arquivo/" + chave)));
});
test("v6.5 fx arquivo: chave que não é uid__appId é NEGADA", () => assertFails(setDoc(doc(como("u1"), "dados_pessoais/_fenix_admin/arquivo/outra"), { dados: { uid: "u1", appId: "app1" } })));
// ---------- Controle de Compras ----------
const ambBase = (dono) => ({ dono, membrosUids: [dono], papeis: { [dono]: { p: "gestor" } } });
test("v6.5 ambientes: quem cria vira o único membro e gestor", () => assertSucceeds(setDoc(doc(como("g1"), "ambientes_compartilhados/a1"), ambBase("g1"))));
test("v6.5 ambientes: criar com dono de outra pessoa é NEGADO", () => assertFails(setDoc(doc(como("g1"), "ambientes_compartilhados/a1"), ambBase("g2"))));
test("v6.5 ambientes: só membro lê", async () => {
  await semRegras((db) => setDoc(doc(db, "ambientes_compartilhados/a1"), ambBase("g1")));
  await assertSucceeds(getDoc(doc(como("g1"), "ambientes_compartilhados/a1")));
  await assertFails(getDoc(doc(como("g2"), "ambientes_compartilhados/a1")));
});
test("v6.5 ambientes: leitor NÃO grava no estoque; gestor grava", async () => {
  await semRegras(async (db) => { await setDoc(doc(db, "ambientes_compartilhados/a1"), { dono: "g1", membrosUids: ["g1", "l1"], papeis: { g1: { p: "gestor" }, l1: { p: "leitor" } } }); });
  await assertFails(setDoc(doc(como("l1"), "ambientes_compartilhados/a1/dados/r1"), { x: 1 }));
  await assertSucceeds(setDoc(doc(como("g1"), "ambientes_compartilhados/a1/dados/r1"), { x: 1 }));
  await assertSucceeds(getDoc(doc(como("l1"), "ambientes_compartilhados/a1/dados/r1")));
});
test("v6.5 ambientes: só o dono apaga o ambiente", async () => {
  await semRegras((db) => setDoc(doc(db, "ambientes_compartilhados/a1"), { dono: "g1", membrosUids: ["g1", "c1"], papeis: { g1: { p: "gestor" }, c1: { p: "cuidador" } } }));
  await assertFails(deleteDoc(doc(como("c1"), "ambientes_compartilhados/a1")));
  await assertSucceeds(deleteDoc(doc(como("g1"), "ambientes_compartilhados/a1")));
});
test("v6.5 ambientes: só o dono cria convite (cuidador ou leitor)", async () => {
  await semRegras((db) => setDoc(doc(db, "ambientes_compartilhados/a1"), ambBase("g1")));
  await assertSucceeds(setDoc(doc(como("g1"), "ambientes_compartilhados/a1/convites/t1"), { papel: "leitor", ate: Date.now() + 86400000 }));
  await assertFails(setDoc(doc(como("g1"), "ambientes_compartilhados/a1/convites/t2"), { papel: "gestor", ate: Date.now() + 86400000 }));
  await assertFails(setDoc(doc(como("g2"), "ambientes_compartilhados/a1/convites/t3"), { papel: "leitor", ate: Date.now() + 86400000 }));
});
const prod = (ean) => ({ ean, nome: "Arroz", modo: "emb", unidade: "un" });
test("v6.5 catalogo_produtos: logado cria código novo (EAN 8 a 14 dígitos) e lê", async () => {
  await assertSucceeds(setDoc(doc(como("u1"), "catalogo_produtos/7891234567895"), prod("7891234567895")));
  await assertSucceeds(getDoc(doc(como("u2"), "catalogo_produtos/7891234567895")));
});
test("v6.5 catalogo_produtos: EAN inválido, campo extra e foto de não administrador são NEGADOS", async () => {
  await assertFails(setDoc(doc(como("u1"), "catalogo_produtos/abc"), prod("abc")));
  await assertFails(setDoc(doc(como("u1"), "catalogo_produtos/7891234567895"), { ...prod("7891234567895"), preco: 9 }));
  await assertFails(setDoc(doc(como("u1"), "catalogo_produtos/7891234567895"), { ...prod("7891234567895"), foto: "x" }));
});
test("v6.5 catalogo_produtos: alterar e apagar um existente é só de administrador (admins/{uid})", async () => {
  await semRegras((db) => setDoc(doc(db, "catalogo_produtos/7891234567895"), prod("7891234567895")));
  await assertFails(updateDoc(doc(como("u1"), "catalogo_produtos/7891234567895"), { nome: "Outro" }));
  await assertSucceeds(updateDoc(doc(como("adm1"), "catalogo_produtos/7891234567895"), { nome: "Outro" }));
});
test("v6.5 catalogo_denuncias: logado cria com o próprio uid; só administrador lê", async () => {
  await assertSucceeds(setDoc(doc(como("u1"), "catalogo_denuncias/d1"), { ean: "7891234567895", motivo: "nome", por: "u1" }));
  await assertFails(setDoc(doc(como("u1"), "catalogo_denuncias/d2"), { ean: "7891234567895", motivo: "nome", por: "outro" }));
  await assertFails(getDoc(doc(como("u1"), "catalogo_denuncias/d1")));
  await assertSucceeds(getDoc(doc(como("adm1"), "catalogo_denuncias/d1")));
});
// ---------- Laudos Técnicos ----------
const hash64 = "a".repeat(64), cod20 = "ABCDEFGHJKLMNPQRSTUV";
const laudo = (uid, extra = {}) => ({ uid, app: "fenix-laudos-tecnicos", numero: "1", hash: hash64, html: "<p>laudo</p>", status: "vigente", ...extra });
test("v6.5 laudos: qualquer pessoa lê um laudo pelo código (get), mesmo sem login", async () => {
  await semRegras((db) => setDoc(doc(db, "verificacoes_laudos/" + cod20), laudo("u1")));
  await assertSucceeds(getDoc(doc(anonimo(), "verificacoes_laudos/" + cod20)));
});
test("v6.5 laudos: listar a coleção é NEGADO", () => assertFails(getDocs(collection(como("u1"), "verificacoes_laudos"))));
test("v6.5 laudos: dono cria com código de 20+ caracteres", () => assertSucceeds(setDoc(doc(como("u1"), "verificacoes_laudos/" + cod20), laudo("u1"))));
test("v6.5 laudos: código curto, uid alheio, hash curto, status inválido e campo extra são NEGADOS", async () => {
  await assertFails(setDoc(doc(como("u1"), "verificacoes_laudos/curto"), laudo("u1")));
  await assertFails(setDoc(doc(como("u1"), "verificacoes_laudos/" + cod20), laudo("u2")));
  await assertFails(setDoc(doc(como("u1"), "verificacoes_laudos/" + cod20), laudo("u1", { hash: "abc" })));
  await assertFails(setDoc(doc(como("u1"), "verificacoes_laudos/" + cod20), laudo("u1", { status: "outro" })));
  await assertFails(setDoc(doc(como("u1"), "verificacoes_laudos/" + cod20), laudo("u1", { cpf: "123" })));
});
test("v6.5 laudos: sem login NÃO cria", () => assertFails(setDoc(doc(anonimo(), "verificacoes_laudos/" + cod20), laudo("u1"))));
test("v6.5 laudos: dono muda só status; NÃO muda o html nem o uid; ninguém apaga", async () => {
  await semRegras((db) => setDoc(doc(db, "verificacoes_laudos/" + cod20), laudo("u1")));
  await assertSucceeds(updateDoc(doc(como("u1"), "verificacoes_laudos/" + cod20), { status: "revogado", atualizadoEm: serverTimestamp() }));
  await assertFails(updateDoc(doc(como("u1"), "verificacoes_laudos/" + cod20), { html: "<p>outro</p>" }));
  await assertFails(updateDoc(doc(como("u2"), "verificacoes_laudos/" + cod20), { status: "arquivado" }));
  await assertFails(deleteDoc(doc(como("u1"), "verificacoes_laudos/" + cod20)));
});
test("v6.5 laudos: teste vencido da empresa NEGA criar laudo", async () => {
  await estado({ testeInicio: dias(-20) });
  await assertFails(setDoc(doc(como("tec1"), "verificacoes_laudos/" + cod20), laudo("tec1")));
});
// ---------- regra final ----------
test("v6.5 coleção que não existe nas regras é NEGADA", async () => {
  await assertFails(setDoc(doc(como("u1"), "qualquer_coisa/x"), { a: 1 }));
  await assertFails(getDoc(doc(como("u1"), "qualquer_coisa/x")));
});

// ---------- v6.6: 4 e-mails raiz, Supremo e hierarquia da equipe ----------
const SUP = "fenicris@gmail.com", RAIZ4 = "baudofenix@gmail.com";
const eqDoc = (email, nivel, criadoPor, ativo = true) => semRegras((db) => setDoc(doc(db, "equipe_fenix/" + email), { email, nivel, ativo, nome: email, ...(criadoPor ? { criadoPor } : {}) }));
test("v6.6 raiz: baudofenix@gmail.com verificado altera a licença", () => assertSucceeds(updateDoc(doc(comEmail("r4b", RAIZ4), "empresas/e1"), { licenca: "definitiva" })));
test("v6.6 raiz: baudofenix@gmail.com NÃO verificado é NEGADO", () => assertFails(updateDoc(doc(comEmail("r4c", RAIZ4, false), "empresas/e1"), { licenca: "definitiva" })));
test("v6.6 raiz: trampodofenix@gmail.com altera a licença (agora raiz em tudo)", () => assertSucceeds(updateDoc(doc(comEmail("r3b", RAIZ3), "empresas/e1"), { licenca: "definitiva" })));
test("v6.6 raiz: baudofenix@gmail.com administra o arquivo fx", () => assertSucceeds(setDoc(doc(comEmail("r4d", RAIZ4), "dados_pessoais/_fenix_equipe/admins/novo@x.com"), { dados: { ativo: true, vinculadoA: RAIZ4 } })));
test("v6.6 equipe: administrador cria administrador com criadoPor = ele", async () => { await equipe("adm@x.com", "admin"); await assertSucceeds(setDoc(doc(comEmail("a1", "adm@x.com"), "equipe_fenix/novo@x.com"), { email: "novo@x.com", nivel: "admin", ativo: true, criadoPor: "adm@x.com" })); });
test("v6.6 equipe: criar SEM criadoPor, ou com criadoPor de outro, é NEGADO", async () => {
  await equipe("adm@x.com", "admin");
  await assertFails(setDoc(doc(comEmail("a1", "adm@x.com"), "equipe_fenix/n1@x.com"), { email: "n1@x.com", nivel: "suporte", ativo: true }));
  await assertFails(setDoc(doc(comEmail("a1", "adm@x.com"), "equipe_fenix/n2@x.com"), { email: "n2@x.com", nivel: "suporte", ativo: true, criadoPor: "outro@x.com" }));
});
test("v6.6 equipe: administrador NÃO apaga nem altera outro administrador", async () => {
  await equipe("adm@x.com", "admin"); await eqDoc("adm2@x.com", "admin", "adm@x.com");
  await assertFails(deleteDoc(doc(comEmail("a1", "adm@x.com"), "equipe_fenix/adm2@x.com")));
  await assertFails(updateDoc(doc(comEmail("a1", "adm@x.com"), "equipe_fenix/adm2@x.com"), { ativo: false }));
});
test("v6.6 equipe: administrador altera e apaga o auxiliar que ELE criou", async () => {
  await equipe("adm@x.com", "admin"); await eqDoc("aux@x.com", "suporte", "adm@x.com");
  await assertSucceeds(updateDoc(doc(comEmail("a1", "adm@x.com"), "equipe_fenix/aux@x.com"), { ativo: false }));
  await assertSucceeds(deleteDoc(doc(comEmail("a1", "adm@x.com"), "equipe_fenix/aux@x.com")));
});
test("v6.6 equipe: administrador NÃO mexe no auxiliar criado por outro administrador", async () => {
  await equipe("adm@x.com", "admin"); await eqDoc("aux@x.com", "comercial", "outro@x.com");
  await assertFails(updateDoc(doc(comEmail("a1", "adm@x.com"), "equipe_fenix/aux@x.com"), { ativo: false }));
  await assertFails(deleteDoc(doc(comEmail("a1", "adm@x.com"), "equipe_fenix/aux@x.com")));
});
test("v6.6 equipe: criadoPor não pode ser alterado (nem pelo dono do auxiliar)", async () => {
  await equipe("adm@x.com", "admin"); await eqDoc("aux@x.com", "suporte", "adm@x.com");
  await assertFails(updateDoc(doc(comEmail("a1", "adm@x.com"), "equipe_fenix/aux@x.com"), { criadoPor: "outro@x.com" }));
});
test("v6.6 equipe: Supremo apaga e altera administrador e auxiliar de qualquer um", async () => {
  await eqDoc("adm2@x.com", "admin", "adm@x.com"); await eqDoc("aux@x.com", "suporte", "adm@x.com");
  await assertSucceeds(updateDoc(doc(comEmail("s0", SUP), "equipe_fenix/adm2@x.com"), { ativo: false }));
  await assertSucceeds(deleteDoc(doc(comEmail("s0", SUP), "equipe_fenix/adm2@x.com")));
  await assertSucceeds(deleteDoc(doc(comEmail("s0", SUP), "equipe_fenix/aux@x.com")));
});
test("v6.6 equipe: Supremo NÃO verificado é NEGADO", async () => { await eqDoc("aux@x.com", "suporte", "adm@x.com"); await assertFails(deleteDoc(doc(comEmail("s0", SUP, false), "equipe_fenix/aux@x.com"))); });
test("v6.6 equipe: raiz que não é o Supremo NÃO apaga administrador nem auxiliar alheio", async () => {
  await eqDoc("adm2@x.com", "admin", "adm@x.com"); await eqDoc("aux@x.com", "suporte", "adm@x.com");
  await assertFails(deleteDoc(doc(comEmail("r2", RAIZ2), "equipe_fenix/adm2@x.com")));
  await assertFails(deleteDoc(doc(comEmail("r3", RAIZ3), "equipe_fenix/aux@x.com")));
  await assertFails(deleteDoc(doc(comEmail("r4e", RAIZ4), "equipe_fenix/aux@x.com")));
});
test("v6.6 equipe: raiz que não é o Supremo cria administrador e gere o auxiliar que criou", async () => {
  await assertSucceeds(setDoc(doc(comEmail("r2", RAIZ2), "equipe_fenix/a9@x.com"), { email: "a9@x.com", nivel: "admin", ativo: true, criadoPor: RAIZ2 }));
  await assertSucceeds(setDoc(doc(comEmail("r2", RAIZ2), "equipe_fenix/s9@x.com"), { email: "s9@x.com", nivel: "suporte", ativo: true, criadoPor: RAIZ2 }));
  await assertSucceeds(deleteDoc(doc(comEmail("r2", RAIZ2), "equipe_fenix/s9@x.com")));
  await assertFails(deleteDoc(doc(comEmail("r2", RAIZ2), "equipe_fenix/a9@x.com")));
});
test("v6.6 equipe: cadastro antigo sem criadoPor só o Supremo mexe", async () => {
  await equipe("adm@x.com", "admin"); await eqDoc("velho@x.com", "suporte", null);
  await assertFails(deleteDoc(doc(comEmail("a1", "adm@x.com"), "equipe_fenix/velho@x.com")));
  await assertSucceeds(deleteDoc(doc(comEmail("s0", SUP), "equipe_fenix/velho@x.com")));
});
test("v6.6 equipe: comercial e suporte NÃO criam nem apagam", async () => {
  await equipe("com@x.com", "comercial"); await eqDoc("aux@x.com", "suporte", "com@x.com");
  await assertFails(setDoc(doc(comEmail("c1", "com@x.com"), "equipe_fenix/n@x.com"), { email: "n@x.com", nivel: "suporte", ativo: true, criadoPor: "com@x.com" }));
  await assertFails(deleteDoc(doc(comEmail("c1", "com@x.com"), "equipe_fenix/aux@x.com")));
});
test("v6.6 fx: só o Supremo apaga administrador do arquivo fx", async () => {
  await semRegras((db) => setDoc(doc(db, "dados_pessoais/_fenix_equipe/admins/z@x.com"), { dados: { ativo: true, vinculadoA: SUP } }));
  await assertFails(deleteDoc(doc(comEmail("r2", RAIZ2), "dados_pessoais/_fenix_equipe/admins/z@x.com")));
  await assertSucceeds(deleteDoc(doc(comEmail("s0", SUP), "dados_pessoais/_fenix_equipe/admins/z@x.com")));
});
