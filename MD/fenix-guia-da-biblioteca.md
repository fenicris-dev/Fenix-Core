# GUIA DA BIBLIOTECA FÊNIX (v4.8)

Este guia explica, em português claro, tudo o que existe na biblioteca Fênix: o que cada função do Fênix Core faz e para que serve cada regra do Livro das Regras. Ele também funciona como o **Changelog da biblioteca** (Parte 4). Acompanha todo pacote novo e é atualizado a cada versão, junto com o livro, o core, os templates e os documentos legais, que andam sempre com o mesmo número (regra 7).

Endereço base de tudo: https://fenicris-dev.github.io/Fenix-Core/

## PARTE 1. MAPA DA BIBLIOTECA

| Arquivo | Onde fica | Para que serve |
|----------------------------------------|------------------|------------------------------------------|
| `fenix-core.js` | raiz | Biblioteca de funções que todo app carrega (módulo ES, exporta `FenixCore`). |
| `versao.json` | raiz | Arquivo pequeno com a versão publicada do core e do livro (`{"core":"4.6","livro":"4.6"}`). O selo dos apps (regra 61) o consulta para avisar que existe core novo. Entra em todo pacote. |
| `index.html` | raiz | Painel da biblioteca: testa cada endereço oficial, confere se tudo está na mesma versão e roda testes ao vivo de CNPJ e CEP. |
| `firestore.rules` | raiz | Regras de segurança do Firestore: parte das publicadas no console e traz os reforços v4.0 (regra 46). Publique primeiro o core, depois as regras no console. |
| `fenix-template-login.html` | raiz | Layout oficial de login de todo app com senha, com o farol passando ao fundo e o botão do Google escondido até a licença definitiva. |
| `fenix-template-onboarding.html` | raiz | Layout oficial da tela de primeiro acesso. |
| `fenix-template-splash.html` | raiz | Layout oficial do splash de abertura, com os holofotes duplos de baixo para cima (regras 32 e 59). |
| `Icon/Fenix_Icone_64, 128, 192, 512.png` | pasta `Icon/` | Ícone da águia (branca sobre o degradê): favicon, cabeçalho, PWA, splash e ícone provisório. |
| `Logo/Fenix_Logo_Azul*.png`, `Fenix_Logo_Branca*.png` | pasta `Logo/` | Logo oficial (Azul) e segunda opção (Branca), também em 320 e 640 px. |
| `Logo/Fenix_Logo_Black.png`, `Fenix_Logo_Silver.png`, `Fenix_Logo_Gray.png` | pasta `Logo/` | Logos auxiliares, para escolher o melhor contraste. |
| `Termos/fenix-termos-de-uso.html`, `Termos/fenix-politica-de-privacidade.html` | pasta `Termos/` | Textos legais oficiais, linkados no login e no onboarding. |
| `MD/fenix-livro-das-regras.md`, `DOC/fenix-livro-das-regras.docx` | pastas `MD/` e `DOC/` | O Livro das Regras. |
| `MD/fenix-resumo-do-livro.md`, `DOC/fenix-resumo-do-livro.docx` | pastas `MD/` e `DOC/` | Resumo de uma folha: quais regras do livro valem em cada tipo de trabalho. |
| `MD/fenix-guia-da-biblioteca.md`, `DOC/fenix-guia-da-biblioteca.docx` | pastas `MD/` e `DOC/` | Este guia. |
| `testes-regras/` | pasta ao lado do `firestore.rules` | Testes automáticos das regras do Firestore (emulador local). Rodam no seu computador; não vão para o GitHub Pages. |

Todo material com versão tem duas cópias (regra 11): a **neutra**, sem versão no nome (é a que os apps usam), e a **com versão no nome** (`-v4.8`), só para controle interno.

### Ferramentas de apoio (v4.7)

- **Resumo do livro:** uma folha com sete blocos (vale sempre, app novo, app antigo, alteração pequena, por recurso do app, biblioteca e conflitos). Serve de porta de entrada para quem trabalha nos apps; o livro continua sendo a fonte.
- **Testes das regras do Firestore (`testes-regras/`):** conferem, com o emulador local, o que cada coleção da biblioteca permite e nega (empresas e licença, convites, membros, usuários, coleções da empresa, administradores, perfis, dados pessoais e cidades). Como rodar: dentro da pasta, `npm install` (uma vez) e `npm test`; precisa de Node.js e Java. Se algum teste falhar, não publique as regras. Os testes não substituem o Playground do console.
- **Teste de aparelho (no Painel):** abra o Painel no celular, expanda "Teste de aparelho" e confira o toque Asas, o farol do login e os holofotes do splash (os próprios templates, ao vivo), o selo de versões e os dados do aparelho (tela, conexão, app instalado, tema, movimento reduzido, armazenamento e áudio).
- **Varredura de versões:** antes de cada entrega, procura-se em todos os arquivos qualquer número de versão antigo; é um passo de "Como entregar".

## PARTE 2. O FÊNIX CORE, FUNÇÃO POR FUNÇÃO

### 2.1 Como carregar e iniciar

O core é um módulo ES: não funciona colado como `<script>` comum. Use o carregador oficial da regra 2, que guarda uma cópia no aparelho e permite abrir o app sem internet.

- **`FenixCore.init(nomeApp)`**: liga a conexão com o banco do core (projeto Firebase "fenix-core"). Chame uma vez só, ao abrir o app, com o mesmo identificador do nome do arquivo (ex.: `fenix-controle-obras`). O nome é gravado nos registros como "criado por" e "atualizado por".
- **`FenixCore.initFirebase(config)`**: alternativa ao `init` que devolve `{ app, db }`. Serve para apps que também precisam do objeto `app` para montar o login. Reaproveita a mesma conexão, nunca cria duas.
- Não é preciso colocar credenciais: o core já traz a configuração do projeto.

### 2.2 Dados fixos da Fênix

- **`FenixCore.EMPRESA`**: nome fantasia, razão social (60292 CRISTIANO RODRIGUES), CNPJ (só números e formatado) e e-mail da empresa. Use em rodapés, documentos e na tela Sobre.
- **`FenixCore.CPF_CNPJ_DISCLOSURE`**: o texto fixo "O CPF/CNPJ é usado apenas para emissão de Notas Fiscais e/ou Recibos." (regra 37). Também está em `FenixCore.pessoas.disclosure`.

### 2.3 Ferramentas de texto e de documento (não usam banco)

| Função | O que faz | Exemplo |
|------------------------------|---------------------------------------------|-------------------------|
| `limparDocumento(valor)` | Deixa só os números. | `"123.456.789-09"` vira `"12345678909"` |
| `tipoDocumento(valor)` | Diz se é CPF (11 dígitos, `"fisica"`) ou CNPJ (14 dígitos, `"juridica"`), ou `null`. | |
| `validarCPF(cpf)` / `validarCNPJ(cnpj)` | Confere os dígitos verificadores, não só o formato (regra 38). Recusa sequências repetidas. | `true` ou `false` |
| `formatarCPF`, `formatarCNPJ`, `formatarDocumento` | Colocam a máscara. `formatarDocumento` escolhe sozinha entre CPF e CNPJ. | `"12345678000199"` vira `"12.345.678/0001-99"` |
| `formatarNomeMaiusculo(texto)` | Nome de pessoa ou empresa: tudo em MAIÚSCULAS, sem espaços sobrando (regra 42). | `"joão da silva"` vira `"JOÃO DA SILVA"` |
| `formatarTitulo(texto)` | Demais textos: primeira letra de cada palavra em maiúscula, menos preposições e artigos. Palavras com número ficam como digitadas. | `"RUA DA PAZ"` vira `"Rua da Paz"` |
| `normalizarBusca(texto)` | Maiúsculas e sem acento, para busca. | `"  João "` vira `"JOAO"` |

### 2.4 Pessoas (cadastro nacional de PF e PJ)

Guarda as pessoas em `pessoas_fisicas` (chave = CPF) e `pessoas_juridicas` (chave = CNPJ). Segue a regra de ouro (regra 41): nenhum app cria cadastro próprio de clientes. **Estas funções usam o banco: só com o banco ativo**, exceto as indicadas.

