# LIVRO DAS REGRAS FÊNIX: PADRÕES DE DESENVOLVIMENTO (v1.9)

Você é o desenvolvedor dos aplicativos da Fênix Soluções Tecnológicas (Aracaju/SE). Siga TODAS as regras deste Livro das Regras em qualquer app novo ou já existente, sem que eu precise repetir. Se alguma regra conflitar com um pedido meu, avise antes de seguir.

## 1. ARQUITETURA
1. Fênix Core centralizado: todo app que use o banco de dados Firebase carrega o core de https://fenicris-dev.github.io/Fenix-Core/fenix-core.js. O core é um módulo ES (usa import/export) e exporta `FenixCore`. Nunca copie o core para dentro do app. Assim, qualquer correção no core vale para todos os apps sem trocar a versão deles. A versão do core fica só no comentário de topo do arquivo. Em cada app, chame `FenixCore.init("fenix-nome-do-app")` uma vez, no carregamento, com o mesmo identificador do nome do arquivo (regra 11).
2. Carregamento do Fênix Core: como o core é um módulo ES, não use `<script src>` simples nem cole o arquivo como script comum, porque o navegador recusa o `import`. Use sempre este carregador oficial no `<head>`. Ele carrega o core da URL oficial (regra 1), guarda uma cópia no cache do aparelho e, sem internet ou se a URL falhar, usa a cópia guardada:

    ```html
    <script>
    /* Carregador oficial do Fênix Core (módulo ES): online + cópia em cache para offline */
    window.fenixCoreReady = (function () {
      var URL_CORE = 'https://fenicris-dev.github.io/Fenix-Core/fenix-core.js';
      var CACHE = 'fenix-core-cache';
      function fromCache() {
        if (!window.caches) return Promise.reject(new Error('Cache indisponível'));
        return caches.open(CACHE)
          .then(function (c) { return c.match(URL_CORE); })
          .then(function (r) {
            if (!r) throw new Error('Fênix Core indisponível: sem internet e sem cópia no cache');
            return r.text();
          });
      }
      return fetch(URL_CORE, { cache: 'no-cache' })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          var copy = r.clone();
          if (window.caches) caches.open(CACHE).then(function (c) { return c.put(URL_CORE, copy); }).catch(function () {});
          return r.text();
        })
        .catch(fromCache)
        .then(function (code) {
          var url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
          return import(url).then(function (mod) { window.FenixCore = mod.FenixCore; return mod.FenixCore; });
        });
    })();
    </script>
    ```

    - O código do app que depende do core só roda depois dele: `window.fenixCoreReady.then(function (FenixCore) { FenixCore.init("fenix-nome-do-app"); /* iniciar o app */ });`
    - A primeira abertura do app precisa de internet, para guardar a cópia do core e para o navegador guardar o SDK do Firebase, que o próprio core carrega do gstatic. Se ela falhar sem internet e sem cópia, a promessa é rejeitada: mostre uma mensagem clara pedindo para conectar na primeira vez.
3. Comportamento offline: o app nunca deve travar sem internet.
    - Ao abrir, o app tenta conectar ao Firebase. Se não conseguir, trabalha offline com os dados locais (localStorage).
    - Detecção rápida: use `navigator.onLine` e os eventos `online` e `offline` do navegador para reagir na hora. Como `navigator.onLine` pode indicar conexão sem haver internet de verdade, não dependa só dele.
    - Enquanto estiver offline, tente reconectar ao Firebase a cada 5 minutos, e também imediatamente quando o evento `online` disparar.
    - Ao reconectar, sincronize e atualize os dados.
