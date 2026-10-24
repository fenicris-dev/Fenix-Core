// Testes das regras do Firestore (firestore.rules) com o emulador local.
// Rode com:  npm install   (uma vez)   e depois   npm test
// Nada aqui toca o banco real: o projeto é "demo-fenix" e tudo roda na sua máquina.
import { test, before, after, beforeEach } from "node:test";
import fs from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection } from "firebase/firestore";

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
test("empresas: criar sem o campo licenca é permitido", () => assertSucceeds(setDoc(doc(como("novo1"), "empresas/e9"), { nome: "Nova", donoUid: "novo1" })));
test("empresas: criar com licenca = teste é permitido", () => assertSucceeds(setDoc(doc(como("novo1"), "empresas/e9"), { nome: "Nova", donoUid: "novo1", licenca: "teste" })));
test("empresas: criar com licenca = definitiva é NEGADO", () => assertFails(setDoc(doc(como("novo1"), "empresas/e9"), { nome: "Nova", donoUid: "novo1", licenca: "definitiva" })));
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

// ---------- cidades da empresa (fechada na v4.8) ----------
test("empresas/{id}/cidades: membro lê, mas NÃO grava (v4.8)", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), "empresas/e1/cidades/2800308"), { nome: "Aracaju" }); });
  await assertSucceeds(getDoc(doc(como("tec1"), "empresas/e1/cidades/2800308")));
  await assertFails(setDoc(doc(como("tec1"), "empresas/e1/cidades/2800308"), { nome: "Outra" }));
  await assertFails(setDoc(doc(como("dono1"), "empresas/e1/cidades/9999999"), { nome: "Nova" }));
});
test("empresas/{id}/cidades/{ibge}/bairros: membro continua gravando", () => assertSucceeds(setDoc(doc(como("tec1"), "empresas/e1/cidades/2800308/bairros/centro"), { nome: "Centro" })));

// ---------- cidades (leitura pública) ----------
test("cidades: leitura pública, gravação só logado", async () => {
  await assertSucceeds(getDoc(doc(anonimo(), "cidades/2800308")));
  await assertSucceeds(setDoc(doc(como("tec1"), "cidades/2800308"), { nome: "Aracaju" }));
  await assertFails(setDoc(doc(anonimo(), "cidades/2800308"), { nome: "Aracaju" }));
});