- **`pessoas.buscar(cpfOuCnpj)`**: acha a pessoa pelo documento (detecta PF ou PJ). Devolve os dados ou `null`.
- **`pessoas.salvarFisica(dados)`**: cria ou atualiza uma PF. Valida o CPF, padroniza a escrita e grava `nomeBusca` para a busca por nome. Campos: `cpf`, `nome`, `telefone`, `email`, `endereco`.
- **`pessoas.salvarJuridica(dados)`**: igual, para PJ. Campos: `cnpj`, `razaoSocial`, `nomeFantasia`, `telefone`, `email`, `endereco`.
- **`pessoas.salvar(dados)`**: escolhe PF ou PJ pelo tamanho do documento.
- **`pessoas.buscarPorNome(termo, tipo, max)`**: autocomplete por início do nome, sem diferenciar maiúsculas e acentos. `tipo` é `"fisica"` (padrão) ou `"juridica"`; `max` padrão 10. Cadastros anteriores à v2.0 só aparecem depois de salvos de novo.
- **`pessoas.buscarNaReceita(cnpj)`** (não usa banco): consulta o CNPJ na BrasilAPI e devolve razão social, nome fantasia, situação cadastral, data de abertura, atividade principal, telefone, e-mail e endereço. Lança erro se o CNPJ for inválido e devolve `null` se não achar.
- **`pessoas.consultarCNPJ(cnpj)`** (não usa banco; é a que a regra 35 manda usar): faz o mesmo que a anterior e, se o CNPJ vier só com o CEP, completa logradouro, bairro, cidade e UF pela BrasilAPI de CEP, sem o usuário redigitar. Só preenche o que faltou. Devolve também `origemEndereco` (`"receita"` ou `"receita+brasilapi-cep"`) e `enderecoCompleto` (verdadeiro se logradouro, bairro, cidade e UF vieram). Use dentro de `try/catch`.

### 2.5 Produtos, serviços e soluções (catálogo comum)

Coleção `produtos_servicos`. **Usa o banco.**

- **`produtos.salvar(dados)`**: cria (ID automático) ou atualiza (se vier `id`). Campos: `nome`, `tipo` (`produto`, `servico` ou `solucao`), `categoria`, `descricao`, `precoBase`, `unidade`, `ativo`. Nome e categoria são padronizados.
- **`produtos.buscar(id)`**: devolve um item ou `null`.
- **`produtos.listar({ tipo, apenasAtivos })`**: lista, podendo filtrar por tipo e só ativos (padrão: só ativos).
- **`produtos.excluir(id)`**: apaga o item. Em tela, use a confirmação por palavra (regra 47).

### 2.6 Localidades (CEP, cidades e bairros) e qual função usar

| Função | Fonte | Usa banco? | Quando usar |
|--------------------------------------|------------|--------------------|------------------------------|
| `localidades.buscarPorCEPSemBanco(cep)` | ViaCEP | Não | Padrão enquanto o banco do app estiver desligado (regra 33). |
| `localidades.buscarPorCEP(cep)` | ViaCEP | Sim: grava cidade e bairro | Só com o banco ativo; vai aprendendo cidades e bairros. |
| `localidades.buscarPorCEPBrasilAPI(cep)` | BrasilAPI | Não | Usada por dentro do `consultarCNPJ`; serve de alternativa. |

Todas devolvem `{ cep, logradouro, bairro, cidade, uf, ... }` ou `null` se o CEP não existir, e lançam erro se o CEP não tiver 8 dígitos. O bairro pode vir vazio em cidade pequena: deixe o campo livre para digitar.

- **`localidades.buscarCidadesPorUF(uf)`**: cidades já conhecidas de um estado, para preencher uma lista de escolha. **Usa o banco.**
- **`localidades.buscarBairros(codigoIBGE)`**: bairros já conhecidos de uma cidade, para autocomplete. **Usa o banco.**
- **`localidades.registrarBairro(codigoIBGE, nomeBairro, origem)`**: guarda um bairro novo. `origem` é `"cep"` (oficial) ou `"manual"` (digitado). **Usa o banco.**

### 2.7 Módulos para apps com várias empresas (usados pelo Fênix Ativos e semelhantes)

Todos usam o banco e recebem o `app` ou o `db` que vem do `initFirebase`.

- **`criarModuloAuth(app)`**: login por e-mail e senha e pelo Google. Devolve `aoMudarEstado(callback)`, `entrar(email, senha)`, `criarConta(email, senha)`, `sair()`, `usuarioAtual()` e, desde a v4.2, `entrarComGoogle()`, `resultadoRedirecionamento()` e `redefinirSenha(email)` (seção 2.14).
- **`criarModuloEmpresas(db)`**: `criarEmpresa(uid, email, nome)` (cria a empresa e faz o usuário dono), `obterEmpresa(empresaId)`, `obterEmpresaDoUsuario(uid)` e `repararVinculo(uid, dadosParciais)`.
- **`criarModuloConvites(db, baseUrl)`**: convidar técnicos por link. `criarConvite(empresaId, criadorUid, criadorEmail, destinatario, nomeEmpresa)` (o nome da empresa, opcional, vai dentro do convite desde a v4.4), `obterConvite`, `aceitarConvite`, `listarConvitesPendentes` e `cancelarConvite`. Cada convite é uma chave aleatória de uso único.
- **`criarModuloEquipe(db)`**: `listarMembros(empresaId)` e `removerMembro(empresaId, uid)`.
- **`criarModuloAppData(db, empresaId, nomeApp)`**: guarda listas inteiras do app na nuvem, um documento por chave. `salvar(chave, lista)`, `carregar(chave)` e, desde a v4.2, `escutar(chave, aoMudar)`, que avisa a cada alteração feita em qualquer aparelho.
- **`criarModuloCatalogoEmpresa(db, empresaId, nomeColecao, campoChave)`**: cria uma coleção própria do app, isolada dentro da empresa, sem mexer no core. Devolve `listar()`, `salvar(obj)` (cria ou atualiza pela chave) e `excluir(chave)`. Atalhos prontos: `criarModuloMateriais`, `criarModuloProdutosServicos` e `criarModuloFamiliasMateriais`.
- **`criarModuloPessoas(db, empresaId)`**: clientes de um app dentro da empresa (diferente do cadastro nacional da seção 2.4). `listar`, `salvar`, `arquivar(obj, arquivado)` e `excluir`.

### 2.8 Backup (não usa o banco: guarda no aparelho)

- **`backup.verificarLembrete(nomeApp, { dias, aoFazerBackup, aoRecusar })`**: chame uma vez depois de abrir o app. Se passaram mais de 7 dias (ou o número que você informar) sem backup, abre um aviso com "Agora não" e "Fazer agora". Quem exporta os dados é o app, na função `aoFazerBackup`. "Agora não" só volta a perguntar na próxima abertura. Devolve `"nao-necessario"`, `"adiado"`, `"feito"` ou `"erro"`.
- **`backup.baixarJSON(nomeApp, dados)`**: baixa o arquivo `nomeApp-backup-aaaa-mm-dd.json` e registra o backup. Ponha a versão do app dentro de `dados`.
- **`backup.registrar(nomeApp)`**: marca que um backup acabou de ser feito (zera a contagem).
- **`backup.ultimo(nomeApp)`** e **`backup.diasSemBackup(nomeApp)`**: data do último backup e quantos dias se passaram (desde a primeira abertura, se nunca fez).
- O core não tem importação: o app oferece o botão Importar (regra 44).

### 2.9 Tela Sobre e Changelog (não usa o banco: guarda no aparelho)

- **`sobre.registrarAcesso(nomeApp, versao)`**: chame uma vez ao abrir. Conta 1 acesso por abertura (recarregar a página não conta), guarda o primeiro acesso e a data em que a versão atual foi instalada. Devolve `acessos`, `primeiroAcessoTexto`, `ultimaAtualizacaoTexto` e o histórico das últimas 20 versões instaladas.
- **`sobre.obter(nomeApp)`**: lê esses dados sem contar acesso.
- **`sobre.formatarData(iso, comHora)`**: formata como `02/10/2026 14:30`.
- **`sobre.montarTela(container, { nomeApp, titulo, versao, changelog })`**: monta a tela Sobre completa: versão, acessos, primeiro acesso, última atualização, data de criação e de última modificação do app, dados da Fênix e o Changelog com botão de PDF.
- **`sobre.changelogHTML(changelog)`**, **`sobre.ordenarChangelog(changelog)`** e **`sobre.datasDoApp(changelog)`**: peças usadas pela tela (HTML do Changelog, lista ordenada da versão mais nova para a mais antiga, e as datas de criação e modificação).
- **`sobre.baixarChangelogPDF(nomeApp, changelog, opcoes)`**: baixa `nomeApp-changelog-vX.X.pdf`. Usa o jsPDF que o app já embute.
- **Formato do changelog:** lista de `{ versao: "1.1", criadaEm: "2026-10-02", modificadaEm: "2026-10-05", mudancas: ["...", "..."] }`. `modificadaEm` é opcional (vale a data de criação). Datas aparecem como dd/mm/aaaa.

### 2.10 Manual do usuário (não usa o banco)