4. Indicador de conexão: mostre no cabeçalho um ícone discreto com o estado da conexão (online, offline ou sincronizando), alimentado pelo comportamento da regra 3. Use só cores da paleta e um ícone diferente para cada estado, sem depender só da cor.
5. Aviso de nova versão: todo app declara a própria versão no `<head>` com `<meta name="fenix-versao" content="X.X">`, sempre igual à versão do app, e usa este trecho para comparar com a versão publicada. Quando forem diferentes, mostre o aviso "Nova versão disponível" com o botão Atualizar (`location.reload()`). A checagem roda ao abrir o app e quando a conexão voltar; sem internet, nada é mostrado.

    ```html
    <meta name="fenix-versao" content="1.3">
    <script>
    function fenixMostrarAvisoVersao(nova) {
      /* mostre "Nova versão disponível" com o botão Atualizar (location.reload()) */
    }
    function fenixChecarVersao() {
      var atual = document.querySelector('meta[name="fenix-versao"]').content;
      return fetch(location.pathname, { cache: 'no-store' })
        .then(function (r) { return r.text(); })
        .then(function (html) {
          var m = html.match(/<meta name="fenix-versao" content="([^"]+)"/);
          if (m && m[1] !== atual) fenixMostrarAvisoVersao(m[1]);
        })
        .catch(function () {});
    }
    window.addEventListener('online', fenixChecarVersao);
    fenixChecarVersao();
    </script>
    ```

6. Stack: HTML/CSS/JS em arquivo único ou multi-file, PWA quando fizer sentido, Firebase (Auth + Firestore), localStorage, jsPDF (embutido) e arquitetura offline-first.
7. Hospedagem: GitHub Pages.

## 2. VERSIONAMENTO E ENTREGA
8. Sequência de versões: 1.0 → 1.1 → … → 1.9 → 2.0 → 2.1. Nunca pule versão e use só uma casa decimal (nunca 1.10).
9. Toda alteração, por menor que seja, sobe a versão, inclusive no arquivo de código baixável.
10. Em toda entrega, escreva a versão explicitamente no texto da resposta.
11. Nome do arquivo: `fenix-nome-do-app-vX.X.html` (prefixo `fenix-`, hífens, versão no nome). Nunca use nome genérico como `app.html`.
12. Exceção de nome: `fenix-core.js` e `index.html` são as cópias publicadas e NÃO levam versão no nome (os apps apontam para elas). A cada entrega, entregue também uma cópia idêntica com a versão no nome (ex.: `fenix-core-v2.2.js`, `fenix-nome-do-app-v1.3.html`), usada só para controle histórico; nenhum app aponta para ela. A versão do core fica também no comentário de topo do arquivo. Os documentos legais (`fenix-termos-de-uso.html` e `fenix-politica-de-privacidade.html`) também ficam sem versão no nome e trazem a versão dentro do documento.
13. Changelog e Manual obrigatórios: todo app tem um Changelog e um Manual do aplicativo, acessíveis dentro do app (ex.: item Ajuda no menu), somente para visualização (sem edição) e com botão para baixar (PDF, gerado com o jsPDF já embutido). Vale para todos os apps futuros e, nos existentes, a partir da próxima alteração de cada um. O `fenix-core.js` não entra aqui: segue a regra 12.
    - Changelog: lista das versões, da mais nova para a mais antiga, com versão, data e o que mudou. Toda alteração entrega uma entrada nova, junto com a subida de versão.
    - Manual: explica para que serve o app e como usar cada área e função. É revisado sempre que uma alteração mudar o uso do app.
    - Em app existente, o Changelog começa na versão atual; o histórico anterior só entra se eu o informar.
14. Tela Sobre: na área de Ajuda, todo app tem uma tela Sobre feita com o módulo `FenixCore.sobre`. Chame `FenixCore.sobre.registrarAcesso("fenix-nome-do-app", "vX.X")` uma vez no carregamento do app (conta 1 acesso por abertura) e mostre: versão, número de acessos, data e hora do primeiro acesso e a última atualização (versão instalada e data). Os dados da Fênix (nome, CNPJ e e-mail) vêm de `FenixCore.EMPRESA`. Tudo fica no aparelho (localStorage), e nada é enviado para fora.
    - O primeiro acesso também é o início da contagem de 7 dias do alerta de backup (regra 45).

## 3. IDENTIDADE VISUAL
15. Paleta oficial:
    - Degradê de menu e rodapé: `#040798` → `#0076CE`
    - Marca (Azul Fênix): `#041273`
    - Botões (Dell Azul): `#0076CE`
    - Destaque, alerta e hover (Amarelo): `#ffcb00`
    - Texto dos inputs: `#000000`
    - Texto de barra de menus e rodapé: `#ffffff`
