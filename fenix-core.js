/**
 * ============================================================================
 * FÊNIX CORE v4.8
 *
 * CONVENÇÃO DE NOME (DUAS CÓPIAS A CADA ENTREGA):
 * O endereço oficial é SEMPRE fenix-core.js (sem número de versão no nome nem
 * na URL): é a cópia publicada e referenciada por todos os apps. A cada nova
 * versão é entregue também uma cópia idêntica com a versão no nome (ex:
 * fenix-core-v2.1.js), usada só para controle temporal/histórico — nenhum app
 * deve apontar para ela. O mesmo vale para o index.html (Painel da biblioteca):
 * index.html (publicado) + cópia com a versão no nome (histórico). A versão
 * também é registrada aqui, no comentário de topo (ver Histórico de Versões
 * abaixo). Assim, cada app aponta para o endereço UMA vez, pra sempre, e
 * nunca mais precisa mudar.
 *
 * URL ÚNICA E CENTRALIZADA (usar sempre com barra simples):
 *   https://fenicris-dev.github.io/Fenix-Core/fenix-core.js
 *
 * Módulo central de dados compartilhados entre todos os apps Fênix
 * ============================================================================
 *
 * O QUE É:
 * Este arquivo conecta seu app a um projeto Firebase SEPARADO ("fenix-core"),
 * dedicado exclusivamente a dados que são comuns entre todos os aplicativos:
 *   - Pessoas Físicas (CPF)
 *   - Pessoas Jurídicas (CNPJ)
 *   - Produtos / Serviços / Soluções
 *   - Cidades / UF / Bairros
 *   - Autenticação, Empresas, Convites, Equipe (multiempresa)
 *   - Coleções próprias por app, isoladas por empresa (catálogo genérico)
 *
 * COMO USAR EM QUALQUER APP:
 * Este arquivo é um MÓDULO ES (usa import/export). Não funciona colado como
 * <script> comum. Em qualquer app, use um bloco <script type="module">:
 *
 *   <script type="module">
 *     import { FenixCore } from "https://fenicris-dev.github.io/Fenix-Core/fenix-core.js";
 *     FenixCore.init("nome-do-seu-app");   // uma vez só, no carregamento do app
 *     // depois use: FenixCore.pessoas.buscar(cpfOuCnpj), etc.
 *   </script>
 *
 * RECOMENDADO (Livro das Regras, regra 2): em vez do import direto, use o
 * carregador oficial do Livro das Regras, que carrega este módulo a partir de
 * uma cópia guardada no cache do aparelho e permite abrir o app sem internet:
 *
 *   window.fenixCoreReady.then(function (FenixCore) {
 *     FenixCore.init("fenix-nome-do-app");   // uma vez só, no carregamento do app
 *   });
 *
 * Não é preciso preencher credenciais: o firebaseConfig do projeto
 * "fenix-core" já está definido neste arquivo (seção 1).
 *
 * REGRA DE BACKUP (todos os apps):
 * Se o usuário ficar mais de 7 dias sem fazer backup, o app abre um alerta
 * perguntando se ele quer fazer uma cópia de segurança dos dados agora.
 * Chame uma vez, depois do boot do app:
 *   FenixCore.backup.verificarLembrete("nome-do-seu-app", {
 *     aoFazerBackup: () => minhaFuncaoQueExportaOsDados()   // exporta/baixa o JSON
 *   });
 * Quando o usuário fizer backup manualmente (botão do app), chame
 * FenixCore.backup.registrar("nome-do-seu-app") para zerar a contagem. A
 * função FenixCore.backup.baixarJSON(nomeApp, dados) já baixa o arquivo e
 * registra o backup. Na primeira abertura de um app, a contagem dos 7 dias
 * começa a partir desse dia.
 *
 * TELA "SOBRE" (todos os apps):
 * Chame uma vez no boot, ANTES do alerta de backup, informando a versão do app:
 *   const info = FenixCore.sobre.registrarAcesso("nome-do-seu-app", "v1.0");
 * Isso conta 1 acesso por abertura do app (recarregar a página não conta de
 * novo) e devolve tudo pronto para exibir:
 *   info.acessos                -> número de acessos neste aparelho
 *   info.primeiroAcessoTexto    -> "02/10/2026 14:30"
 *   info.ultimaAtualizacaoTexto -> "v1.0 instalada em 02/10/2026"
 * "Última atualização" = data em que a versão atual foi instalada NESTE
 * aparelho (muda sempre que a versão informada muda). Os números são por
 * aparelho/navegador: trocar de aparelho ou limpar os dados zera o contador.
 * Apps que já estavam em uso começam a contar no dia em que adotarem este módulo.
 *
 * REGRA DE ESCRITA DOS TEXTOS (todos os apps):
 *  - Nome de Pessoa Física e de Pessoa Jurídica (razão social e nome
 *    fantasia): sempre em MAIÚSCULAS, por completo.
 *  - Demais campos de texto (endereço, bairro, cidade, produtos, etc.):
 *    primeira letra de cada palavra em maiúscula, exceto preposições, artigos
 *    e "e" (de, da, do, das, dos, em, na, no, para, por, com, e...).
 *  - Ficam de fora da regra: e-mail (minúsculas), UF (maiúsculas), CEP,
 *    telefone, números e textos livres longos (descrição, observações).
 *  O Core já aplica isso ao salvar. Nos campos próprios do app, use
 *  FenixCore.formatarTitulo(texto) e FenixCore.formatarNomeMaiusculo(texto).
 *
 * OBSERVAÇÃO SOBRE O PADRÃO "SEM CDN EXTERNO":
 * Este módulo importa o Firebase SDK de gstatic.com (servidor do Google).
 * É uma exceção fixa do Core ao padrão "sem CDN externo": os apps que usam o
 * Core precisam de internet para carregar essa parte (o service worker do PWA
 * pode guardar uma cópia para uso offline). O restante de cada app continua
 * sem dependências externas.
 *
 * IMPORTANTE:
 * Este módulo NÃO substitui o Firebase do seu app operacional (fenix-rat,
 * fenix-frotas, etc.). Ele roda EM PARALELO. Seu app continua com seu banco
 * próprio para dados específicos (boletins, veículos, aulas...) e usa o
 * fenix-core só para os dados de cadastro comuns.
 *
 * REGRA DE OURO:
 * Nenhum app deve mais ter sua própria coleção de "pessoas" ou "clientes"
 * completa. Ele guarda apenas a referência (CPF/CNPJ) + um cache leve opcional
 * (nome, cidade) pra exibição rápida em listas, sem duplicar o cadastro.
 *
 * HISTÓRICO DE VERSÕES:
 * v1.0 — Módulo base: Pessoas (PF/PJ), Produtos/Serviços, Localidades com
 *        aprendizado orgânico de bairro.
 * v1.1 — Adicionada localidades.buscarPorCEP() via ViaCEP: CEP passa a ser a
 *        fonte primária de logradouro/bairro/cidade/UF, com criação automática
 *        de cidade sob demanda. Bairro manual vira fallback, não regra.
 * v1.2 — Adicionada pessoas.buscarNaReceita() via BrasilAPI: CNPJ passa a ser
 *        consultado automaticamente na Receita Federal (razão social, nome
 *        fantasia, situação cadastral, endereço, CNAE).
 * v1.3–v1.6 — Módulos de Auth/Empresas/Convites/Equipe/AppData/Materiais/
 *        ProdutosServicos/FamiliasMateriais/Pessoas por empresa, construídos
 *        para suportar o Fênix Ativos (multiempresa).
 * v1.7 — Reconstrução completa dos módulos acima após bug fatal de import
 *        duplicado ter quebrado o arquivo publicado; API realinhada com o
 *        uso real do Fênix Ativos.
 * v1.8 — Adicionado excluir() ao helper interno de catálogo por empresa, e
 *        exposta a função pública criarModuloCatalogoEmpresa(db, empresaId,
 *        nomeColecao, campoChave), permitindo que qualquer app crie sua
 *        própria coleção isolada por empresa sem alterar o fenix-core a cada
 *        novo app (usado pela primeira vez pelo Fênix Controle de Obras
 *        Terceirizadas). Puramente aditivo — nenhuma função existente mudou.
 * v1.9 — BUG CRÍTICO CORRIGIDO: todo o módulo de Empresas (criarEmpresa,
 *        obterEmpresaDoUsuario, repararVinculo, aceitar convite, remover
 *        membro) gravava/lia o vínculo usuário→empresa na coleção
 *        "usuariosEmpresa" (camelCase), mas o firestore.rules e os dados
 *        reais em produção usam "usuarios_empresa" (com underline). Como não
 *        existe regra nenhuma pra "usuariosEmpresa", toda leitura/escrita
 *        nela sempre falhava com permission-denied, silenciosamente — é
 *        provável que isso nunca tenha funcionado de verdade em nenhum app
 *        (Ativos incluído). Corrigido pra usar "usuarios_empresa" em todo
 *        lugar, batendo com o que já existe no banco e nas regras.
 * v2.0 — (1) Documentação do topo e exemplo de uso corrigidos: o arquivo é
 *        módulo ES (<script type="module">), a URL é única e com barra
 *        simples, e o exemplo não aponta mais para fenix-core-v1.0.js.
 *        (2) pessoas.buscarPorNome() corrigido: a busca por prefixo agora usa
 *        o campo normalizado "nomeBusca" (maiúsculas, sem acentos), gravado
 *        automaticamente por salvarFisica/salvarJuridica. Antes, a busca
 *        comparava com o termo em maiúsculas, mas o nome era salvo como
 *        digitado, então nomes como "João da Silva" nunca eram encontrados.
 *        ATENÇÃO: cadastros criados antes da v2.0 não têm "nomeBusca" e só
 *        aparecem na busca por nome depois de serem salvos novamente (a
 *        busca por CPF/CNPJ não é afetada). Puramente aditivo — nenhuma
 *        outra função mudou.
 * v2.1 — (1) Dados da Fênix expostos em FenixCore.EMPRESA (nome, CNPJ
 *        60.292.878/0001-70 e e-mail trempodofenix@gmail.com).
 *        (2) Novo módulo FenixCore.backup: alerta de backup após mais de 7
 *        dias sem cópia de segurança (verificarLembrete, registrar,
 *        diasSemBackup, baixarJSON).
 *        (3) Padronização de escrita ao salvar: nome de PF/PJ (razão social
 *        e nome fantasia) em MAIÚSCULAS; demais campos de texto com a
 *        primeira letra de cada palavra em maiúscula, exceto preposições
 *        (novas funções formatarTitulo e formatarNomeMaiusculo); e-mail em
 *        minúsculas e UF em maiúsculas. Vale para pessoas, produtos e
 *        localidades. ATENÇÃO: registros já salvos só são padronizados
 *        quando salvos novamente.
 *        (4) Correção: salvar com merge parcial (sem "nome"/"razaoSocial")
 *        não apaga mais o campo "nomeBusca".
 * v2.2 — Novo módulo FenixCore.sobre para a tela "Sobre" de todos os apps:
 *        contador de acessos (1 por abertura do app), data e hora do primeiro
 *        acesso e data de instalação da versão atual no aparelho (última
 *        atualização), com histórico das últimas 20 versões instaladas. O
 *        primeiro acesso também passa a ser o início da contagem de 7 dias do
 *        alerta de backup. Puramente aditivo — nenhuma função existente mudou.
 * v2.3 — (1) FenixCore.EMPRESA ganha "razaoSocial" ("60292 CRISTIANO
 *        RODRIGUES", como consta na Receita Federal); "nome" continua sendo o
 *        nome fantasia "Fênix Soluções Tecnológicas".
 *        (2) Correção do e-mail em FenixCore.EMPRESA.email:
 *        trampodofenix@gmail.com (a v2.1 e a v2.2 traziam "trempodofenix",
 *        com erro de digitação).
 *        (3) Texto de uso atualizado: os apps carregam o core pelo carregador
 *        oficial do Livro das Regras (regra 2), que carrega este módulo a
 *        partir de uma cópia em cache e funciona offline; o import direto da
 *        URL continua funcionando.
 *        Nenhuma função mudou.
 * v2.4 — Três módulos NOVOS, para os apps montarem sem repetir código
 *        (Livro das Regras v2.7, regras 12, 13 e 54). Puramente aditivo:
 *        nenhuma função existente foi alterada ou removida.
 *        (1) FenixCore.sobre ganha: montarTela (tela Sobre completa, com o
 *        Changelog), changelogHTML, ordenarChangelog, datasDoApp (data de
 *        criação do app e da última modificação) e baixarChangelogPDF. Cada
 *        versão do Changelog traz "criadaEm" e "modificadaEm".
 *        (2) FenixCore.manual: paraHTML, montarTela e baixarPDF. O manual do
 *        usuário é escrito em Markdown (prints em base64), consultado dentro
 *        do app e baixado em PDF.
 *        (3) FenixCore.dashboard.montar: indicadores clicáveis que expandem
 *        os registros que os formam (ver exemplo na seção 17).
 *        Os PDFs usam o jsPDF que o app já embute (window.jspdf).
 * v2.5 — Consulta de CNPJ com endereço completo (Livro das Regras v2.9,
 *        regra 35). Puramente aditivo: nenhuma função existente foi alterada.
 *        (1) FenixCore.pessoas.consultarCNPJ(cnpj): devolve Razão Social,
 *        Endereço, Número, Bairro, CEP, Cidade e UF; se a API do CNPJ trouxer
 *        só o CEP, completa pela BrasilAPI (consulta de CEP), sem o usuário
 *        redigitar.
 *        (2) FenixCore.localidades.buscarPorCEPBrasilAPI(cep): consulta de CEP
 *        pela BrasilAPI. As duas funções não usam o Firestore.
 * v3.0 — Nivelamento de versões (Livro das Regras v3.0, regras 7 e 11).
        Livro, core, templates e documentos legais passam a andar juntos, com
        o mesmo número; por isso o core salta da 2.5 para a 3.0 (exceção única,
        registrada no Histórico do livro). Nenhuma função foi alterada: o
        código é idêntico ao da v2.5.
 * v3.1 — Nivelamento com o Livro das Regras v3.1 (ícone provisório e splash
        em todos os apps, regras 17 e 32). Nenhuma função foi alterada.
 * v3.2 — (cancelada: endereço com sublinhado, Fenix_Core, que não existe.)
 * v3.3 — Endereço oficial confirmado: https://fenicris-dev.github.io/Fenix-Core/
        fenix-core.js (hífen). Nenhuma função foi alterada.
 * v3.4 — Nivelamento com o Livro das Regras v3.4 (index.html vira o Painel da
        biblioteca). Nenhuma função foi alterada.
 * v3.5 — Puramente aditivo (Livro das Regras v3.5): novo
        FenixCore.localidades.buscarPorCEPSemBanco(cep), que consulta o ViaCEP
        e devolve o endereço SEM gravar nada no Firestore (para apps com o banco
        ainda desligado). buscarPorCEP continua igual, para quem usa o banco.
 * v3.6 — Nivelamento com o Livro das Regras v3.6 (entrega também em .zip).
        Nenhuma função foi alterada.
 * v3.7 — Nivelamento com o Livro das Regras v3.7 (Guia da biblioteca e testes ao
        vivo no Painel). Nenhuma função foi alterada.
 * v3.8 — Nivelamento com o Livro das Regras v3.8 (roteiro de app antigo, regra 55,
        e firestore.rules na biblioteca). Nenhuma função foi alterada.
 * v3.9 — NOVO FenixCore.mascaras: máscaras automáticas enquanto o usuário digita
        (CPF/CNPJ no mesmo campo, CEP, telefone, moeda pelos centavos, percentual,
        data, hora, placa, IP, MAC e número), ligadas por data-mask + mascaras.auto().
        Nada foi removido nem alterado nas funções existentes.
 * v4.0 — (1) Moeda e percentual passam a seguir a regra do Cristiano: 1 dígito
        = "1"; 2 = "1,0"; 3 = "1,00"; 4 = "10,00"; 6 = "1.000,00"; começando
        com zero: "01" = "0,1" e "010" = "0,10". moedaParaNumero agora lê o
        texto mostrado (vírgula decimal). (2) Novos tipos de máscara: ie
        (inscrição estadual, com data-mask-uf; SE, BA e SP têm formato próprio),
        rg (só dígitos e X) e uf (2 letras). (3) Convites: aceitarConvite grava
        "conviteToken" no registro de membro (o firestore.rules v4.0 usa isso
        para provar o convite) e recusa convite cancelado. Só acréscimos e
        correções; nenhuma função foi removida.
 * v4.1 — Ajustes das máscaras a pedido do Cristiano: placa sempre com hífen
        depois das três letras (ABC-1D23 Mercosul e ABC-1234 antiga); RG no
        formato 00.000.000-0 (o último caractere pode ser X). valorLimpo("rg")
        devolve só números e X.
 * v4.2 — NOVO: (1) criarModuloAuth ganha entrarComGoogle(), resultadoRedirecionamento()
        e redefinirSenha(email). (2) criarModuloDadosPessoais(db, uid, nomeApp):
        dados do usuário sem empresa em dados_pessoais/{uid}/{nomeApp}/{chave}
        (salvar, carregar, excluir, listar, escutar, escutarTudo). (3)
        criarSincronia(db, opcoes): sincroniza uma tabela entre aparelhos em
        tempo real, com fila offline, exclusão e conflito por última alteração,
        no escopo pessoal ou de empresa. (4) criarModuloAppData ganha escutar().
        Só acréscimos; nenhuma função foi removida.
 * v4.3 — NOVO: (1) FenixCore.licenca: licença definitiva de uso (campo
        licenca = "definitiva" em empresas/{id}); o botão Entrar com Google só
        aparece com ela (ehDefinitiva, daEmpresa, porEmail, hashEmail, lembrar,
        lembrada, liberaGoogle, confirmarAposGoogle). (2) FenixCore.som: toque
        de abertura "Asas" (Lá, Ré, Lá), sintetizado no navegador, sem arquivo
        de áudio (tocarAbertura, ligado, definir, sintetizar). Só acréscimos;
        nenhuma função foi removida.
 * v4.4 — NOVO: (1) licenca: validade opcional (campo licencaAte, "AAAA-MM-DD"
        ou Timestamp), situacao(dados) com tipo definitiva/teste/vencida e dias
        restantes, e MENSAGEM_GOOGLE (texto único quando o Google é negado).
        (2) FenixCore.preferencias: som, animações reduzidas e tema claro/escuro/
        automático (aplicar, montarTela). (3) criarSincronia ganha
        importarLista(lista): importa registro a registro pelo caminho da
        sincronia (backup, regra 44). (4) criarConvite aceita o nome da empresa
        (5º parâmetro), para o convite não depender da leitura de empresas/{id}.
        Só acréscimos; nenhuma função foi removida.
 * v4.5 — NOVO (traz para o core oficial a linhagem v2.0-v2.4 que o Gestor do
        Tempo e o Controle de Compras carregavam embutida nos apps, regra 1):
        (1) initFirebaseComCache(config): como initFirebase, com cache offline
        do Firestore. (2) criarModuloSincronia(db, uid, nomeApp): sincronia
        pessoal por coleção em dados_pessoais/{uid}/{nomeApp}_{colecao}/{id}
        (ouvir, salvar, salvarVarios, excluir, apagarTudo, agora, relogio,
        medirRelogio). (3) criarModuloAcesso(db, colecao): cadastro com
        aprovação do administrador (obter, ouvir, solicitar, ehAdmin, listar,
        definirStatus, excluir). (4) criarModuloAuth ganha recuperarSenha
        (igual a redefinirSenha), reautenticar(senha) e excluirConta(senha).
        Só acréscimos; nenhuma função foi removida.
 * v4.6 — NOVO (selo de versões, regra 61): FenixCore.versoes. (1) core: a
        versão deste arquivo ("4.6"). (2) selo(versaoApp): texto "v3.2 | c 4.6",
        onde v = versão do app e c = versão do core em uso. (3) montarSelo(
        container, versaoApp, { coreMinimo, livro }): desenha o selo no app e,
        com internet, consulta versao.json no GitHub Pages e acrescenta um
        indicador amarelo quando existe core mais novo (ou vermelho quando o
        core em uso é menor que o mínimo exigido pelo app). (4) verificar():
        a mesma consulta, sem desenhar nada. Sem internet não mostra aviso
        nem erro. FenixCore.sobre.montarTela ganha as linhas Core e Livro e o
        selo (opções livro e coreMinimo). Só acréscimos.
 * v4.7 — Só a versão sobe (a biblioteca anda nivelada, regra 7). Nenhuma função
        foi criada, alterada ou removida; o Painel ganhou o Teste de aparelho,
        o livro ganhou o Resumo e as regras do Firestore ganharam testes.
 * v4.8 — Só a versão sobe (a biblioteca anda nivelada, regra 7). Nenhuma função
        foi criada, alterada ou removida; as regras do Firestore fecharam a
        gravação em empresas/{id}/cidades (o core grava cidades em cidades/…).
 * ============================================================================
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, query, where, orderBy, limit as fsLimit,
  serverTimestamp, onSnapshot,
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  writeBatch, getDocFromServer
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, sendPasswordResetEmail
  , EmailAuthProvider, reauthenticateWithCredential, deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ============================================================================
// 1. CONFIGURAÇÃO — credenciais do projeto Firebase "fenix-core"
// ============================================================================
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDU8pGPVrBOS75Fry9FB3H5nokw6Qk5wpA",
  authDomain: "fenix-core-19e82.firebaseapp.com",
  projectId: "fenix-core-19e82",
  storageBucket: "fenix-core-19e82.firebasestorage.app",
  messagingSenderId: "296658490141",
  appId: "1:296658490141:web:cd2ac556069ded075307f4"
};

const CPF_CNPJ_DISCLOSURE = "O CPF/CNPJ é usado apenas para emissão de Notas Fiscais e/ou Recibos.";

// Dados institucionais da Fênix (use em rodapés, documentos, contato, etc.)
const EMPRESA = Object.freeze({
  nome: "Fênix Soluções Tecnológicas",
  cnpj: "60292878000170",
  cnpjFormatado: "60.292.878/0001-70",
  razaoSocial: "60292 CRISTIANO RODRIGUES",   // como consta na Receita Federal (nome = nome fantasia)
  email: "trampodofenix@gmail.com"
});

let _db = null;
let _nomeAppChamador = "app-desconhecido"; // cada app deve se identificar no init()
const _NOME_APP_FIREBASE = "fenix-core-connection";

function _obterAppFirebase(config) {
  const existente = getApps().find(a => a.name === _NOME_APP_FIREBASE);
  if (existente) return existente;
  return initializeApp(config || firebaseConfig, _NOME_APP_FIREBASE);
}

/**
 * Inicializa a conexão com o fenix-core.
 * Chame uma vez só, no boot do app.
 * @param {string} nomeApp - identificador do app chamador, ex: "fenix-frotas", "fenix-financiamentos"
 */