- **`manual.montarTela(container, md, { nomeApp, versao, titulo })`**: mostra o manual em Markdown, só para ler. Com `nomeApp`, mostra o botão "Baixar manual (PDF)".
- **`manual.baixarPDF(nomeApp, versao, md, opcoes)`**: gera `nomeApp-manual-vX.X.pdf` a partir do mesmo Markdown, com os prints em base64.
- **`manual.paraHTML(md)`**: converte o Markdown em HTML seguro. Aceita títulos (#, ##, ###), parágrafos, listas, citações, código, linha, negrito, itálico, links e imagens (base64 de PNG, JPEG, WebP ou GIF, ou endereço https).

### 2.11 Dashboard clicável (não usa o banco)

- **`dashboard.montar(container, indicadores, opcoes)`**: desenha os cartões de indicador. Cada indicador é `{ id, rotulo, registros (lista ou função), valor, moeda }`. Clicar abre a lista dos registros que formam o número. Indicador zerado não abre e mostra "Nenhum registro". Tem botão Fechar, a tecla Esc fecha e a tela volta à posição anterior. Funciona pelo teclado. Opções: `rotuloRegistro`, `detalheRegistro` e `aoAbrirRegistro` (para ir ao detalhe do registro).
- Devolve um objeto com **`abrir(id)`**, **`fechar()`**, **`abrirLista(titulo, registros)`** (para fatias e barras de gráfico) e **`atualizar(novos)`** (redesenha depois de mudar os dados).

### 2.12 O que funciona com o banco desligado

Todo app nasce com o banco desligado (regra 1). Enquanto `FENIX_BANCO_ATIVO` for `false`, use só:

- **Sem banco, pode usar:** `EMPRESA`, `CPF_CNPJ_DISCLOSURE`, as ferramentas de texto e documento (2.3), `pessoas.buscarNaReceita`, `pessoas.consultarCNPJ`, `localidades.buscarPorCEPSemBanco`, `localidades.buscarPorCEPBrasilAPI`, `backup`, `sobre`, `manual`, `dashboard` e `mascaras`.
- **Precisam do banco ativo:** `pessoas.buscar`, `salvar`, `salvarFisica`, `salvarJuridica`, `buscarPorNome`; `produtos.*`; `localidades.buscarPorCEP`, `buscarCidadesPorUF`, `buscarBairros`, `registrarBairro`; e todos os módulos `criarModulo...`.

### 2.13 Máscaras automáticas ao digitar (`FenixCore.mascaras`, não usa banco)

O campo se formata sozinho enquanto o usuário digita. Ninguém precisa pedir: vale para todo campo com formato fixo (regra 38).

**Como ligar:** no HTML escreva `<input data-mask="cpfcnpj">` e, uma vez, depois do carregamento do core, `FenixCore.mascaras.auto()`. Campos que aparecerem depois na tela (um modal, uma lista) também são cobertos. O cursor se mantém quando se edita no meio do texto.

| Tipo (`data-mask`) | Como se comporta | Exemplo |
|--------------------------------|-----------------------------------------------|-----------------------------------|
| `cpfcnpj` | Até 11 dígitos é CPF; passou de 11 vira CNPJ. Apagando de volta, volta a CPF. | `11111111111` vira `111.111.111-11`; mais três dígitos: `11.111.111/1111-11` |
| `cpf`, `cnpj` | Só um dos dois. | |
| `moeda` | Sem zero na frente: 1 dígito fica `R$ 1`; 2 viram `R$ 1,0`; 3 viram `R$ 1,00`; 4 viram `R$ 10,00`; 6 viram `R$ 1.000,00`. Começando com zero vêm os decimais. | `100000` vira `R$ 1.000,00`; `01` vira `R$ 0,1`; `010` vira `R$ 0,10` |
| `percentual` | Igual à moeda, com `%`. | `1250` vira `12,50%` |
| `telefone` | Escolhe fixo ou celular pelo primeiro dígito depois do DDD (9 é celular). | `79999680880` vira `(79) 9 9968-0880`; `7932221234` vira `(79) 3222-1234` |
| `cep` | Traço depois do quinto dígito. | `49000000` vira `49000-000` |
| `data`, `hora` | `dd/mm/aaaa` e `HH:mm`. | `25122026` vira `25/12/2026` |
| `placa` | Maiúsculas, sempre com hífen depois das três letras: Mercosul ou antiga. | `0er0c32` vira `0ER-0C32`; `abc1234` vira `ABC-1234` |
| `ip`, `mac` | IP com pontos (cada parte até 255) e MAC com dois pontos, maiúsculo. Úteis em CFTV. | `192168001010` vira `192.168.001.010` |
| `numero` | Só dígitos. | |
| `ie` | Inscrição estadual. Informe a UF em `data-mask-uf`: SE, BA e SP têm formato próprio; as outras UFs ficam só com dígitos. Aceita `ISENTO`. | UF `SE`: `123456789` vira `12345678-9` |
| `rg` | Formato `00.000.000-0`; o último caractere pode ser X. | `528972580` vira `52.897.258-0` |
| `uf` | Duas letras, maiúsculas. | `se1` vira `SE` |

**Funções de apoio** (todas devolvem texto ou valor, sem mexer na tela):
- **`mascaras.cpf`, `cnpj`, `cpfCnpj`, `cep`, `telefone`, `moeda`, `percentual`, `data`, `hora`, `placa`, `ip`, `mac`, `numero`, `ie(valor, uf)`, `rg`, `uf`:** formatam um texto, para exibir um valor guardado.
- **`mascaras.moedaParaNumero("R$ 1.234,56")`:** devolve `1234.56`, para guardar e calcular. **`numeroParaMoeda(1234.56)`** faz o caminho contrário.
- **`mascaras.dataParaISO("25/12/2026")`:** devolve `2026-12-25`, ou `null` se a data não existe.
- **`mascaras.valorLimpo(tipo, texto)`:** o valor para guardar (só dígitos, número, data ISO...).
- **`mascaras.aplicar(campo, tipo)`:** liga a máscara a um campo sem usar `data-mask`. **`definirValor(campo, valor)`:** põe um valor no campo já mascarado (número, no caso da moeda).

**Atenção:** a moeda não aceita valor negativo, e o valor inicial de um campo deve ser posto com `definirValor`, não direto no `value`. `moedaParaNumero` lê o texto mostrado (com vírgula decimal): `"R$ 1.234,56"` vira `1234.56` e `"R$ 1,0"` vira `1`.

### 2.14 Login com Google, dados pessoais e sincronia entre aparelhos (v4.2)

**Login com Google** (módulo `criarModuloAuth`, regra 56):
- **`entrarComGoogle()`:** abre a janela do Google e devolve o usuário. Se o navegador bloquear a janela (comum em PWA no celular), cai sozinho para o redirecionamento e devolve `null`; ao voltar, o app chama `resultadoRedirecionamento()`. Para forçar o redirecionamento: `entrarComGoogle({ redirecionar: true })`.
- **`resultadoRedirecionamento()`:** chame ao abrir o app. Devolve o usuário se ele acabou de voltar do Google, ou `null`.
- **`redefinirSenha(email)`:** envia o e-mail de redefinição de senha.
- **Antes de usar:** o endereço do app (`fenicris-dev.github.io`) precisa estar em Firebase > Authentication > Configurações > Domínios autorizados, e o provedor Google precisa estar ativado em Authentication > Método de login.

**Dados pessoais** (app sem empresa; o dado é do usuário): `criarModuloDadosPessoais(db, uid, nomeApp)` grava em `dados_pessoais/{uid}/{nomeApp}/{chave}`, o caminho que as regras do Firestore já liberam só para o dono do uid. Devolve `salvar(chave, dados)`, `carregar(chave)`, `excluir(chave)`, `listar()`, `escutar(chave, aoMudar)` e `escutarTudo(aoMudar)`. Os dois `escutar` devolvem a função que para de escutar.

**Sincronia entre aparelhos** (regra 57): `criarSincronia(db, opcoes)` mantém uma tabela igual em todos os aparelhos da mesma conta, em tempo real.
- **Opções:** `escopo` (`"pessoal"` com `uid`, ou `"empresa"` com `empresaId`), `nomeApp`, `tabela`, `lerLocal()` e `gravarLocal(lista)` (onde o app guarda a lista no aparelho), `aoMudar(lista, info)` (redesenhar a tela; `info.origem` é `"local"` ou `"nuvem"`) e `aoMudarEstado(estado)` (indicador de conexão: `sincronizado`, `sincronizando`, `offline` ou `erro`). Cada registro precisa do campo `id`.
- **Funções:** `iniciar()`, `parar()`, `salvar(registro)`, `excluir(id)`, `importarLista(lista)` (importa um backup inteiro de uma vez, registro a registro, sem duplicar), `forcarSincronia()` (botão "Sincronizar"), `estado()` e `pendentes()`.
- **Como funciona:** cada registro vira um documento com a hora da última alteração. Em conflito vale a alteração mais recente, por registro. Excluir grava uma marca de "apagado", para valer nos outros aparelhos. Sem internet, as alterações ficam numa fila no aparelho e sobem sozinhas ao reconectar (evento `online` e nova tentativa a cada 5 minutos, regra 3).
- **Primeiro uso:** o que só existe no aparelho sobe para a nuvem. Se o mesmo `id` já existir na nuvem, vale a nuvem.
- **Limite:** usa o relógio do aparelho; um aparelho com a hora muito errada pode "ganhar" conflitos.
- **Exemplo mínimo:** `const sync = FenixCore.criarSincronia(db, { escopo: "pessoal", uid, nomeApp: "fenix-gestor-do-tempo", tabela: "tarefas", lerLocal, gravarLocal, aoMudar: desenhar }); sync.iniciar(); sync.salvar({ id: "t1", titulo: "..." });`
- **Por que o Gestor do Tempo não sincronizava:** guardava só no `localStorage`, que é de cada aparelho. Para sincronizar, o app precisa de login com a mesma conta, banco ativo e `criarSincronia` (ou `criarModuloDadosPessoais`) no lugar da gravação local direta.

### 2.15 Licença definitiva e toque de abertura (v4.3)

**Licença definitiva** (`FenixCore.licenca`, regra 58):
- **Onde fica a licença:** campo `licenca` do documento `empresas/{id}`. O valor `"definitiva"` é a licença definitiva de uso; qualquer outro valor, ou a falta do campo, é teste. Só o Cristiano grava, pelo console do Firebase.
- **`ehDefinitiva(dados)`:** devolve `true` se a licença é `"definitiva"` (sem diferenciar maiúsculas) e não está vencida.
- **`situacao(dados)` (v4.4):** devolve `{ tipo, ate, dias }`, com `tipo` `"definitiva"`, `"teste"` ou `"vencida"`. A validade é opcional: o campo `licencaAte` (`AAAA-MM-DD`, vale até o fim do dia) na empresa ou no espelho. `dias` é quantos dias faltam (0 no último dia) e serve para avisar "seu teste termina em N dias".
- **`dataLimite(dados)` (v4.4):** devolve a data de `licencaAte` como `Date`, ou `null`.
- **`MENSAGEM_GOOGLE` (v4.4):** o texto único para mostrar quando o Google é negado: "O login com Google é exclusivo da licença definitiva. Entre com e-mail e senha."
- **`daEmpresa(db, empresaId)`:** lê a empresa e diz se a licença é definitiva (precisa de login).
- **`hashEmail(email)`:** devolve o SHA-256 do e-mail em minúsculas, que é o ID do espelho. O card "Licença definitiva e toque" do Painel gera esse ID para você copiar.
- **`porEmail(db, email)`:** consulta o espelho `licencas/{ID}`; funciona antes do login.
- **`lembrar(app, sim)` e `lembrada(app)`:** guardam e leem, neste aparelho, se a licença é definitiva (por app).
- **`liberaGoogle(db, { app, email, empresaId })`:** diz se o botão do Google deve aparecer. Nunca dá erro: sem rede, vale o que o aparelho lembra.
- **`confirmarAposGoogle(db, modAuth, usuario, app)`:** chame logo depois de `entrarComGoogle()`. Se a licença do usuário (pela empresa ou pelo espelho do e-mail) não for definitiva, sai da conta e devolve `false`.
- **Por que existem dois lugares:** antes do login o app não sabe quem é o usuário; por isso o botão usa a lembrança do aparelho ou o espelho pelo e-mail. A confirmação depois do Google é a trava de verdade.
- **Para dar uma licença definitiva:** no console do Firebase, 1) na empresa, crie o campo `licenca` com o texto `definitiva`; 2) para cada e-mail que vai usar o Google, crie o documento `licencas/ID` (ID gerado pelo Painel) com o campo `licenca = definitiva`.

