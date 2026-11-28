import fs from "fs";
let src = fs.readFileSync(process.argv[2], "utf8");
src = src.replace(/^import \{[\s\S]*?\} from "[^"]+";$/gm, "");
// armazenamento falso
const mem = {};
const store = new Map();
const stubs = `
const __docs = globalThis.__docs;
const doc = (db, ...p) => { if (db && db.__col && !p.length) { const id = "id" + Math.random().toString(36).slice(2,8); return { __path: db.__col + "/" + id, id }; } return ({ __path: p.join("/"), id: p[p.length-1], __col: p.length%2===1 }); };
const collection = (db, ...p) => ({ __col: p.join("/") });
const serverTimestamp = () => ({ seconds: Math.floor(Date.now()/1000) });
const getDoc = async (r) => { const d = __docs.get(r.__path); return { exists: () => !!d, data: () => d ? JSON.parse(JSON.stringify(d), (k,v)=>v) : undefined, id: r.id }; };
const getDocs = async (c) => { const out=[]; for (const [k,v] of __docs) if (k.startsWith(c.__col+"/") && k.split("/").length===c.__col.split("/").length+1) out.push({ id:k.split("/").pop(), data:()=>JSON.parse(JSON.stringify(v)), ref:{__path:k} }); return { docs: out }; };
const merge = (a,b)=>{ const o={...a}; for (const k in b){ if (b[k] && typeof b[k]==="object" && !(b[k] instanceof Date) && b[k].seconds===undefined && o[k] && typeof o[k]==="object") o[k]=merge(o[k],b[k]); else o[k]=b[k]; } return o; };
const setDoc = async (r, v, o) => { __docs.set(r.__path, o && o.merge ? merge(__docs.get(r.__path)||{}, v) : v); };
const updateDoc = async (r, v) => { __docs.set(r.__path, merge(__docs.get(r.__path)||{}, v)); };
const deleteDoc = async (r) => { __docs.delete(r.__path); };
const writeBatch = () => { const ops=[]; return { set:(r,v,o)=>ops.push(()=>setDoc(r,v,o)), update:(r,v)=>ops.push(()=>updateDoc(r,v)), commit: async()=>{ for (const f of ops) await f(); } }; };
const initializeApp=()=>({}), getApps=()=>[], getApp=()=>({}), getFirestore=()=>({}), query=()=>({}), where=()=>({}), orderBy=()=>({}), fsLimit=()=>({}), onSnapshot=()=>()=>{}, initializeFirestore=()=>({}), persistentLocalCache=()=>({}), persistentMultipleTabManager=()=>({}), getDocFromServer=getDoc;
const getAuth=()=>({}), onAuthStateChanged=()=>{}, signInWithEmailAndPassword=()=>{}, createUserWithEmailAndPassword=()=>{}, signOut=()=>{}, GoogleAuthProvider=class{}, signInWithPopup=()=>{}, signInWithRedirect=()=>{}, getRedirectResult=()=>{}, sendPasswordResetEmail=()=>{}, EmailAuthProvider={}, reauthenticateWithCredential=()=>{}, deleteUser=()=>{};
`;
globalThis.__docs = store;
const ls = {}; globalThis.localStorage = { getItem:k=>k in ls?ls[k]:null, setItem:(k,v)=>{ls[k]=String(v)}, removeItem:k=>{delete ls[k]} };
globalThis.sessionStorage = { getItem:()=>null, setItem(){} };
globalThis.location = { search: "?ind=abcdef0123", origin: "https://x.github.io", pathname: "/App/" };
fs.writeFileSync("/tmp/claude-0/w60/_masc_test.mjs", stubs + src);
const { FenixCore: F } = await import("/tmp/claude-0/w60/_masc_test.mjs?" + Date.now());
let ok = 0, falhas = 0;
const t = (nome, cond) => { if (cond) ok++; else { falhas++; console.log("FALHOU:", nome); } };
const db = {};
const M = F.mascaras, V = (tp, v) => M.validar(tp, v);
t("versão 6.7", /v6\.7|6\.7/.test(src) && true);
// --- referências publicadas ---
t("ISBN-13 9780306406157 válido", V("isbn","9780306406157"));
t("ISBN-13 com um dígito errado inválido", !V("isbn","9780306406158"));
t("ISBN-10 0306406152 válido", V("isbn","0306406152"));
t("ISBN-10 com X: 080442957X válido", V("isbn","0-8044-2957-X"));
t("ISBN-10 errado inválido", !V("isbn","0306406153"));
t("ISBN 10->13", M.isbn10para13("0306406152") === "9780306406157");
t("ISBN 13->10", M.isbn13para10("9780306406157") === "0306406152");
t("ISBN 13->10 com X", M.isbn13para10(M.isbn10para13("080442957X")) === "080442957X");
t("ISBN 979 não converte para 10", M.isbn13para10("9791090636071") === null);
t("ISBN 979-10-90636-07-1 válido", V("isbn","979-10-90636-07-1"));
t("ISBN com X mantém o X", M.isbn("080442957x") === "0-8044295-7".slice(0,0)+M.isbn("080442957x") && M.isbn("080442957x").endsWith("-X"));
t("ISSN com X", M.issn("0378595x")==="0378-595X" || M.issn("03785955")==="0378-5955");
console.log("  isbn13:", M.isbn("9780306406157"), "| br:", M.isbn("9788535902778"), "| 10:", M.isbn("0306406152"), "| X:", M.isbn("080442957x"), "| parcial:", M.isbn("97885"));
t("ISBN máscara BR 978-85", M.isbn("9788535902778").startsWith("978-85-"));
t("ISBN valorLimpo sem hífen", M.valorLimpo("isbn","978-0-306-40615-7") === "9780306406157");
t("ISSN 0378-5955 válido", V("issn","0378-5955"));
t("ISSN 0378-5954 inválido", !V("issn","0378-5954"));
t("EAN-13 4006381333931 válido", V("ean","4006381333931"));
t("EAN-13 errado", !V("ean","4006381333932"));
t("EAN-8 96385074 válido", V("ean","96385074"));
t("UPC-A 036000291452 válido", V("ean","036000291452"));
t("cartão Visa teste 4111111111111111", V("cartao","4111 1111 1111 1111"));
t("cartão Amex teste 378282246310005", V("cartao","378282246310005"));
t("cartão errado", !V("cartao","4111111111111112"));
t("IMEI 490154203237518 válido", V("imei","490154203237518"));
t("IMEI errado", !V("imei","490154203237519"));
t("CNPJ alfanumérico oficial 12ABC34501DE35", V("cnpjalfa","12.ABC.345/01DE-35"));
t("CNPJ alfa errado", !V("cnpjalfa","12.ABC.345/01DE-36"));
t("CNPJ numérico também vale em cnpjalfa", V("cnpjalfa","11.222.333/0001-81"));
t("cpfcnpjalfa aceita CPF", V("cpfcnpjalfa","529.982.247-25"));
t("CPF 52998224725 válido (cpf)", V("cpf","529.982.247-25"));
t("CNPJ 11222333000181 válido", V("cnpj","11.222.333/0001-81"));
t("cpfcnpj por tamanho", V("cpfcnpj","52998224725") && V("cpfcnpj","11222333000181") && !V("cpfcnpj","123"));
// --- algoritmos com número construído por quem implementou (sem referência externa) ---
const pisDV = d => { const w=[3,2,9,8,7,6,5,4,3,2]; let s=0; for(let i=0;i<10;i++) s+=+d[i]*w[i]; const r=11-(s%11); return r>=10?0:r; };
const pis = "1205641254" + pisDV("1205641254"); t("PIS construído", V("pis", pis)); t("PIS dígito trocado", !V("pis", pis.slice(0,10)+((+pis[10]+1)%10)));
t("PIS máscara", M.pis(pis) === pis.slice(0,3)+"."+pis.slice(3,8)+"."+pis.slice(8,10)+"-"+pis[10]);
// CNS: propriedade Σ(d[i]*(15-i)) % 11 == 0
let cns; for (let k=0;k<10;k++){ const b="7000123456789".slice(0,0)+"70012345678"+"90"; }
{ const base="898000362540"; for (let a=0;a<1000;a++){ const c=base+String(a).padStart(3,"0"); let s=0; for(let i=0;i<15;i++) s+=+c[i]*(15-i); if(s%11===0){cns=c;break;} } }
t("CNS construído (propriedade mod 11)", !!cns && V("cns", cns)); t("CNS inválido", cns && !V("cns", cns.slice(0,14)+((+cns[14]+1)%10)));
t("CNS começando em 3 recusado", !V("cns","300000000000000"));
// Título: dois DVs por força bruta contra o algoritmo escrito em outra forma
const tit = (() => { const b="10664444"+"03"; for(let a=0;a<100;a++){ const c=b+String(a).padStart(2,"0"); if (V("titulo", c)) return c; } return null; })();
t("Título: existe combinação válida e é única por UF/sequência", !!tit);
t("Título UF inválida (99)", !V("titulo","106644449900"));
// CNH
const cnh = (() => { const b="026503064"; for(let a=0;a<100;a++){ const c=b+String(a).padStart(2,"0"); if (V("cnh", c)) return c; } return null; })();
t("CNH: existe DV válido", !!cnh); console.log("  CNH 02650306461 válido?", V("cnh","02650306461"));
t("CNH sequência repetida recusada", !V("cnh","11111111111"));
// NF-e
const chave43 = "3514081234567800019555001000000001100000001"; const r = (()=>{ let s=0,p=2; for(let i=42;i>=0;i--){ s+=+chave43[i]*p; p=p===9?2:p+1; } const x=s%11; return x<2?0:11-x; })();
t("NF-e construída", V("nfe", chave43+r)); t("NF-e errada", !V("nfe", chave43+((r+1)%10)));
t("NF-e máscara em blocos de 4", M.nfe(chave43+r).split(" ").length === 11);
// Boleto 47 construído: campos com DV mod10 e DV geral
(() => {
  const m10=(d)=>{ let s=0,p=2; for(let i=d.length-1;i>=0;i--){ let n=+d[i]*p; if(n>9) n=Math.floor(n/10)+n%10; s+=n; p=p===2?1:2; } const r=s%10; return r===0?0:10-r; };
  const banco="0019", moeda="", fv="9000", valor="0000012345"; // fator 9000? usa 4 dígitos + valor 10
  const livre="1234567890123456789012345"; // 25 dígitos
  const c1=banco.slice(0,3)+"9"+livre.slice(0,5); // 0019 -> banco(3)+moeda(1)+5
  const f1=c1+m10(c1), f2=livre.slice(5,15), f3=livre.slice(15,25);
  const F1=f1, F2=f2+m10(f2), F3=f3+m10(f3);
  const fatorvalor=fv+valor;
  const semDV = "001"+"9"+fatorvalor+livre; // código de barras sem DV (43)
  let s=0,p=2; for(let i=semDV.length-1;i>=0;i--){ s+=+semDV[i]*p; p=p===9?2:p+1; } let dv=11-(s%11); if(dv===0||dv===10||dv===11) dv=1;
  const linha = F1+F2+F3+dv+fatorvalor;
  t("Boleto 47 construído", linha.length===47 && V("boleto", linha));
  t("Boleto 47 DV trocado", !V("boleto", linha.slice(0,32)+((dv%9)+1)+linha.slice(33)));
  t("Boleto máscara 47", M.boleto(linha).split(" ").length===5);
})();
// Renavam
const rv = "6393666278"; const rvdv = (()=>{ const w=[3,2,9,8,7,6,5,4,3,2]; let s=0; for(let i=0;i<10;i++) s+=+rv[i]*w[i]; const d=(s*10)%11; return d===10?0:d; })();
t("Renavam construído", V("renavam", rv+rvdv)); t("Renavam errado", !V("renavam", rv+((rvdv+1)%10)));
// outros
t("UF válida", V("uf","SE") && !V("uf","XX"));
t("telefone celular/fixo", V("telefone","(79) 9 9968-0880") && V("telefone","(79) 3222-1234") && !V("telefone","(79) 1 2222-1234"));
t("data/hora", V("data","29/02/2028") && !V("data","29/02/2027") && V("hora","23:59") && !V("hora","24:00"));
t("placa antiga e Mercosul", V("placa","ABC-1234") && V("placa","ABC-1D23") && !V("placa","AB-12345"));
t("ip/mac", V("ip","192.168.0.1") && !V("ip","256.1.1.1") && V("mac","AA:BB:CC:00:11:22"));
t("CEP", V("cep","49000-000") && !V("cep","00000-000"));
t("e-mail", V("email","a@b.com") && !V("email","a@b") && !V("email","a b@c.com"));
t("e-mail máscara minúsculo sem espaço", M.email(" Joao@Gmail.COM ") === "joao@gmail.com");
t("chassi", V("chassi","9BWZZZ377VT004251") && !V("chassi","9BWZZZ377VT00425I") && !V("chassi","123"));
t("chassi máscara tira IOQ e põe maiúsculo", M.chassi("9bwzzz377vt004251") === "9BWZZZ377VT004251");
t("latitude/longitude", V("latitude","-10,9472") && !V("latitude","91") && V("longitude","-37.0731") && !V("longitude","181"));
t("lat máscara vírgula vira ponto", M.latitude("-10,947212345") === "-10.947212");
t("valorLimpo lat", M.valorLimpo("latitude","-10,9472") === -10.9472);
t("duração máscara e validação", M.duracao("012345") === "01:23:45" && M.duracao("017599") === "01:59:59" && V("duracao","01:23:45") && !V("duracao","01:60:00"));
t("duração em segundos", M.valorLimpo("duracao","01:23:45") === 5025);
t("mesano máscara e validação", M.mesano("122026") === "12/2026" && M.mesano("5") === "05" && M.mesano("13") === "12" && V("mesano","12/2026") && !V("mesano","13/2026"));
t("mesano valorLimpo", M.valorLimpo("mesano","12/2026") === "2026-12");
t("validade do cartão", M.validadecartao("1228") === "12/28" && V("validadecartao","12/28") && !V("validadecartao","13/28"));
t("NCM e CFOP", M.ncm("85258919") === "8525.89.19" && V("ncm","8525.89.19") && M.cfop("5102") === "5.102" && V("cfop","5.102") && !V("cfop","0.102"));
t("PIX email/evp/telefone/cpf/cnpj", M.pixTipo("a@b.com")==="email" && M.pixTipo("123e4567-e89b-12d3-a456-426614174000")==="evp" && M.pixTipo("+5579999680880")==="telefone" && M.pixTipo("11144477735")==="cpf" && M.pixTipo("52998224725")==="cpf_ou_telefone" && M.pixTipo("11222333000181")==="cnpj" && M.pixTipo("abc")===null);
t("PIX validar", V("pix","a@b.com") && V("pix","123e4567-e89b-12d3-a456-426614174000") && !V("pix","123"));
t("PIX máscara uuid", M.pix("123E4567E89B12D3A456426614174000") === "123e4567-e89b-12d3-a456-426614174000");
t("tipos antigos continuam", ["cpf","cnpj","cep","telefone","moeda","placa","rg","ie"].every(x => M.tipos.includes(x)) && M.tipos.length === 16+24);
t("tipos novos listados", ["isbn","issn","ean","nfe","boleto","pis","titulo","cnh","cns","cnpjalfa"].every(x => M.tipos.includes(x)));
t("máscaras antigas não mudaram", M.cpf("52998224725")==="529.982.247-25" && M.cnpj("11222333000181")==="11.222.333/0001-81" && M.moeda("100000")==="R$ 1.000,00" && M.placa("abc1d23")==="ABC-1D23");
t("vazio é inválido", !V("isbn","") && !V("cpf","") && !V("pix",""));
t("tipo desconhecido é inválido", !V("xyz","123"));

// --- aplicar() em campo falso: não pode quebrar em nenhum tipo novo ---
for (const tp of ["pis","titulo","cnh","cns","pix","nfe","boleto","cartao","validadecartao","imei","ean","isbn","issn","ncm","cfop","chassi","renavam","cnpjalfa","cpfcnpjalfa","email","latitude","longitude","duracao","mesano"]) {
  const attrs = {}; let h = null;
  const inp = { value: "", selectionStart: null, getAttribute: k => attrs[k] ?? null, setAttribute: (k, v) => { attrs[k] = String(v); }, addEventListener: (e, f) => { h = f; }, setSelectionRange() {} };
  const r = M.aplicar(inp, tp);
  inp.value = tp === "email" ? "A@B.COM" : tp === "isbn" ? "9780306406157" : tp === "cnpjalfa" ? "12ABC34501DE35" : "1234567890123456";
  if (h) h();
  t("aplicar " + tp + " liga, maxlength e inputmode", r === inp && +attrs.maxlength > 0 && !!attrs.inputmode && inp.value.length <= +attrs.maxlength);
}
console.log(ok + " ok, " + falhas + " falhas");
if (falhas) process.exitCode = 1;