function init(nomeApp) {
  _nomeAppChamador = nomeApp || _nomeAppChamador;
  const app = _obterAppFirebase(firebaseConfig);
  _db = getFirestore(app);
  return _db;
}

/**
 * Alternativa a init(): devolve {app, db} diretamente, sem depender do
 * estado interno _db. Usada por apps (como o Fênix Ativos) que também
 * precisam do objeto `app` pra montar Auth. Reaproveita a MESMA instância
 * do Firebase App que init() usaria, então os dois métodos são
 * intercambiáveis e nunca criam apps Firebase duplicados.
 * @param {object} config - opcional; usa firebaseConfig padrão se omitido
 */
function initFirebaseComCache(config) {
  const app = _obterAppFirebase(config);
  try {
    _db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (e) {
    _db = getFirestore(app);
  }
  return { app, db: _db };
}

function initFirebase(config) {
  const app = _obterAppFirebase(config);
  _db = getFirestore(app);
  return { app, db: _db };
}

function _garantirInit() {
  if (!_db) throw new Error("FenixCore não inicializado. Chame FenixCore.init('nome-do-seu-app') primeiro.");
}

// ============================================================================
// 2. HELPERS DE VALIDAÇÃO E FORMATAÇÃO (CPF / CNPJ)
// ============================================================================

function limparDocumento(valor) {
  return (valor || "").toString().replace(/\D/g, "");
}

/**
 * Normaliza um texto para busca por prefixo: maiúsculas, sem acentos e sem
 * espaços nas pontas. Ex: "  João da Silva " -> "JOAO DA SILVA".
 */
function normalizarBusca(texto) {
  return (texto || "").toString().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

// Palavras que ficam em minúsculas no meio do texto (preposições, artigos e "e")
const _PALAVRAS_MINUSCULAS = new Set([
  "a", "o", "as", "os", "e", "ou", "de", "da", "do", "das", "dos",
  "em", "na", "no", "nas", "nos", "ao", "aos", "à", "às", "para", "pra",
  "por", "pelo", "pela", "pelos", "pelas", "com", "sem", "sob", "sobre", "um", "uma"
]);

/**
 * Nome de Pessoa Física/Jurídica: sempre MAIÚSCULAS por completo.
 * Ex: "  joão da   silva " -> "JOÃO DA SILVA".
 */
function formatarNomeMaiusculo(texto) {
  return (texto || "").toString().trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR");
}

/**
 * Demais campos: primeira letra de cada palavra em maiúscula, exceto
 * preposições/artigos/"e" (que ficam em minúscula, menos na 1ª palavra).
 * Palavras com número (BR-101, 4º, 12A) são mantidas como foram digitadas.
 * Ex: "RUA DA PAZ" -> "Rua da Paz"; "centro de aracaju" -> "Centro de Aracaju".
 */
function formatarTitulo(texto) {
  const limpo = (texto || "").toString().trim().replace(/\s+/g, " ");
  if (!limpo) return "";
  return limpo.split(" ").map((palavra, i) => {
    if (/\d/.test(palavra)) return palavra;
    const baixa = palavra.toLocaleLowerCase("pt-BR");
    if (i > 0 && _PALAVRAS_MINUSCULAS.has(baixa)) return baixa;
    return baixa.split("-").map(p => p ? p.charAt(0).toLocaleUpperCase("pt-BR") + p.slice(1) : p).join("-");
  }).join(" ");
}

/** Padroniza o objeto de endereço: textos em formatarTitulo, UF em maiúsculas; CEP e número intactos. */
function _formatarEndereco(end) {
  if (!end || typeof end !== "object") return end;
  const out = { ...end };
  ["logradouro", "complemento", "bairro", "cidade"].forEach(c => {
    if (out[c] != null) out[c] = formatarTitulo(out[c]);
  });
  if (out.uf != null) out.uf = out.uf.toString().trim().toUpperCase();
  return out;
}

/**
 * Aplica a regra de escrita aos dados antes de salvar. Só mexe nos campos que
 * vieram preenchidos (não cria campos vazios, para não apagar nada num merge).
 * @param {object} dados
 * @param {string[]} camposNome - campos de nome (MAIÚSCULAS por completo)
 * @param {string[]} camposTitulo - campos de texto curto (Primeira Letra Maiúscula)
 */
function _padronizarCampos(dados, camposNome = [], camposTitulo = []) {
  const out = { ...dados };
  camposNome.forEach(c => { if (out[c] != null) out[c] = formatarNomeMaiusculo(out[c]); });
  camposTitulo.forEach(c => { if (out[c] != null) out[c] = formatarTitulo(out[c]); });
  if (out.email != null) out.email = out.email.toString().trim().toLowerCase();
  if (out.endereco) out.endereco = _formatarEndereco(out.endereco);
  return out;
}

function tipoDocumento(valor) {
  const limpo = limparDocumento(valor);
  if (limpo.length === 11) return "fisica";
  if (limpo.length === 14) return "juridica";
  return null;
}

function validarCPF(cpf) {
  cpf = limparDocumento(cpf);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.substring(10, 11));
}

function validarCNPJ(cnpj) {
  cnpj = limparDocumento(cnpj);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0, pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  tamanho++;
  numeros = cnpj.substring(0, tamanho);
  soma = 0; pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
}

function formatarCPF(cpf) {
  cpf = limparDocumento(cpf);
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarCNPJ(cnpj) {
  cnpj = limparDocumento(cnpj);
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function formatarDocumento(valor) {
  const limpo = limparDocumento(valor);
  return limpo.length === 14 ? formatarCNPJ(limpo) : formatarCPF(limpo);
}

// ============================================================================
// 3. PESSOAS (Físicas e Jurídicas) — coleção unificada por tipo de documento
// ============================================================================

const pessoas = {

  /**
   * Busca uma pessoa (física ou jurídica) pelo CPF/CNPJ.
   * Detecta o tipo automaticamente pelo tamanho do documento.
   * @returns {object|null} dados da pessoa ou null se não encontrada
   */
  async buscar(cpfOuCnpj) {
    _garantirInit();
    const doc_id = limparDocumento(cpfOuCnpj);
    const tipo = tipoDocumento(doc_id);
    if (!tipo) throw new Error("CPF/CNPJ inválido: " + cpfOuCnpj);
    const colecao = tipo === "fisica" ? "pessoas_fisicas" : "pessoas_juridicas";
    const ref = doc(_db, colecao, doc_id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, tipo, ...snap.data() };
  },

  /**
   * Salva (cria ou atualiza) uma pessoa física.
   * Grava também "nomeBusca" (nome normalizado) para a busca por prefixo.
   * @param {object} dados - { cpf, nome, telefone, email, endereco: {cep, logradouro, numero, complemento, bairro, cidade, uf} }
   */
  async salvarFisica(dados) {
    _garantirInit();
    const cpf = limparDocumento(dados.cpf);
    if (!validarCPF(cpf)) throw new Error("CPF inválido: " + dados.cpf);
    const ref = doc(_db, "pessoas_fisicas", cpf);
    const existente = await getDoc(ref);
    const padrao = _padronizarCampos(dados, ["nome"]);
    const payload = {
      ...padrao,
      cpf,
      ...(padrao.nome != null ? { nomeBusca: normalizarBusca(padrao.nome) } : {}),
      atualizadoEm: serverTimestamp(),
      atualizadoPor: _nomeAppChamador,
      ...(existente.exists() ? {} : { criadoEm: serverTimestamp(), criadoPor: _nomeAppChamador })
    };
    await setDoc(ref, payload, { merge: true });
    return { id: cpf, tipo: "fisica", ...payload };
  },

  /**
   * Busca dados oficiais de um CNPJ na Receita Federal (via BrasilAPI, gratuita, sem chave).
   * Use isso ANTES de salvarJuridica, para pré-preencher o formulário automaticamente
   * assim que o usuário digitar o CNPJ — igual ao fluxo de CEP.
   *
   * Nota: API pública com uso razoável, sem SLA garantido. Para volume alto de
   * consultas no futuro, considerar alternativa paga (ReceitaWS, CNPJá).
   *
   * @returns {object|null} { cnpj, razaoSocial, nomeFantasia, situacaoCadastral,
   *   dataAbertura, cnaePrincipal, telefone, email,
   *   endereco: {cep, logradouro, numero, complemento, bairro, cidade, uf}, origem: 'receita' }
   */
  async buscarNaReceita(cnpj) {
    const cnpjLimpo = limparDocumento(cnpj);
    if (!validarCNPJ(cnpjLimpo)) throw new Error("CNPJ inválido: " + cnpj);

    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
    if (!resp.ok) return null; // CNPJ não encontrado ou API indisponível
    const dados = await resp.json();

    return {
      cnpj: cnpjLimpo,
      razaoSocial: dados.razao_social || "",
      nomeFantasia: dados.nome_fantasia || "",
      situacaoCadastral: dados.descricao_situacao_cadastral || "",
      dataAbertura: dados.data_inicio_atividade || "",
      cnaePrincipal: dados.cnae_fiscal_descricao || "",
      telefone: dados.ddd_telefone_1 || "",
      email: dados.email || "",
      endereco: {
        cep: dados.cep || "",
        logradouro: `${dados.descricao_tipo_de_logradouro || ""} ${dados.logradouro || ""}`.trim(),
        numero: dados.numero || "",
        complemento: dados.complemento || "",
        bairro: dados.bairro || "",
        cidade: dados.municipio || "",
        uf: dados.uf || ""
      },
      origem: "receita"
    };
  },

  /**
   * Salva (cria ou atualiza) uma pessoa jurídica.
   * Grava também "nomeBusca" (razão social normalizada) para a busca por prefixo.
   * @param {object} dados - { cnpj, razaoSocial, nomeFantasia, telefone, email, endereco: {...} }
   */
  async salvarJuridica(dados) {
    _garantirInit();
    const cnpj = limparDocumento(dados.cnpj);
    if (!validarCNPJ(cnpj)) throw new Error("CNPJ inválido: " + dados.cnpj);
    const ref = doc(_db, "pessoas_juridicas", cnpj);
    const existente = await getDoc(ref);
    const padrao = _padronizarCampos(dados, ["razaoSocial", "nomeFantasia"], ["situacaoCadastral", "cnaePrincipal"]);
    const payload = {
      ...padrao,
      cnpj,
      ...(padrao.razaoSocial != null ? { nomeBusca: normalizarBusca(padrao.razaoSocial) } : {}),
      atualizadoEm: serverTimestamp(),
      atualizadoPor: _nomeAppChamador,
      ...(existente.exists() ? {} : { criadoEm: serverTimestamp(), criadoPor: _nomeAppChamador })
    };
    await setDoc(ref, payload, { merge: true });
    return { id: cnpj, tipo: "juridica", ...payload };
  },

  /**
   * Salva automaticamente detectando o tipo pelo tamanho do documento.
   */
  async salvar(dados) {
    const doc_id = limparDocumento(dados.cpf || dados.cnpj);
    const tipo = tipoDocumento(doc_id);
    if (tipo === "fisica") return pessoas.salvarFisica({ ...dados, cpf: doc_id });
    if (tipo === "juridica") return pessoas.salvarJuridica({ ...dados, cnpj: doc_id });
    throw new Error("Não foi possível determinar se é CPF ou CNPJ: " + doc_id);
  },

  /**
   * Busca por nome (prefixo, ignorando maiúsculas/minúsculas e acentos).
   * Usa o campo normalizado "nomeBusca", gravado por salvarFisica/salvarJuridica.
   * Cadastros anteriores à v2.0 só aparecem aqui depois de salvos novamente.
   * Para bases grandes, considerar Algolia/Typesense futuramente.
   */
  async buscarPorNome(termo, tipo = "fisica", max = 10) {
    _garantirInit();
    const colecao = tipo === "fisica" ? "pessoas_fisicas" : "pessoas_juridicas";
    const termoNorm = normalizarBusca(termo);
    if (!termoNorm) return [];
    const q = query(
      collection(_db, colecao),
      orderBy("nomeBusca"),
      where("nomeBusca", ">=", termoNorm),
      where("nomeBusca", "<=", termoNorm + "\uf8ff"),
      fsLimit(max)
    );
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, tipo, ...d.data() }));
  },

  disclosure: CPF_CNPJ_DISCLOSURE
};

// ============================================================================
// 4. PRODUTOS / SERVIÇOS / SOLUÇÕES — catálogo comum entre apps
// ============================================================================