**Toque de abertura "Asas"** (`FenixCore.som`, regra 59): três notas, Lá, Ré e Lá, duas curtas e uma longa, no ritmo de Fê-ni-x, geradas pelo navegador, sem arquivo de áudio.
- **`tocarAbertura({ somentePermitido, forcar })`:** toca o toque e devolve `true` se tocou. Toca no máximo uma vez por sessão (a menos que `forcar`). Com `somentePermitido`, só toca se o navegador já liberar o som (uso no splash); sem ele, use dentro de um clique (login que deu certo).
- **`ligado()` e `definir(sim)`:** leem e gravam a chave Som deste aparelho (padrão: ligado).
- **`sintetizar(contexto, inicio)`:** escreve as três notas em um contexto de áudio (uso interno e testes).
- **Limite:** navegadores só liberam som depois de um toque do usuário; por isso o toque normal sai no login e não ao abrir o app.

**Animações (só CSS, nos templates):** o `fenix-template-login.html` tem o farol passando ao fundo; o `fenix-template-splash.html` tem os holofotes duplos. As duas param quando o aparelho pede para reduzir movimento.

### 2.16 Preferências do usuário: som, animações e tema (v4.4)

**`FenixCore.preferencias`** (regra 60) guarda no aparelho as escolhas do usuário e as aplica na página.
- **`montarTela(container, { tema })`:** desenha os controles prontos (Som de abertura, Reduzir animações e, a menos que `tema: false`, o seletor Tema). Use na tela Sobre ou no menu do avatar.
- **`aplicar()`:** coloca a classe `fenix-sem-movimento` e o atributo `data-tema` no `<html>`. O core já chama ao carregar; os templates também aplicam antes de desenhar a tela, para não piscar.
- **`animacoesReduzidas()`:** `true` se o usuário pediu OU se o sistema pede movimento reduzido. `animacoesReduzidasEscolhidas()` olha só a escolha do usuário. `definirAnimacoesReduzidas(sim)` grava.
- **`tema()` e `definirTema(t)`:** `"claro"`, `"escuro"` ou `"auto"` (segue o sistema; valor inválido vira `"auto"`).
- **Como o app pinta o escuro:** com variáveis CSS, no bloco `html[data-tema="escuro"]` e no mesmo bloco dentro de `@media (prefers-color-scheme: dark)` para `html:not([data-tema="claro"])`, como nos templates de login e onboarding. Só a paleta Fênix: fundo `#020733`, cards `#041273`, texto branco, links em amarelo.
- **Som:** o toque Asas continua em `FenixCore.som` (seção 2.15); `ligado()` e `definir()` são os mesmos que a caixa Som de abertura usa.

### 2.17 Funções da linhagem v2.x, agora no core (v4.5)

O Gestor do Tempo e o Controle de Compras carregavam estas funções **embutidas no app** (uma cópia do core v2.4). Elas agora fazem parte do core oficial; o app só precisa chamar `FenixCore`.

- **`initFirebaseComCache(config)`:** igual a `initFirebase`, mas liga o cache offline do Firestore (IndexedDB): leituras funcionam sem internet e gravações feitas offline sobem quando a conexão volta. Chame **antes** de qualquer `init()` ou `initFirebase()` na página. Devolve `{ app, db }`.
- **`criarModuloSincronia(db, uid, nomeApp)`:** sincronia pessoal **por coleção**, no caminho `dados_pessoais/{uid}/{nomeApp}_{coleção}/{id}` (o caminho que o Gestor e o Compras já usam, então os dados existentes continuam valendo). Cada documento é gravado por inteiro, com a hora corrigida pelo servidor.
  - **`ouvir(coleção, aoMudar, aoErro)`:** escuta em tempo real; devolve a função que cancela. `aoMudar(mudanças, meta)` recebe `[{ tipo: "added" | "modified" | "removed", id, dados, atualizadoEm, pendente }]`.
  - **`salvar(coleção, objeto)`:** grava um registro (o campo `id` é obrigatório). **`salvarVarios(coleção, lista)`:** grava em lotes de 400.
  - **`excluir(coleção, id)`** e **`apagarTudo([coleções])`:** apagam um registro ou tudo do usuário nas coleções informadas.
  - **`agora()`, `relogio()` e `medirRelogio()`:** corrigem a diferença entre o relógio do aparelho e o do servidor (medir precisa de internet).
- **`criarModuloAcesso(db, coleção = "perfis")`:** cadastro aberto com **aprovação do administrador**. Cada pessoa tem `perfis/{uid}` com `status`: `pendente`, `aprovado` ou `bloqueado`. Funções: `obter(uid)`, `ouvir(uid, aoMudar)`, `solicitar(uid, email, nome)`, `ehAdmin(uid)` (existe `admins/{uid}`, criado à mão no console), `listar(status)`, `definirStatus(uid, status, adminUid)` e `excluir(uid)`. As regras do Firestore (blocos `perfis` e `admins`) garantem que só o administrador aprova.
- **Login (`criarModuloAuth`), três funções a mais:** `recuperarSenha(email)` (igual a `redefinirSenha`), `reautenticar(senha)` (confirma a senha antes de uma ação sensível) e `excluirConta(senha)` (apaga a conta de quem está logado).
- **Qual sincronia usar:** `criarSincronia` (seção 2.14) para app novo; `criarModuloSincronia` para app que já grava em `dados_pessoais/{uid}/{app}_{coleção}`, para não mudar o caminho dos dados (regra 55d).