16. Degradê: sempre que houver menu lateral/superior e rodapé, aplique `linear-gradient` de `#040798` para `#0076CE` (horizontal no rodapé, vertical ou diagonal no menu).
17. Fundo da página `#F3F4F9`; cards brancos com sombra suave; texto principal `#020733`.
18. Identidade gráfica: a águia Fênix. Arquivos oficiais no GitHub Pages (base https://fenicris-dev.github.io/Fenix-Core/): `Fenix_Icone_64.png`, `Fenix_Icone_128.png`, `Fenix_Icone_192.png` e `Fenix_Icone_512.png` (águia branca sobre o degradê Fênix, quadrados: favicon, ícone de cabeçalho e ícones do PWA) e `Fenix_Logo_Azul_320.png`, `Fenix_Logo_Azul_640.png`, `Fenix_Logo_Branca_320.png` e `Fenix_Logo_Branca_640.png` (águia com fundo transparente; 640 para telas de alta densidade). Nos apps, embuta em base64 inline: o app nunca depende de arquivo externo para abrir, e o endereço do GitHub Pages é a fonte oficial para gerar o base64 e para trocas futuras de logo. Logo Branca em fundos de cor (degradê, azul, splash, topo do login); logo Azul em fundos brancos ou claros (cards, PDFs, recibos, orçamentos); a Azul nunca vai sobre o degradê. Ícones da interface lineares.
19. Layout: menu lateral (ou superior) + cards. Seções colapsáveis (accordion) sempre fechadas por padrão.
20. Mobile: barra de abas fixa embaixo, com o ícone central em destaque para a ação principal.
21. Áreas de toque: botões, ícones clicáveis e demais elementos de toque têm no mínimo 44 × 44 px, com espaço entre eles, porque os técnicos usam os apps no celular, em campo.
22. Mensagens ao usuário: escreva em português claro, sem jargão técnico (nada de "HTTP 500" ou "undefined"), dizendo o que aconteceu e o que fazer. Os estados de carregando, lista vazia e erro seguem um padrão único em todos os apps, só com cores da paleta (alertas em amarelo `#ffcb00`).
23. Template de referência para apps com menu: `fenix-template-layout-menu-v1.0.html` (menu lateral + cabeçalho + cards + rodapé).
24. Rodapé padrão: fundo em degradê Fênix, texto branco, no formato `{ANO} <Cristiano Fênix/> | © Fênix Soluções Tecnológicas`
    - O ano vem de `new Date().getFullYear()`, nunca fixo.
    - `<Cristiano Fênix/>` linka para o WhatsApp: https://wa.me/5579999680880
    - "© Fênix Soluções Tecnológicas" linka para o Instagram: https://www.instagram.com/fenixsolucoestecnologicas/
    - O número da versão do app fica visível no rodapé, inclusive no `index.html` publicado, que é cópia idêntica da versão numerada.

## 4. ACESSO E LOGIN
25. Layout oficial de login: TODO app com acesso por senha usa o `fenix-template-login-v1.2.html`. Não crie outro layout de login. Características: abas Entrar / Criar conta (a aba Criar conta pede só e-mail, senha e confirmação, porque o nome vem do onboarding, regra 30), recuperar senha, só login social Google, topo em degradê com a logo branca e o nome do app, card branco sobre fundo `#F3F4F9`, rodapé padrão, fonte do sistema e apenas cores da paleta; erros e alertas em amarelo `#ffcb00` e hover do botão primário em amarelo. Os links de Termos de Uso e Política de Privacidade apontam para os documentos oficiais (regra 29).
26. Endereços oficiais do template: https://fenicris-dev.github.io/Fenix-Core/fenix-template-login-v1.2.html e uma cópia idêntica em `index.html` (https://fenicris-dev.github.io/Fenix-Core/). Quando o template mudar, suba a nova versão com nome versionado e atualize o `index.html` junto, para as duas cópias não divergirem.
27. Em cada app, mudam só o nome do app (texto no topo do card) e a ligação da autenticação ao Fênix Core, porque a autenticação do template é demonstrativa. Layout, cores e estrutura não mudam.
28. Autenticação por e-mail ou pelo botão do Google. Não use PIN.
29. Termos de Uso e Política de Privacidade: os textos oficiais ficam no GitHub Pages, ao lado do core, com nomes fixos e sem versão, porque os endereços não podem mudar: https://fenicris-dev.github.io/Fenix-Core/fenix-termos-de-uso.html e https://fenicris-dev.github.io/Fenix-Core/fenix-politica-de-privacidade.html. Cada documento traz, dentro dele, o número da versão e a data de atualização. Os links de Termos de Uso e Política de Privacidade do login e do onboarding apontam para esses endereços e abrem em outra aba.
30. Onboarding (primeiro acesso): na primeira vez que o usuário acessa o app, mostre uma tela de onboarding pedindo primeiro nome, e-mail e CNPJ (opcional, só se a pessoa tiver). Não peça CPF. O CNPJ segue as regras de máscara e validação (regra 39) e o aviso de uso (regra 38). Ao informar um CNPJ válido, o Fluxo PJ (regra 36) traz razão social, nome fantasia e endereço: mostre os dados na tela para o usuário conferir e salve no perfil, tudo editável. Se a consulta falhar (sem internet ou CNPJ não encontrado), o onboarding continua e os campos podem ser preenchidos à mão. Com login pelo Google, nome e e-mail já vêm da conta e a tela pede só o que faltar. O onboarding aparece uma única vez, e os dados ficam salvos no perfil do usuário.
31. Nome do usuário na tela: exiba o primeiro nome do usuário no lado direito da tela, junto ao avatar. Ao tocar no avatar, o nome aparece. Se a tela não ficar poluída, exiba o nome ao lado do avatar sem precisar tocar nele.
32. Avatar: se o usuário não tiver foto (contas por e-mail), mostre a inicial do primeiro nome sobre fundo Dell Azul `#0076CE`, com texto branco. O menu do avatar traz, nesta ordem: o primeiro nome, Ajuda (Changelog e Manual, regra 13) e Sair.
33. Splash de abertura (apps com autenticação): tela azul Fênix cheia, ícone oficial, nome do sistema + "Fênix Soluções Tecnológicas" e barrinha animada de vai e vem (sem texto piscando). Some assim que a tela certa estiver pronta (login ou app já logado), sem atraso artificial, com teto de segurança de 1,2 s.

## 5. CADASTROS E DADOS
34. Cadastro PF: nome completo, CPF, RG, data de nascimento, telefone/WhatsApp, e-mail, CEP e endereço (logradouro, número, complemento, referência, bairro, cidade, UF). O CEP busca o endereço com `FenixCore.localidades.buscarPorCEP(cep)` (ViaCEP), e os campos continuam editáveis.
35. Cadastro PJ: razão social, nome fantasia, CNPJ, inscrição estadual/municipal (quando aplicável), telefone/WhatsApp, e-mail, CEP, endereço completo e nome do responsável/contato.
36. Fluxo PJ: ao digitar o CNPJ, use `FenixCore.pessoas.buscarNaReceita(cnpj)` (BrasilAPI), dentro de um try/catch, e preencha razão social, nome fantasia e endereço. Se o endereço vier incompleto ou desatualizado, peça ao usuário para redigitar o CEP e use `FenixCore.localidades.buscarPorCEP(cep)` (ViaCEP) para corrigir. Tudo continua editável.
37. Toggle PF/PJ (radio ou abas) alterna os conjuntos de campos, mantendo compartilhados os campos comuns (telefone, e-mail, endereço).
38. Abaixo dos campos CPF e CNPJ, exiba sempre: "O CPF/CNPJ é usado apenas para emissão de Notas Fiscais e/ou Recibos."
39. Máscaras (aplicadas enquanto o usuário digita):
    - CPF: `000.000.000-00`
    - CNPJ: `00.000.000/0000-00`
    - CEP: `00000-000`
    - Celular: `(00) 0 0000-0000`
    - Fixo: `(00) 0000-0000`
    - Valide os dígitos verificadores de CPF e CNPJ, não apenas o formato, com `FenixCore.validarCPF` e `FenixCore.validarCNPJ`; para formatar, use `FenixCore.formatarCPF`, `formatarCNPJ` e `formatarDocumento`.
40. Moeda no padrão ABNT/pt-BR: `R$ 0.000,00` (ponto nos milhares, vírgula nos decimais), tanto na exibição quanto nos campos de digitação, enquanto o usuário digita.
41. Datas no padrão brasileiro `dd/mm/aaaa` e horas em 24h (`HH:mm`), na exibição e nos campos de digitação. Internamente, guarde as datas em formato ISO (`aaaa-mm-dd`).
42. Cadastros pelo Fênix Core (regra de ouro): pessoas físicas e jurídicas são cadastradas e buscadas pelo `FenixCore.pessoas`. Nenhum app cria coleção própria de pessoas ou clientes: guarda só a referência (CPF ou CNPJ) e, se quiser, um cache leve (nome, cidade) para listas rápidas, nunca o cadastro duplicado.
43. Padronização de escrita ao salvar: nome de pessoa física e jurídica (razão social e nome fantasia) em MAIÚSCULAS; demais textos com a primeira letra de cada palavra em maiúscula, exceto preposições; e-mail em minúsculas e UF em maiúsculas. O core já aplica isso ao salvar pessoas, produtos e localidades; nos campos próprios do app, use `FenixCore.formatarTitulo` e `FenixCore.formatarNomeMaiusculo`. Registros antigos só são padronizados quando forem salvos de novo.
44. Ficha de produto/equipamento: a base é sempre Marca, Modelo e Série (Serial). Campos extras (IP, Local, Senha, Zonas etc.) variam conforme a categoria.
45. Backup dos dados: todo app que guarda dados no aparelho (localStorage) usa o módulo `FenixCore.backup`. Depois do carregamento, chame `FenixCore.backup.verificarLembrete("fenix-nome-do-app", { aoFazerBackup: ... })`, que abre o alerta após mais de 7 dias sem cópia, e gere o arquivo com `FenixCore.backup.baixarJSON("fenix-nome-do-app", dados)`, que o nomeia `fenix-nome-do-app-backup-aaaa-mm-dd.json`. Inclua a versão do app dentro de `dados`. O core não tem importação: o app oferece o botão Importar na área de Ajuda ou Configurações, e a importação substitui os dados atuais, então segue a regra de ações destrutivas (regra 48).
46. Documentos em PDF (recibos, orçamentos, relatórios): usam um cabeçalho padrão com a logo Azul (regra 18) e os dados da empresa do usuário, vindos do perfil do onboarding (razão social, CNPJ e endereço, quando informados); sem CNPJ, usam o nome do usuário. Datas e valores seguem as regras 41 e 40.

## 6. SEGURANÇA E QUALIDADE
47. Regras de segurança do Firestore: nenhuma coleção fica aberta, nem em modo de teste. Cada usuário só lê e grava os próprios dados (comparando `request.auth.uid` com o dono do documento); dados compartilhados entre usuários só com permissão explícita. Ao criar ou alterar coleções, entregue junto as regras do Firestore correspondentes, para eu publicar no console do Firebase.
48. Ações destrutivas (apagar dados) exigem digitar uma palavra de confirmação (ex.: "APAGAR") para liberar o botão. Nunca use o `confirm()` simples do navegador.
49. Antes de entregar, valide o JS: `node --check` deve retornar 0 e as chaves devem estar balanceadas.
50. Teste antes de entregar: além da validação do JS (regra 49), confira o app em tela de 360 px de largura, que é o celular comum dos técnicos em campo, e sem internet, conforme o comportamento da regra 3.
51. Handlers inline no HTML (onclick etc.) exigem funções declaradas com `var` ou `function`, nunca `const` nem arrow function, para ficarem acessíveis no escopo global.
52. Cuidados contra regressão: o escape do Python pode corromper template literals de JS, e blocos órfãos depois de refatorações quebram botões. Confira os dois pontos antes de entregar.

## 7. PROCESSO
53. Estas regras são um documento vivo. Em cada app novo, antes de começar, confirme comigo: nome do app, funcionalidade principal, se precisa de cadastro PF, PJ ou ambos, se usa Firebase desde a v1 ou local-first primeiro, outras APIs e observações de layout.

## COMO ENTREGAR
- Declare a versão no texto da resposta.
- Entregue o arquivo com o nome no padrão da regra 11.
- Para `index.html` e `fenix-core.js`, entregue também a cópia idêntica com a versão no nome (regra 12).
- Se algo que eu pedir contrariar alguma regra acima, avise e pergunte antes de executar.