const produtos = {

  /**
   * @param {object} dados - { nome, tipo: 'produto'|'servico'|'solucao', categoria, descricao, precoBase, unidade, ativo }
   * Se dados.id vier preenchido, atualiza; senão, cria novo com ID automático.
   */
  async salvar(dados) {
    _garantirInit();
    const id = dados.id || doc(collection(_db, "produtos_servicos")).id;
    const ref = doc(_db, "produtos_servicos", id);
    const existente = await getDoc(ref);
    const payload = {
      ...dados,
      ...(dados.nome != null ? { nome: formatarTitulo(dados.nome) } : {}),
      ...(dados.categoria != null ? { categoria: formatarTitulo(dados.categoria) } : {}),
      id,
      ativo: dados.ativo !== undefined ? dados.ativo : true,
      atualizadoEm: serverTimestamp(),
      atualizadoPor: _nomeAppChamador,
      ...(existente.exists() ? {} : { criadoEm: serverTimestamp(), criadoPor: _nomeAppChamador })
    };
    await setDoc(ref, payload, { merge: true });
    return payload;
  },

  async buscar(id) {
    _garantirInit();
    const snap = await getDoc(doc(_db, "produtos_servicos", id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  /**
   * Lista produtos/serviços, opcionalmente filtrando por tipo e só ativos.
   */
  async listar({ tipo = null, apenasAtivos = true } = {}) {
    _garantirInit();
    const clausulas = [];
    if (tipo) clausulas.push(where("tipo", "==", tipo));
    if (apenasAtivos) clausulas.push(where("ativo", "==", true));
    const q = query(collection(_db, "produtos_servicos"), ...clausulas);
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async excluir(id) {
    _garantirInit();
    await deleteDoc(doc(_db, "produtos_servicos", id));
  }
};

// ============================================================================
// 5. LOCALIDADES — Cidades/UF (base fixa) + Bairros (aprendizado orgânico)
// ============================================================================

const localidades = {

  /**
   * Busca endereço completo a partir do CEP, usando ViaCEP (base oficial dos Correios).
   * Esta é a fonte PRIMÁRIA de bairro/cidade/UF — sempre prefira isso ao preenchimento manual.
   *
   * Também garante que a cidade exista em `cidades/{codigoIBGE}` (cria automaticamente
   * na primeira vez que aparece) e registra o bairro retornado, se houver.
   *
   * @returns {object|null} { cep, logradouro, bairro, cidade, uf, codigoIBGE, origem: 'cep' }
   *          bairro/logradouro podem vir vazios em cidades pequenas com CEP único —
   *          nesse caso, o app deve liberar o campo de bairro para digitação manual
   *          (use localidades.registrarBairro para gravar o valor digitado).
   */
  async buscarPorCEP(cep) {
    const cepLimpo = limparDocumento(cep);
    if (cepLimpo.length !== 8) throw new Error("CEP inválido: " + cep);

    const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const dados = await resp.json();
    if (dados.erro) return null;

    const resultado = {
      cep: cepLimpo,
      logradouro: formatarTitulo(dados.logradouro),
      bairro: formatarTitulo(dados.bairro),
      cidade: formatarTitulo(dados.localidade),
      uf: (dados.uf || "").toString().trim().toUpperCase(),
      codigoIBGE: dados.ibge || null,
      origem: "cep"
    };

    // Garante que a cidade exista na base local (criação automática sob demanda)
    if (resultado.codigoIBGE) {
      _garantirInit();
      const refCidade = doc(_db, "cidades", resultado.codigoIBGE);
      const existeCidade = await getDoc(refCidade);
      if (!existeCidade.exists()) {
        await setDoc(refCidade, {
          nome: resultado.cidade,
          uf: resultado.uf,
          criadoEm: serverTimestamp(),
          criadoPor: _nomeAppChamador,
          origem: "viacep"
        });
      }
      // Se o CEP já trouxe o bairro, registra como oficial (fonte CEP), sem precisar
      // esperar preenchimento manual do usuário.
      if (resultado.bairro) {
        await localidades.registrarBairro(resultado.codigoIBGE, resultado.bairro, "cep");
      }
    }

    return resultado;
  },

  /**
   * Busca cidades por UF (para popular <select>).
   * Populada automaticamente conforme os CEPs vão sendo consultados (buscarPorCEP),
   * sem necessidade de import antecipado.
   */
  async buscarCidadesPorUF(uf) {
    _garantirInit();
    const q = query(collection(_db, "cidades"), where("uf", "==", uf.toUpperCase()), orderBy("nome"));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  /**
   * Busca bairros já conhecidos de uma cidade (autocomplete).
   * @param {string} codigoIBGE - id do documento da cidade
   */
  async buscarBairros(codigoIBGE) {
    _garantirInit();
    const snaps = await getDocs(collection(_db, "cidades", codigoIBGE, "bairros"));
    return snaps.docs.map(d => d.id.replace(/-/g, " "));
  },

  /**
   * Registra um bairro novo para uma cidade, se ainda não existir.
   *
   * Chame isso em dois cenários:
   *  1) origem='cep' — automaticamente, dentro de buscarPorCEP (já acontece sozinho).
   *  2) origem='manual' — quando o usuário digita o bairro à mão, porque o CEP
   *     dele não retornou bairro (ex: cidade pequena com CEP único).
   *
   * Bairros com origem='cep' são confiáveis (base oficial dos Correios).
   * Bairros com origem='manual' são aprendizado orgânico — úteis para autocomplete,
   * mas não têm garantia de exatidão oficial.
   */
  async registrarBairro(codigoIBGE, nomeBairro, origem = "manual") {
    _garantirInit();
    if (!codigoIBGE || !nomeBairro) return;
    const slug = nomeBairro.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
    const ref = doc(_db, "cidades", codigoIBGE, "bairros", slug);
    const existente = await getDoc(ref);
    if (!existente.exists()) {
      await setDoc(ref, {
        nomeOriginal: formatarTitulo(nomeBairro),
        origem, // 'cep' (oficial) ou 'manual' (aprendizado orgânico)
        criadoEm: serverTimestamp(),
        criadoPor: _nomeAppChamador
      });
    }
  }
};

// ============================================================================
// 6. AUTENTICAÇÃO (e-mail/senha) — usada por apps multiempresa como o Fênix Ativos
// ============================================================================
/**
 * @param {object} app - o objeto `app` retornado por initFirebase()
 */
function criarModuloAuth(app) {
  const auth = getAuth(app);
  return {
    aoMudarEstado(callback) {
      return onAuthStateChanged(auth, callback);
    },
    entrar(email, senha) {
      return signInWithEmailAndPassword(auth, email, senha).then(cred => cred.user);
    },
    criarConta(email, senha) {
      return createUserWithEmailAndPassword(auth, email, senha).then(cred => cred.user);
    },
    sair() {
      return signOut(auth);
    },
    /**
     * Entrar com Google. Abre a janela do Google; se o navegador bloquear a
     * janela (comum em PWA no celular), cai sozinho para o redirecionamento e
     * devolve null: ao voltar, chame resultadoRedirecionamento(). Para forçar
     * o redirecionamento: entrarComGoogle({ redirecionar: true }).
     * O endereço do app (ex.: fenicris-dev.github.io) precisa estar em
     * Firebase > Authentication > Configurações > Domínios autorizados.
     */
    entrarComGoogle(opcoes) {
      const provedor = new GoogleAuthProvider();
      provedor.setCustomParameters({ prompt: "select_account" });
      if (opcoes && opcoes.redirecionar) return signInWithRedirect(auth, provedor).then(() => null);
      return signInWithPopup(auth, provedor).then(cred => cred.user).catch(e => {
        if (e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) {
          return signInWithRedirect(auth, provedor).then(() => null);
        }
        throw e;
      });
    },
    /** Chame ao abrir o app: devolve o usuário se ele acabou de voltar do redirecionamento do Google, ou null. */
    resultadoRedirecionamento() {
      return getRedirectResult(auth).then(cred => (cred ? cred.user : null));
    },
    /** Envia o e-mail de redefinição de senha. */
    redefinirSenha(email) {
      return sendPasswordResetEmail(auth, email).then(() => true);
    },
    /** Igual a redefinirSenha (nome usado pelos apps da linhagem v2.x). */
    recuperarSenha(email) {
      return sendPasswordResetEmail(auth, email);
    },
    /** Confirma a senha do usuário logado (útil antes de ações sensíveis). */
    async reautenticar(senha) {
      const u = auth.currentUser;
      if (!u) throw new Error("Nenhum usuário logado.");
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, senha));
      return true;
    },
    /** Apaga a conta do usuário logado (pede a senha para confirmar). */
    async excluirConta(senha) {
      const u = auth.currentUser;
      if (!u) throw new Error("Nenhum usuário logado.");
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, senha));
      return deleteUser(u);
    },
    usuarioAtual() {
      return auth.currentUser;
    }
  };
}

// ============================================================================
// 7. EMPRESAS — cadastro multiempresa e vínculo usuário↔empresa
// ============================================================================
/**
 * Estrutura no Firestore:
 *   empresas/{empresaId}                -> {nome, donoUid, donoEmail, criadoEm}
 *   empresas/{empresaId}/membros/{uid}  -> {email, papel, status, criadoEm}
 *   usuarios_empresa/{uid}                -> {empresaId, papel, status}  (índice rápido pra achar a empresa de um usuário)
 * @param {object} db - o objeto `db` retornado por initFirebase()
 */
function criarModuloEmpresas(db) {
  return {
    criarEmpresa(uid, email, nome) {
      const ref = doc(collection(db, "empresas"));
      const empresa = { nome, donoUid: uid, donoEmail: email, criadoEm: serverTimestamp() };
      return setDoc(ref, empresa).then(() =>
        setDoc(doc(db, "empresas", ref.id, "membros", uid), { email, papel: "dono", status: "aprovado", criadoEm: serverTimestamp() })
      ).then(() =>
        setDoc(doc(db, "usuarios_empresa", uid), { empresaId: ref.id, papel: "dono", status: "aprovado" })
      ).then(() => ({ id: ref.id, nome }));
    },
    obterEmpresa(empresaId) {
      return getDoc(doc(db, "empresas", empresaId)).then(snap => snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    obterEmpresaDoUsuario(uid) {
      return getDoc(doc(db, "usuarios_empresa", uid)).then(snap => snap.exists() ? snap.data() : null);
    },
    repararVinculo(uid, dadosParciais) {
      return updateDoc(doc(db, "usuarios_empresa", uid), dadosParciais);
    }
  };
}

// ============================================================================
// 8. CONVITES — convidar técnicos/membros pra uma empresa por link/token
// ============================================================================
/**
 * @param {object} db
 * @param {string} baseUrl - URL base do app (sem query string) usada pra montar o link do convite
 */
function criarModuloConvites(db, baseUrl) {
  function gerarToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  return {
    criarConvite(empresaId, criadorUid, criadorEmail, destinatario, nomeEmpresa) {
      const token = gerarToken();
      const convite = {
        empresaId, criadoPorUid: criadorUid, criadoPor: criadorEmail,
        destinatario: destinatario || null, empresaNome: nomeEmpresa || null, usado: false, cancelado: false, criadoEm: serverTimestamp()
      };
      return setDoc(doc(db, "convites", token), convite).then(() => ({ token, link: baseUrl + "?convite=" + token }));
    },
    obterConvite(token) {
      return getDoc(doc(db, "convites", token)).then(snap => snap.exists() ? { token, ...snap.data() } : null);
    },
    aceitarConvite(token, uid, email) {
      const refConvite = doc(db, "convites", token);
      return getDoc(refConvite).then(snap => {
        if (!snap.exists()) throw new Error("Convite não encontrado.");
        const convite = snap.data();
        if (convite.usado) throw new Error("Este convite já foi utilizado.");
        if (convite.cancelado) throw new Error("Este convite foi cancelado.");
        return setDoc(doc(db, "empresas", convite.empresaId, "membros", uid), { email, papel: "tecnico", status: "aprovado", conviteToken: token, criadoEm: serverTimestamp() })
          .then(() => setDoc(doc(db, "usuarios_empresa", uid), { empresaId: convite.empresaId, papel: "tecnico", status: "aprovado" }))
          .then(() => updateDoc(refConvite, { usado: true, usadoPorUid: uid, usadoEm: serverTimestamp() }))
          .then(() => getDoc(doc(db, "empresas", convite.empresaId)))
          .then(empSnap => ({ id: empSnap.id, ...empSnap.data() }));
      });
    },
    listarConvitesPendentes(empresaId) {
      return getDocs(query(collection(db, "convites"), where("empresaId", "==", empresaId), where("usado", "==", false)))
        .then(snap => snap.docs.filter(d => !d.data().cancelado).map(d => ({ token: d.id, ...d.data() })));
    },
    cancelarConvite(token) {
      return updateDoc(doc(db, "convites", token), { cancelado: true });
    }
  };
}

// ============================================================================
// 9. EQUIPE — membros de uma empresa
// ============================================================================
function criarModuloEquipe(db) {
  return {
    listarMembros(empresaId) {
      return getDocs(collection(db, "empresas", empresaId, "membros"))
        .then(snap => snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    },
    removerMembro(empresaId, uidAlvo) {
      return deleteDoc(doc(db, "empresas", empresaId, "membros", uidAlvo))
        .then(() => deleteDoc(doc(db, "usuarios_empresa", uidAlvo)).catch(() => {}));
    }
  };
}

// ============================================================================
// 10. APPDATA — mirror genérico de "tabelas" locais de um app, por empresa
// ============================================================================
/**
 * Guarda arrays inteiros (localStorage-like) na nuvem, um documento por
 * chave. Usado pelo Fênix Ativos pra sincronizar solucoes/ativos/kits/etc.
 * sem precisar de um schema próprio no fenix-core pra cada app.
 * @param {object} db
 * @param {string} empresaId
 * @param {string} nomeApp - namespace do app chamador (evita colisão entre apps na mesma empresa)
 */
function criarModuloAppData(db, empresaId, nomeApp) {
  return {
    salvar(chave, arr) {
      return setDoc(doc(db, "empresas", empresaId, "appData", nomeApp + "_" + chave), {
        dados: arr, atualizadoEm: serverTimestamp()
      }).then(() => true).catch(() => false);
    },
    carregar(chave) {
      return getDoc(doc(db, "empresas", empresaId, "appData", nomeApp + "_" + chave))
        .then(snap => snap.exists() ? (snap.data().dados || []) : null);
    },
    /** Tempo real: chama aoMudar(dados) a cada alteração (de qualquer aparelho). Devolve a função que para de escutar. */
    escutar(chave, aoMudar, aoErro) {
      return onSnapshot(doc(db, "empresas", empresaId, "appData", nomeApp + "_" + chave),
        snap => aoMudar(snap.exists() ? (snap.data().dados || []) : null), aoErro || function () {});
    }
  };
}

// ============================================================================
// 11. CATÁLOGOS POR EMPRESA — materiais, produtos/serviços, famílias de material
// ============================================================================
/** Helper genérico: coleção de catálogo dentro de uma empresa, "salvar" faz upsert pela chave informada. */
function _criarModuloCatalogoEmpresa(db, empresaId, nomeColecao, campoChave) {
  return {
    listar() {
      return getDocs(collection(db, "empresas", empresaId, nomeColecao))
        .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })));
    },
    salvar(obj) {
      const chave = obj[campoChave] || obj.id;
      if (!chave) return Promise.reject(new Error(nomeColecao + ": faltou o campo '" + campoChave + "' pra identificar o registro."));
      return setDoc(doc(db, "empresas", empresaId, nomeColecao, String(chave)), {
        ...obj, atualizadoEm: serverTimestamp()
      }, { merge: true }).then(() => true);
    },
    excluir(chave) {
      if (!chave) return Promise.reject(new Error(nomeColecao + ": faltou a chave pra excluir o registro."));
      return deleteDoc(doc(db, "empresas", empresaId, nomeColecao, String(chave)));
    }
  };
}
/**
 * Versão pública do helper acima — permite que QUALQUER app crie sua própria
 * coleção isolada dentro da empresa (empresas/{empresaId}/{nomeColecao}),
 * sem precisar que o fenix-core conheça o schema daquele app.
 * Ex: FenixCore.criarModuloCatalogoEmpresa(db, empresaId, "obras_terceirizadas", "id")
 * @param {object} db
 * @param {string} empresaId
 * @param {string} nomeColecao - nome livre, escolhido pelo app chamador
 * @param {string} campoChave - campo do objeto usado como ID do documento (default "id")
 */
function criarModuloCatalogoEmpresa(db, empresaId, nomeColecao, campoChave) {
  return _criarModuloCatalogoEmpresa(db, empresaId, nomeColecao, campoChave || "id");
}
function criarModuloMateriais(db, empresaId) {
  return _criarModuloCatalogoEmpresa(db, empresaId, "materiais", "codigoFabricante");
}
function criarModuloProdutosServicos(db, empresaId) {
  return _criarModuloCatalogoEmpresa(db, empresaId, "produtos_servicos", "id");
}
function criarModuloFamiliasMateriais(db, empresaId) {
  return _criarModuloCatalogoEmpresa(db, empresaId, "familias_materiais", "id");
}

// ============================================================================
// 12. PESSOAS POR EMPRESA — clientes de um app específico (distinto do
//     cadastro nacional de CPF/CNPJ compartilhado em `pessoas`, acima)
// ============================================================================
function criarModuloPessoas(db, empresaId) {
  return {
    listar() {
      return getDocs(collection(db, "empresas", empresaId, "pessoas"))
        .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })));
    },
    salvar(obj) {
      if (!obj.id) return Promise.reject(new Error("pessoas: registro sem id."));
      return setDoc(doc(db, "empresas", empresaId, "pessoas", obj.id), {
        ...obj, atualizadoEm: serverTimestamp()
      }, { merge: true }).then(() => true);
    },
    arquivar(obj, arquivado) {
      if (!obj.id) return Promise.reject(new Error("pessoas: registro sem id."));
      return updateDoc(doc(db, "empresas", empresaId, "pessoas", obj.id), { arquivado: !!arquivado });
    },
    excluir(obj) {
      if (!obj.id) return Promise.reject(new Error("pessoas: registro sem id."));
      return deleteDoc(doc(db, "empresas", empresaId, "pessoas", obj.id));
    }
  };
}

// ============================================================================
// 13. BACKUP — alerta quando o usuário passa mais de 7 dias sem cópia de segurança
// ============================================================================
/**
 * O Core cuida do lembrete e da contagem de dias; quem sabe exportar os dados
 * é o próprio app (aoFazerBackup). A data do último backup fica no
 * localStorage do aparelho, separada por app.
 */
const _BACKUP_ULTIMO = "fenix_backup_ultimo__";
const _BACKUP_INICIO = "fenix_backup_inicio__";
const _BACKUP_ADIADO = "fenix_backup_adiado__";
const _MS_DIA = 24 * 60 * 60 * 1000;

function _lerData(chave) {
  try {
    const v = localStorage.getItem(chave);
    const d = v ? new Date(v) : null;
    return d && !isNaN(d.getTime()) ? d : null;
  } catch (e) { return null; }
}

function _perguntarBackup(nomeApp, dias) {
  return new Promise(resolve => {
    const fundo = document.createElement("div");
    fundo.setAttribute("role", "dialog");
    fundo.setAttribute("aria-modal", "true");
    fundo.style.cssText = "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,7,51,.6);font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;";
    const caixa = document.createElement("div");
    caixa.style.cssText = "background:#fff;color:#000;max-width:400px;width:100%;border-radius:14px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.35);";
    const topo = document.createElement("div");
    topo.style.cssText = "background:linear-gradient(135deg,#040798,#0076CE);color:#fff;padding:14px 18px;font-weight:700;font-size:16px;";
    topo.textContent = "Cópia de segurança";
    const corpo = document.createElement("div");
    corpo.style.cssText = "padding:18px;font-size:15px;line-height:1.45;";
    corpo.textContent = "Faz " + dias + " dias que você não faz uma cópia de segurança dos seus dados. Deseja fazer agora?";
    const botoes = document.createElement("div");
    botoes.style.cssText = "display:flex;gap:10px;padding:0 18px 18px;justify-content:flex-end;flex-wrap:wrap;";
    const btnNao = document.createElement("button");
    btnNao.type = "button";
    btnNao.textContent = "Agora não";
    btnNao.style.cssText = "padding:10px 16px;border-radius:8px;border:1px solid #0076CE;background:#fff;color:#0076CE;font-size:15px;cursor:pointer;";
    const btnSim = document.createElement("button");
    btnSim.type = "button";
    btnSim.textContent = "Fazer backup agora";
    btnSim.style.cssText = "padding:10px 16px;border-radius:8px;border:0;background:#0076CE;color:#fff;font-size:15px;font-weight:600;cursor:pointer;";
    function fechar(resposta) {
      document.removeEventListener("keydown", aoTeclar);
      fundo.remove();
      resolve(resposta);
    }
    function aoTeclar(ev) { if (ev.key === "Escape") fechar(false); }
    btnNao.addEventListener("click", () => fechar(false));
    btnSim.addEventListener("click", () => fechar(true));
    document.addEventListener("keydown", aoTeclar);
    botoes.append(btnNao, btnSim);
    caixa.append(topo, corpo, botoes);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);
    btnSim.focus();
  });
}

const backup = {
  DIAS_PADRAO: 7,

  /** Data do último backup registrado (Date) ou null. */
  ultimo(nomeApp) {
    return _lerData(_BACKUP_ULTIMO + nomeApp);
  },

  /** Marca que um backup acabou de ser feito (zera a contagem). */
  registrar(nomeApp) {
    try { localStorage.setItem(_BACKUP_ULTIMO + nomeApp, new Date().toISOString()); } catch (e) { /* sem storage */ }
  },

  /** Dias inteiros desde o último backup (ou desde a 1ª abertura, se nunca fez). null se não der para saber. */
  diasSemBackup(nomeApp) {
    const ref = backup.ultimo(nomeApp) || _lerData(_BACKUP_INICIO + nomeApp);
    return ref ? Math.floor((Date.now() - ref.getTime()) / _MS_DIA) : null;
  },

  /**
   * Baixa um arquivo JSON com os dados e registra o backup.
   * Nome do arquivo: {nomeApp}-backup-AAAA-MM-DD.json
   */
  baixarJSON(nomeApp, dados) {
    const hoje = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeApp + "-backup-" + hoje + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    backup.registrar(nomeApp);
  },

  /**
   * Chame uma vez depois do boot do app. Se passou MAIS de `dias` dias sem
   * backup, abre o alerta. "Fazer backup agora" chama aoFazerBackup e, se não
   * der erro (e não retornar false), registra o backup. "Agora não" não
   * pergunta de novo até a próxima abertura do app.
   * @param {string} nomeApp
   * @param {object} opcoes - { dias = 7, aoFazerBackup: async () => {...}, aoRecusar }
   * @returns {Promise<"nao-necessario"|"adiado"|"feito"|"erro">}
   */
  async verificarLembrete(nomeApp, opcoes = {}) {
    const { dias = backup.DIAS_PADRAO, aoFazerBackup, aoRecusar } = opcoes;
    if (typeof aoFazerBackup !== "function") {
      throw new Error("backup.verificarLembrete: informe a função aoFazerBackup.");
    }
    // Primeira abertura: a contagem dos dias começa hoje.
    let inicio = _lerData(_BACKUP_INICIO + nomeApp);
    if (!inicio) {
      try { localStorage.setItem(_BACKUP_INICIO + nomeApp, new Date().toISOString()); } catch (e) { /* sem storage */ }
      inicio = new Date();
    }
    const referencia = backup.ultimo(nomeApp) || inicio;
    if (Date.now() - referencia.getTime() <= dias * _MS_DIA) return "nao-necessario";

    try {
      if (sessionStorage.getItem(_BACKUP_ADIADO + nomeApp)) return "adiado";
    } catch (e) { /* sem sessionStorage */ }

    const quer = await _perguntarBackup(nomeApp, backup.diasSemBackup(nomeApp));
    if (!quer) {
      try { sessionStorage.setItem(_BACKUP_ADIADO + nomeApp, "1"); } catch (e) { /* sem sessionStorage */ }
      if (typeof aoRecusar === "function") aoRecusar();
      return "adiado";
    }
    try {
      const resultado = await aoFazerBackup();
      if (resultado !== false) backup.registrar(nomeApp);
      return "feito";
    } catch (e) {
      console.error("FenixCore.backup: falha ao fazer o backup:", e);
      return "erro";
    }
  }
};