### 2.18 Selo de versões e aviso de core novo (v4.6)

**`FenixCore.versoes`** (regra 61) mostra, em todo app, o selo **`v3.2 | c 4.6`**: `v` é a versão do app e `c` é a versão do core que ele está usando. Assim você vê de relance o que está atualizado.

- **`versoes.core`:** a versão deste arquivo do core, por exemplo `"4.6"`.
- **`versoes.selo("3.2")`:** devolve só o texto, `v3.2 | c 4.6` (aceita `"v3.2"` também).
- **`versoes.montarSelo(container, "3.2", { coreMinimo, livro, verificar, detalhe })`:** desenha o selo (um botão com 44 px de altura de toque) dentro do container. `coreMinimo` é o core mais antigo que o app aceita; `livro` é a versão do Livro das Regras que o app atende (a mesma do selo da regra 53); `verificar: false` desliga a consulta pela internet; `detalhe: true` já abre a explicação (a tela Sobre usa assim).
- **Indicador amarelo `⬆ c 4.7`:** com internet, o core lê o `versao.json` publicado; se a versão publicada for maior que a do aparelho, o selo ganha esse ponto. Ao tocar, o texto explica que basta fechar e abrir o app com internet, porque o core se atualiza sozinho ao carregar.
- **Indicador vermelho `⚠ c 4.6+`:** o core em uso é menor que o `coreMinimo` do app (o app pode não ter as funções que usa).
- **Sem internet:** nada de aviso e nada de erro; o selo aparece só com `v` e `c`. A consulta usa o cache do aparelho por 6 horas e tem limite de 6 segundos.
- **`versoes.verificar({ forcar })`:** a mesma consulta, sem desenhar nada; devolve `{ online, coreEmUso, publicada: { core, livro }, nova }`. `forcar: true` ignora as 6 horas.
- **`versoes.comparar(a, b)`:** compara versões número a número (`4.10` é maior que `4.9`).
- **Tela Sobre:** `FenixCore.sobre.montarTela` aceita `livro` e `coreMinimo`, mostra as linhas **Core em uso** (`c`) e **Livro das Regras** (`l`) e desenha o selo com a explicação aberta.
- **Quem mantém o `versao.json`:** o pacote da biblioteca. Ele não tem cópia com versão no nome e fica na raiz do repositório, ao lado do `fenix-core.js`.

## PARTE 3. O LIVRO DAS REGRAS, REGRA POR REGRA

### Seção 1. Arquitetura
1. **Core centralizado.** Todo app carrega o core do endereço oficial e nunca guarda cópia dentro de si; assim, uma correção no core vale para todos. O banco vem pré-configurado e desligado (`FENIX_BANCO_ATIVO = false`) e só é ligado quando você der o sinal. O app nasce pronto: ativar é só trocar a chave para `true`.
2. **Carregador oficial.** Código fixo no `<head>` que baixa o core, guarda uma cópia no aparelho e usa essa cópia sem internet. A primeira abertura precisa de internet.
3. **Comportamento offline.** O app nunca trava sem internet: trabalha com dados locais e tenta reconectar a cada 5 minutos e quando a internet voltar.
4. **Indicador de conexão.** Ícone discreto no cabeçalho: online, offline ou sincronizando.
5. **Stack.** HTML, CSS e JS (arquivo único ou vários), PWA quando fizer sentido, Firebase, localStorage, jsPDF embutido, offline-first.
6. **Hospedagem.** GitHub Pages.

### Seção 2. Versionamento e entrega
7. **Sequência de versões.** 1.0, 1.1, ... 1.9, 2.0, sem pular e com uma casa decimal. Livro, guia, core, regras do Firestore, templates e documentos legais andam juntos com o mesmo número. O salto da v3.0 foi a única exceção.
8. **Toda alteração sobe a versão**, inclusive no arquivo baixável.
9. **Dizer a versão** no texto da resposta de toda entrega.
10. **Nome do arquivo** `fenix-nome-do-app-vX.X.html`, sempre com a cópia neutra.
11. **Duas cópias** de tudo que tem versão: com versão no nome (controle interno) e neutra (referência).
12. **Changelog e Manual obrigatórios**, dentro do app, só para ver. O Changelog tem as datas de criação e modificação de cada versão e PDF para baixar; o Manual é passo a passo, com print e exemplo de cada campo e botão, em MD (no app) e PDF (download). Prints refeitos a cada alteração que mude o uso.
13. **Tela Sobre** com versão, acessos, primeiro acesso, última atualização, datas de criação e modificação e os dados da Fênix.

### Seção 3. Identidade visual
14. **Paleta:** degradê `#040798` para `#0076CE`; marca `#041273`; botões `#0076CE`; destaque, alerta e hover `#ffcb00`; texto de input `#000000`; texto de menu e rodapé `#ffffff`.
15. **Degradê** em menu e rodapé.
16. **Fundo** `#F3F4F9`, cartões brancos com sombra suave, texto `#020733`.
17. **Identidade gráfica:** a águia. Ícones em `Icon/`, logos em `Logo/`, embutidos em base64 no app. Escolha o contraste que melhor combina: Azul (oficial) em fundo claro, Branca (segunda opção) em fundo de cor, e as auxiliares Black, Silver e Gray quando convier. Azul nunca sobre o degradê. App sem ícone próprio, ou com o ícone da letra F, usa a águia como ícone provisório, inclusive no splash.
18. **Layout** com menu lateral ou superior mais cartões; seções colapsáveis sempre fechadas.
19. **Mobile:** barra de abas fixa embaixo, com o ícone central em destaque.
20. **Áreas de toque** de pelo menos 44 × 44 px.
21. **Mensagens em português claro**, sem jargão, dizendo o que houve e o que fazer; estados de carregando, vazio e erro iguais em todos os apps, alertas em amarelo.
22. **Rodapé padrão:** degradê, texto branco, `{ANO} <Cristiano Fênix/> | © Fênix Soluções Tecnológicas`, com ano automático, links do WhatsApp e do Instagram e a versão do app visível.

### Seção 4. Acesso e login
23. **Layout de login único:** use o `fenix-template-login.html`, sem criar outro.
24. **Endereço do template de login** e como versioná-lo.
25. **O que muda em cada app:** só o nome do app e a ligação da autenticação ao core.
26. **Autenticação** por e-mail ou Google, sem PIN.
27. **Termos de Uso e Política de Privacidade** em `Termos/`, com endereço fixo; a versão acompanha o livro e a data só muda quando o texto muda.
28. **Onboarding** no primeiro acesso: primeiro nome, e-mail e CNPJ opcional (nunca CPF). O CNPJ traz razão social e endereço para conferir. Aparece uma única vez.
29. **Template de onboarding** único, com `FENIX_PERFIL_INICIAL`, `salvarPerfil()` e o evento `fenix:onboarding-concluido`.
30. **Nome do usuário** no lado direito, junto ao avatar.
31. **Avatar** com a inicial do primeiro nome (sem foto); menu com nome, Ajuda e Sair.
32. **Splash de abertura em todos os apps:** tela azul com o ícone do app, nome do sistema, "Fênix Soluções Tecnológicas" e barra animada; some quando a tela certa estiver pronta, com teto de 1,2 s.

### Seção 5. Cadastros e dados
33. **Cadastro PF** completo; o CEP preenche o endereço (`buscarPorCEPSemBanco` com o banco desligado, `buscarPorCEP` com ele ativo).
34. **Cadastro PJ** completo, com responsável ou contato.
35. **Fluxo do CNPJ** em qualquer tela que capture CNPJ: use `consultarCNPJ` e liste Razão Social, Endereço, Número, Bairro, CEP, Cidade e UF; tudo continua editável.
36. **Alternância PF/PJ** mantendo os campos comuns.
37. **Aviso de uso do CPF/CNPJ** sempre abaixo dos campos.
38. **Máscaras automáticas** enquanto digita (CPF e CNPJ no mesmo campo, CEP, telefone, moeda, percentual, data, hora, placa, IP, MAC, número, inscrição estadual, RG, UF), ligadas por `data-mask` e `FenixCore.mascaras.auto()`; validação dos dígitos de CPF e CNPJ à parte. Nunca máscara própria.
39. **Moeda** no padrão `R$ 0.000,00`, na exibição e na digitação (`data-mask="moeda"`; o campo põe a vírgula e os pontos sozinho).
40. **Datas** em dd/mm/aaaa e horas em 24 h; guardar em formato ISO (`data-mask="data"` e `"hora"`).
41. **Pessoas só pelo core:** nenhum app cria coleção própria de clientes; guarda a referência e, no máximo, um cache leve.
42. **Padronização de escrita** ao salvar: nomes em MAIÚSCULAS, demais textos com iniciais maiúsculas, e-mail em minúsculas, UF em maiúsculas.
43. **Ficha de produto ou equipamento:** base sempre Marca, Modelo e Série; campos extras por categoria.
44. **Backup:** alerta após mais de 7 dias, arquivo JSON datado, botão Importar no app (que segue a regra 47); com sincronia ativa, a importação usa `sync.importarLista`.
45. **PDF** com cabeçalho padrão: logo Azul e dados da empresa do perfil.

### Seção 6. Segurança e qualidade
46. **Regras do Firestore:** nenhuma coleção aberta; cada usuário só lê e grava os próprios dados; as regras seguem junto com a entrega, partindo do arquivo-base `firestore.rules` da biblioteca (veja o quadro "firestore.rules, bloco por bloco" depois da Seção 9), com um checklist de publicação: core e templates no GitHub, testes da pasta `testes-regras/`, backup das regras atuais, Playground, publicar, testar num app real e, se falhar, recolocar o backup.
47. **Ações destrutivas** exigem digitar uma palavra (ex.: APAGAR). Nunca o `confirm()` do navegador.
48. **Validar o JS** com `node --check` (retorno 0) e chaves balanceadas.
49. **Testar** em tela de 360 px e sem internet.
50. **Funções dos botões** no HTML declaradas com `var` ou `function`, nunca `const` nem seta.
51. **Evitar regressão:** conferir o escape do Python em template literals e blocos órfãos depois de refatorar.

### Seção 7. Processo
52. **Livro vivo e Ficha de aplicação:** em app novo, ou existente trazido para alteração, preencher a Ficha com o Cristiano antes de começar, perguntando sempre se o app terá login com Google (grupo H) se vai funcionar em tempo real em mais de um aparelho (grupo I) e se terá tema escuro opcional (grupo J).
53. **Selo do Livro:** o app declara `fenix-livro` (versão aplicada) e `fenix-ficha` (grupos marcados) no `<head>` e mostra "Padrão: Livro das Regras Fênix vX.Y" na Sobre. Selo igual à versão do livro significa que já está aplicado; selo antigo, aplicar só o que o Histórico indica; sem selo, aplicar tudo.

### Seção 8. Dashboard
54. **Dashboard clicável:** todo indicador com dados abre os registros que o formam, com o mesmo número; zerado mostra "Nenhum registro"; vale também para gráficos e valores em R$. Use `dashboard.montar`.

### Seção 9. Trazer um app antigo ao padrão
55. **Roteiro do app antigo:** quando um app existente vem para alteração: (a) ler o selo (sem selo, aplicar tudo; selo antigo, só o que o Histórico indica); (b) preencher a Ficha; (c) fazer o inventário do que o app cumpre e do que falta, regra por regra, e mostrar antes de mexer; (d) proteger os dados: chaves e formatos do localStorage e das coleções não mudam sem migração e backup; (e) aplicar em cinco etapas, cada uma testada: 1) core, banco desligado e selo, 2) identidade, 3) acesso, 4) cadastros e máscaras, 5) qualidade (Changelog e Manual, Sobre, backup, PDF e dashboard); (f) não mexer em telas que não foram pedidas e avisar quando uma regra conflitar com algo do app; (g) entregar pelo Como entregar, com a sequência de versões do próprio app e a Ficha no Changelog; (h) anotar o app em Apps já no padrão.

### Seção 10. Login com Google e sincronia entre aparelhos
56. **Login com Google (grupo H):** botão "Entrar com Google" do template ligado a `criarModuloAuth(app).entrarComGoogle()`, nunca código de login próprio; `resultadoRedirecionamento()` ao abrir; `redefinirSenha(email)` na tela de esqueci a senha; domínio do app autorizado no Firebase Authentication.
57. **Sincronização entre aparelhos (grupo I):** exige banco ativo e login; usa só o core (`criarModuloDadosPessoais`, `criarSincronia`); comportamento obrigatório: tempo real, offline com fila, conflito pela alteração mais recente, exclusão que vale em todos, primeiro uso sem duplicar, indicador de conexão com `aoMudarEstado`, backup passando pelo `sync.importarLista`; testar com dois aparelhos.

### Seção 11. Licença definitiva, animações, toque e preferências
58. **Licença definitiva (grupo H):** o botão Entrar com Google só aparece com a licença definitiva (campo `licenca = "definitiva"` na empresa, gravado só pelo console, mais o espelho `licencas/{SHA-256 do e-mail}` para a tela de login); `liberaGoogle` decide o botão e `confirmarAposGoogle` confirma depois do login; a licença pode ter validade (`licencaAte`) e, quando o Google é negado, o texto é sempre `MENSAGEM_GOOGLE`.
59. **Animações e toque (todos os apps):** farol passando ao fundo do login e holofotes duplos de baixo para cima no splash (templates prontos, só CSS, respeitam reduzir movimento); toque Asas (Lá, Ré, Lá) sintetizado pelo core, que toca no login que deu certo e, no splash, só se o navegador já permitir; chave Som no login.
60. **Preferências e tema escuro:** controles Som de abertura e Reduzir animações na tela Sobre ou no menu do avatar (`FenixCore.preferencias.montarTela`); tema escuro opcional no grupo J, só com a paleta Fênix, por variáveis CSS e `data-tema`; o claro segue como padrão.
61. **Selo de versões:** todo app mostra `v3.2 | c 4.6` (app e core) ao lado da versão e na Sobre, com `FenixCore.versoes.montarSelo`; a Sobre mostra também Core e Livro; com internet o core lê o `versao.json` e avisa com ponto amarelo quando existe core mais novo (vermelho se o core for menor que o `coreMinimo` do app). Vale para todo app, sem grupo na Ficha.

### firestore.rules, bloco por bloco
O arquivo está na raiz da biblioteca e **parte das regras publicadas no seu console** (as versões registradas no cabeçalho). O que já funcionava foi mantido; o que mudou na v4.0 está marcado com `[v4.0]`. Tudo que não está liberado é negado.

**Ordem para publicar:** 1) o `fenix-core.js` mais novo no GitHub (ele grava o `conviteToken` e, desde a v4.4, o nome da empresa no convite); 2) só depois estas regras no console. Teste antes no "Playground de regras" (roteiro abaixo).

**Checklist de publicação (regra 46):** 1) core e templates no GitHub; 2) no seu computador, rode os testes da pasta `testes-regras/` (`npm install` uma vez e `npm test`) e, se algum falhar, não publique; 3) no console, copie as regras atuais para um arquivo de backup; 4) cole as novas no Playground e rode o roteiro abaixo; 5) publique; 6) abra um app real, entre e grave um registro; 7) se algo falhar, recoloque o backup e avise.

- **Funções de apoio:** `autenticado`, `pertenceAEmpresa` (vínculo aprovado em `usuarios_empresa`), `souDonoDaEmpresa`, e, novas, `temVinculoAprovado`, `membroComPapel` e `conviteValido` (convite da empresa, não usado e não cancelado).
- **Base compartilhada:** `produtos_servicos` e `cidades` como antes. **[v4.0]** `pessoas_fisicas` e `pessoas_juridicas` (CPF e CNPJ, dados pessoais) só para quem tem vínculo aprovado com uma empresa; antes, qualquer conta Google logada em qualquer app lia a base inteira.
- **`empresas/{id}`:** **[v4.4]** só lê o dono (`donoUid`) e quem tem vínculo aprovado com a empresa; antes, qualquer logado lia. Ninguém altera nem apaga. **[v4.3]** criar exige deixar o campo `licenca` de fora ou usar `teste`: o app nunca cria uma empresa como definitiva; só o console grava `definitiva`.
- **[v4.3] `licencas/{ID}`:** espelho da licença para a tela de login (ID = SHA-256 do e-mail). Leitura só pontual (`get`, sem listar) e sem gravação pelo app; só o console cria.
- **`usuarios_empresa/{uid}`:** leitura e remoção como antes. **[v4.0]** criar o vínculo exige já ter o registro de membro da empresa com o mesmo papel; antes, qualquer logado criava o próprio vínculo como dono de qualquer empresa e passava a ver os dados dela. Atualizar sem trocar empresa nem papel continua livre.
- **`convites/{token}`:** ler um convite pelo token, listar e criar como antes. **[v4.0]** a alteração fica restrita: o titular só cancela; o convidado só marca como usado, uma vez, com o próprio uid. Antes, qualquer logado alterava qualquer campo de um convite não usado.
- **[v4.0] `empresas/{id}/membros/{uid}`:** o dono cria o próprio registro (a empresa tem de ter `donoUid` igual ao uid); o técnico cria o seu com o `conviteToken` de um convite válido da empresa. Só o titular altera; o titular ou o próprio apaga.
- **Dados da empresa** (pessoas, `appData`, materiais, famílias, produtos e serviços e as coleções de cada app): só membros aprovados leem e gravam. **[v4.0]** a gravação não vale para a coleção `membros`. **[v4.8]** nem para a coleção `cidades` da empresa.
- **`dados_pessoais/{uid}`:** como estava (Gestor de Tempo e apps pessoais: cada um só vê o que está sob o próprio uid).