// ============================================================================
// 14. SOBRE — contador de acessos e datas do app neste aparelho
// ============================================================================
/**
 * Tudo fica no localStorage do aparelho, separado por app. Não envia nada
 * para fora do aparelho.
 */
const _SOBRE_DADOS = "fenix_sobre__";
const _SOBRE_SESSAO = "fenix_sobre_sessao__";

function _lerSobre(nomeApp) {
  try {
    const bruto = localStorage.getItem(_SOBRE_DADOS + nomeApp);
    const obj = bruto ? JSON.parse(bruto) : null;
    return obj && typeof obj === "object" && obj.primeiroAcesso ? obj : null;
  } catch (e) { return null; }
}

function _montarSobre(d) {
  const dataCurta = sobre.formatarData(d.instaladaEm, false);
  return {
    acessos: d.acessos || 0,
    primeiroAcesso: d.primeiroAcesso,
    primeiroAcessoTexto: sobre.formatarData(d.primeiroAcesso),
    versao: d.versao || null,
    instaladaEm: d.instaladaEm,
    instaladaEmTexto: sobre.formatarData(d.instaladaEm),
    ultimaAtualizacaoTexto: (d.versao ? d.versao + " instalada em " : "Instalada em ") + dataCurta,
    historico: d.historico || []
  };
}

const sobre = {
  /**
   * Formata uma data ISO como "02/10/2026 14:30" (ou só "02/10/2026" se comHora = false).
   * Usa o fuso do aparelho. Retorna "" se a data for inválida.
   */
  formatarData(iso, comHora = true) {
    const d = iso ? new Date(iso) : null;
    if (!d || isNaN(d.getTime())) return "";
    const dois = n => String(n).padStart(2, "0");
    const data = dois(d.getDate()) + "/" + dois(d.getMonth() + 1) + "/" + d.getFullYear();
    return comHora ? data + " " + dois(d.getHours()) + ":" + dois(d.getMinutes()) : data;
  },

  /**
   * Registra a abertura do app. Chame uma vez no boot.
   * - Conta 1 acesso por sessão (recarregar a página não conta de novo).
   * - Guarda data/hora do primeiro acesso neste aparelho.
   * - Se a versão informada mudou, guarda a data da instalação da nova versão.
   * @param {string} nomeApp - mesmo identificador usado em init()/backup
   * @param {string} versao - versão atual do app, ex: "v1.0"
   * @returns {object} { acessos, primeiroAcesso, primeiroAcessoTexto, versao,
   *   instaladaEm, instaladaEmTexto, ultimaAtualizacaoTexto, historico }
   */
  registrarAcesso(nomeApp, versao) {
    const agora = new Date().toISOString();
    let dados = _lerSobre(nomeApp);
    if (!dados) {
      dados = { acessos: 0, primeiroAcesso: agora, versao: versao || null, instaladaEm: agora, historico: versao ? [{ versao, em: agora }] : [] };
      // A contagem dos 7 dias do alerta de backup parte do primeiro acesso.
      try {
        if (!localStorage.getItem(_BACKUP_INICIO + nomeApp)) localStorage.setItem(_BACKUP_INICIO + nomeApp, agora);
      } catch (e) { /* sem storage */ }
    } else if (versao && dados.versao !== versao) {
      dados.versao = versao;
      dados.instaladaEm = agora;
      dados.historico = [...(dados.historico || []), { versao, em: agora }].slice(-20);
    }
    let novaSessao = true;
    try {
      if (sessionStorage.getItem(_SOBRE_SESSAO + nomeApp)) novaSessao = false;
      else sessionStorage.setItem(_SOBRE_SESSAO + nomeApp, "1");
    } catch (e) { /* sem sessionStorage: conta como nova sessão */ }
    if (novaSessao) dados.acessos = (dados.acessos || 0) + 1;
    try { localStorage.setItem(_SOBRE_DADOS + nomeApp, JSON.stringify(dados)); } catch (e) { /* sem storage */ }
    return _montarSobre(dados);
  },

  /** Lê os dados atuais sem contar acesso. Retorna null se o app nunca registrou acesso. */
  obter(nomeApp) {
    const dados = _lerSobre(nomeApp);
    return dados ? _montarSobre(dados) : null;
  }
};

// ============================================================================
// 15. SOBRE (TELA E CHANGELOG) — acrescenta métodos ao módulo FenixCore.sobre
// ============================================================================
/**
 * Nada aqui altera o que já existia em FenixCore.sobre (registrarAcesso,
 * obter, formatarData): são métodos NOVOS, só para montar a tela Sobre com o
 * Changelog (Livro das Regras, regras 12 e 13).
 *
 * Formato do changelog (lista; a ordem não importa, é reordenada da versão
 * mais nova para a mais antiga):
 *   [
 *     { versao: "1.1", criadaEm: "2026-10-02", modificadaEm: "2026-10-05",
 *       mudancas: ["Novo filtro por data", "Correção no total"] },
 *     { versao: "1.0", criadaEm: "2026-09-20", mudancas: ["Primeira versão"] }
 *   ]
 * "modificadaEm" é opcional: se faltar, vale a mesma data de "criadaEm".
 * Datas no formato aaaa-mm-dd (ou ISO completo); são exibidas como dd/mm/aaaa.
 */

// ---- utilidades internas compartilhadas (sobre, manual, dashboard) --------

function _esc(valor) {
  return String(valor == null ? "" : valor).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function _semV(versao) {
  return String(versao == null ? "" : versao).trim().replace(/^v/i, "");
}

/** Compara "1.10" e "1.9" número a número. Retorna > 0 se a for mais nova que b. */
function _compararVersoes(a, b) {
  const pa = _semV(a).split(".").map(n => parseInt(n, 10) || 0);
  const pb = _semV(b).split(".").map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff) return diff;
  }
  return 0;
}

/** "2026-10-05" (ou ISO completo) -> "05/10/2026". Retorna "" se inválida. */
function _dataBR(valor) {
  if (!valor) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor));
  if (m) return m[3] + "/" + m[2] + "/" + m[1];   // sem passar por Date: evita erro de fuso
  return sobre.formatarData(valor, false);
}

function _dia(valor) {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(valor || ""));
  return m ? m[1] : "";
}

function _resolverContainer(container) {
  if (typeof container === "string") return document.querySelector(container);
  return container || null;
}

const _FX_ESTILOS_ID = "fenix-core-estilos";
function _injetarEstilos() {
  if (typeof document === "undefined" || document.getElementById(_FX_ESTILOS_ID)) return;
  const st = document.createElement("style");
  st.id = _FX_ESTILOS_ID;
  st.textContent = [
    ".fx-dash-card{font:inherit;text-align:left;cursor:pointer;background:#fff;color:#020733;border:2px solid transparent;border-radius:12px;padding:14px;min-height:64px;box-shadow:0 1px 4px rgba(2,7,51,.12);transition:border-color .15s,box-shadow .15s}",
    ".fx-dash-card:hover,.fx-dash-card:focus-visible{border-color:#ffcb00;box-shadow:0 2px 8px rgba(2,7,51,.2);outline:none}",
    ".fx-dash-card[aria-expanded=true]{border-color:#ffcb00}",
    ".fx-dash-card[aria-disabled=true]{cursor:default;opacity:.7}",
    ".fx-dash-card[aria-disabled=true]:hover{border-color:transparent;box-shadow:0 1px 4px rgba(2,7,51,.12)}",
    ".fx-dash-item{font:inherit;width:100%;text-align:left;background:#fff;color:#020733;border:1px solid #d9deef;border-radius:10px;padding:12px;min-height:44px;margin:0 0 8px}",
    "button.fx-dash-item{cursor:pointer}",
    "button.fx-dash-item:hover,button.fx-dash-item:focus-visible{border-color:#ffcb00;outline:none}",
    ".fx-btn{font:inherit;cursor:pointer;min-height:44px;padding:10px 16px;border-radius:8px;border:0;background:#0076CE;color:#fff;font-weight:600}",
    ".fx-btn:hover,.fx-btn:focus-visible{background:#ffcb00;color:#020733;outline:none}",
    ".fx-selo{display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:12px;color:inherit;opacity:.95;background:none;border:0;padding:0;min-height:0}",
    ".fx-selo b{font-weight:700}",
    "button.fx-selo{cursor:pointer;min-height:44px;padding:0 6px}",
    ".fx-selo-ponto{display:inline-flex;align-items:center;gap:3px;border-radius:10px;padding:1px 7px;background:#ffcb00;color:#041273;font-weight:700}",
    ".fx-selo-ponto.fx-vermelho{background:#c62828;color:#fff}",
    ".fx-selo-msg{font-size:13px;margin:6px 0 0;padding:8px 10px;border-radius:8px;background:#eef1fa;color:#020733;border-left:4px solid #0076CE}",
    ".fx-selo-msg.fx-amarelo{background:#fffbe6;border-left-color:#ffcb00}",
    ".fx-selo-msg.fx-vermelho{background:#fdecec;border-left-color:#c62828}",
    ".fx-manual{color:#020733;line-height:1.5}",
    ".fx-manual h1,.fx-manual h2,.fx-manual h3{color:#041273;margin:1.2em 0 .4em}",
    ".fx-manual img{max-width:100%;height:auto;border:1px solid #d9deef;border-radius:8px;margin:8px 0}",
    ".fx-manual code{background:#eef1fa;padding:1px 5px;border-radius:4px}",
    ".fx-manual pre{background:#eef1fa;padding:10px;border-radius:8px;overflow:auto}",
    ".fx-manual blockquote{margin:8px 0;padding:6px 12px;border-left:4px solid #ffcb00;background:#fffbe6}"
  ].join("\n");
  document.head.appendChild(st);
}

// ---- gerador de PDF compartilhado (changelog e manual) ---------------------

function _jsPDF() {
  const J = (typeof window !== "undefined") && ((window.jspdf && window.jspdf.jsPDF) || window.jsPDF);
  if (!J) throw new Error("FenixCore: jsPDF não encontrado. O app deve embutir o jsPDF antes de gerar PDF.");
  return J;
}

/** O jsPDF padrão só tem o alfabeto Latin-1: troca o que ele não desenha. */
function _pdfTexto(s) {
  return String(s == null ? "" : s)
    .replace(/→/g, "->").replace(/←/g, "<-").replace(/[✓✔]/g, "OK").replace(/[✗✘]/g, "X")
    .replace(/[←-⇿☀-➿\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[^\x09\x0A\x20-\x7E -ÿ•–—‘’“”…]/g, "?");
}

function _semMarcasMD(s) {
  return String(s == null ? "" : s)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|[^*\w])[*_]([^*_]+)[*_](?![*\w])/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1");
}

function _carregarImagemJPEG(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0);
        resolve({ dados: c.toDataURL("image/jpeg", 0.85), w: c.width, h: c.height });
      } catch (e) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function _novoPDF(titulo) {
  const J = _jsPDF();
  const doc = new J({ unit: "mm", format: "a4" });
  const L = 15, LARG = 210 - 2 * L, TOPO = 24, BASE = 285;
  let y = TOPO;
  function novaPagina() { doc.addPage(); y = TOPO; }
  function garantir(h) { if (y + h > BASE) novaPagina(); }
  function texto(txt, { tam = 11, negrito = false, cor = [2, 7, 51], recuo = 0, espaco = 2 } = {}) {
    doc.setFont("helvetica", negrito ? "bold" : "normal");
    doc.setFontSize(tam);
    doc.setTextColor(cor[0], cor[1], cor[2]);
    const linhas = doc.splitTextToSize(_pdfTexto(txt), LARG - recuo);
    const alt = tam * 0.3528 * 1.35;
    linhas.forEach(l => { garantir(alt); doc.text(l, L + recuo, y + tam * 0.3528); y += alt; });
    y += espaco;
  }
  return {
    doc,
    titulo(t) { texto(t, { tam: 20, negrito: true, cor: [4, 18, 115], espaco: 3 }); },
    h2(t) { garantir(14); y += 3; texto(t, { tam: 15, negrito: true, cor: [4, 18, 115], espaco: 2 }); },
    h3(t) { garantir(10); y += 1; texto(t, { tam: 12.5, negrito: true, cor: [0, 118, 206], espaco: 1.5 }); },
    p(t, opc) { texto(t, opc); },
    li(t, marca) { texto((marca || "•") + " " + t, { recuo: 4, espaco: 1 }); },
    espaco(mm) { y += mm; },
    async imagem(src) {
      const im = await _carregarImagemJPEG(src);
      if (!im) return;
      let w = Math.min(LARG, 80);
      let h = w * im.h / im.w;
      if (h > 200) { h = 200; w = h * im.w / im.h; }
      garantir(h + 4);
      doc.addImage(im.dados, "JPEG", L, y, w, h);
      doc.setDrawColor(217, 222, 239); doc.rect(L, y, w, h);
      y += h + 4;
    },
    finalizar(nomeArquivo) {
      const total = doc.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setFillColor(4, 7, 152); doc.rect(0, 0, 210, 14, "F");
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text(_pdfTexto("Fênix Soluções Tecnológicas"), L, 9);
        doc.setFont("helvetica", "normal");
        doc.text(_pdfTexto(titulo), 210 - L, 9, { align: "right" });
        doc.setTextColor(110, 116, 150); doc.setFontSize(9);
        doc.text("Página " + i + " de " + total, 210 / 2, 292, { align: "center" });
      }
      doc.save(nomeArquivo);
      return nomeArquivo;
    }
  };
}

// ---- Sobre: métodos novos ---------------------------------------------------

function _normalizarChangelog(changelog) {
  return (Array.isArray(changelog) ? changelog : [])
    .filter(v => v && v.versao != null)
    .map(v => {
      const criada = _dia(v.criadaEm);
      return {
        versao: _semV(v.versao),
        criadaEm: criada,
        modificadaEm: _dia(v.modificadaEm) || criada,
        mudancas: Array.isArray(v.mudancas) ? v.mudancas.map(String) : (v.mudancas ? [String(v.mudancas)] : [])
      };
    })
    .sort((a, b) => _compararVersoes(b.versao, a.versao));
}

Object.assign(sobre, {
  /** Changelog ordenado da versão mais nova para a mais antiga, com as datas normalizadas. */
  ordenarChangelog(changelog) {
    return _normalizarChangelog(changelog);
  },

  /**
   * Data de criação do app (menor "criadaEm") e data da última modificação
   * (maior "modificadaEm") a partir do changelog. Textos já em dd/mm/aaaa.
   */
  datasDoApp(changelog) {
    const lista = _normalizarChangelog(changelog);
    const criadas = lista.map(v => v.criadaEm).filter(Boolean).sort();
    const modificadas = lista.map(v => v.modificadaEm).filter(Boolean).sort();
    const criadoEm = criadas[0] || "";
    const ultimaModificacao = modificadas[modificadas.length - 1] || "";
    return {
      criadoEm, criadoEmTexto: _dataBR(criadoEm),
      ultimaModificacao, ultimaModificacaoTexto: _dataBR(ultimaModificacao)
    };
  },

  /** HTML (já escapado) do Changelog: uma caixa por versão, com as duas datas. */
  changelogHTML(changelog) {
    const lista = _normalizarChangelog(changelog);
    if (!lista.length) return '<p style="color:#020733">Nenhuma versão registrada.</p>';
    return lista.map(v => {
      const itens = v.mudancas.map(m => "<li>" + _esc(m) + "</li>").join("");
      return '<div style="background:#fff;border:1px solid #d9deef;border-radius:10px;padding:12px 14px;margin:0 0 10px;color:#020733">' +
        '<div style="font-weight:700;color:#041273;font-size:16px">v' + _esc(v.versao) + "</div>" +
        '<div style="font-size:13px;color:#555b80;margin:2px 0 6px">Criada em ' + _esc(_dataBR(v.criadaEm) || "—") +
        " · Modificada em " + _esc(_dataBR(v.modificadaEm) || "—") + "</div>" +
        (itens ? '<ul style="margin:0;padding-left:20px;line-height:1.5">' + itens + "</ul>" : "") +
        "</div>";
    }).join("");
  },

  /**
   * Monta a tela Sobre completa dentro de um elemento (ou seletor):
   * versão, acessos, primeiro acesso, última atualização, data de criação do
   * app, data da última modificação, dados da Fênix e o Changelog com botão
   * para baixar em PDF. Não conta acesso (isso é do registrarAcesso).
   * @param {Element|string} container
   * @param {object} opcoes - { nomeApp (obrigatório), titulo, versao, changelog }
   */
  montarTela(container, opcoes = {}) {
    const alvo = _resolverContainer(container);
    if (!alvo) throw new Error("sobre.montarTela: container não encontrado.");
    _injetarEstilos();
    const { nomeApp, titulo, versao, changelog, livro, coreMinimo } = opcoes;
    if (!nomeApp) throw new Error("sobre.montarTela: informe nomeApp.");
    const info = sobre.obter(nomeApp);
    const datas = sobre.datasDoApp(changelog);
    const lista = _normalizarChangelog(changelog);
    const versaoAtual = versao || (lista[0] && lista[0].versao) || (info && info.versao) || "";
    const fatos = [
      ["Versão", versaoAtual ? "v" + _semV(versaoAtual) : "—"],
      ["Acessos", info ? String(info.acessos) : "—"],
      ["Primeiro acesso", info ? info.primeiroAcessoTexto : "—"],
      ["Última atualização", info ? info.ultimaAtualizacaoTexto : "—"],
      ["Criado em", datas.criadoEmTexto || "—"],
      ["Última modificação", datas.ultimaModificacaoTexto || "—"],
      ["Core em uso", "c " + versoes.core],
      ["Livro das Regras", livro ? "l " + _semV(livro) : "—"]
    ];
    alvo.innerHTML =
      '<div style="color:#020733;line-height:1.45">' +
      '<h2 style="color:#041273;margin:0 0 10px">' + _esc(titulo || "Sobre") + "</h2>" +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 14px">' +
      fatos.map(f => '<div style="background:#fff;border-radius:10px;padding:10px 12px;box-shadow:0 1px 4px rgba(2,7,51,.12)">' +
        '<div style="font-size:12px;color:#555b80">' + _esc(f[0]) + '</div><div style="font-weight:700">' + _esc(f[1]) + "</div></div>").join("") +
      "</div>" +
      '<div style="background:#fff;border-radius:10px;padding:10px 12px;margin:0 0 14px;box-shadow:0 1px 4px rgba(2,7,51,.12);font-size:14px">' +
      "<strong>" + _esc(EMPRESA.nome) + "</strong><br>" + _esc(EMPRESA.razaoSocial) + " · CNPJ " + _esc(EMPRESA.cnpjFormatado) +
      "<br>" + _esc(EMPRESA.email) + "</div>" +
      '<div style="margin:0 0 14px" data-fx-selo-sobre></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 0 8px">' +
      '<h3 style="color:#041273;margin:0">Changelog</h3>' +
      '<button type="button" class="fx-btn" data-fx-changelog-pdf>Baixar Changelog (PDF)</button></div>' +
      sobre.changelogHTML(changelog) + "</div>";
    const slotSelo = alvo.querySelector("[data-fx-selo-sobre]");
    if (slotSelo && versaoAtual) versoes.montarSelo(slotSelo, versaoAtual, { coreMinimo, livro, detalhe: true });
    const btn = alvo.querySelector("[data-fx-changelog-pdf]");
    if (btn) btn.addEventListener("click", () => {
      sobre.baixarChangelogPDF(nomeApp, changelog, { versao: versaoAtual, titulo }).catch(e => {
        console.error("FenixCore.sobre: falha ao gerar o PDF do Changelog:", e);
        alert("Não foi possível gerar o PDF agora. Tente novamente.");
      });
    });
    return alvo;
  },

  /**
   * Baixa o Changelog em PDF (usa o jsPDF que o app já embute).
   * Nome do arquivo: <nomeApp>-changelog-vX.X.pdf
   * @returns {Promise<string>} nome do arquivo gerado
   */
  async baixarChangelogPDF(nomeApp, changelog, opcoes = {}) {
    const lista = _normalizarChangelog(changelog);
    const versao = _semV(opcoes.versao || (lista[0] && lista[0].versao) || "");
    const nomeLegivel = opcoes.titulo || nomeApp;
    const pdf = _novoPDF("Changelog");
    const datas = sobre.datasDoApp(changelog);
    pdf.titulo("Changelog — " + nomeLegivel);
    pdf.p("Criado em " + (datas.criadoEmTexto || "—") + " · Última modificação " + (datas.ultimaModificacaoTexto || "—"), { tam: 10, cor: [85, 91, 128], espaco: 4 });
    lista.forEach(v => {
      pdf.h2("v" + v.versao);
      pdf.p("Criada em " + (_dataBR(v.criadaEm) || "—") + " · Modificada em " + (_dataBR(v.modificadaEm) || "—"), { tam: 10, cor: [85, 91, 128], espaco: 2 });
      v.mudancas.forEach(m => pdf.li(m));
    });
    return pdf.finalizar(nomeApp + "-changelog" + (versao ? "-v" + versao : "") + ".pdf");
  }
});