**Roteiro de teste no Playground de regras** (todos com usuário logado de teste):
1. Dono cria empresa (grava a empresa, o registro de membro dono e o vínculo): permitido.
2. Usuário comum cria vínculo como dono de uma empresa que não é dele: negado.
3. Técnico aceita convite válido (grava membro com `conviteToken`, depois o vínculo, depois marca o convite como usado): permitido.
4. Técnico grava o registro de membro sem `conviteToken`, ou com convite cancelado ou já usado: negado.
5. Técnico lê os dados da empresa: permitido; grava na coleção `membros`: negado.
6. Usuário sem vínculo lê `pessoas_fisicas`: negado; com vínculo aprovado: permitido.
7. Gestor de Tempo grava em `dados_pessoais/{o próprio uid}`: permitido; no de outro usuário: negado.
8. Criar uma empresa com `licenca: "definitiva"`: negado; sem o campo, ou com `"teste"`: permitido.
9. Ler `licencas/{ID}` (get) sem estar logado: permitido; listar a coleção ou gravar nela: negado.
10. **[v4.4]** Usuário logado, sem vínculo e que não é o dono, lê `empresas/{id}`: negado; o dono, ou um membro aprovado: permitido.
11. **[v4.4]** Técnico aceita convite: o convite tem `empresaNome`, e depois de aceitar ele lê a empresa: permitido.

**Pontos de atenção**
- Um app com o core antigo guardado no cache do aparelho não grava o `conviteToken`, então não consegue aceitar convite até abrir com internet e baixar o core novo.
- Pelas regras que estavam publicadas, o `criarEmpresa` do core gravava o registro de membro antes de existir o vínculo e era negado; agora passa. Se o Fênix Ativos tem fluxo próprio para criar empresa, ele segue funcionando.
- **[v4.4]** Convites criados antes da v4.4 não têm `empresaNome`: a tela do convite mostra só o código até o convite ser aceito. O app que mostrava o nome da empresa antes de aceitar deve ler `convite.empresaNome`, não `empresas/{id}`.
- **[v4.8] `empresas/{id}/cidades`:** a regra `write: false` agora vale de verdade: o curinga das coleções da empresa passou a deixar essa coleção de fora da gravação (antes ele a liberava para qualquer membro aprovado). O core grava cidades na raiz (`cidades/…`), então nenhum app é afetado; a leitura por membros e a gravação de `bairros` abaixo dela continuam como estavam.

### Seções finais do livro
- **Ficha de aplicação:** sempre valem as regras 1 a 3, 5 a 22, 39, 40, 47 a 53, 55, 59, 60 e 61. Grupos marcáveis: A banco ativo (4, 46), B login (23 a 32), C PF/PJ (33 a 38, 41, 42), D produto (43), E backup (44), F PDF (45), G dashboard (54), H login com Google (56 e 58), I sincronização entre aparelhos (57), J tema escuro opcional (60). Os grupos H, I e J vêm desmarcados e são perguntados sempre.
- **Histórico do livro:** diz o que cada versão muda para os apps e se afeta ou não.
- **Endereços oficiais:** a lista única de endereços; só use os dela.
- **Como entregar:** declarar a versão; nome padrão; selo e Ficha no Changelog; manual MD e PDF; duas cópias; guia da biblioteca atualizado; rodar o Painel e tocar em "Testar tudo"; teste com dois aparelhos para o grupo I; checklist de publicação quando houver `firestore.rules`; zip com `LEIAME.txt` quando houver mais de um arquivo (a pasta `versoes/` nunca sobe para a raiz do repositório); avisar se um pedido contrariar o livro.
- **Apps já no padrão:** anotação numerada dos apps que já seguem o livro.

## PARTE 4. CHANGELOG DA BIBLIOTECA

Cada linha diz o que mudou e o que isso exige dos apps. As versões v1.x e v2.x do core vieram antes do livro atual; as versões v3.x são niveladas entre livro, core, templates e documentos legais.

### Versões v3.x (niveladas)
- **v4.8**: regras do Firestore fecham a gravação em `empresas/{id}/cidades` (o curinga da empresa a liberava); novo teste em `testes-regras/`; checklist de publicação do guia alinhado ao da regra 46. O core só muda de versão. Afeta apps: não.
- **v4.7**: Resumo do livro (uma folha); pasta `testes-regras/` com testes automáticos das regras do Firestore; Painel com Teste de aparelho; varredura de versões em Como entregar; checklist da regra 46 com o passo dos testes. O core só muda de versão. Afeta apps: não.
- **v4.6**: selo de versões `v | c` em todo app e aviso de core novo (regra 61); novo arquivo `versao.json`; a Sobre ganha Core e Livro; Painel testa o `versao.json` e teve a conferência de versão corrigida; a regra 61 vale sempre, sem grupo na Ficha. Afeta apps: sim, leve.
- **v4.5**: o core oficial ganha as funções da linhagem v2.x (`initFirebaseComCache`, `criarModuloSincronia`, `criarModuloAcesso`, `recuperarSenha`, `reautenticar`, `excluirConta`), para o Gestor do Tempo e o Controle de Compras tirarem as cópias embutidas; regras 55 e 57 esclarecidas; regras do Firestore com os blocos `perfis` e `admins`. Apps: SIM, os três apps em andamento seguem o roteiro da regra 55.
- **v4.4**: leitura de `empresas/{id}` só para o dono e membros (convite leva `empresaNome`); licença com validade (`licencaAte`, `situacao`) e `MENSAGEM_GOOGLE`; `sync.importarLista`; `FenixCore.preferencias` (som, animações, tema claro/escuro/automático); regra 60 e grupo J; checklist de publicação das regras, teste com dois aparelhos e aviso da pasta `versoes/` em Como entregar; Termos (cláusula 3, licença de uso) e Política (dados de licença e preferências) atualizados em 23/10/2026. Apps: SIM, na próxima alteração.
- **v4.3**: login com Google só com a licença definitiva (regra 58); farol passando ao fundo do login e holofotes duplos no splash, que ganha `fenix-template-splash.html` (regra 59); toque Asas; core com `FenixCore.licenca` e `FenixCore.som`; regras do Firestore com o campo `licenca` protegido e a coleção `licencas`. Apps: SIM, na próxima alteração.
- **v4.2**: Ficha com os grupos H (login com Google) e I (sincronização entre aparelhos), perguntados sempre; regras 56 e 57 (seção 10); core com `entrarComGoogle`, `resultadoRedirecionamento`, `redefinirSenha`, `criarModuloDadosPessoais`, `criarSincronia` e `escutar` nos dados por empresa. Apps: SIM, na próxima alteração.
- **v4.1**: placa sempre com hífen depois das três letras (`ABC-1D23`, `ABC-1234`) e RG no formato `00.000.000-0`. Apps: SIM, só quem usa essas máscaras.
- **v4.0**: moeda no padrão definido (1 dígito `R$ 1`, 2 `R$ 1,0`, 3 `R$ 1,00`, 4 `R$ 10,00`; com zero na frente vêm os decimais); máscaras novas `ie`, `rg` e `uf`; logos com nome com sublinhado (`Fenix_Logo_Silver.png`, `Fenix_Logo_Gray.png`); `firestore.rules` parte das regras publicadas e fecha três brechas (vínculo com qualquer empresa, alteração livre de convites e base de CPF/CNPJ aberta a qualquer logado); core grava `conviteToken` e recusa convite cancelado. Apps: SIM, na próxima alteração.
- **v3.9**: máscaras automáticas em todo campo com formato fixo (regras 38 a 40): novo `FenixCore.mascaras`, ligado por `data-mask` e `mascaras.auto()`; CPF e CNPJ no mesmo campo, moeda pelos centavos, telefone, CEP, data, hora, placa, IP, MAC, percentual e número. O Painel testa as máscaras e tem um grupo para digitar. Apps: SIM, na próxima alteração cada app troca as máscaras próprias pelas do core.
- **v3.8**: nova regra 55 (roteiro para trazer um app antigo ao padrão, seção 9). Novo arquivo-base `firestore.rules` (proposta de regras do Firestore para as coleções do core), com duas cópias, nos Endereços oficiais e no Painel; a regra 46 aponta para ele. Apps: nada.
- **v3.7**: o Guia da biblioteca entra no conjunto (mesma versão, duas cópias, endereços oficiais, Como entregar e Painel). O Painel ganha testes ao vivo de CNPJ e CEP, que rodam `consultarCNPJ`, `buscarPorCEPSemBanco` e `buscarPorCEPBrasilAPI` com a internet real, sem gravar no banco. Apps: nada.
- **v3.6**: entrega com mais de um arquivo leva também um `.zip` com `LEIAME.txt`. Este guia nasce nesta versão. Apps: só na entrega.
- **v3.5**: nova função `localidades.buscarPorCEPSemBanco` (ViaCEP sem gravar no banco). A data dos Termos e da Política só muda quando o texto muda. Entrega termina com o Painel e "Testar tudo". Apps: troque para `buscarPorCEPSemBanco` se consultam CEP com o banco desligado.
- **v3.4**: `index.html` vira o Painel da biblioteca. O template de login fica só em `fenix-template-login.html`. Apps: nada.
- **v3.3**: endereços conferidos: repositório `Fenix-Core` (com hífen), pastas `Icon/`, `Logo/`, `Termos/`, `MD/` e `DOC/`; logos oficial e auxiliares; criado o `Fenix_Icone_128.png`. A v3.2 (Fenix_Core com sublinhado) foi cancelada. Apps: apontar para os endereços novos na próxima alteração.
- **v3.2**: cancelada (endereço com sublinhado que não existe).
- **v3.1**: ícone provisório para app sem ícone ou com o "F"; splash em todos os apps. Apps: aplicar na próxima alteração.
- **v3.0**: nivelamento: livro, core, templates e documentos legais passam a ter o mesmo número; duas cópias de tudo que tem versão. Apps: passam a sair também com a cópia neutra.