// ============================================================================
// 16. MANUAL — manual do usuário em MD (consulta no app) e PDF (download)
// ============================================================================
/**
 * Livro das Regras, regra 12. O manual é escrito em Markdown simples e fica
 * dentro do próprio app (texto). Prints entram como imagens em base64:
 *   ![Tela inicial](data:image/jpeg;base64,....)
 * Suportado: títulos (#, ##, ###), parágrafos, listas (- e 1.), **negrito**,
 * *itálico*, `código`, [link](https://...), citação (>), linha (---),
 * bloco de código (```) e imagens (uma por linha).
 *
 * Uso:
 *   FenixCore.manual.montarTela("#areaManual", MANUAL_MD,
 *     { nomeApp: "fenix-meu-app", versao: "1.3", titulo: "Meu App" });
 */

function _mdBlocos(md) {
  const linhas = String(md == null ? "" : md).replace(/\r\n?/g, "\n").split("\n");
  const blocos = [];
  let par = [];
  let lista = null;
  const fechaPar = () => { if (par.length) { blocos.push({ t: "p", texto: par.join(" ") }); par = []; } };
  const fechaLista = () => { if (lista) { blocos.push(lista); lista = null; } };
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    let m;
    if ((m = /^\s*```/.exec(l))) {
      fechaPar(); fechaLista();
      const cod = [];
      i++;
      while (i < linhas.length && !/^\s*```/.test(linhas[i])) { cod.push(linhas[i]); i++; }
      blocos.push({ t: "code", texto: cod.join("\n") });
      continue;
    }
    if (!l.trim()) { fechaPar(); fechaLista(); continue; }
    if ((m = /^(#{1,3})\s+(.*)$/.exec(l))) { fechaPar(); fechaLista(); blocos.push({ t: "h" + m[1].length, texto: m[2].trim() }); continue; }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) { fechaPar(); fechaLista(); blocos.push({ t: "hr" }); continue; }
    if ((m = /^\s*!\[([^\]]*)\]\(([^)\s]+)\)\s*$/.exec(l))) { fechaPar(); fechaLista(); blocos.push({ t: "img", alt: m[1], src: m[2] }); continue; }
    if ((m = /^\s*>\s?(.*)$/.exec(l))) { fechaPar(); fechaLista(); blocos.push({ t: "quote", texto: m[1] }); continue; }
    if ((m = /^\s*[-*+]\s+(.*)$/.exec(l))) {
      fechaPar();
      if (!lista || lista.t !== "ul") { fechaLista(); lista = { t: "ul", itens: [] }; }
      lista.itens.push(m[1]); continue;
    }
    if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(l))) {
      fechaPar();
      if (!lista || lista.t !== "ol") { fechaLista(); lista = { t: "ol", itens: [] }; }
      lista.itens.push(m[1]); continue;
    }
    if (lista && /^\s+\S/.test(l)) { lista.itens[lista.itens.length - 1] += " " + l.trim(); continue; }
    fechaLista();
    par.push(l.trim());
  }
  fechaPar(); fechaLista();
  return blocos;
}

function _inlineMD(texto) {
  let s = _esc(texto);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|#)[^\s)]*)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/(\*\*|__)(.+?)\1/g, "<strong>$2</strong>");
  s = s.replace(/(^|[^*\w])[*_]([^*_]+)[*_](?![*\w])/g, "$1<em>$2</em>");
  return s;
}

function _srcImagemSegura(src) {
  return /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(src) || /^https:\/\//i.test(src);
}

const manual = {
  /** Converte o Markdown do manual em HTML seguro (tudo escapado). */
  paraHTML(md) {
    return _mdBlocos(md).map(b => {
      switch (b.t) {
        case "h1": case "h2": case "h3": return "<" + b.t + ">" + _inlineMD(b.texto) + "</" + b.t + ">";
        case "p": return "<p>" + _inlineMD(b.texto) + "</p>";
        case "ul": return "<ul>" + b.itens.map(i => "<li>" + _inlineMD(i) + "</li>").join("") + "</ul>";
        case "ol": return "<ol>" + b.itens.map(i => "<li>" + _inlineMD(i) + "</li>").join("") + "</ol>";
        case "quote": return "<blockquote>" + _inlineMD(b.texto) + "</blockquote>";
        case "code": return "<pre><code>" + _esc(b.texto) + "</code></pre>";
        case "hr": return "<hr>";
        case "img": return _srcImagemSegura(b.src) ? '<img src="' + _esc(b.src) + '" alt="' + _esc(b.alt) + '" loading="lazy">' : "";
        default: return "";
      }
    }).join("\n");
  },

  /**
   * Mostra o manual (somente leitura) dentro de um elemento ou seletor.
   * Se informar nomeApp, mostra também o botão "Baixar manual (PDF)".
   * @param {object} opcoes - { nomeApp, versao, titulo }
   */
  montarTela(container, md, opcoes = {}) {
    const alvo = _resolverContainer(container);
    if (!alvo) throw new Error("manual.montarTela: container não encontrado.");
    _injetarEstilos();
    const barra = opcoes.nomeApp
      ? '<div style="margin:0 0 10px"><button type="button" class="fx-btn" data-fx-manual-pdf>Baixar manual (PDF)</button></div>'
      : "";
    alvo.innerHTML = '<div class="fx-manual">' + barra + manual.paraHTML(md) + "</div>";
    const btn = alvo.querySelector("[data-fx-manual-pdf]");
    if (btn) btn.addEventListener("click", () => {
      manual.baixarPDF(opcoes.nomeApp, opcoes.versao, md, { titulo: opcoes.titulo }).catch(e => {
        console.error("FenixCore.manual: falha ao gerar o PDF:", e);
        alert("Não foi possível gerar o PDF agora. Tente novamente.");
      });
    });
    return alvo;
  },

  /**
   * Gera e baixa o manual em PDF (usa o jsPDF que o app já embute), a partir
   * do mesmo Markdown. Prints em base64 entram no PDF.
   * Nome do arquivo: <nomeApp>-manual-vX.X.pdf
   * @returns {Promise<string>} nome do arquivo gerado
   */
  async baixarPDF(nomeApp, versao, md, opcoes = {}) {
    if (!nomeApp) throw new Error("manual.baixarPDF: informe nomeApp.");
    const v = _semV(versao);
    const pdf = _novoPDF("Manual do usuário" + (v ? " · v" + v : ""));
    if (opcoes.titulo) pdf.titulo(opcoes.titulo);
    for (const b of _mdBlocos(md)) {
      switch (b.t) {
        case "h1": pdf.titulo(_semMarcasMD(b.texto)); break;
        case "h2": pdf.h2(_semMarcasMD(b.texto)); break;
        case "h3": pdf.h3(_semMarcasMD(b.texto)); break;
        case "p": pdf.p(_semMarcasMD(b.texto)); break;
        case "ul": b.itens.forEach(i => pdf.li(_semMarcasMD(i))); pdf.espaco(1); break;
        case "ol": b.itens.forEach((i, n) => pdf.li(_semMarcasMD(i), (n + 1) + ".")); pdf.espaco(1); break;
        case "quote": pdf.p(_semMarcasMD(b.texto), { recuo: 4, cor: [85, 91, 128] }); break;
        case "code": pdf.p(b.texto, { tam: 9.5, recuo: 4 }); break;
        case "img": if (_srcImagemSegura(b.src)) await pdf.imagem(b.src); break;
        default: break;
      }
    }
    return pdf.finalizar(nomeApp + "-manual" + (v ? "-v" + v : "") + ".pdf");
  }
};

// ============================================================================
// 17. DASHBOARD CLICÁVEL — indicadores que expandem os registros que os formam
// ============================================================================
/**
 * Livro das Regras, regra 54. Cada indicador com dados é clicável e expande a
 * lista que o compõe, com o mesmo número do indicador. Indicador zerado não
 * abre e mostra "Nenhum registro". A lista tem botão Fechar, Esc fecha, e o
 * dashboard volta à posição em que estava. Também funciona pelo teclado.
 *
 *   const dash = FenixCore.dashboard.montar("#dash", [
 *     { id: "total",  rotulo: "Total de serviços", registros: servicos },
 *     { id: "andam",  rotulo: "Em andamento", registros: () => servicos.filter(s => s.situacao === "andamento") },
 *     { id: "valor",  rotulo: "A receber", moeda: true, valor: 1234.5, registros: lancamentos }
 *   ], {
 *     rotuloRegistro:  s => s.cliente,            // linha principal (texto simples)
 *     detalheRegistro: s => s.situacao,           // linha secundária (opcional)
 *     aoAbrirRegistro: (s, indicador) => abrirDetalhe(s.id)   // redireciona ao detalhe
 *   });
 *   // gráficos: ao clicar numa fatia/barra, abra os registros dela:
 *   // dash.abrirLista("Interrompidos (3)", registrosDaFatia);
 *   // depois de mudar os dados: dash.atualizar();
 *
 * Cada indicador aceita: id, rotulo, registros (lista ou função que devolve a
 * lista), valor (padrão = quantidade de registros), moeda (formata em R$),
 * rotuloRegistro, detalheRegistro e aoAbrirRegistro (sobrepõem os de "opcoes").
 */

function _formatarMoedaBR(n) {
  const num = Number(n);
  if (!isFinite(num)) return String(n);
  return "R$ " + num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const dashboard = {
  montar(container, indicadores, opcoes = {}) {
    const raiz = _resolverContainer(container);
    if (!raiz) throw new Error("dashboard.montar: container não encontrado.");
    _injetarEstilos();
    let lista = Array.isArray(indicadores) ? indicadores : [];
    let abertoId = null;       // id do indicador aberto, ou "__lista" para lista avulsa
    let posicao = 0;

    const registrosDe = ind => {
      try {
        const r = typeof ind.registros === "function" ? ind.registros() : ind.registros;
        return Array.isArray(r) ? r : [];
      } catch (e) { console.error("FenixCore.dashboard: erro em registros de", ind.id, e); return []; }
    };

    const grade = document.createElement("div");
    grade.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;";
    const painel = document.createElement("div");
    painel.style.cssText = "margin-top:12px;display:none;";
    painel.setAttribute("role", "region");
    raiz.textContent = "";
    raiz.append(grade, painel);

    function fechar() {
      if (abertoId === null) return;
      abertoId = null;
      painel.style.display = "none";
      painel.textContent = "";
      grade.querySelectorAll(".fx-dash-card").forEach(b => b.setAttribute("aria-expanded", "false"));
      window.scrollTo(0, posicao);
    }

    function mostrarLista(id, titulo, registros, cfg) {
      if (abertoId === null) posicao = window.scrollY || 0;
      abertoId = id;
      grade.querySelectorAll(".fx-dash-card").forEach(b => b.setAttribute("aria-expanded", String(b.dataset.id === id)));
      painel.textContent = "";
      painel.style.display = "block";
      painel.setAttribute("aria-label", titulo);
      const topo = document.createElement("div");
      topo.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 8px;";
      const h = document.createElement("strong");
      h.style.cssText = "color:#041273;font-size:16px;";
      h.textContent = titulo;
      const bFechar = document.createElement("button");
      bFechar.type = "button"; bFechar.className = "fx-btn"; bFechar.textContent = "Fechar";
      bFechar.addEventListener("click", fechar);
      topo.append(h, bFechar);
      painel.appendChild(topo);
      const rot = cfg.rotuloRegistro || (r => (r && (r.nome || r.titulo || r.descricao || r.id)) || String(r));
      registros.forEach(reg => {
        const clicavel = typeof cfg.aoAbrirRegistro === "function";
        const el = document.createElement(clicavel ? "button" : "div");
        if (clicavel) el.type = "button";
        el.className = "fx-dash-item";
        const l1 = document.createElement("div");
        l1.style.fontWeight = "600";
        l1.textContent = String(rot(reg));
        el.appendChild(l1);
        if (typeof cfg.detalheRegistro === "function") {
          const d = cfg.detalheRegistro(reg);
          if (d) {
            const l2 = document.createElement("div");
            l2.style.cssText = "font-size:13px;color:#555b80;";
            l2.textContent = String(d);
            el.appendChild(l2);
          }
        }
        if (clicavel) el.addEventListener("click", () => cfg.aoAbrirRegistro(reg, cfg.indicador || null));
        painel.appendChild(el);
      });
      painel.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    function abrir(id) {
      const ind = lista.find(i => i.id === id);
      if (!ind) return false;
      const regs = registrosDe(ind);
      if (!regs.length) return false;
      if (abertoId === id) { fechar(); return true; }
      mostrarLista(id, ind.rotulo + " (" + regs.length + ")", regs, {
        rotuloRegistro: ind.rotuloRegistro || opcoes.rotuloRegistro,
        detalheRegistro: ind.detalheRegistro || opcoes.detalheRegistro,
        aoAbrirRegistro: ind.aoAbrirRegistro || opcoes.aoAbrirRegistro,
        indicador: ind
      });
      return true;
    }

    function desenhar() {
      grade.textContent = "";
      lista.forEach(ind => {
        const regs = registrosDe(ind);
        const temDados = regs.length > 0;
        let valor = ind.valor !== undefined ? ind.valor : regs.length;
        if (typeof ind.valor === "number" && !ind.moeda && ind.valor !== regs.length) {
          console.warn("FenixCore.dashboard: o valor de '" + ind.rotulo + "' (" + ind.valor + ") difere da quantidade de registros (" + regs.length + ").");
        }
        const texto = ind.moeda ? _formatarMoedaBR(valor) : String(valor);
        const b = document.createElement("button");
        b.type = "button";
        b.className = "fx-dash-card";
        b.dataset.id = ind.id;
        b.setAttribute("aria-expanded", "false");
        if (!temDados) b.setAttribute("aria-disabled", "true");
        const r = document.createElement("div");
        r.style.cssText = "font-size:13px;color:#555b80;";
        r.textContent = ind.rotulo;
        const v = document.createElement("div");
        v.style.cssText = "font-size:26px;font-weight:700;color:#041273;";
        v.textContent = texto;
        b.append(r, v);
        if (!temDados) {
          const n = document.createElement("div");
          n.style.cssText = "font-size:12px;color:#555b80;";
          n.textContent = "Nenhum registro";
          b.appendChild(n);
        }
        b.addEventListener("click", () => { if (temDados) abrir(ind.id); });
        grade.appendChild(b);
      });
      if (abertoId && abertoId !== "__lista") {
        const aindaAberto = abertoId;
        abertoId = null;
        if (!abrir(aindaAberto)) { painel.style.display = "none"; painel.textContent = ""; }
      }
    }

    raiz.addEventListener("keydown", ev => { if (ev.key === "Escape") fechar(); });
    desenhar();

    return {
      abrir,
      fechar,
      /** Abre uma lista avulsa (ex.: fatia de um gráfico), no mesmo painel. */
      abrirLista(titulo, registros, cfg = {}) {
        mostrarLista("__lista", titulo, Array.isArray(registros) ? registros : [], {
          rotuloRegistro: cfg.rotuloRegistro || opcoes.rotuloRegistro,
          detalheRegistro: cfg.detalheRegistro || opcoes.detalheRegistro,
          aoAbrirRegistro: cfg.aoAbrirRegistro || opcoes.aoAbrirRegistro
        });
      },
      /** Redesenha com os dados atuais (e com novos indicadores, se informados). */
      atualizar(novos) {
        if (Array.isArray(novos)) lista = novos;
        desenhar();
      }
    };
  }
};

// ============================================================================
// 18. CNPJ COMPLETO — consulta do CNPJ com endereço completado pelo CEP
// ============================================================================
/**
 * Livro das Regras, regra 35. Métodos NOVOS (nada existente foi alterado):
 *
 *   FenixCore.pessoas.consultarCNPJ(cnpj)
 *     Consulta o CNPJ (BrasilAPI, o mesmo de buscarNaReceita) e devolve o
 *     mesmo objeto, com Razão Social, Endereço (logradouro), Número, Bairro,
 *     CEP, Cidade e UF em dados.endereco. Se a API do CNPJ trouxer só o CEP
 *     (sem logradouro, bairro, cidade ou UF), complementa sozinha pela
 *     BrasilAPI (consulta de CEP), sem o usuário redigitar nada. Só preenche
 *     o que faltou: o que veio do CNPJ nunca é sobrescrito.
 *     Campos extras no retorno:
 *       origemEndereco:  "receita" | "receita+brasilapi-cep"
 *       enderecoCompleto: true se logradouro, bairro, cidade e UF vieram
 *     Retorna null se o CNPJ não for encontrado; lança erro se for inválido.
 *     Não lê nem grava no Firestore (funciona com o banco desligado).
 *
 *   FenixCore.localidades.buscarPorCEPBrasilAPI(cep)
 *     Consulta o CEP na BrasilAPI e devolve { cep, logradouro, bairro,
 *     cidade, uf, origem: "brasilapi-cep" }, ou null se não achar. Também
 *     não usa o Firestore.
 *
 * Exemplo:
 *   try {
 *     const d = await FenixCore.pessoas.consultarCNPJ(cnpjDigitado);
 *     if (d) { razao.value = d.razaoSocial; rua.value = d.endereco.logradouro; ... }
 *     if (d && !d.enderecoCompleto) { // deixe os campos editáveis para conferir }
 *   } catch (e) { // CNPJ inválido ou sem internet }
 */

const _SO_TIPO_LOGRADOURO = /^(RUA|AVENIDA|AV|TRAVESSA|TV|PRAÇA|PRACA|ALAMEDA|RODOVIA|ESTRADA|LARGO|VIA|LOTEAMENTO|QUADRA|CONJUNTO|BECO|VIELA)\.?$/i;

Object.assign(localidades, {
  async buscarPorCEPBrasilAPI(cep) {
    const cepLimpo = limparDocumento(cep);
    if (cepLimpo.length !== 8) throw new Error("CEP inválido: " + cep);
    const resp = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`);
    if (!resp.ok) return null;                 // CEP não encontrado ou API indisponível
    const dados = await resp.json();
    if (!dados || dados.errors || dados.type === "service_error") return null;
    return {
      cep: cepLimpo,
      logradouro: formatarTitulo(dados.street || ""),
      bairro: formatarTitulo(dados.neighborhood || ""),
      cidade: formatarTitulo(dados.city || ""),
      uf: (dados.state || "").toString().trim().toUpperCase(),
      origem: "brasilapi-cep"
    };
  },

  /**
   * Igual ao buscarPorCEP (ViaCEP), mas NÃO usa o Firestore: não cria cidade nem
   * registra bairro. Use enquanto o banco do app estiver desligado.
   * Devolve { cep, logradouro, bairro, cidade, uf, codigoIBGE, origem:"cep-sem-banco" }
   * ou null se o CEP não existir.
   */
  async buscarPorCEPSemBanco(cep) {
    const cepLimpo = limparDocumento(cep);
    if (cepLimpo.length !== 8) throw new Error("CEP inválido: " + cep);
    const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (!resp.ok) return null;
    const dados = await resp.json();
    if (!dados || dados.erro) return null;
    return {
      cep: cepLimpo,
      logradouro: formatarTitulo(dados.logradouro),
      bairro: formatarTitulo(dados.bairro),
      cidade: formatarTitulo(dados.localidade),
      uf: (dados.uf || "").toString().trim().toUpperCase(),
      codigoIBGE: dados.ibge || null,
      origem: "cep-sem-banco"
    };
  }
});

Object.assign(pessoas, {
  async consultarCNPJ(cnpj) {
    const dados = await pessoas.buscarNaReceita(cnpj);   // lança erro se inválido; null se não achou
    if (!dados) return null;
    const e = dados.endereco;
    // O CNPJ às vezes traz só o tipo ("RUA") sem o nome: conta como logradouro ausente.
    if (_SO_TIPO_LOGRADOURO.test((e.logradouro || "").trim())) e.logradouro = "";
    const falta = () => !e.logradouro || !e.bairro || !e.cidade || !e.uf;
    dados.origemEndereco = "receita";
    const cepLimpo = limparDocumento(e.cep);
    if (falta() && cepLimpo.length === 8) {
      try {
        const c = await localidades.buscarPorCEPBrasilAPI(cepLimpo);
        if (c) {
          if (!e.logradouro) e.logradouro = c.logradouro;
          if (!e.bairro) e.bairro = c.bairro;
          if (!e.cidade) e.cidade = c.cidade;
          if (!e.uf) e.uf = c.uf;
          dados.origemEndereco = "receita+brasilapi-cep";
        }
      } catch (err) {
        console.warn("FenixCore.pessoas.consultarCNPJ: não foi possível completar o endereço pelo CEP:", err);
      }
    }
    dados.enderecoCompleto = !falta();
    return dados;
  }
});

// ============================================================================
// MÁSCARAS AUTOMÁTICAS (v3.9) — formatam o campo enquanto o usuário digita
// ============================================================================
/**
 * Uso mais simples: no HTML, marque o campo com data-mask e chame uma vez
 * FenixCore.mascaras.auto() depois do carregamento do core:
 *
 *   <input data-mask="cpfcnpj">   <input data-mask="moeda">   <input data-mask="telefone">
 *
 * Tipos: cpfcnpj (até 11 dígitos é CPF; passou de 11 vira CNPJ), cpf, cnpj,
 * cep, telefone (fixo ou celular), moeda, percentual, data, hora, placa,
 * ip, mac, numero, ie (com data-mask-uf="SE"), rg, uf. Campos que aparecerem depois na tela também são cobertos.
 *
 * Moeda: 1 -> R$ 1 | 10 -> R$ 1,0 | 100 -> R$ 1,00 | 1000 -> R$ 10,00 |
 * 10000 -> R$ 100,00 | 100000 -> R$ 1.000,00. Começando com zero:
 * 01 -> R$ 0,1 | 010 -> R$ 0,10.
 *
 * Funções (todas devolvem texto, sem tocar na tela):
 *   mascaras.cpf / cnpj / cpfCnpj / cep / telefone / moeda / percentual /
 *   data / hora / placa / ip / mac / numero (valor)
 *   mascaras.moedaParaNumero("R$ 1.234,56") -> 1234.56
 *   mascaras.numeroParaMoeda(1234.56)       -> "R$ 1.234,56"
 *   mascaras.dataParaISO("25/12/2026")      -> "2026-12-25" (ou null se inválida)
 *   mascaras.valorLimpo(tipo, texto)        -> o valor para guardar (só dígitos,
 *                                              número, data ISO...)
 *   mascaras.aplicar(input, tipo)           -> liga a máscara a um campo
 *   mascaras.definirValor(input, valor)     -> põe um valor já mascarado no campo
 *   mascaras.auto(raiz)                     -> liga todos os [data-mask]
 */
const _soDigitos = v => String(v == null ? "" : v).replace(/\D/g, "");

function _moedaBase(v, prefixo, sufixo, maxDigitos) {
  // Regra: sem zero na frente, 1 dígito = "1"; 2 = "1,0"; 3 em diante, os dois
  // últimos são decimais ("1,00", "10,00", "1.000,00"). Com zero na frente,
  // os dígitos seguintes são os decimais ("0,1", "0,10").
  const d = _soDigitos(v).slice(0, maxDigitos);
  if (!d) return "";
  const milhar = x => x.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  let r;
  if (d[0] === "0") {
    const resto = d.slice(1);
    if (resto.length <= 2) r = resto ? "0," + resto : "0";
    else {
      const sem = resto.replace(/^0+/, "").padStart(3, "0");
      r = milhar(sem.slice(0, -2)) + "," + sem.slice(-2);
    }
  } else if (d.length === 1) r = d;
  else if (d.length === 2) r = d[0] + "," + d[1];
  else r = milhar(d.slice(0, -2)) + "," + d.slice(-2);
  return prefixo + r + sufixo;
}
function _textoParaNumero(texto) {
  const t = String(texto == null ? "" : texto).replace(/[^\d,]/g, "").replace(",", ".");
  return t === "" || t === "." ? null : Number(t);
}
function _numeroParaTexto(n) {
  const cent = Math.round(Math.abs(Number(n)) * 100);
  const sem = String(cent).padStart(3, "0");
  return sem.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + sem.slice(-2);
}

const mascaras = {
  tipos: ["cpfcnpj", "cpf", "cnpj", "cep", "telefone", "moeda", "percentual", "data", "hora", "placa", "ip", "mac", "numero", "ie", "rg", "uf"],

  cpf(v) {
    const d = _soDigitos(v).slice(0, 11);
    let r = d.slice(0, 3);
    if (d.length > 3) r += "." + d.slice(3, 6);
    if (d.length > 6) r += "." + d.slice(6, 9);
    if (d.length > 9) r += "-" + d.slice(9, 11);
    return r;
  },
  cnpj(v) {
    const d = _soDigitos(v).slice(0, 14);
    let r = d.slice(0, 2);
    if (d.length > 2) r += "." + d.slice(2, 5);
    if (d.length > 5) r += "." + d.slice(5, 8);
    if (d.length > 8) r += "/" + d.slice(8, 12);
    if (d.length > 12) r += "-" + d.slice(12, 14);
    return r;
  },
  cpfCnpj(v) {
    const d = _soDigitos(v);
    return d.length > 11 ? mascaras.cnpj(d) : mascaras.cpf(d);
  },
  cep(v) {
    const d = _soDigitos(v).slice(0, 8);
    return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
  },
  telefone(v) {
    const d = _soDigitos(v).slice(0, 11);
    if (!d) return "";
    let r = "(" + d.slice(0, 2);
    if (d.length <= 2) return r;
    r += ") ";
    const resto = d.slice(2);
    if (resto[0] === "9") { // celular: (79) 9 9968-0880
      r += resto[0];
      if (resto.length > 1) r += " " + resto.slice(1, 5);
      if (resto.length > 5) r += "-" + resto.slice(5, 9);
    } else {               // fixo: (79) 3222-1234
      r += resto.slice(0, 4);
      if (resto.length > 4) r += "-" + resto.slice(4, 8);
    }
    return r;
  },
  moeda(v) { return _moedaBase(v, "R$ ", "", 15); },
  percentual(v) { return _moedaBase(v, "", "%", 7); },
  data(v) {
    const d = _soDigitos(v).slice(0, 8);
    let r = d.slice(0, 2);
    if (d.length > 2) r += "/" + d.slice(2, 4);
    if (d.length > 4) r += "/" + d.slice(4, 8);
    return r;
  },
  hora(v) {
    const d = _soDigitos(v).slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + ":" + d.slice(2) : d;
  },
  placa(v) {
    const c = String(v == null ? "" : v).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
    return c.length > 3 ? c.slice(0, 3) + "-" + c.slice(3) : c;
  },
  ip(v) {
    const partes = [];
    String(v == null ? "" : v).replace(/[^\d.]/g, "").split(".").forEach(p => {
      while (p.length > 3) { partes.push(p.slice(0, 3)); p = p.slice(3); }
      partes.push(p);
    });
    return partes.slice(0, 4).map(p => (p !== "" && Number(p) > 255 ? "255" : p)).join(".");
  },
  mac(v) {
    const h = String(v == null ? "" : v).toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 12);
    return h.replace(/(.{2})(?=.)/g, "$1:");
  },
  numero(v) { return _soDigitos(v); },

  moedaParaNumero(texto) { return _textoParaNumero(texto); },
  numeroParaMoeda(n) {
    if (n == null || n === "" || isNaN(Number(n))) return "";
    return "R$ " + _numeroParaTexto(n);
  },
  // Inscrição estadual. SE (00000000-0), BA (000000-00 ou 0000000-00) e SP
  // (000.000.000.000) têm formato próprio; as demais UFs ficam só com os
  // dígitos. "ISENTO" é aceito. Informe a UF (SE, BA, SP...) para o formato.
  ie(v, uf) {
    const txt = String(v == null ? "" : v).toUpperCase();
    if (/^[A-Z]/.test(txt)) return "ISENTO".startsWith(txt.replace(/[^A-Z]/g, "")) ? txt.replace(/[^A-Z]/g, "").slice(0, 6) : "";
    const d = _soDigitos(txt);
    switch (String(uf || "").toUpperCase()) {
      case "SE": { const x = d.slice(0, 9); return x.length > 8 ? x.slice(0, 8) + "-" + x.slice(8) : x; }
      case "BA": { const x = d.slice(0, 9); const k = x.length > 8 ? 7 : 6; return x.length > k ? x.slice(0, k) + "-" + x.slice(k) : x; }
      case "SP": { const x = d.slice(0, 12); return x.replace(/^(\d{3})(\d{1,3})?(\d{1,3})?(\d{1,3})?$/, (m, a, b, c, e) => [a, b, c, e].filter(Boolean).join(".")); }
      default: return d.slice(0, 14);
    }
  },
  // RG no formato 00.000.000-0 (o último caractere pode ser X). Maiúsculo.
  rg(v) {
    let c = "";
    for (const ch of String(v == null ? "" : v).toUpperCase()) {
      if (/\d/.test(ch) && c.length < 9) c += ch;
      else if (ch === "X" && c.length === 8) c += ch;
    }
    let r = c.slice(0, 2);
    if (c.length > 2) r += "." + c.slice(2, 5);
    if (c.length > 5) r += "." + c.slice(5, 8);
    if (c.length > 8) r += "-" + c.slice(8, 9);
    return r;
  },
  uf(v) { return String(v == null ? "" : v).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2); },
  dataParaISO(texto) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(texto || ""));
    if (!m) return null;
    const dia = +m[1], mes = +m[2], ano = +m[3];
    const dt = new Date(ano, mes - 1, dia);
    if (dt.getFullYear() !== ano || dt.getMonth() !== mes - 1 || dt.getDate() !== dia) return null;
    return m[3] + "-" + m[2] + "-" + m[1];
  },
  valorLimpo(tipo, texto) {
    switch (_normalizarTipoMascara(tipo)) {
      case "moeda": return mascaras.moedaParaNumero(texto);
      case "percentual": return mascaras.moedaParaNumero(texto);
      case "data": return mascaras.dataParaISO(texto);
      case "hora": { const m = /^(\d{2}):(\d{2})$/.exec(String(texto || "")); return m && +m[1] < 24 && +m[2] < 60 ? texto : null; }
      case "placa": return String(texto || "").replace(/-/g, "");
      case "rg": return String(texto || "").toUpperCase().replace(/[^0-9X]/g, "");
      case "ip": case "mac": return String(texto || "");
      default: return _soDigitos(texto);
    }
  },

  aplicar(input, tipo, opcoes) {
    const t = _normalizarTipoMascara(tipo);
    const base = t === "cpfcnpj" ? mascaras.cpfCnpj : mascaras[t];
    const fn = t === "ie" ? (x => mascaras.ie(x, input.getAttribute("data-mask-uf"))) : base;
    if (!input || !fn || !mascaras.tipos.includes(t)) return null;
    if (input._fenixMascara === t) return input;
    input._fenixMascara = t;
    const numerico = ["cpfcnpj", "cpf", "cnpj", "cep", "telefone", "moeda", "percentual", "data", "hora", "numero"].includes(t);
    input.setAttribute("inputmode", t === "ip" ? "decimal" : numerico ? "numeric" : "text");
    input.setAttribute("maxlength", String({ cpfcnpj: 18, cpf: 14, cnpj: 18, cep: 9, telefone: 16, moeda: 24, percentual: 11, data: 10, hora: 5, placa: 8, ip: 15, mac: 17, numero: 20, ie: 18, rg: 12, uf: 2 }[t]));
    if (t === "ip") input.setAttribute("autocomplete", "off");
    const fimDoTexto = t === "moeda" || t === "percentual";
    input.addEventListener("input", () => {
      const antes = input.value;
      const pos = input.selectionStart == null ? antes.length : input.selectionStart;
      const sig = (antes.slice(0, pos).match(/[0-9A-Za-z]/g) || []).length;
      const novo = fn(antes);
      if (novo === antes) return;
      input.value = novo;
      let p = novo.length;
      if (!fimDoTexto && pos < antes.length) {
        let cont = 0; p = 0;
        while (p < novo.length && cont < sig) { if (/[0-9A-Za-z]/.test(novo[p])) cont++; p++; }
      }
      try { input.setSelectionRange(p, p); } catch (e) { /* tipos sem seleção */ }
    });
    if (input.value) {
      const ini = input.value;
      if (!(fimDoTexto && !ini.includes(","))) input.value = fn(ini);
    }
    return input;
  },
  definirValor(input, valor) {
    const t = input && input._fenixMascara;
    if (!t) { if (input) input.value = valor == null ? "" : valor; return input; }
    if (t === "moeda") input.value = typeof valor === "number" ? mascaras.numeroParaMoeda(valor) : mascaras.moeda(valor);
    else if (t === "percentual") input.value = typeof valor === "number" ? _numeroParaTexto(valor) + "%" : mascaras.percentual(valor);
    else if (t === "ie") input.value = mascaras.ie(valor, input.getAttribute("data-mask-uf"));
    else input.value = (t === "cpfcnpj" ? mascaras.cpfCnpj : mascaras[t])(valor);
    return input;
  },
  auto(raiz) {
    if (typeof document === "undefined") return 0;
    const ligar = el => el.getAttribute && mascaras.aplicar(el, el.getAttribute("data-mask"));
    const r = raiz || document;
    let n = 0;
    r.querySelectorAll("[data-mask]").forEach(el => { if (ligar(el)) n++; });
    if (!mascaras._obs && typeof MutationObserver !== "undefined") {
      mascaras._obs = new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(nd => {
        if (nd.nodeType !== 1) return;
        if (nd.matches && nd.matches("[data-mask]")) ligar(nd);
        if (nd.querySelectorAll) nd.querySelectorAll("[data-mask]").forEach(ligar);
      })));
      mascaras._obs.observe(document.documentElement, { childList: true, subtree: true });
    }
    return n;
  }
};
function _normalizarTipoMascara(t) {
  t = String(t || "").toLowerCase().replace(/[^a-z]/g, "");
  return t === "documento" || t === "cpfoucnpj" ? "cpfcnpj" : t;
}

// ============================================================================
// 12. DADOS PESSOAIS E SINCRONIA ENTRE APARELHOS (v4.2)
// ============================================================================
/**
 * DADOS PESSOAIS (app sem empresa: o dado é do usuário).
 * Grava em dados_pessoais/{uid}/{nomeApp}/{chave} (caminho que as regras do
 * Firestore já liberam só para o dono do uid). Um documento por chave.
 *
 *   const dp = FenixCore.criarModuloDadosPessoais(db, uid, "fenix-gestor-do-tempo");
 *   await dp.salvar("config", { tema: "claro" });
 *   const cfg = await dp.carregar("config");
 *   const parar = dp.escutar("config", dados => { ... });   // tempo real
 */
function criarModuloDadosPessoais(db, uid, nomeApp) {
  if (!uid) throw new Error("criarModuloDadosPessoais: falta o uid do usuário logado.");
  if (!nomeApp) throw new Error("criarModuloDadosPessoais: falta o nome do app.");
  const ref = chave => doc(db, "dados_pessoais", uid, nomeApp, String(chave));
  return {
    salvar(chave, dados) {
      return setDoc(ref(chave), { dados: _limparParaFirestore(dados), ts: Date.now(), atualizadoEm: serverTimestamp() }).then(() => true);
    },
    carregar(chave) {
      return getDoc(ref(chave)).then(snap => snap.exists() ? snap.data().dados : null);
    },
    excluir(chave) {
      return deleteDoc(ref(chave)).then(() => true);
    },
    listar() {
      return getDocs(collection(db, "dados_pessoais", uid, nomeApp))
        .then(snap => snap.docs.map(d => ({ chave: d.id, dados: d.data().dados, ts: d.data().ts })));
    },
    /** Tempo real de uma chave. Devolve a função que para de escutar. */
    escutar(chave, aoMudar, aoErro) {
      return onSnapshot(ref(chave), snap => aoMudar(snap.exists() ? snap.data().dados : null), aoErro || function () {});
    },
    /** Tempo real de todas as chaves do app. */
    escutarTudo(aoMudar, aoErro) {
      return onSnapshot(collection(db, "dados_pessoais", uid, nomeApp),
        snap => aoMudar(snap.docs.map(d => ({ chave: d.id, dados: d.data().dados, ts: d.data().ts }))), aoErro || function () {});
    }
  };
}

function _limparParaFirestore(v) {
  return v === undefined ? null : JSON.parse(JSON.stringify(v));
}

/**
 * SINCRONIA DE UMA TABELA entre aparelhos, em tempo real e com offline.
 * O app continua guardando a lista no aparelho (localStorage) e passa a
 * chamar sync.salvar / sync.excluir em vez de mexer na lista direto.
 *
 *   const sync = FenixCore.criarSincronia(db, {
 *     escopo: "pessoal",              // "pessoal" (por usuário) ou "empresa"
 *     uid: user.uid,                  // escopo pessoal
 *     // empresaId: "abc123",         // escopo empresa
 *     nomeApp: "fenix-gestor-do-tempo",
 *     tabela: "tarefas",
 *     lerLocal:   () => JSON.parse(localStorage.getItem("tarefas") || "[]"),
 *     gravarLocal: arr => localStorage.setItem("tarefas", JSON.stringify(arr)),
 *     aoMudar:    (arr, info) => desenharTela(arr),   // info.origem: "local" | "nuvem"
 *     aoMudarEstado: est => mostrarIndicador(est)     // "sincronizado" | "sincronizando" | "offline" | "erro"
 *   });
 *   sync.iniciar();
 *   sync.salvar({ id: "t1", titulo: "Ligar para o cliente" });
 *   sync.excluir("t1");
 *
 * Como funciona: cada registro vira um documento (tabela__id) com a hora da
 * última alteração. Em conflito vale a alteração mais recente (por registro).
 * Exclusão grava uma marca de "apagado" para valer nos outros aparelhos.
 * Sem internet, as alterações ficam numa fila no aparelho e sobem sozinhas ao
 * reconectar (evento online e nova tentativa a cada 5 minutos, regra 3).
 * Primeiro uso: o que só existe no aparelho sobe; se o mesmo id já existir na
 * nuvem, vale a nuvem. Limite: usa o relógio do aparelho (aparelhos com a hora
 * muito errada podem "ganhar" conflitos).
 */
function criarSincronia(db, opcoes) {
  const o = opcoes || {};
  const campoId = o.campoId || "id";
  if (!o.nomeApp || !o.tabela) throw new Error("criarSincronia: faltam nomeApp e tabela.");
  if (typeof o.lerLocal !== "function" || typeof o.gravarLocal !== "function") throw new Error("criarSincronia: faltam lerLocal e gravarLocal.");
  let colecao;
  if (o.escopo === "empresa") {
    if (!o.empresaId) throw new Error("criarSincronia: escopo empresa pede empresaId.");
    colecao = ["empresas", o.empresaId, o.nomeApp + "_sync"];
  } else {
    if (!o.uid) throw new Error("criarSincronia: escopo pessoal pede uid.");
    colecao = ["dados_pessoais", o.uid, o.nomeApp];
  }
  const chaveLocal = "fenix-sync:" + colecao.join("/") + ":" + o.tabela + (o.sufixoLocal || "");
  const online = o.estaOnline || (() => typeof navigator === "undefined" || navigator.onLine !== false);
  const memoria = {};
  const ler = (k, padrao) => { try { const t = localStorage.getItem(k); return t ? JSON.parse(t) : padrao; } catch (e) { return memoria[k] || padrao; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { memoria[k] = v; } };
  let meta = ler(chaveLocal + ":meta", {});   // { id: { ts, apagado } }
  let pend = ler(chaveLocal + ":pend", {});   // { id: true }
  let estado = "sincronizado", cancelar = null, timer = null, enviando = false, primeira = true, ligado = false;
  const docRef = id => doc(db, ...colecao, o.tabela + "__" + id);
  const mudarEstado = e => { if (e !== estado) { estado = e; if (o.aoMudarEstado) o.aoMudarEstado(e); } };
  const salvarEstado = () => { gravar(chaveLocal + ":meta", meta); gravar(chaveLocal + ":pend", pend); };
  const itens = () => { const a = o.lerLocal(); return Array.isArray(a) ? a : []; };
  const proximoTs = id => Math.max(Date.now(), ((meta[id] && meta[id].ts) || 0) + 1);

  async function enviar() {
    if (enviando) return;
    const ids = Object.keys(pend);
    if (!ids.length) { if (online()) mudarEstado("sincronizado"); else mudarEstado("offline"); return; }
    if (!online()) { mudarEstado("offline"); return; }
    enviando = true; mudarEstado("sincronizando");
    try {
      for (const id of ids) {
        const m = meta[id] || { ts: Date.now() };
        const reg = itens().find(x => String(x[campoId]) === String(id));
        if (!m.apagado && !reg) { delete pend[id]; continue; }
        await setDoc(docRef(id), {
          tabela: o.tabela, id: String(id), dados: m.apagado ? null : _limparParaFirestore(reg),
          ts: m.ts, apagado: !!m.apagado, atualizadoEm: serverTimestamp()
        });
        delete pend[id]; salvarEstado();
      }
      mudarEstado("sincronizado");
    } catch (e) {
      mudarEstado(online() ? "erro" : "offline");
    } finally { enviando = false; }
  }

  function aplicarNuvem(docs) {
    let arr = itens(), mudou = false;
    const vistos = {};
    docs.forEach(d => {
      const r = d.data();
      if (!r || r.tabela !== o.tabela) return;
      const id = String(r.id); vistos[id] = true;
      const m = meta[id];
      if (!m || r.ts > m.ts) {
        arr = arr.filter(x => String(x[campoId]) !== id);
        if (!r.apagado && r.dados) arr.push(r.dados);
        meta[id] = { ts: r.ts, apagado: !!r.apagado }; delete pend[id]; mudou = true;
      } else if (r.ts < m.ts) { pend[id] = true; }
    });
    if (primeira) {
      primeira = false;
      itens().forEach(x => { const id = String(x[campoId]); if (!vistos[id] && !(meta[id] && meta[id].apagado)) { if (!meta[id]) meta[id] = { ts: Date.now() }; pend[id] = true; } });
    }
    salvarEstado();
    if (mudou) { o.gravarLocal(arr); if (o.aoMudar) o.aoMudar(arr, { origem: "nuvem" }); }
    return enviar();
  }

  function assinar() {
    if (cancelar || !ligado) return;
    if (!online()) { mudarEstado("offline"); return; }
    mudarEstado("sincronizando");
    cancelar = onSnapshot(query(collection(db, ...colecao), where("tabela", "==", o.tabela)),
      snap => { aplicarNuvem(snap.docs); },
      () => { cancelar = null; mudarEstado(online() ? "erro" : "offline"); });
  }

  const aoVoltar = () => { assinar(); enviar(); };
  return {
    iniciar() {
      if (ligado) return;
      ligado = true;
      if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("online", aoVoltar);
      timer = setInterval(aoVoltar, 5 * 60 * 1000);
      assinar(); enviar();
    },
    parar() {
      ligado = false;
      if (cancelar) { cancelar(); cancelar = null; }
      if (timer) { clearInterval(timer); timer = null; }
      if (typeof window !== "undefined" && window.removeEventListener) window.removeEventListener("online", aoVoltar);
    },
    salvar(reg) {
      const id = reg && reg[campoId];
      if (id == null || id === "") return Promise.reject(new Error("criarSincronia.salvar: o registro precisa do campo '" + campoId + "'."));
      const arr = itens().filter(x => String(x[campoId]) !== String(id)); arr.push(reg);
      o.gravarLocal(arr);
      meta[String(id)] = { ts: proximoTs(String(id)), apagado: false }; pend[String(id)] = true; salvarEstado();
      if (o.aoMudar) o.aoMudar(arr, { origem: "local" });
      return enviar().then(() => true);
    },
    /**
     * Importa uma lista inteira (backup, regra 44) registro a registro, pelo caminho
     * da sincronia: grava no aparelho, entra na fila e sobe de uma vez. Devolve a
     * quantidade importada. Registros sem id são ignorados.
     */
    importarLista(lista) {
      const mapa = new Map();
      (lista || []).forEach(r => { if (r && r[campoId] != null && r[campoId] !== "") mapa.set(String(r[campoId]), r); });
      if (!mapa.size) return Promise.resolve(0);
      const arr = itens().filter(x => !mapa.has(String(x[campoId]))).concat(Array.from(mapa.values()));
      o.gravarLocal(arr);
      mapa.forEach((r, id) => { meta[id] = { ts: proximoTs(id), apagado: false }; pend[id] = true; });
      salvarEstado();
      if (o.aoMudar) o.aoMudar(arr, { origem: "local" });
      return enviar().then(() => mapa.size);
    },
    excluir(id) {
      const arr = itens().filter(x => String(x[campoId]) !== String(id));
      o.gravarLocal(arr);
      meta[String(id)] = { ts: proximoTs(String(id)), apagado: true }; pend[String(id)] = true; salvarEstado();
      if (o.aoMudar) o.aoMudar(arr, { origem: "local" });
      return enviar().then(() => true);
    },
    /** Tenta enviar a fila e reconectar agora (ex.: botão "Sincronizar"). */
    forcarSincronia() { assinar(); return enviar(); },
    estado() { return estado; },
    pendentes() { return Object.keys(pend).length; }
  };
}

// ============================================================================
// 19. LICENÇA DEFINITIVA E TOQUE DE ABERTURA (v4.3)
// ============================================================================

/**
 * Licença definitiva de uso (regra 58 do Livro).
 *  - Verdade: campo `licenca` do documento empresas/{empresaId}. "definitiva"
 *    = licença definitiva; qualquer outro valor, ou sem o campo = teste.
 *    Só é gravado pelo console do Firebase (as regras do Firestore recusam
 *    que o app grave esse campo).
 *  - Antes do login o app não sabe quem é o usuário. Por isso existe o espelho
 *    licencas/{SHA-256 do e-mail} = { licenca: "definitiva" }, de leitura
 *    pontual (get) liberada, e a lembrança no aparelho (localStorage).
 */
const _chaveLicenca = (app) => "fenix_licenca_definitiva_" + String(app || "app");

const licenca = {
  /** Texto único para mostrar quando o Google é negado por falta de licença definitiva. */
  MENSAGEM_GOOGLE: "O login com Google é exclusivo da licença definitiva. Entre com e-mail e senha.",
  /** Data-limite (Date) de licencaAte: "AAAA-MM-DD" (vale até o fim do dia), Timestamp do Firestore ou Date. */
  dataLimite(dados) {
    const v = dados && typeof dados === "object" ? dados.licencaAte : null;
    if (!v) return null;
    if (typeof v.toDate === "function") return v.toDate();
    if (typeof v.seconds === "number") return new Date(v.seconds * 1000);
    if (v instanceof Date) return v;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
    return m ? new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59) : null;
  },
  /**
   * Situação da licença: { tipo: "definitiva" | "teste" | "vencida", ate: Date|null, dias: número|null }.
   * "vencida" = tinha prazo (licencaAte) e o prazo passou. `dias` = dias que faltam (0 no último dia).
   */
  situacao(dados, agora) {
    const t = (typeof dados === "string") ? dados : (dados && dados.licenca);
    const def = String(t || "").trim().toLowerCase() === "definitiva";
    const ate = licenca.dataLimite(dados);
    const hoje = agora || new Date();
    if (ate) {
      const dias = Math.max(0, Math.floor((ate.getTime() - hoje.getTime()) / 86400000));
      if (ate.getTime() < hoje.getTime()) return { tipo: "vencida", ate, dias: 0 };
      return { tipo: def ? "definitiva" : "teste", ate, dias };
    }
    return { tipo: def ? "definitiva" : "teste", ate: null, dias: null };
  },
  /** true se a licença é definitiva e não está vencida (objeto da empresa, espelho ou texto). */
  ehDefinitiva(dados, agora) {
    return licenca.situacao(dados, agora).tipo === "definitiva";
  },
  /** SHA-256 (hex) do e-mail em minúsculas: o ID do espelho licencas/{id}. */
  async hashEmail(email) {
    const txt = String(email || "").trim().toLowerCase();
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  },
  /** Lê empresas/{empresaId} e diz se a licença é definitiva (exige login). */
  async daEmpresa(db, empresaId) {
    if (!db || !empresaId) return false;
    const snap = await getDoc(doc(db, "empresas", empresaId));
    return snap.exists() && licenca.ehDefinitiva(snap.data());
  },
  /** Consulta o espelho licencas/{hash do e-mail} (funciona antes do login). */
  async porEmail(db, email) {
    if (!db || !email) return false;
    const snap = await getDoc(doc(db, "licencas", await licenca.hashEmail(email)));
    return snap.exists() && licenca.ehDefinitiva(snap.data());
  },
  /** Guarda neste aparelho se a licença é definitiva (por app). */
  lembrar(app, sim) {
    try { if (sim) localStorage.setItem(_chaveLicenca(app), "1"); else localStorage.removeItem(_chaveLicenca(app)); } catch (e) {}
  },
  lembrada(app) {
    try { return localStorage.getItem(_chaveLicenca(app)) === "1"; } catch (e) { return false; }
  },
  /**
   * Decide se o botão Entrar com Google deve aparecer.
   * opcoes: { app, email?, empresaId? }. Sem rede ou com erro, vale o que o
   * aparelho lembra. Sempre devolve true ou false, nunca lança erro.
   */
  async liberaGoogle(db, opcoes) {
    const o = opcoes || {};
    try {
      let r = null;
      if (o.empresaId) r = await licenca.daEmpresa(db, o.empresaId);
      else if (o.email) { if (await licenca.porEmail(db, o.email)) r = true; }
      if (r === true) { licenca.lembrar(o.app, true); return true; }
      if (r === false && o.empresaId) { licenca.lembrar(o.app, false); return false; }
    } catch (e) { /* offline ou sem permissão: vale a lembrança do aparelho */ }
    return licenca.lembrada(o.app);
  },
  /**
   * Chame logo depois de entrarComGoogle(): confirma a licença do usuário
   * (pelo vínculo com a empresa ou pelo espelho do e-mail). Se não for
   * definitiva, sai da conta e devolve false. `modAuth` é o criarModuloAuth(app).
   */
  async confirmarAposGoogle(db, modAuth, usuario, app) {
    let ok = false;
    try {
      const v = await getDoc(doc(db, "usuarios_empresa", usuario.uid));
      if (v.exists() && v.data().empresaId) ok = await licenca.daEmpresa(db, v.data().empresaId);
      if (!ok && usuario.email) ok = await licenca.porEmail(db, usuario.email);
    } catch (e) { ok = false; }
    licenca.lembrar(app, ok);
    if (!ok) { try { await modAuth.sair(); } catch (e) {} }
    return ok;
  }
};

/**
 * Toque de abertura "Asas": três notas, Lá (440 Hz), Ré (587,33 Hz) e Lá
 * (880 Hz), duas curtas e uma longa, no ritmo de Fê-ni-x. Sintetizado pelo
 * navegador (Web Audio), sem arquivo de áudio. Navegadores só tocam som depois
 * de um toque do usuário: com somentePermitido, o toque só sai se o navegador
 * já permitir; sem ele, use dentro de um clique (ex.: login que deu certo).
 */
const _SOM_NOTAS = [[440, 0, 0.28], [587.33, 0.2, 0.28], [880, 0.4, 1.0]];
const _chaveSom = "fenix_som";
const _chaveSomSessao = "fenix_toque_tocado";

const som = {
  /** Som ligado? (padrão: sim). */
  ligado() { try { return localStorage.getItem(_chaveSom) !== "off"; } catch (e) { return true; } },
  /** Liga ou desliga o som neste aparelho. */
  definir(sim) { try { localStorage.setItem(_chaveSom, sim ? "on" : "off"); } catch (e) {} },
  /** Escreve as três notas em um AudioContext (também serve para testes offline). */
  sintetizar(c, inicio) {
    const t0 = (inicio === undefined ? c.currentTime : inicio) + 0.05;
    const saida = c.createGain(); saida.gain.value = 0.32;
    const eco = c.createDelay(); eco.delayTime.value = 0.17;
    const fb = c.createGain(); fb.gain.value = 0.28; eco.connect(fb); fb.connect(eco);
    const molhado = c.createGain(); molhado.gain.value = 0.22;
    saida.connect(c.destination); saida.connect(eco); eco.connect(molhado); molhado.connect(c.destination);
    _SOM_NOTAS.forEach((n) => {
      const f = n[0], ini = t0 + n[1], dur = n[2];
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, ini);
      g.gain.exponentialRampToValueAtTime(1, ini + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
      const o1 = c.createOscillator(); o1.type = "triangle"; o1.frequency.value = f;
      const o2 = c.createOscillator(); o2.type = "sine"; o2.frequency.value = f * 2;
      const g2 = c.createGain(); g2.gain.value = 0.22;
      o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(saida);
      o1.start(ini); o2.start(ini); o1.stop(ini + dur + 0.05); o2.stop(ini + dur + 0.05);
    });
  },
  /**
   * Toca o toque de abertura. opcoes: { somentePermitido, forcar }.
   * Toca no máximo uma vez por sessão (a menos que forcar). Devolve true se tocou.
   */
  async tocarAbertura(opcoes) {
    const o = opcoes || {};
    try {
      if (!som.ligado()) return false;
      if (!o.forcar && sessionStorage.getItem(_chaveSomSessao) === "1") return false;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      const c = new AC();
      if (o.somentePermitido && c.state !== "running") { try { c.close(); } catch (e) {} return false; }
      if (c.state === "suspended" && c.resume) { try { await c.resume(); } catch (e) {} }
      som.sintetizar(c);
      try { sessionStorage.setItem(_chaveSomSessao, "1"); } catch (e) {}
      setTimeout(() => { try { c.close(); } catch (e) {} }, 2500);
      return true;
    } catch (e) { return false; }
  }
};

// ============================================================================
// 20. PREFERÊNCIAS DO USUÁRIO: SOM, MOVIMENTO E TEMA (v4.4)
// ============================================================================

/**
 * Preferências guardadas neste aparelho (localStorage), valem para todos os
 * apps do mesmo endereço: som de abertura (FenixCore.som), animações reduzidas
 * e tema (claro, escuro ou automático). `aplicar()` coloca na página a classe
 * `fenix-sem-movimento` e o atributo `data-tema` no <html>; os templates de
 * login e splash já reagem a eles. `montarTela(container, { tema: false })` desenha
 * os controles prontos (use na tela Sobre ou no menu do avatar, regra 60);
 * com tema:false o seletor de tema não aparece (app sem o grupo J).
 */
const _chaveMov = "fenix_movimento";
const _chaveTema = "fenix_tema";

const preferencias = {
  /** true se o usuário pediu animações reduzidas OU se o sistema pede (prefers-reduced-motion). */
  animacoesReduzidas() {
    try { if (localStorage.getItem(_chaveMov) === "reduzido") return true; } catch (e) {}
    try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; }
  },
  /** Só a escolha do usuário (sem olhar o sistema). */
  animacoesReduzidasEscolhidas() { try { return localStorage.getItem(_chaveMov) === "reduzido"; } catch (e) { return false; } },
  definirAnimacoesReduzidas(sim) {
    try { if (sim) localStorage.setItem(_chaveMov, "reduzido"); else localStorage.removeItem(_chaveMov); } catch (e) {}
    preferencias.aplicar();
  },
  /** "claro", "escuro" ou "auto" (segue o sistema). */
  tema() { try { const t = localStorage.getItem(_chaveTema); return (t === "claro" || t === "escuro") ? t : "auto"; } catch (e) { return "auto"; } },
  definirTema(t) {
    try { if (t === "claro" || t === "escuro") localStorage.setItem(_chaveTema, t); else localStorage.removeItem(_chaveTema); } catch (e) {}
    preferencias.aplicar();
  },
  /** Aplica as preferências na página (idempotente). */
  aplicar() {
    if (typeof document === "undefined" || !document.documentElement) return;
    const h = document.documentElement;
    h.classList.toggle("fenix-sem-movimento", preferencias.animacoesReduzidasEscolhidas());
    const t = preferencias.tema();
    if (t === "auto") h.removeAttribute("data-tema"); else h.setAttribute("data-tema", t);
  },
  /** Desenha os controles Som de abertura, Reduzir animações e Tema dentro do container. */
  montarTela(container, opcoes) {
    const op = opcoes || {};
    const alvo = (typeof container === "string") ? document.querySelector(container) : container;
    if (!alvo) throw new Error("preferencias.montarTela: container não encontrado.");
    alvo.innerHTML = "";
    const caixa = document.createElement("div");
    caixa.style.cssText = "display:flex;flex-direction:column;gap:6px";
    const linha = (rotulo, el) => {
      const l = document.createElement("label");
      l.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;font-size:.95rem";
      const s = document.createElement("span"); s.textContent = rotulo; l.appendChild(s); l.appendChild(el); caixa.appendChild(l);
    };
    const chk = (marcado, aoMudar) => { const i = document.createElement("input"); i.type = "checkbox"; i.checked = marcado; i.style.cssText = "width:20px;height:20px"; i.addEventListener("change", () => aoMudar(i.checked)); return i; };
    linha("Som de abertura", chk(som.ligado(), (v) => som.definir(v)));
    linha("Reduzir animações", chk(preferencias.animacoesReduzidasEscolhidas(), (v) => preferencias.definirAnimacoesReduzidas(v)));
    if (op.tema !== false) {   // opcoes.tema = false esconde o seletor (app sem o grupo J, tema escuro)
      const sel = document.createElement("select"); sel.style.cssText = "min-height:44px;font-size:.95rem";
      [["auto", "Automático"], ["claro", "Claro"], ["escuro", "Escuro"]].forEach((o) => { const opt = document.createElement("option"); opt.value = o[0]; opt.textContent = o[1]; sel.appendChild(opt); });
      sel.value = preferencias.tema(); sel.addEventListener("change", () => preferencias.definirTema(sel.value));
      linha("Tema", sel);
    }
    alvo.appendChild(caixa);
    return caixa;
  }
};
if (typeof document !== "undefined") { try { preferencias.aplicar(); } catch (e) {} }

// ============================================================================
// 20. SINCRONIA PESSOAL POR COLEÇÃO (v4.5, linhagem v2.x) — dados privados do usuário, multi-aparelho
// ============================================================================
/**
 * Estrutura: dados_pessoais/{uid}/{nomeApp}_{colecao}/{id}
 * Cada documento é gravado por inteiro (a última gravação vale) e leva o campo
 * interno "_u" (horário corrigido pelo servidor, em ms), que não é devolvido
 * ao app: o app recebe "atualizadoEm" à parte.
 * @param {object} db - de initFirebaseComCache() (ou initFirebase())
 * @param {string} uid - uid do usuário logado
 * @param {string} nomeApp - namespace do app, ex: "fenix-tempo"
 */
function criarModuloSincronia(db, uid, nomeApp) {
  if (!uid) throw new Error("criarModuloSincronia: faltou o uid do usuário logado.");
  if (!nomeApp) throw new Error("criarModuloSincronia: faltou o nomeApp.");
  const CHAVE_RELOGIO = "fenix_relogio__" + nomeApp;
  let offset = 0;
  try { const v = Number(localStorage.getItem(CHAVE_RELOGIO)); if (isFinite(v)) offset = v; } catch (e) { /* sem storage */ }
  const nomeCol = nome => nomeApp + "_" + nome;
  const col = nome => collection(db, "dados_pessoais", uid, nomeCol(nome));
  const ref = (nome, id) => doc(db, "dados_pessoais", uid, nomeCol(nome), String(id));
  const agora = () => Date.now() + offset;
  // Firestore não aceita "undefined": remove-os (e copia o objeto).
  const limpar = obj => JSON.parse(JSON.stringify(obj));
  const comMarca = obj => ({ ...limpar(obj), _u: agora() });

  return {
    /** Horário atual corrigido pela diferença com o servidor. */
    agora,
    /** Diferença atual (ms) entre o servidor e o relógio do aparelho. */
    relogio() { return offset; },

    /**
     * Escuta uma coleção em tempo real.
     * aoMudar(mudancas, meta): mudancas = [{tipo:"added"|"modified"|"removed", id, dados,
     *   atualizadoEm, pendente}]; pendente=true é uma gravação deste aparelho ainda não
     *   confirmada. meta = {doCache, pendente}; doCache=true quando veio só do cache.
     * @returns {function} cancela a escuta
     */
    ouvir(nome, aoMudar, aoErro) {
      return onSnapshot(col(nome), snap => {
        const mudancas = snap.docChanges().map(c => {
          const dados = c.doc.data();
          const atualizadoEm = dados._u || 0;
          delete dados._u;
          return { tipo: c.type, id: c.doc.id, dados, atualizadoEm, pendente: c.doc.metadata.hasPendingWrites };
        });
        aoMudar(mudancas, { doCache: snap.metadata.fromCache, pendente: snap.metadata.hasPendingWrites });
      }, err => {
        if (typeof aoErro === "function") aoErro(err);
        else console.error("FenixCore.sincronia:", err);
      });
    },

    /** Grava (substitui) um documento; obj.id é obrigatório. */
    salvar(nome, obj) {
      if (!obj || obj.id == null) return Promise.reject(new Error(nome + ": registro sem id."));
      return setDoc(ref(nome, obj.id), comMarca(obj));
    },

    /** Grava vários documentos (em lotes de 400). */
    async salvarVarios(nome, lista) {
      for (let i = 0; i < lista.length; i += 400) {
        const lote = writeBatch(db);
        lista.slice(i, i + 400).forEach(o => {
          if (o == null || o.id == null) throw new Error(nome + ": registro sem id.");
          lote.set(ref(nome, o.id), comMarca(o));
        });
        await lote.commit();
      }
      return true;
    },

    excluir(nome, id) {
      if (id == null) return Promise.reject(new Error(nome + ": faltou o id para excluir."));
      return deleteDoc(ref(nome, id));
    },

    /** Apaga TODOS os documentos do usuário nas coleções informadas (ex.: ["dias","regs"]). */
    async apagarTudo(colecoes) {
      for (const nome of colecoes) {
        const snap = await getDocs(col(nome));
        const docs = snap.docs;
        for (let i = 0; i < docs.length; i += 400) {
          const lote = writeBatch(db);
          docs.slice(i, i + 400).forEach(d => lote.delete(d.ref));
          await lote.commit();
        }
      }
      return true;
    },

    /**
     * Mede a diferença entre o relógio do aparelho e o do servidor (ms) e guarda
     * no aparelho. Precisa de internet; sem resposta em 8 s mantém o valor anterior.
     */
    async medirRelogio() {
      const r = doc(db, "dados_pessoais", uid, nomeCol("sistema"), "relogio");
      const medir = (async () => {
        const t0 = Date.now();
        await setDoc(r, { t: serverTimestamp() });
        const t1 = Date.now();
        const snap = await getDocFromServer(r);
        const t = snap.data() && snap.data().t;
        if (!t || !t.toMillis) return offset;
        return Math.round(t.toMillis() - (t0 + t1) / 2);
      })();
      const limite = new Promise(res => setTimeout(() => res(null), 8000));
      const novo = await Promise.race([medir, limite]).catch(() => null);
      if (novo != null && isFinite(novo)) {
        offset = novo;
        try { localStorage.setItem(CHAVE_RELOGIO, String(offset)); } catch (e) { /* sem storage */ }
      }
      return offset;
    }
  };
}

// ============================================================================
// 21. ACESSO COM APROVAÇÃO (v4.5, linhagem v2.x) — cadastro aberto, liberação pelo administrador
// ============================================================================
/**
 * Estrutura: {colecao}/{uid} -> { email, nome, status, criadoEm, decididoEm, decididoPor }
 *            admins/{uid}    -> documento qualquer, criado à mão no console (quem tem é administrador)
 * status: "pendente" (recém-cadastrado) | "aprovado" | "bloqueado".
 * Quem aprova é o administrador; as regras do firestore.rules garantem isso.
 * @param {object} db
 * @param {string} colecao - padrão "perfis"
 */
function criarModuloAcesso(db, colecao = "perfis") {
  const ref = uid => doc(db, colecao, uid);
  return {
    obter(uid) {
      return getDoc(ref(uid)).then(s => s.exists() ? { uid: s.id, ...s.data() } : null);
    },
    /** Acompanha o perfil em tempo real (ex.: para liberar o app quando for aprovado). */
    ouvir(uid, aoMudar, aoErro) {
      return onSnapshot(ref(uid), s => aoMudar(s.exists() ? { uid: s.id, ...s.data() } : null),
        err => { if (typeof aoErro === "function") aoErro(err); });
    },
    /** Pede acesso: cria o perfil como "pendente". */
    solicitar(uid, email, nome) {
      return setDoc(ref(uid), {
        email: (email || "").toString().trim().toLowerCase(),
        nome: (nome || "").toString().trim(),
        status: "pendente",
        criadoEm: serverTimestamp()
      });
    },
    /** true se o usuário é administrador (existe admins/{uid}). */
    ehAdmin(uid) {
      return getDoc(doc(db, "admins", uid)).then(s => s.exists()).catch(() => false);
    },
    /** Só administrador. status = "pendente" | "aprovado" | "bloqueado" | null (todos). */
    listar(status = null) {
      const q = status ? query(collection(db, colecao), where("status", "==", status)) : collection(db, colecao);
      return getDocs(q).then(s => s.docs.map(d => ({ uid: d.id, ...d.data() })));
    },
    /** Só administrador. */
    definirStatus(uid, status, adminUid) {
      return updateDoc(ref(uid), { status, decididoEm: serverTimestamp(), decididoPor: adminUid || null });
    },
    excluir(uid) {
      return deleteDoc(ref(uid));
    }
  };
}


// ============================================================================
// 22. SELO DE VERSÕES (v4.6, regra 61) — "v3.2 | c 4.6" + aviso de core novo
// ============================================================================

const _CORE_VERSAO = "4.8";
const _VERSOES_URL = "https://fenicris-dev.github.io/Fenix-Core/versao.json";
const _VERSOES_CHAVE = "fenix_versoes_check";
const _VERSOES_INTERVALO = 6 * 60 * 60 * 1000; // consulta a rede no máximo a cada 6 horas

function _cmpVersao(a, b) {
  const pa = _semV(a).split(".").map(n => parseInt(n, 10) || 0);
  const pb = _semV(b).split(".").map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

const versoes = {
  /** Versão deste arquivo do core, por exemplo "4.6". */
  core: _CORE_VERSAO,

  /** Compara duas versões ("4.10" > "4.9"). Retorna 1, 0 ou -1. */
  comparar: _cmpVersao,

  /** Texto do selo: selo("3.2") ou selo("v3.2") → "v3.2 | c 4.6". */
  selo(versaoApp) {
    const v = _semV(versaoApp);
    return (v ? "v" + v + " | " : "") + "c " + _CORE_VERSAO;
  },

  /**
   * Consulta o versao.json publicado (só com internet). Nunca lança erro.
   * @param {object} [opcoes] - { url, forcar (ignora o intervalo de 6 h), tempoMs (padrão 6000) }
   * @returns {Promise<{online:boolean, coreEmUso:string, publicada:{core:string,livro:string}|null, nova:boolean}>}
   */
  async verificar(opcoes = {}) {
    const base = { online: false, coreEmUso: _CORE_VERSAO, publicada: null, nova: false };
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) return base;
      if (typeof fetch !== "function") return base;
      if (!opcoes.forcar) {
        try {
          const g = JSON.parse(localStorage.getItem(_VERSOES_CHAVE) || "null");
          if (g && g.publicada && Date.now() - g.em < _VERSOES_INTERVALO)
            return { online: true, coreEmUso: _CORE_VERSAO, publicada: g.publicada, nova: _cmpVersao(g.publicada.core, _CORE_VERSAO) > 0 };
        } catch (e) { /* sem localStorage: segue para a rede */ }
      }
      const ctl = typeof AbortController === "function" ? new AbortController() : null;
      const t = ctl ? setTimeout(() => ctl.abort(), opcoes.tempoMs || 6000) : null;
      let resp;
      try {
        const url = (opcoes.url || _VERSOES_URL) + "?t=" + Date.now();
        resp = await fetch(url, { cache: "no-store", signal: ctl ? ctl.signal : undefined });
      } finally { if (t) clearTimeout(t); }
      if (!resp || !resp.ok) return base;
      const j = await resp.json();
      if (!j || !j.core) return base;
      const publicada = { core: _semV(j.core), livro: j.livro ? _semV(j.livro) : "" };
      try { localStorage.setItem(_VERSOES_CHAVE, JSON.stringify({ em: Date.now(), publicada })); } catch (e) { /* ok */ }
      return { online: true, coreEmUso: _CORE_VERSAO, publicada, nova: _cmpVersao(publicada.core, _CORE_VERSAO) > 0 };
    } catch (e) {
      return base;
    }
  },

  /**
   * Desenha o selo "v3.2 | c 4.6" dentro do container e, com internet,
   * acrescenta o indicador de core novo (amarelo) ou de core abaixo do
   * mínimo (vermelho). Tocar no selo mostra a explicação.
   * @param {Element|string} container
   * @param {string} versaoApp - versão do app, por exemplo "3.2"
   * @param {object} [opcoes] - { coreMinimo, livro, verificar (padrão true), detalhe (mostra a explicação aberta) }
   * @returns {Element} o elemento do selo
   */
  montarSelo(container, versaoApp, opcoes = {}) {
    const alvo = _resolverContainer(container);
    if (!alvo) throw new Error("versoes.montarSelo: container não encontrado.");
    _injetarEstilos();
    const { coreMinimo, livro } = opcoes;
    const abaixo = !!coreMinimo && _cmpVersao(_CORE_VERSAO, coreMinimo) < 0;
    const el = document.createElement("button");
    el.type = "button";
    el.className = "fx-selo";
    el.setAttribute("data-fx-selo", "");
    const msg = document.createElement("div");
    msg.hidden = !opcoes.detalhe;
    const texto = () => {
      const l = ["v = versão do app, c = versão do core" + (livro ? ", l = versão do Livro das Regras (" + _semV(livro) + ")" : "") + "."];
      return l.join(" ");
    };
    const pintar = (estado) => {
      let ponto = "";
      let aviso = texto();
      let vermelho = false, amarelo = false;
      if (abaixo) {
        ponto = '<span class="fx-selo-ponto fx-vermelho">⚠ c ' + _esc(_semV(coreMinimo)) + "+</span>";
        aviso = "Este app exige o core " + _semV(coreMinimo) + " ou mais novo e está com o " + _CORE_VERSAO + ". Feche e abra o app com internet para atualizar. " + aviso;
        vermelho = true;
      } else if (estado && estado.nova) {
        ponto = '<span class="fx-selo-ponto">⬆ c ' + _esc(estado.publicada.core) + "</span>";
        amarelo = true;
        aviso = "Existe o core " + estado.publicada.core + " (este app usa o " + _CORE_VERSAO + "). Feche e abra o app com internet para atualizar. " + aviso;
      } else if (estado && estado.online) {
        aviso = "Core em dia (versão publicada: " + estado.publicada.core + "). " + aviso;
      }
      el.innerHTML = "<b>" + _esc(versoes.selo(versaoApp)) + "</b>" + ponto;
      el.title = aviso;
      el.setAttribute("aria-label", "Versões: " + versoes.selo(versaoApp) + ". " + aviso);
      msg.textContent = aviso;
      msg.className = "fx-selo-msg" + (vermelho ? " fx-vermelho" : amarelo ? " fx-amarelo" : "");
      el.dataset.estado = abaixo ? "abaixo" : (estado && estado.nova ? "nova" : (estado && estado.online ? "ok" : "desconhecido"));
    };
    pintar(null);
    el.addEventListener("click", () => { msg.hidden = !msg.hidden; });
    alvo.innerHTML = "";
    alvo.appendChild(el);
    alvo.appendChild(msg);
    if (opcoes.verificar !== false) {
      versoes.verificar().then(est => { if (el.isConnected) pintar(est); });
    }
    return el;
  }
};

// ============================================================================
// EXPORTAÇÃO
// ============================================================================

export const FenixCore = {
  init,
  initFirebase,
  initFirebaseComCache,
  criarModuloAuth,
  criarModuloEmpresas,
  criarModuloConvites,
  criarModuloEquipe,
  criarModuloAppData,
  criarModuloMateriais,
  criarModuloProdutosServicos,
  criarModuloFamiliasMateriais,
  criarModuloCatalogoEmpresa,
  criarModuloPessoas,
  criarModuloDadosPessoais,
  criarSincronia,
  criarModuloSincronia,
  criarModuloAcesso,
  licenca,
  som,
  preferencias,
  versoes,
  pessoas,
  produtos,
  localidades,
  backup,
  sobre,
  manual,
  dashboard,
  mascaras,
  validarCPF,
  validarCNPJ,
  formatarCPF,
  formatarCNPJ,
  formatarDocumento,
  limparDocumento,
  normalizarBusca,
  formatarTitulo,
  formatarNomeMaiusculo,
  tipoDocumento,
  CPF_CNPJ_DISCLOSURE,
  EMPRESA
};

/**
 * ============================================================================
 * EXEMPLO DE USO EM UM APP (ex: Fênix Financiamentos)
 * ============================================================================
 *
 * <script type="module">
 *   import { FenixCore } from "https://fenicris-dev.github.io/Fenix-Core/fenix-core.js";
 *
 *   FenixCore.init("fenix-financiamentos");
 *
 *   // Tela "Sobre": conta o acesso e devolve os textos prontos
 *   const info = FenixCore.sobre.registrarAcesso("fenix-financiamentos", "v1.0");
 *   // info.acessos | info.primeiroAcessoTexto | info.ultimaAtualizacaoTexto
 *
 *   // Alerta de backup (mais de 7 dias sem cópia de segurança):
 *   FenixCore.backup.verificarLembrete("fenix-financiamentos", {
 *     aoFazerBackup: () => FenixCore.backup.baixarJSON("fenix-financiamentos", meusDados)
 *   });
 *
 *   // Dados da Fênix (rodapé, documentos): FenixCore.EMPRESA.razaoSocial, FenixCore.EMPRESA.cnpjFormatado, FenixCore.EMPRESA.email
 *
 *   // Ao digitar o CPF do cliente no formulário:
 *   const cpfDigitado = "12345678900";
 *   const pessoa = await FenixCore.pessoas.buscar(cpfDigitado);
 *
 *   if (pessoa) {
 *     // preenche o formulário automaticamente
 *     document.getElementById("nome").value = pessoa.nome;
 *     document.getElementById("endereco").value = pessoa.endereco?.logradouro || "";
 *   } else {
 *     // mostra formulário de cadastro novo
 *
 *     // 1) Ao digitar o CEP, busca endereço oficial (Correios via ViaCEP):
 *     const endereco = await FenixCore.localidades.buscarPorCEP("49000-000");
 *     if (endereco) {
 *       document.getElementById("logradouro").value = endereco.logradouro;
 *       document.getElementById("cidade").value = endereco.cidade;
 *       document.getElementById("uf").value = endereco.uf;
 *       if (endereco.bairro) {
 *         // CEP trouxe o bairro (caso comum) — já preenche e já está registrado
 *         document.getElementById("bairro").value = endereco.bairro;
 *       } else {
 *         // CEP genérico de cidade pequena, sem bairro — libera campo manual
 *         document.getElementById("bairro").disabled = false;
 *         // ao usuário digitar e sair do campo:
 *         // await FenixCore.localidades.registrarBairro(endereco.codigoIBGE, valorDigitado, "manual");
 *       }
 *     }
 *
 *     // 2) Ao salvar o cadastro:
 *     await FenixCore.pessoas.salvarFisica({
 *       cpf: cpfDigitado,
 *       nome: "João da Silva",
 *       telefone: "(79) 99999-0000",
 *       email: "joao@email.com",
 *       endereco: {
 *         cep: "49000-000", logradouro: "Rua Y", numero: "123",
 *         bairro: "Centro", cidade: "Aracaju", uf: "SE"
 *       }
 *     });
 *   }
 *
 *   // Autocomplete por nome (prefixo, sem diferenciar maiúsculas/acentos):
 *   // const achados = await FenixCore.pessoas.buscarPorNome("joao", "fisica");
 *
 *   // Mesma lógica serve para CNPJ, buscando na Receita Federal:
 *   const dadosReceita = await FenixCore.pessoas.buscarNaReceita("12345678000199");
 *   if (dadosReceita) {
 *     document.getElementById("razaoSocial").value = dadosReceita.razaoSocial;
 *     document.getElementById("cidade").value = dadosReceita.endereco.cidade;
 *     // etc. — depois, ao salvar, chama FenixCore.pessoas.salvarJuridica(dadosReceita)
 *   }
 * </script>
 *
 * // No app operacional (banco próprio do Financiamentos), grava só a referência:
 * // { cpfCliente: "12345678900", valorFinanciado: 15000, ... }
 * // Nunca duplica nome/endereço lá — sempre busca no FenixCore quando precisar exibir.
 * ============================================================================
 */