### Livro das Regras, antes do nivelamento
- **v2.9**: consulta de CNPJ com endereço completo; ícone provisório; app nasce pronto para o banco. Apps: sim.
- **v2.8**: regras 12, 13 e 54 passam a indicar as funções prontas do core. Apps: não.
- **v2.7**: Manual em MD e PDF com prints; Changelog com datas na tela Sobre; dashboard clicável (regra 54). Apps: sim.
- **v2.6**: banco pré-configurado e desligado em todo app (chave `FENIX_BANCO_ATIVO`). Apps: sim.
- **v2.5**: Ficha de aplicação das regras e Selo do Livro. Apps: sim.
- **v2.4**: seção Endereços oficiais. Apps: não.
- **v2.3**: templates sem versão no nome. Apps: não.
- **v2.2**: removidas as regras do aviso de nova versão e do template de layout com menu. Apps: não.
- **v2.1**: anotação dos apps já no padrão. Apps: não.

### Fênix Core, funções acrescentadas (nada foi removido)
- **v4.8**: nenhuma função nova; só a versão (`versoes.core` passa a `"4.8"`).
- **v4.7**: nenhuma função nova; só a versão (`versoes.core` passa a `"4.7"`).
- **v4.6**: `FenixCore.versoes` (`core`, `selo`, `montarSelo`, `verificar`, `comparar`); `sobre.montarTela` aceita `livro` e `coreMinimo` e mostra Core e Livro.
- **v4.5**: `initFirebaseComCache`, `criarModuloSincronia`, `criarModuloAcesso`; `criarModuloAuth`: `recuperarSenha`, `reautenticar`, `excluirConta` (seção 2.17).
- **v4.4**: `licenca.situacao`, `licenca.dataLimite`, `licenca.MENSAGEM_GOOGLE` (e `ehDefinitiva` passa a respeitar `licencaAte`); `FenixCore.preferencias` (`montarTela`, `aplicar`, `animacoesReduzidas`, `animacoesReduzidasEscolhidas`, `definirAnimacoesReduzidas`, `tema`, `definirTema`); `criarSincronia().importarLista`; `criarConvite` com o 5º parâmetro `nomeEmpresa` (seções 2.7, 2.14, 2.15 e 2.16).
- **v4.3**: `FenixCore.licenca` (`ehDefinitiva`, `daEmpresa`, `hashEmail`, `porEmail`, `lembrar`, `lembrada`, `liberaGoogle`, `confirmarAposGoogle`) e `FenixCore.som` (`tocarAbertura`, `ligado`, `definir`, `sintetizar`), seção 2.15.
- **v4.2**: `criarModuloAuth`: `entrarComGoogle`, `resultadoRedirecionamento`, `redefinirSenha`; `criarModuloDadosPessoais`; `criarSincronia`; `criarModuloAppData.escutar` (seção 2.14).
- **v4.1**: ajuste de `mascaras.placa` (hífen sempre) e `mascaras.rg` (formato `00.000.000-0`); `valorLimpo("rg")` devolve números e X.
- **v4.0**: `mascaras.ie`, `rg`, `uf`; regra nova da moeda; `moedaParaNumero` lê a vírgula decimal; `aceitarConvite` grava `conviteToken` e recusa convite cancelado.
- **v3.9**: `FenixCore.mascaras` (máscaras automáticas e funções de apoio, seção 2.13).
- **v3.5**: `localidades.buscarPorCEPSemBanco`.
- **v2.5**: `pessoas.consultarCNPJ` e `localidades.buscarPorCEPBrasilAPI`.
- **v2.4**: `sobre.montarTela`, `changelogHTML`, `ordenarChangelog`, `datasDoApp`, `baixarChangelogPDF`; módulo `manual` (`paraHTML`, `montarTela`, `baixarPDF`); `dashboard.montar`.
- **v2.3**: `EMPRESA.razaoSocial` e e-mail corrigido para `trampodofenix@gmail.com`; texto de uso atualizado para o carregador oficial.
- **v2.2**: módulo `sobre` (`registrarAcesso`, `obter`, `formatarData`).
- **v2.1**: `EMPRESA`; módulo `backup`; padronização de escrita ao salvar (`formatarTitulo`, `formatarNomeMaiusculo`).
- **v2.0**: `pessoas.buscarPorNome` corrigido com o campo `nomeBusca`; documentação corrigida.
- **v1.9**: correção grave: o vínculo usuário e empresa passou a usar a coleção `usuarios_empresa`, a mesma das regras do banco.
- **v1.8**: `criarModuloCatalogoEmpresa` e `excluir` no catálogo por empresa.
- **v1.7**: reconstrução dos módulos multiempresa, alinhada ao uso real do Fênix Ativos.
- **v1.3 a v1.6**: módulos de login, empresas, convites, equipe, dados do app, catálogos e pessoas por empresa.
- **v1.2**: `pessoas.buscarNaReceita` (consulta de CNPJ).
- **v1.1**: `localidades.buscarPorCEP` (ViaCEP).
- **v1.0**: módulo base: pessoas, produtos e serviços, localidades.

## PARTE 5. RECEITA RÁPIDA: APP NOVO EM 10 PASSOS

1. Preencha a Ficha de aplicação com o Cristiano (regra 52), perguntando sempre se terá login com Google e se vai funcionar em mais de um aparelho, e escolha o nome do arquivo `fenix-nome-do-app` (regra 10).
2. Ponha o carregador oficial do core no `<head>` (regra 2) e chame `FenixCore.init("fenix-nome-do-app")`.
3. Crie a chave `FENIX_BANCO_ATIVO = false` e escreva as leituras e gravações do banco atrás dela (regra 1).
4. Monte o login e o onboarding a partir dos templates (regras 23 e 29), o splash (32), o avatar (30 e 31) e o rodapé padrão (22).
5. Use a paleta, o ícone e os logos oficiais; se não houver ícone próprio, use a águia (regras 14 a 17).
6. Cadastros: campos com `data-mask` e `FenixCore.mascaras.auto()` (CPF/CNPJ, CEP, telefone, moeda), validação de CPF e CNPJ, `consultarCNPJ`, CEP com `buscarPorCEPSemBanco` (regras 33 a 38).
7. Moeda e datas no padrão brasileiro (39 e 40); ações destrutivas com palavra de confirmação (47).
8. Backup com `verificarLembrete` e `baixarJSON` (44); Sobre com `registrarAcesso` e `montarTela` (13); dashboard com `dashboard.montar` (54).
9. Escreva o Changelog e o Manual (com prints a 360 px), declare o selo e a ficha no `<head>` (12 e 53) e valide o JS e o app sem internet (48 e 49).
10. Entregue o app nas duas cópias, o manual em MD e PDF e o zip; depois rode o Painel e toque em "Testar tudo".

App que já existe? Em vez desta receita, siga o roteiro da regra 55 (selo, Ficha, inventário, proteção dos dados e cinco etapas).
