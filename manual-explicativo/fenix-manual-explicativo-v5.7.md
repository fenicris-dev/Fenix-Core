# Manual explicativo da Biblioteca Fênix (v5.7)

Este manual explica, em português simples, **para que serve cada regra do Livro das Regras (1 a 78)** e **cada módulo do Fênix Core**. Foi feito para o Cristiano e para os colaboradores, inclusive quem não programa.

- **Parte 1:** as regras do Livro, uma a uma (o que diz, para que serve, quando vale, na prática e como conferir).
- **Parte 2:** o Fênix Core, módulo a módulo (o que é, para que serve, regras relacionadas, funções, exemplo e cuidados).

Se houver diferença entre este manual e o Livro ou o Guia, **valem o Livro e o Guia**. Este manual foi refeito do zero a partir do Livro e do core da versão 5.7.

---

# PARTE 1. As regras do Livro

O Livro das Regras Fênix é o documento que diz como todo aplicativo da Fênix Soluções Tecnológicas deve ser construído: de onde vem o código comum, como o app se parece, como o usuário entra, como os dados são guardados, o que é testado antes de entregar e como cada entrega é conferida. Ele tem 78 regras numeradas, divididas em 15 seções, mais a Ficha de aplicação e o roteiro "Como entregar".

Este manual explica cada regra em cinco linhas: o que ela diz, para que serve, quando vale, como aparece na prática e como conferir. Ele não substitui o livro; se houver diferença, vale o livro. Quem constrói um app pode ler na ordem ou procurar pelo número da regra.

A Ficha de aplicação é a lista que se confere com o Cristiano a cada app novo ou alterado. Ela tem os grupos A a J: A (banco de dados Firebase ativo), B (acesso com login), C (cadastro de pessoas PF/PJ), D (ficha de produto/equipamento), E (backup dos dados no aparelho), F (documentos em PDF), G (dashboard com indicadores), H (login com Google), I (sincronização entre aparelhos) e J (tema escuro opcional). Os grupos B a G vêm marcados e podem ser desmarcados; o A, o H, o I e o J vêm desmarcados.

"Valem sempre" significa que a regra se aplica a todo app, sem marcar nada na Ficha. São as regras 1 a 3, 5 a 22, 39, 40, 47 a 53, 55, 59, 60, 61, 62, 64, 65, 68, 69, 70, 71, 72, 73, 74, 75, 77 e 78. As demais só valem quando o grupo correspondente estiver marcado, e isso aparece no item "Quando vale" de cada regra.

---

## 1. Arquitetura

Esta seção trata da base técnica de todo app: de onde vem o código comum (o Fênix Core), como o app se comporta sem internet, quais ferramentas usa e onde é publicado. São as regras que garantem que todos os apps nasçam sobre o mesmo alicerce.

### Regra 1. Fênix Core centralizado
- **O que diz:** todo app carrega o core (o código comum da Fênix) do endereço oficial `https://fenicris-dev.github.io/Fenix-Core/fenix-core.js`. O core é um módulo ES (um tipo de arquivo JavaScript que usa `import`/`export`) e exporta `FenixCore`. Nunca se copia o core para dentro do app. A versão do core fica só no comentário de topo do arquivo. Em cada app, chama-se `FenixCore.init("fenix-nome-do-app")` uma única vez, no carregamento, com o mesmo identificador do nome do arquivo (regra 10). O banco de dados vem pré-configurado em todo app, mas desligado: o app nasce guardando dados só no aparelho (`localStorage`) e só liga o Firestore quando o Cristiano der o sinal, trocando `const FENIX_BANCO_ATIVO = false;` para `true`. Enquanto estiver `false`, o app não lê nem grava no Firestore. As leituras e gravações do banco já ficam escritas atrás dessa chave, para que ativar seja só trocar o valor. O endereço com sublinhado (`Fenix_Core`) não existe: o nome certo é `Fenix-Core`, com hífen.
- **Para que serve:** o Livro dá o motivo: qualquer correção feita no core vale para todos os apps sem precisar trocar a versão deles. Deixar o banco pronto, mas desligado, evita refazer o app quando ele for ativado.
- **Quando vale:** sempre, em todo app. A parte de ligar o Firestore só entra com o grupo A marcado (banco ativo).
- **Na prática:** no código de um app aparece uma única chamada `FenixCore.init("fenix-nome-do-app")` e, perto do começo, a linha `const FENIX_BANCO_ATIVO = false;`. Não existe nenhuma cópia do `fenix-core.js` na pasta do app.
- **Como conferir:** procure no arquivo o endereço do core com hífen (`Fenix-Core`); confirme que o core não foi colado dentro do app, que `FenixCore.init` aparece uma só vez com o mesmo nome do arquivo e que a chave `FENIX_BANCO_ATIVO` está `false`, a menos que o banco tenha sido liberado.

### Regra 2. Carregamento do Fênix Core
- **O que diz:** como o core é um módulo ES, não se usa `<script src>` simples nem se cola o arquivo como script comum, porque o navegador recusa o `import`. Todo app usa o carregador oficial, colocado no `<head>`. Ele busca o core na URL oficial (regra 1), guarda uma cópia no cache do aparelho e, sem internet ou se a URL falhar, usa a cópia guardada. O código do app que depende do core só roda depois dele, com `window.fenixCoreReady.then(function (FenixCore) { FenixCore.init("fenix-nome-do-app"); ... })`. A primeira abertura precisa de internet, para guardar a cópia do core e para o navegador guardar o SDK do Firebase (que o core carrega do gstatic). Se ela falhar sem internet e sem cópia, o app mostra uma mensagem clara pedindo para conectar na primeira vez.
- **Para que serve:** evita que o navegador recuse o core e permite que o app abra sem internet depois da primeira vez.
- **Quando vale:** sempre, em todo app.
- **Na prática:** o início do `<head>` de qualquer app traz o bloco do carregador oficial, e o resto do app só começa dentro do `window.fenixCoreReady.then(...)`. Se alguém abrir o app pela primeira vez sem internet, vê um aviso em português pedindo para conectar.
- **Como conferir:** veja se o carregador oficial está no `<head>` sem alterações e se não há `<script src>` apontando para o core. Teste abrindo o app online uma vez e depois sem internet: ele precisa abrir. Teste também a primeira abertura sem internet: deve aparecer a mensagem clara.

### Regra 3. Comportamento offline
- **O que diz:** o app nunca deve travar sem internet. Ao abrir, tenta conectar ao Firebase e, se não conseguir, trabalha offline com os dados locais (`localStorage`). Para reagir na hora, usa `navigator.onLine` e os eventos `online` e `offline` do navegador, mas sem depender só disso, porque `navigator.onLine` pode indicar conexão sem haver internet de verdade. Enquanto estiver offline, tenta reconectar ao Firebase a cada 5 minutos, e também imediatamente quando o evento `online` disparar. Ao reconectar, sincroniza e atualiza os dados.
- **Para que serve:** o Livro não escreve um motivo, mas o uso em campo deixa claro: o técnico trabalha onde o sinal falha, e o app precisa continuar funcionando.
- **Quando vale:** sempre. As partes de reconexão com o Firebase só valem com o grupo A marcado (banco ativo).
- **Na prática:** o usuário tira o celular do modo avião e, sem fazer nada, o app volta a sincronizar sozinho. Com o aparelho sem sinal, o app abre e mostra os dados que estão guardados nele.
- **Como conferir:** desligue a internet, abra o app e cadastre algo: não pode travar nem dar erro. Religue a internet e veja se o app reage sem precisar recarregar. Se o banco estiver ativo, confira também a tentativa de reconexão a cada 5 minutos.

### Regra 4. Indicador de conexão
- **O que diz:** o cabeçalho mostra um ícone discreto com o estado da conexão (online, offline ou sincronizando), alimentado pelo comportamento da regra 3. Usa só cores da paleta e um ícone diferente para cada estado, sem depender só da cor.
- **Para que serve:** o usuário vê de relance em que situação está a conexão. O ícone diferente para cada estado serve para quem não distingue bem as cores.
- **Quando vale:** só com o grupo A marcado (banco ativo), pois a Ficha de Aplicação coloca a regra 4 nesse grupo.
- **Na prática:** no topo do app, ao lado do avatar ou do título, há um pequeno ícone que muda de desenho conforme o app esteja online, offline ou sincronizando.
- **Como conferir:** com o banco ativo, alterne a conexão e veja se o ícone muda de forma (não só de cor) nos três estados e se usa apenas cores da paleta.

### Regra 5. Stack
- **O que diz:** a base técnica é HTML, CSS e JS em arquivo único ou em vários arquivos, PWA (app instalável pelo navegador) quando fizer sentido, Firebase (Auth + Firestore), `localStorage`, jsPDF (biblioteca que gera PDF) embutido e arquitetura offline-first (o app funciona primeiro no aparelho).
- **Para que serve:** o Livro não escreve o motivo. Na prática, é manter todos os apps na mesma tecnologia.
- **Quando vale:** sempre, em todo app.
- **Na prática:** um app novo é um `index.html` (ou poucos arquivos) com HTML, CSS e JS puros, sem montar um projeto com ferramentas extras, e usa o jsPDF já embutido para gerar PDFs.
- **Como conferir:** veja se o app usa só essas tecnologias e se o jsPDF está dentro do próprio app, sem depender de endereço externo.

### Regra 6. Hospedagem
- **O que diz:** a hospedagem dos apps é no GitHub Pages.
- **Para que serve:** o Livro não explica o motivo. É o mesmo lugar de onde a biblioteca serve o core, os ícones e os templates.
- **Quando vale:** sempre, em todo app.
- **Na prática:** cada app é publicado em um repositório próprio no GitHub, e o endereço dele é o do GitHub Pages.
- **Como conferir:** confirme que o app foi publicado no GitHub Pages e abre pelo endereço publicado.

---

## 2. Versionamento e entrega

Esta seção trata de como as versões são numeradas, como os arquivos são nomeados e que material acompanha cada app (Changelog, Manual, tela Sobre). Serve para saber sempre qual versão de cada coisa está em uso e para que nada se perca entre uma entrega e outra.

### Regra 7. Sequência de versões
- **O que diz:** as versões seguem 1.0, 1.1, até 1.9, depois 2.0, 2.1 e assim por diante. Nunca se pula versão e usa-se só uma casa decimal (nunca 1.10). Isso vale para cada app. Já o Livro das Regras, o Guia da biblioteca, as regras do Firestore (`firestore.rules`), o Fênix Core, o Painel da biblioteca (`index.html`), o Painel administrativo (`admin/fenix-admin.html`), os templates de login, de onboarding e de splash e os documentos legais (Termos de Uso e Política de Privacidade) andam sempre juntos, com o mesmo número: qualquer mudança em um deles sobe todos para a mesma versão nova, mesmo que o conteúdo dos outros não mude. A única exceção, registrada no Histórico, foi o nivelamento da v3.0, em que o Fênix Core (que estava na 2.5), os templates (1.2 e 1.0) e os documentos legais (1.0) saltaram direto para a 3.0. O esclarecimento da v5.6 diz que as regras 7 a 11 tratam do mesmo assunto, versão e cópias: a 7 é a sequência e o nivelamento, a 8 a 10 dizem onde a versão aparece e como o arquivo se chama, e a 11 são as duas cópias.
- **Para que serve:** uma sequência previsível mostra de imediato se algo está atrasado. O número único da biblioteca evita misturar peças de versões diferentes.
- **Quando vale:** sempre, para cada app e para toda a biblioteca.
- **Na prática:** um app que está na 1.3 vai para a 1.4 na próxima alteração, nunca para a 1.5. Na biblioteca, se só o Termos de Uso mudar, todas as peças listadas acima sobem juntas para o mesmo número novo.
- **Como conferir:** veja se o número novo é o seguinte exato do anterior, com uma casa decimal, e, no caso da biblioteca, se todas as peças da lista estão com o mesmo número.

### Regra 8. Toda alteração sobe a versão
- **O que diz:** toda alteração, por menor que seja, sobe a versão, inclusive no arquivo de código baixável.
- **Para que serve:** o Livro não detalha o motivo. Na prática, evita que existam dois arquivos diferentes com o mesmo número.
- **Quando vale:** sempre, em todo app.
- **Na prática:** mesmo corrigir uma palavra errada numa tela gera uma versão nova, com entrada nova no Changelog.
- **Como conferir:** compare o arquivo novo com o anterior: se algo mudou, o número da versão também precisa ter mudado, no nome do arquivo, dentro do arquivo e no Changelog.

### Regra 9. Dizer a versão na entrega
- **O que diz:** em toda entrega, a versão é escrita explicitamente no texto da resposta.
- **Para que serve:** o Livro não explica. Na prática, quem recebe fica sabendo qual versão chegou sem abrir o arquivo.
- **Quando vale:** sempre, em todo app.
- **Na prática:** a resposta de entrega traz uma frase como "Entrega: Nome do App, versão 1.4".
- **Como conferir:** releia o texto da resposta antes de enviar e veja se o número da versão está escrito nele.

### Regra 10. Nome do arquivo
- **O que diz:** o arquivo do app se chama `fenix-nome-do-app-vX.X.html` (prefixo `fenix-`, hífens, versão no nome) e sempre vem acompanhado da cópia neutra `fenix-nome-do-app.html` (regra 11). Nunca se usa nome genérico como `app.html`.
- **Para que serve:** o nome padronizado identifica o app e a versão sem abrir o arquivo. O mesmo identificador do nome é usado em `FenixCore.init` (regra 1).
- **Quando vale:** sempre, em todo app.
- **Na prática:** um app de orçamentos teria o arquivo `fenix-nome-do-app-v1.3.html` (com o nome do app no lugar) e a cópia `fenix-nome-do-app.html`.
- **Como conferir:** veja se o nome começa com `fenix-`, usa hífens, tem a versão e não é genérico, e se a cópia neutra existe ao lado.

### Regra 11. Duas cópias de todo material com versão
- **O que diz:** tudo que tem versão (apps novos, em atualização e antigos, Fênix Core, templates de login e de onboarding, Termos de Uso, Política de Privacidade, o Livro das Regras, o Resumo do livro, o Guia da biblioteca e as regras do Firestore) é entregue sempre em duas cópias idênticas. A primeira tem a versão no nome (exemplos do Livro: `fenix-core-v5.7.js`, `fenix-nome-do-app-v1.3.html`) e serve só para controle interno. A segunda é a cópia neutra, sem versão no nome (exemplos: `fenix-core.js`, `fenix-nome-do-app.html`), que é a referência e à qual os apps apontam. Nenhum app aponta para a cópia com versão. A versão fica também dentro do arquivo: comentário de topo no core, rodapé nos templates, cabeçalho nos documentos legais e no livro. O `index.html` é o Painel da biblioteca (página que testa cada endereço oficial e confere as versões); a cópia com versão dele é `index-v5.7.html`.
- **Para que serve:** o endereço neutro nunca muda, então os apps não quebram quando a versão sobe. A cópia com versão guarda o histórico.
- **Quando vale:** sempre, para todo material com versão.
- **Na prática:** o app aponta para `fenix-core.js` (sem versão) e nunca para `fenix-core-v5.7.js`. Quem quiser consultar a versão antiga abre a cópia com o número no nome.
- **Como conferir:** para cada material entregue, veja se existem as duas cópias, se o conteúdo é idêntico e se nenhum app aponta para o endereço com versão.

### Regra 12. Changelog e Manual do usuário obrigatórios
- **O que diz:** todo app tem um Changelog e um Manual do usuário, acessíveis dentro do app (Ajuda), somente para visualização, sem edição. Vale para todos os apps futuros e, nos existentes, a partir da próxima alteração de cada um. O `fenix-core.js` não entra, pois segue a regra 11.
  - Changelog: fica na tela Sobre (regra 13), com as versões da mais nova para a mais antiga. Cada versão traz o número, "Criada em", "Modificada em" (igual à criação se não houve nova modificação) e o que mudou, com datas no padrão dd/mm/aaaa (regra 40). Toda alteração entrega uma entrada nova, junto com a subida de versão. Há um botão para baixar o Changelog em PDF (gerado com o jsPDF embutido). Monta-se com `FenixCore.sobre.montarTela(...)` e baixa-se o PDF com `FenixCore.sobre.baixarChangelogPDF(...)`.
  - Manual do usuário, em dois formatos: (a) em MD, guardado dentro do próprio app e exibido na Ajuda; (b) em PDF, para baixar, gerado com o jsPDF a partir do mesmo conteúdo do MD. É um passo a passo na ordem em que o usuário usa o app: para cada tela, explica cada campo e cada botão, com exemplo de uso e o print da tela, em português claro (regra 21). Mostra-se com `FenixCore.manual.montarTela(...)` e gera-se o PDF com `FenixCore.manual.baixarPDF(...)`.
  - Prints do manual: gerados a cada entrega, com o navegador de teste, em largura de 360 px, a partir do app com dados de exemplo (nunca dados reais). São comprimidos em JPEG e embutidos no próprio arquivo (base64). O manual é revisado e os prints refeitos sempre que uma alteração mudar o uso ou a aparência do app.
  - Em toda entrega, o manual vai também em MD e em PDF, com os nomes `fenix-nome-do-app-manual-vX.X.md` e `fenix-nome-do-app-manual-vX.X.pdf`.
  - Em app existente, o Changelog começa na versão atual; o histórico anterior só entra se o Cristiano o informar.
- **Para que serve:** o usuário aprende o app sem ajuda externa e o histórico de mudanças fica registrado. Prints com dados de exemplo evitam expor dados reais.
- **Quando vale:** sempre. Nos apps existentes, a partir da próxima alteração de cada um.
- **Na prática:** dentro de Ajuda, o usuário abre o Manual, lê o passo a passo de cada tela e pode baixar o PDF. Na tela Sobre, vê a lista de versões, cada uma com "Criada em" e "Modificada em".
- **Como conferir:** veja se o Changelog tem uma entrada nova para a versão entregue, com datas em dd/mm/aaaa e botão de PDF; se o manual existe em MD e PDF com os nomes certos; se os prints são recentes, de 360 px e com dados de exemplo.

### Regra 13. Tela Sobre
- **O que diz:** na área de Ajuda, todo app tem uma tela Sobre feita com o módulo `FenixCore.sobre`. Chama-se `FenixCore.sobre.registrarAcesso("fenix-nome-do-app", "vX.X")` uma vez no carregamento do app (conta 1 acesso por abertura) e a tela mostra: versão, número de acessos, data e hora do primeiro acesso e a última atualização (versão instalada e data). Os dados da Fênix (nome fantasia, razão social, CNPJ e e-mail) vêm de `FenixCore.EMPRESA`. Tudo fica no aparelho (`localStorage`) e nada é enviado para fora. Mostra também o Changelog (regra 12), a data de criação do app (a "Criada em" da primeira versão do Changelog) e a data da última modificação (a "Modificada em" da versão mais recente). A tela inteira pode ser montada com `FenixCore.sobre.montarTela(...)`. O primeiro acesso também é o início da contagem de 7 dias do alerta de backup (regra 44).
- **Para que serve:** reúne num só lugar a versão em uso, o uso do app e quem é a empresa por trás dele.
- **Quando vale:** sempre, em todo app.
- **Na prática:** em Ajuda, o usuário toca em Sobre e vê, por exemplo, a versão instalada, quantas vezes abriu o app e os dados da Fênix, além do Changelog.
- **Como conferir:** confirme que `registrarAcesso` é chamado uma vez ao abrir (sem contar duas vezes), que a tela mostra todos os itens listados e que os dados da empresa vêm de `FenixCore.EMPRESA`, não escritos à mão.

---

## 3. Identidade visual

Esta seção trata da aparência dos apps: cores, logos, layout, tamanho dos botões, mensagens e rodapé. O objetivo é que qualquer app Fênix seja reconhecido de imediato como parte da mesma família.

### Regra 14. Paleta oficial
- **O que diz:** as cores oficiais são: degradê de menu e rodapé `#040798` para `#0076CE`; marca (Azul Fênix) `#041273`; botões (Dell Azul) `#0076CE`; destaque, alerta e hover (Amarelo) `#ffcb00`; texto dos inputs `#000000`; texto de barra de menus e rodapé `#ffffff`.
- **Para que serve:** garantir a mesma cara em todos os apps e uma identidade de marca consistente.
- **Quando vale:** sempre, em todo app.
- **Na prática:** botões azuis (Dell Azul), alertas e hover em amarelo, texto digitado nos campos em preto e texto de menu e rodapé em branco.
- **Como conferir:** compare as cores usadas na tela com a lista acima. Não deve haver cor fora da paleta oficial.

### Regra 15. Degradê
- **O que diz:** sempre que houver menu lateral ou superior e rodapé, aplica-se `linear-gradient` de `#040798` para `#0076CE`: horizontal no rodapé, vertical ou diagonal no menu.
- **Para que serve:** o Livro não escreve o motivo. Na prática, é a assinatura visual da marca aparecendo sempre do mesmo jeito.
- **Quando vale:** sempre, em todo app (quando houver menu e rodapé).
- **Na prática:** o menu lateral do app tem o degradê descendo em vertical ou diagonal, e o rodapé tem o mesmo degradê na horizontal.
- **Como conferir:** olhe o menu e o rodapé: os dois devem ter o degradê com as cores `#040798` e `#0076CE`, na direção certa.

### Regra 16. Fundo, cards e texto
- **O que diz:** o fundo da página é `#F3F4F9`, os cards são brancos com sombra suave e o texto principal é `#020733`.
- **Para que serve:** completa a paleta com as cores de base, para que telas de apps diferentes tenham a mesma aparência geral.
- **Quando vale:** sempre, em todo app.
- **Na prática:** uma tela de lista mostra cards brancos com sombra leve sobre um fundo cinza-azulado bem claro.
- **Como conferir:** veja se o fundo, o card e o texto principal têm exatamente as cores acima e se a sombra é suave.

### Regra 17. Identidade gráfica
- **O que diz:** a identidade é a águia Fênix, com arquivos oficiais no GitHub Pages (base `https://fenicris-dev.github.io/Fenix-Core/`). Na pasta `Icon/` ficam `Fenix_Icone_64.png`, `Fenix_Icone_128.png`, `Fenix_Icone_192.png` e `Fenix_Icone_512.png` (águia branca sobre o degradê Fênix, quadrados, para favicon, ícone de cabeçalho e ícones do PWA). Na pasta `Logo/` (águia com fundo transparente) ficam `Fenix_Logo_Azul.png` (oficial) e `Fenix_Logo_Branca.png` (segunda opção), cada uma também em `_320` e `_640` (a 640 é para telas de alta densidade), e as auxiliares `Fenix_Logo_Black.png`, `Fenix_Logo_Silver.png` e `Fenix_Logo_Gray.png`. Nos apps, as imagens vão embutidas em base64 inline: o app nunca depende de arquivo externo para abrir, e o endereço do GitHub Pages é a fonte oficial para gerar o base64 e para trocas futuras de logo. Usa-se o contraste que melhor combina: logo Branca em fundos de cor (degradê, azul, splash, topo do login); logo Azul em fundos brancos ou claros (cards, PDFs, recibos, orçamentos); a Azul nunca vai sobre o degradê. Os ícones da interface são lineares. Ícone provisório: todo app, novo ou existente, que ainda não tem ícone próprio, ou que está com o ícone da letra F, usa a águia bicéfala da Fênix (os `Fenix_Icone_*`) no favicon, no cabeçalho, no PWA e no splash, até o ícone oficial do app subir; quando ele chegar, troca-se os ícones e registra-se no Changelog.
- **Para que serve:** o app nunca deve depender de arquivo externo para abrir (por isso o base64), e escolher o contraste certo evita logo ilegível. O ícone provisório mantém a marca presente antes do ícone próprio.
- **Quando vale:** sempre, em todo app.
- **Na prática:** o topo do login (fundo em degradê) usa a logo Branca, e um PDF de orçamento (fundo branco) usa a logo Azul.
- **Como conferir:** veja se não há endereço externo de imagem no código (tudo embutido), se cada logo está sobre o fundo certo e se um app sem ícone próprio usa a águia, não a letra F.

### Regra 18. Layout
- **O que diz:** o layout é menu lateral (ou superior) mais cards. As seções colapsáveis (accordion, aquelas que abrem e fecham ao toque) ficam sempre fechadas por padrão.
- **Para que serve:** o Livro não escreve o motivo. Na prática, o usuário reconhece a estrutura de qualquer app e a tela não começa cheia de informação.
- **Quando vale:** sempre, em todo app.
- **Na prática:** ao abrir uma tela com várias seções, o usuário vê só os títulos e abre a que quiser.
- **Como conferir:** abra as telas do app: todas as seções colapsáveis devem estar fechadas ao entrar.

### Regra 19. Mobile
- **O que diz:** no celular há uma barra de abas fixa embaixo, com o ícone central em destaque para a ação principal.
- **Para que serve:** o Livro não escreve o motivo. Na prática, deixa a ação mais usada ao alcance do polegar.
- **Quando vale:** sempre, em todo app.
- **Na prática:** no celular, uma barra fica grudada na parte de baixo da tela, e o botão do meio, maior, é a ação principal do app.
- **Como conferir:** abra o app em tela de celular: a barra deve ficar fixa embaixo, mesmo ao rolar, com o ícone do meio em destaque.

### Regra 20. Áreas de toque
- **O que diz:** botões, ícones clicáveis e demais elementos de toque têm no mínimo 44 × 44 px, com espaço entre eles.
- **Para que serve:** o Livro dá o motivo: os técnicos usam os apps no celular, em campo.
- **Quando vale:** sempre, em todo app.
- **Na prática:** os ícones pequenos de editar e excluir numa lista têm uma área de toque de pelo menos 44 × 44 px e não ficam colados um no outro.
- **Como conferir:** no celular, toque em todos os botões e ícones: nenhum deve ser difícil de acertar nem ficar colado em outro.

### Regra 21. Mensagens ao usuário
- **O que diz:** as mensagens são escritas em português claro, sem jargão técnico (nada de "HTTP 500" ou "undefined"), dizendo o que aconteceu e o que fazer. Os estados de carregando, lista vazia e erro seguem um padrão único em todos os apps, só com cores da paleta (alertas em amarelo `#ffcb00`).
- **Para que serve:** o usuário não precisa entender termos técnicos e sabe qual é o próximo passo. O padrão único evita que cada app trate o erro de um jeito.
- **Quando vale:** sempre, em todo app.
- **Na prática:** em vez de um código de erro, o app mostra uma frase dizendo que não foi possível salvar e o que fazer em seguida. Numa lista vazia, aparece um aviso claro no mesmo estilo dos outros apps.
- **Como conferir:** provoque os três estados (carregando, lista vazia e erro) e leia as mensagens: devem estar em português simples, sem códigos, com o alerta em amarelo da paleta.

### Regra 22. Rodapé padrão
- **O que diz:** o rodapé tem fundo em degradê Fênix, texto branco, no formato `{ANO} <Cristiano Fênix/> | © Fênix Soluções Tecnológicas`. O ano vem de `new Date().getFullYear()`, nunca fixo. `<Cristiano Fênix/>` leva ao WhatsApp `https://wa.me/5579999680880`. "© Fênix Soluções Tecnológicas" leva ao Instagram `https://www.instagram.com/fenixsolucoestecnologicas/`. O número da versão do app fica visível no rodapé, inclusive no `index.html` publicado, que é cópia idêntica da versão numerada.
- **Para que serve:** assina todos os apps com o mesmo contato e a mesma marca. O ano automático nunca fica desatualizado e a versão visível ajuda o suporte.
- **Quando vale:** sempre, em todo app.
- **Na prática:** no pé da tela aparece o ano atual, o nome com link para o WhatsApp, o símbolo de copyright com link para o Instagram e o número da versão.
- **Como conferir:** toque nos dois links e veja se levam aos endereços certos, confirme que o ano não está escrito à mão no código e que a versão aparece no rodapé.

---

## 4. Acesso e login

Esta seção trata de como o usuário entra no app e é recebido: tela de login, primeiro acesso (onboarding), nome, avatar, tela de abertura e documentos legais. Segundo a Ficha de Aplicação, estas regras formam o grupo B (acesso com login), que vem marcado por padrão e o Cristiano desmarca se o app não tiver login.

### Regra 23. Layout oficial de login
- **O que diz:** todo app com acesso por senha usa o `templates/fenix-template-login.html`. Não se cria outro layout de login. O template tem abas Entrar e Criar conta (a aba Criar conta pede só e-mail, senha e confirmação, porque o nome vem do onboarding, regra 28), recuperar senha, só login social Google, topo em degradê com a logo branca e o nome do app, card branco sobre fundo `#F3F4F9`, rodapé padrão, fonte do sistema e apenas cores da paleta. Erros e alertas ficam em amarelo `#ffcb00` e o hover do botão primário também é amarelo. Os links de Termos de Uso e Política de Privacidade apontam para os documentos oficiais (regra 27).
- **Para que serve:** o Livro não escreve um motivo à parte. Na prática, é ter o mesmo login, já pronto, em todos os apps, sem cada um inventar o seu.
- **Quando vale:** só com o grupo B marcado (acesso com login).
- **Na prática:** ao abrir um app com senha, o usuário vê o topo azul com a logo branca, o nome do app e o card branco com as abas Entrar e Criar conta, igual em todos os apps.
- **Como conferir:** compare a tela de login com o template oficial: abas, topo, card, rodapé e cores iguais, e os links dos documentos legais funcionando.

### Regra 24. Endereço oficial do template de login
- **O que diz:** o endereço oficial é `https://fenicris-dev.github.io/Fenix-Core/templates/fenix-template-login.html` (cópia neutra). O template fica só nesse endereço: o `index.html` não é mais cópia dele, e sim o Painel da biblioteca (regra 11). Quando o template mudar, sobe-se a nova versão com nome versionado (exemplo do Livro: `fenix-template-login-v5.7.html`, só para histórico) e atualiza-se o `templates/fenix-template-login.html`.
- **Para que serve:** um endereço único evita que várias versões do login circulem ao mesmo tempo.
- **Quando vale:** só com o grupo B marcado. A manutenção do arquivo é da biblioteca.
- **Na prática:** quem precisar do login busca o template nesse endereço, e não em outro app ou no `index.html`.
- **Como conferir:** confirme que o login do app foi copiado do endereço oficial e que o endereço usado tem a pasta `templates/` no caminho.

### Regra 25. O que muda em cada app
- **O que diz:** em cada app mudam só o nome do app (texto no topo do card) e a ligação da autenticação ao Fênix Core, porque a autenticação do template é demonstrativa. Layout, cores e estrutura não mudam.
- **Para que serve:** a parte de autenticação do template é só demonstração, por isso precisa ser ligada ao core. O resto fica igual para manter o padrão.
- **Quando vale:** só com o grupo B marcado.
- **Na prática:** o login de um app novo é o template com o nome do app no topo do card e o botão Entrar ligado ao Fênix Core.
- **Como conferir:** veja se, além do nome do app e da ligação com o core, nada mais foi alterado no template. Teste entrar de verdade, para ter certeza de que a autenticação não é mais a demonstrativa.

### Regra 26. Autenticação por e-mail ou Google, sem PIN
- **O que diz:** a autenticação é por e-mail ou pelo botão do Google. Não se usa PIN.
- **Para que serve:** o Livro não explica o motivo. Na prática, é ter um único caminho de entrada, o do core.
- **Quando vale:** só com o grupo B marcado. O Livro trata o login com Google como pergunta à parte na Ficha (grupo H, regras 56 e 58), que o Cristiano responde a cada app.
- **Na prática:** o usuário entra com e-mail e senha ou toca no botão do Google. Não existe tela de código de 4 dígitos.
- **Como conferir:** procure no app qualquer tela ou campo de PIN: não pode existir. Confira se o botão do Google aparece conforme o grupo H.

### Regra 27. Termos de Uso e Política de Privacidade
- **O que diz:** os textos oficiais ficam no GitHub Pages, na pasta `Termos/`, com nomes fixos e sem versão (cópia neutra, regra 11): `https://fenicris-dev.github.io/Fenix-Core/Termos/fenix-termos-de-uso.html` e `https://fenicris-dev.github.io/Fenix-Core/Termos/fenix-politica-de-privacidade.html`. Cada documento traz, dentro dele, o número da versão (que acompanha a do livro, regra 7) e a data de atualização (que só muda quando o texto do documento muda de fato). Também existe a cópia com a versão no nome (exemplo: `fenix-termos-de-uso-v5.7.html`), só para histórico. Os links de Termos de Uso e Política de Privacidade do login e do onboarding apontam para os endereços sem versão e abrem em outra aba.
- **Para que serve:** o Livro dá o motivo: os endereços não podem mudar. A data só muda quando o texto muda de fato, para não indicar uma alteração que não houve.
- **Quando vale:** só com o grupo B marcado.
- **Na prática:** na tela de login, o usuário toca em "Termos de Uso" e o documento abre em outra aba, sem tirá-lo da tela de login.
- **Como conferir:** toque nos dois links, no login e no onboarding: devem abrir em outra aba e apontar para os endereços sem versão.

### Regra 28. Onboarding (primeiro acesso)
- **O que diz:** na primeira vez que o usuário acessa o app, mostra-se uma tela de onboarding pedindo primeiro nome, e-mail e CNPJ (opcional, só se a pessoa tiver). Não se pede CPF. O CNPJ segue as regras de máscara e validação (regra 38) e o aviso de uso (regra 37). Ao informar um CNPJ válido, o Fluxo PJ (regra 35) traz razão social, nome fantasia e endereço: os dados aparecem na tela para o usuário conferir e são salvos no perfil, tudo editável. Se a consulta falhar (sem internet ou CNPJ não encontrado), o onboarding continua e os campos podem ser preenchidos à mão. Com login pelo Google, nome e e-mail já vêm da conta e a tela pede só o que faltar. O onboarding aparece uma única vez, e os dados ficam salvos no perfil do usuário.
- **Para que serve:** o Livro não dá um motivo à parte. Na prática, pede só o mínimo para conhecer o usuário e não trava quando a consulta do CNPJ falha.
- **Quando vale:** só com o grupo B marcado.
- **Na prática:** no primeiro acesso, a pessoa digita o primeiro nome, o e-mail e, se tiver empresa, o CNPJ, e vê os dados da empresa aparecerem para conferir. Se estiver sem internet, preenche à mão e segue.
- **Como conferir:** faça um primeiro acesso de teste: a tela não pede CPF, o CNPJ é opcional, a consulta preenche os dados, a falha da consulta não impede de continuar, e a tela não volta no segundo acesso.

### Regra 29. Template de onboarding
- **O que diz:** todo app usa o `templates/fenix-template-onboarding.html` na tela de primeiro acesso e não cria outro layout. O endereço oficial é `https://fenicris-dev.github.io/Fenix-Core/templates/fenix-template-onboarding.html` (a versão fica dentro do arquivo; a cópia com a versão no nome, como `fenix-template-onboarding-v5.7.html`, serve só de histórico). O app define `window.FENIX_PERFIL_INICIAL` com o que já sabe do login (nome e e-mail, no caso do Google), liga o `salvarPerfil()` ao Fênix Core e escuta o evento `fenix:onboarding-concluido`. O app só abre a tela se `perfil.onboardingConcluido` não for verdadeiro.
- **Para que serve:** o Livro não detalha o motivo. Na prática, é ter o mesmo onboarding em todos os apps, que não reaparece depois de concluído.
- **Quando vale:** só com o grupo B marcado.
- **Na prática:** com login pelo Google, o app já entrega o nome e o e-mail em `window.FENIX_PERFIL_INICIAL`, e o usuário só completa o que faltar. Ao terminar, o app recebe o aviso `fenix:onboarding-concluido`.
- **Como conferir:** veja se o app usa o template oficial sem layout próprio, se define `window.FENIX_PERFIL_INICIAL`, se liga `salvarPerfil()` ao core e se escuta o evento. Depois de concluir o onboarding, reabra o app: a tela não pode aparecer de novo.

### Regra 30. Nome do usuário na tela
- **O que diz:** o primeiro nome do usuário aparece no lado direito da tela, junto ao avatar. Ao tocar no avatar, o nome aparece. Se a tela não ficar poluída, o nome é exibido ao lado do avatar sem precisar tocar nele.
- **Para que serve:** o Livro não explica. Na prática, quem usa o app vê com qual conta está logado.
- **Quando vale:** só com o grupo B marcado.
- **Na prática:** no canto direito do topo aparece o avatar com o primeiro nome do usuário ao lado, quando houver espaço.
- **Como conferir:** veja o canto direito da tela em celular e computador: o primeiro nome (não o nome completo) deve estar ali, ao lado do avatar ou ao tocar nele.

### Regra 31. Avatar
- **O que diz:** se o usuário não tiver foto (contas por e-mail), mostra-se a inicial do primeiro nome sobre fundo Dell Azul `#0076CE`, com texto branco. O menu do avatar traz, nesta ordem: o primeiro nome, Ajuda (Changelog e Manual, regra 12) e Sair.
- **Para que serve:** o Livro não explica. Na prática, dá um avatar e um menu iguais em todos os apps, mesmo sem foto.
- **Quando vale:** só com o grupo B marcado.
- **Na prática:** para o usuário Maria, que entrou com e-mail, o avatar é um círculo azul com um "M" branco. Ao tocar, o menu mostra "Maria", "Ajuda" e "Sair", nessa ordem.
- **Como conferir:** teste com uma conta por e-mail: a inicial deve estar sobre o azul `#0076CE` com texto branco, e o menu deve ter exatamente os três itens na ordem certa.

### Regra 32. Splash de abertura
- **O que diz:** TODOS os apps (novos, em atualização e antigos) têm uma tela de abertura azul Fênix cheia, com o ícone do app (a águia dos `Fenix_Icone_*` enquanto o app não tiver ícone oficial, regra 17, o mesmo ícone em todos), o nome do sistema, "Fênix Soluções Tecnológicas" e uma barrinha animada de vai e vem (sem texto piscando). Ela some assim que a tela certa estiver pronta (login, ou o app direto quando não há autenticação), sem atraso artificial, com teto de segurança de 1,2 s. Os holofotes duplos de baixo para cima (regra 59) fazem parte do splash: usa-se o `templates/fenix-template-splash.html`.
- **Para que serve:** o Livro não escreve o motivo. Na prática, a abertura mostra a marca e evita tela em branco, sem fazer o usuário esperar além do necessário.
- **Quando vale:** a própria regra diz que vale para todos os apps, novos, em atualização e antigos, mesmo os sem login (a tela some direto no app). A Ficha de Aplicação, porém, lista a regra 32 dentro do grupo B (regras 23 a 32), que o Cristiano pode desmarcar. Em caso de dúvida, vale o texto da regra: splash em todo app.
- **Na prática:** ao tocar no ícone do app, aparece a tela azul com a águia, o nome do app, "Fênix Soluções Tecnológicas" e a barrinha andando de um lado para o outro, e logo em seguida surge o login ou o app.
- **Como conferir:** abra o app do zero e cronometre: o splash não pode ficar mais de 1,2 s, não pode ter texto piscando e deve usar o ícone certo. Confira se foi feito a partir do template oficial de splash.
## 5. Cadastros e dados

Esta seção mostra como o app recolhe, confere, formata e guarda os dados de pessoas, produtos, valores e datas, e também como faz backup e PDF. A ideia central é simples: tudo passa pelo Fênix Core e fica no mesmo padrão brasileiro, em todos os apps.

### Regra 33. Cadastro PF
- **O que diz:** o cadastro de pessoa física tem nome completo, CPF, RG, data de nascimento, telefone/WhatsApp, e-mail, CEP e endereço (logradouro, número, complemento, referência, bairro, cidade e UF). Ao digitar o CEP, o app busca o endereço com `FenixCore.localidades.buscarPorCEP(cep)` (que usa o ViaCEP, um serviço público de consulta de CEP), e os campos continuam editáveis. Enquanto o banco de dados estiver desligado (regra 1), use `FenixCore.localidades.buscarPorCEPSemBanco(cep)`: ela consulta o ViaCEP sem gravar nada no Firestore. A `buscarPorCEP` grava cidades e bairros no banco, por isso só vale com o banco ativo.
- **Para que serve:** deixar o cadastro completo e igual em todos os apps, com o endereço preenchido sozinho. A versão "sem banco" evita gravar cidades e bairros num banco que ainda não foi ligado.
- **Quando vale:** só quando o grupo C (cadastro de pessoas PF/PJ) está marcado na Ficha.
- **Na prática:** o usuário digita o CEP e o app preenche rua, bairro, cidade e UF. Se algo vier errado, ele corrige no próprio campo.
- **Como conferir:** o cadastro tem todos os campos listados; o CEP preenche o endereço e os campos podem ser editados; com o banco desligado, o app usa `buscarPorCEPSemBanco` e não `buscarPorCEP`.

### Regra 34. Cadastro PJ
- **O que diz:** o cadastro de pessoa jurídica (empresa) tem razão social, nome fantasia, CNPJ, inscrição estadual/municipal (quando se aplicar), telefone/WhatsApp, e-mail, CEP, endereço completo e nome do responsável ou contato.
- **Para que serve:** ter os mesmos campos para empresas em todos os apps, sem cada um inventar o seu.
- **Quando vale:** só quando o grupo C (cadastro de pessoas PF/PJ) está marcado na Ficha.
- **Na prática:** ao cadastrar uma empresa cliente, o app pede razão social, nome fantasia, CNPJ, contato e o resto da lista, sempre com estes mesmos nomes de campo.
- **Como conferir:** abra o cadastro PJ e veja se todos os campos da regra estão presentes, incluindo o nome do responsável/contato.

### Regra 35. Fluxo do CNPJ
- **O que diz:** todo app que capturar um CNPJ, em qualquer tela (com ou sem cadastro PF/PJ completo), consulta o CNPJ com `FenixCore.pessoas.consultarCNPJ(cnpj)`, dentro de um `try/catch` (um bloco que segura o erro para a tela não quebrar se a consulta falhar). Preenche e lista: Razão Social, Endereço (logradouro), Número, Bairro, CEP, Cidade e UF; nome fantasia e outros dados da Receita entram quando existirem. Se a consulta do CNPJ trouxer só o CEP, o core completa sozinho pela BrasilAPI (consulta de CEP), sem o usuário redigitar. Se mesmo assim faltar algo (`enderecoCompleto` falso), os campos ficam editáveis e o app pede ao usuário que confira o endereço, podendo usar `FenixCore.localidades.buscarPorCEP(cep)` (ViaCEP, que exige o banco ativo). Tudo continua editável.
- **Para que serve:** poupar digitação e evitar erro de endereço. O `try/catch` garante que uma falha na consulta não trave a tela.
- **Quando vale:** em qualquer app que capture CNPJ, mesmo sem marcar o grupo C.
- **Na prática:** o usuário digita o CNPJ de um cliente, o app preenche razão social e endereço e mostra os campos para ele conferir e, se quiser, corrigir.
- **Como conferir:** digite um CNPJ válido e veja os campos preencherem; teste com a consulta falhando (por exemplo, sem internet) e veja que a tela não quebra e os campos seguem editáveis.

### Regra 36. Toggle PF/PJ
- **O que diz:** o seletor PF/PJ (botões de opção ou abas) troca o conjunto de campos exibido, mantendo compartilhados os campos comuns: telefone, e-mail e endereço.
- **Para que serve:** o Livro não dá um motivo escrito; pelo desenho da regra, o usuário não precisa digitar de novo o que é igual nos dois tipos de cadastro.
- **Quando vale:** só quando o grupo C (cadastro de pessoas PF/PJ) está marcado na Ficha.
- **Na prática:** o usuário começa um cadastro como PF, preenche telefone e e-mail, troca para PJ e esses dados continuam lá.
- **Como conferir:** preencha telefone, e-mail e endereço, alterne entre PF e PJ e veja se esses campos se mantêm e se os campos próprios de cada tipo aparecem e somem corretamente.

### Regra 37. Aviso de uso do CPF/CNPJ
- **O que diz:** logo abaixo dos campos de CPF e de CNPJ aparece sempre a frase: "O CPF/CNPJ é usado apenas para emissão de Notas Fiscais e/ou Recibos."
- **Para que serve:** o Livro não explica o motivo por escrito, mas a própria frase mostra: avisar o usuário para que o documento dele é pedido.
- **Quando vale:** onde houver campo de CPF ou CNPJ, no cadastro de pessoas (grupo C).
- **Na prática:** na tela de cadastro, embaixo do campo CPF, o usuário lê a frase do aviso.
- **Como conferir:** em cada tela que tenha campo de CPF ou de CNPJ, veja se a frase aparece abaixo dele, com o texto igual ao da regra.

### Regra 38. Máscaras
- **O que diz:** máscara é a formatação automática do campo enquanto a pessoa digita. Os formatos são: CPF `000.000.000-00`, CNPJ `00.000.000/0000-00`, CEP `00000-000`, celular `(00) 0 0000-0000` e fixo `(00) 0000-0000`. Além do formato, os dígitos verificadores de CPF e CNPJ devem ser validados com `FenixCore.validarCPF` e `FenixCore.validarCNPJ`; para formatar, use `FenixCore.formatarCPF`, `formatarCNPJ` e `formatarDocumento`. Todo campo de CPF, CNPJ, CEP, telefone, moeda, percentual, data, hora, placa, IP, MAC, número, inscrição estadual, RG ou UF se formata sozinho: no HTML o campo leva `data-mask` (`cpfcnpj`, `cpf`, `cnpj`, `cep`, `telefone`, `moeda`, `percentual`, `data`, `hora`, `placa`, `ip`, `mac`, `numero`, `ie`, `rg`, `uf`) e o app chama uma vez `FenixCore.mascaras.auto()` depois do carregamento do core. Na inscrição estadual (`ie`), informe a UF em `data-mask-uf="SE"` (SE, BA e SP têm formato próprio). Nunca escreva máscara própria. Detalhes: no campo `cpfcnpj`, até 11 dígitos aparece como CPF e, passando de 11, vira CNPJ. Na `moeda`, o campo põe sozinho a vírgula e os pontos dos milhares: sem zero na frente, 1 dígito fica R$ 1, 2 viram R$ 1,0, 3 viram R$ 1,00, 4 viram R$ 10,00, 5 viram R$ 100,00 e 6 viram R$ 1.000,00; começando com zero vêm os decimais (01 vira R$ 0,1 e 010 vira R$ 0,10). Para guardar o valor, use `FenixCore.mascaras.moedaParaNumero`; para mostrar um valor guardado, `numeroParaMoeda` ou `definirValor`. A placa é `AAA-0A00` (Mercosul) ou `AAA-0000` (antiga), sempre com hífen depois das três letras. O RG é `00.000.000-0` (o último caractere pode ser X). Todo campo novo com formato fixo ganha máscara automática, mesmo que não seja pedido; se o tipo ainda não existir no core, avise e proponha acrescentá-lo.
- **Para que serve:** dados sempre digitados no mesmo formato e CPF/CNPJ realmente válidos, não só com aparência certa. Proibir máscara própria evita que cada app se comporte de um jeito.
- **Quando vale:** em qualquer campo de CPF, CNPJ, CEP ou telefone, mesmo sem marcar o grupo C. Os demais tipos (moeda, data, placa etc.) valem onde o app tiver esse tipo de campo.
- **Na prática:** o usuário digita só números no campo de CPF e o app coloca os pontos e o traço sozinho. Se os dígitos não formarem um CPF válido, o app avisa.
- **Como conferir:** todo campo de formato fixo tem `data-mask`; `FenixCore.mascaras.auto()` é chamado uma vez após o carregamento do core; digite um CPF e um CNPJ inválidos e veja se são recusados; não existe código de máscara escrito dentro do app.

### Regra 39. Moeda
- **O que diz:** valores em reais seguem o padrão brasileiro (ABNT): `R$ 0.000,00`, com ponto nos milhares e vírgula nos decimais. Vale na exibição e nos campos de digitação, enquanto a pessoa digita. Nos campos de digitação use `data-mask="moeda"` (regra 38), que acrescenta sozinho a vírgula e os pontos.
- **Para que serve:** valores lidos sempre do jeito brasileiro, sem confusão entre ponto e vírgula.
- **Quando vale:** sempre, em todo app que tiver valores em reais.
- **Na prática:** um preço aparece na lista como `R$ 1.250,00`, e no campo de preço o usuário digita os números e o formato se monta sozinho.
- **Como conferir:** todo valor na tela e todo campo de valor seguem `R$ 0.000,00`; os campos de digitação usam `data-mask="moeda"`.

### Regra 40. Datas e horas
- **O que diz:** datas aparecem como `dd/mm/aaaa` e horas em 24h (`HH:mm`), tanto na exibição quanto nos campos de digitação (`data-mask="data"` e `data-mask="hora"`, regra 38). Por dentro, o app guarda a data no formato ISO (`aaaa-mm-dd`), e `FenixCore.mascaras.dataParaISO` faz a conversão.
- **Para que serve:** o usuário vê o formato brasileiro, e o sistema guarda um formato que ordena e compara datas sem erro.
- **Quando vale:** sempre, em todo app que tiver datas ou horas.
- **Na prática:** na tela aparece 05/03/2026 e 14:30; no armazenamento fica 2026-03-05.
- **Como conferir:** nenhuma data aparece em outro formato na tela; os campos de data e hora usam as máscaras; o dado guardado está em `aaaa-mm-dd`.

### Regra 41. Cadastros pelo Fênix Core
- **O que diz:** esta é a regra de ouro dos cadastros: pessoas físicas e jurídicas são cadastradas e buscadas pelo `FenixCore.pessoas`. Nenhum app cria coleção própria de pessoas ou de clientes. O app guarda só a referência (CPF ou CNPJ) e, se quiser, um cache leve (nome e cidade) para listas rápidas, nunca o cadastro duplicado.
- **Para que serve:** o cadastro fica em um só lugar, sem cópias que se desencontram entre apps.
- **Quando vale:** só quando o grupo C (cadastro de pessoas PF/PJ) está marcado na Ficha.
- **Na prática:** um orçamento guarda o CPF ou CNPJ do cliente e o nome para a lista, e os demais dados do cliente são buscados pelo `FenixCore.pessoas`.
- **Como conferir:** procure no app qualquer coleção ou tabela própria de pessoas ou clientes (não deve existir); o que o app guarda é só a referência e, no máximo, nome e cidade.

### Regra 42. Padronização de escrita ao salvar
- **O que diz:** ao salvar, nome de pessoa física e jurídica (razão social e nome fantasia) fica em MAIÚSCULAS; os demais textos levam a primeira letra de cada palavra em maiúscula, exceto preposições; e-mail em minúsculas; UF em maiúsculas. O core já faz isso ao salvar pessoas, produtos e localidades. Nos campos próprios do app, use `FenixCore.formatarTitulo` e `FenixCore.formatarNomeMaiusculo`. Registros antigos só são padronizados quando forem salvos de novo.
- **Para que serve:** dados limpos e uniformes. O Livro não detalha o motivo, mas o efeito é facilitar a busca e evitar duplicidade por diferença de maiúsculas e minúsculas.
- **Quando vale:** com o grupo C (cadastro de pessoas) ou o grupo D (ficha de produto) marcado.
- **Na prática:** quem digita "maria da silva" num cadastro vê o nome salvo como MARIA DA SILVA, e o e-mail digitado com letras maiúsculas fica em minúsculas.
- **Como conferir:** salve um cadastro com letras misturadas e veja o resultado; nos campos de texto do próprio app, confirme que as duas funções do core são usadas.

### Regra 43. Ficha de produto/equipamento
- **O que diz:** a base de toda ficha de produto ou equipamento é sempre Marca, Modelo e Série (Serial). Campos extras (IP, Local, Senha, Zonas etc.) variam conforme a categoria.
- **Para que serve:** o Livro não escreve o motivo; o desenho da regra faz todo equipamento ser identificado do mesmo jeito, deixando espaço para o que cada tipo precisa.
- **Quando vale:** só quando o grupo D (ficha de produto/equipamento) está marcado na Ficha.
- **Na prática:** ao registrar uma câmera, a ficha traz Marca, Modelo e Série e, como é equipamento de rede, campos extras como IP e Local.
- **Como conferir:** toda ficha começa com Marca, Modelo e Série, e os campos extras são só os da categoria do item.

### Regra 44. Backup dos dados
- **O que diz:** todo app que guarda dados no aparelho (`localStorage`, a memória do navegador) usa o módulo `FenixCore.backup`. Depois do carregamento, o app chama `FenixCore.backup.verificarLembrete("fenix-nome-do-app", { aoFazerBackup: ... })`, que abre um alerta quando passam mais de 7 dias sem cópia. O arquivo é gerado com `FenixCore.backup.baixarJSON("fenix-nome-do-app", dados)` e se chama `fenix-nome-do-app-backup-aaaa-mm-dd.json`. A versão do app vai dentro de `dados`. O core não tem importação: o app oferece o botão Importar na área de Ajuda ou Configurações, e a importação substitui os dados atuais, por isso segue a regra de ações destrutivas (regra 47). Com a sincronia ativa (grupo I), a importação usa `sync.importarLista(lista)`, do core, que grava registro a registro pelo caminho da sincronia.
- **Para que serve:** dado que só está no aparelho se perde se o aparelho for limpo ou trocado. O backup datado e o lembrete reduzem esse risco.
- **Quando vale:** só quando o grupo E (backup dos dados no aparelho) está marcado na Ficha.
- **Na prática:** depois de uma semana sem cópia, o app mostra o alerta; o usuário baixa o arquivo, e para restaurar usa o botão Importar, que antes pede a palavra de confirmação.
- **Como conferir:** o alerta de lembrete aparece; o arquivo baixado tem o nome no formato certo e a versão do app dentro; o botão Importar existe e pede a confirmação digitada da regra 47.

### Regra 45. Documentos em PDF
- **O que diz:** recibos, orçamentos e relatórios em PDF usam um cabeçalho padrão com a logo Azul (regra 17) e os dados da empresa do usuário, vindos do perfil do onboarding (razão social, CNPJ e endereço, quando informados). Se não houver CNPJ, usa-se o nome do usuário. Datas e valores seguem as regras 40 e 39.
- **Para que serve:** documentos com aparência padronizada e com os dados de quem emite, não os da Fênix.
- **Quando vale:** só quando o grupo F (documentos em PDF) está marcado na Ficha.
- **Na prática:** um recibo gerado pelo app sai com a logo Azul no topo e os dados da empresa do usuário; quem não informou CNPJ aparece pelo nome.
- **Como conferir:** gere um PDF e veja o cabeçalho (logo e dados do perfil), o caso sem CNPJ, e se datas e valores estão no padrão brasileiro.

---

## 6. Segurança e qualidade

Esta seção trata de proteger os dados no banco e de conferir o app antes de entregar: regras do Firestore, confirmação para apagar, validação do código e testes básicos.

### Regra 46. Regras de segurança do Firestore
- **O que diz:** nenhuma coleção do banco fica aberta, nem em modo de teste. Cada usuário só lê e grava os próprios dados (o Firestore compara `request.auth.uid` com o dono do documento); dados compartilhados entre usuários só com permissão explícita. Ao criar ou alterar coleções, entregue junto as regras do Firestore correspondentes, para o Cristiano publicar no console do Firebase. Parta do arquivo-base `firestore.rules` da biblioteca (endereço em Endereços oficiais), que reproduz as regras publicadas e traz os reforços marcados com [v4.0] no próprio arquivo. Ajuste só o que o app criar de coleção própria e entregue o arquivo pronto, nas duas cópias (regra 11). Ao mudar o que o core grava, publique primeiro o core e só depois as regras, e teste no Playground de regras antes (roteiro no Guia). Depois que o Cristiano publicar, ele avisa, para o arquivo entregue passar a valer como o publicado. Checklist para publicar: (1) publicar o core e os templates no GitHub; (2) rodar os testes da pasta `testes/regras/` (`npm install` uma vez e `npm test`; se algum falhar, não publica); (3) no console, copiar as regras atuais para um arquivo de backup; (4) colar as novas no Playground e rodar o roteiro do Guia; (5) publicar; (5a) na v4.9, abrir o `admin/fenix-admin.html` e usar Carimbar início do teste uma vez (regra 63); (6) abrir um app real, entrar e gravar um registro; (7) se algo falhar, recolocar o backup e avisar o Cristiano.
- **Para que serve:** impedir que um usuário veja ou altere dados de outro. A ordem do checklist, com testes e backup, evita derrubar os apps ao publicar regras erradas.
- **Quando vale:** só com o banco ativo (grupo A marcado, o que só acontece quando o Cristiano dá o sinal).
- **Na prática:** um app que passa a gravar numa coleção nova entrega, junto, o `firestore.rules` ajustado, e a publicação segue os sete passos do checklist.
- **Como conferir:** nenhuma coleção está aberta; o `firestore.rules` entregue parte do arquivo-base e cobre as coleções novas, nas duas cópias; o checklist foi seguido e existe o backup das regras anteriores.

### Regra 47. Ações destrutivas
- **O que diz:** apagar dados exige digitar uma palavra de confirmação (por exemplo, "APAGAR") para liberar o botão. Nunca use o `confirm()` simples do navegador (a caixinha padrão de OK e Cancelar).
- **Para que serve:** evitar apagar por engano com um toque; digitar uma palavra exige intenção.
- **Quando vale:** sempre, em todos os apps.
- **Na prática:** ao tocar em "Apagar tudo", abre uma janela pedindo para digitar APAGAR; o botão de confirmar só liga quando a palavra estiver certa.
- **Como conferir:** teste cada ação que apaga dados (inclusive Importar, que substitui os dados): o botão só libera após digitar a palavra, e não existe `confirm()` simples no código.

### Regra 48. Validar o JS
- **O que diz:** antes de entregar, o comando `node --check` deve retornar 0 (sem erro) e as chaves do código devem estar balanceadas (cada abertura tem seu fechamento).
- **Para que serve:** o Livro não escreve o motivo; o efeito é pegar erro de escrita no código antes que o app chegue quebrado ao usuário.
- **Quando vale:** sempre, em todos os apps.
- **Na prática:** antes de enviar o arquivo, quem constrói roda a checagem e só entrega se o resultado for 0.
- **Como conferir:** o resultado do `node --check` é 0 e a contagem de chaves abertas e fechadas bate.

### Regra 49. Teste antes de entregar
- **O que diz:** além de validar o JS (regra 48), o app é conferido em tela de 360 px de largura, que é o celular comum dos técnicos em campo, e sem internet, conforme o comportamento da regra 3.
- **Para que serve:** garantir que o app funciona no aparelho que o técnico realmente usa e que o uso sem internet funciona.
- **Quando vale:** sempre, em todos os apps.
- **Na prática:** abre-se o app com a janela estreita (360 px) e com a internet desligada, e se confere se tudo continua usável.
- **Como conferir:** em 360 px nada fica cortado nem exige rolar para os lados; sem internet o app abre e se comporta como a regra 3 manda.

### Regra 50. Handlers inline no HTML
- **O que diz:** handlers inline são os atributos como `onclick` escritos direto no HTML. As funções que eles chamam devem ser declaradas com `var` ou `function`, nunca com `const` nem arrow function.
- **Para que serve:** o motivo do Livro: assim a função fica acessível no escopo global; se não, o botão não a encontra.
- **Quando vale:** sempre, em todos os apps.
- **Na prática:** um botão com `onclick="salvar()"` só funciona se `salvar` estiver declarada com `function salvar()` ou `var`.
- **Como conferir:** para cada `onclick` (e similares) no HTML, procure a função e veja que ela não é `const` nem arrow function; clique nos botões para confirmar que respondem.

### Regra 51. Cuidados contra regressão
- **O que diz:** regressão é quebrar algo que já funcionava. Dois pontos pedem atenção: o escape do Python pode corromper template literals de JS (os textos entre crases com `${...}`), e blocos órfãos (pedaços de código soltos) deixados depois de refatorações quebram botões. Confira os dois antes de entregar.
- **Para que serve:** evitar que uma reorganização do código, ou a geração dele por script, estrague silenciosamente o que estava certo.
- **Quando vale:** sempre, em todos os apps.
- **Na prática:** depois de reorganizar o código de um app, clica-se em todos os botões, e procura-se por trechos que sobraram sem uso ou textos com crases que ficaram estranhos.
- **Como conferir:** nenhum template literal aparece corrompido, nenhum bloco órfão sobrou, e todos os botões continuam funcionando.

---

## 7. Processo

Esta seção trata de como o trabalho começa: o preenchimento da Ficha com o Cristiano e o selo que diz qual versão do Livro cada app já cumpre.

### Regra 52. Livro vivo e Ficha de aplicação
- **O que diz:** as regras são um documento vivo. Em todo app novo, e em todo app existente que o Cristiano trouxer para alteração, antes de começar preenche-se com ele a Ficha de aplicação e se confirma: nome do app, funcionalidade principal, outras APIs e observações de layout. Pergunta-se sempre, também: se o app terá login com Google (grupo H), se vai funcionar em tempo real em mais de um aparelho (grupo I) e se terá tema escuro opcional (grupo J).
- **Para que serve:** aplicar só o que o app precisa e nunca presumir as escolhas opcionais: elas são sempre perguntadas.
- **Quando vale:** sempre, em todos os apps.
- **Na prática:** antes da primeira linha de código, quem constrói faz as perguntas da Ficha e anota as respostas, marcando os grupos que valem para aquele app.
- **Como conferir:** a Ficha foi preenchida e confirmada com o Cristiano, as três perguntas (H, I e J) foram feitas, e a Ficha está registrada no primeiro item do Changelog e no selo (regra 53).

### Regra 53. Selo do Livro
- **O que diz:** todo app declara no `<head>` do HTML duas linhas: `<meta name="fenix-livro" content="X.Y">`, com a versão do Livro aplicada, e `<meta name="fenix-ficha" content="B,C,E">`, com as letras marcadas na Ficha (vazio se nenhuma). Na tela Sobre (regra 13) aparece a linha "Padrão: Livro das Regras Fênix vX.Y". O selo só muda quando o Livro for de fato aplicado ao app, pelo construtor, na entrega. Ao receber um app: (1) selo igual à versão atual do Livro, ou diferente só em versões que o Histórico marca como "não afeta apps": o Livro já está aplicado, faça só o que for pedido; (2) selo de versão mais antiga: aplique só o que o Histórico indica, nas regras marcadas na Ficha, e atualize o selo; (3) sem selo: aplique o Livro inteiro conforme a Ficha e coloque o selo. O selo é uma declaração: leia só o `<head>`; faça conferência completa apenas se o Cristiano pedir. Esclarecimento da v5.6: este selo é do Livro e diz quais regras o app já atende; o selo da regra 61 (`v | c`) é o que o cliente vê, com a versão do app e do core.
- **Para que serve:** dizer, a quem for mexer no app, quais regras ele já atende, sem ter de conferir tudo de novo.
- **Quando vale:** sempre, em todos os apps.
- **Na prática:** um app com selo de uma versão antiga do Livro recebe só as mudanças que o Histórico aponta para ele, e o selo é atualizado no fim.
- **Como conferir:** as duas linhas `meta` estão no `<head>` com a versão do Livro e as letras da Ficha; a tela Sobre mostra "Padrão: Livro das Regras Fênix vX.Y"; o selo só foi alterado porque o Livro foi realmente aplicado.

---

## 8. Dashboard e indicadores

Esta seção trata dos painéis com números e gráficos: cada número deve levar ao que o compõe.

### Regra 54. Dashboard clicável
- **O que diz:** todo indicador do dashboard (totais, contagens por situação, valores e gráficos) é clicável sempre que houver dados por trás dele, e expande ou leva ao que o compõe. Exemplo do Livro: "Total de serviços (21)" abre a lista dos 21 serviços; "Em andamento", "Interrompidos" e qualquer outra situação abrem os registros daquela situação. Pontos obrigatórios: (a) a lista aberta usa o mesmo filtro do indicador e mostra a mesma quantidade do número clicado; (b) cada item da lista abre o detalhe do registro; (c) há botão Voltar ou Fechar, e o dashboard mantém a posição ao voltar; (d) indicador zerado não abre nada e mostra "Nenhum registro"; (e) o indicador tem cara de clicável (cursor de mão, hover em amarelo `#ffcb00`, área de toque de pelo menos 44 px, regra 20) e também funciona pelo teclado; (f) em gráficos, clicar numa fatia ou barra abre os registros dela; (g) valores em R$ abrem os lançamentos que formam o valor. Monte com `FenixCore.dashboard.montar(...)`; em gráficos, chame `abrirLista(...)` ao clicar numa fatia ou barra. Vale para todos os apps novos e, nos existentes, a partir da próxima alteração de cada um.
- **Para que serve:** quem vê um número consegue conferir de onde ele vem. O Livro não escreve o motivo, mas o desenho da regra dá confiança ao painel.
- **Quando vale:** só quando o grupo G (dashboard com indicadores) está marcado na Ficha.
- **Na prática:** o painel mostra "Total de serviços (21)"; ao tocar nele, abre a lista com exatamente 21 serviços, e cada um abre o seu detalhe.
- **Como conferir:** toque em cada indicador e compare a quantidade da lista com o número; veja o botão Voltar e se o painel mantém a posição; veja o "Nenhum registro" no indicador zerado; teste com o teclado; clique numa fatia ou barra de gráfico e num valor em R$.

---

## 9. Trazer um app antigo ao padrão

Esta seção trata do roteiro para quando um app já existente é trazido para alteração: o que olhar, em que ordem e como não estragar o que já funciona.

### Regra 55. Trazer um app antigo ao padrão
- **O que diz:** quando o Cristiano trouxer um app existente para alteração, siga este roteiro, nesta ordem. (a) Leia o selo (regra 53): sem selo, aplique o Livro inteiro; selo antigo, só o que o Histórico indica; selo igual ao do Livro, nada a aplicar além do que ele pedir. (b) Preencha com ele a Ficha (regra 52). (c) Faça o inventário: liste, em poucas linhas, o que o app já cumpre e o que falta, regra por regra, e mostre antes de mexer. (d) Proteja os dados: não mude o nome nem o formato das chaves do `localStorage` nem das coleções existentes; se for preciso mudar, escreva a migração e ofereça o backup (regra 44) antes. (e) Aplique em etapas, entregando cada uma testada: 1) core, banco desligado e selo (regras 1, 2 e 53); 2) identidade (regras 14 a 22); 3) acesso (regras 23 a 32, inclusive o splash); 4) cadastros e máscaras (regras 33 a 43), trocando os cadastros próprios de pessoas pelas funções do core; 5) qualidade (regras 12, 13, 44, 45, 54, 64, 65, 68, 69 e 71: Changelog e Manual, Sobre, backup, PDF, dashboard, texto seguro, esquema dos dados, teste de fumaça, acessibilidade e saída protegida). (f) Não mude o comportamento nem o visual de telas que o Cristiano não pediu, a não ser que uma regra exija; se uma regra conflitar com algo que o app faz hoje, avise e pergunte. (g) Entregue conforme Como entregar, mantendo a sequência de versões do próprio app e registrando a Ficha no primeiro item do Changelog. (h) Acrescente a regra 62 (teste de 15 dias e somente leitura) na etapa de acesso e acrescente o app em Apps já no padrão, com o selo e a Ficha. Se o app tiver cópia do core ou módulo embutido (como sincronia, acesso ou login de outra linhagem), remova e use as funções do core (`initFirebaseComCache`, `criarModuloSincronia`, `criarModuloAcesso`, `criarModuloAuth`).
- **Para que serve:** atualizar o app sem perder dados dos usuários e sem surpresas. O inventário mostrado antes e a proteção das chaves de dados evitam estragos.
- **Quando vale:** sempre, em todo app existente trazido para alteração (a Ficha lista a regra 55 entre as que valem sempre).
- **Na prática:** chega um app antigo sem selo; lê-se o `<head>`, preenche-se a Ficha, mostra-se ao Cristiano o inventário do que falta e só depois se começa pelas etapas, da primeira à quinta, sem trocar os nomes das chaves onde os dados dele estão guardados.
- **Como conferir:** o inventário foi mostrado antes de mexer; as chaves e coleções existentes continuam iguais (ou há migração com backup oferecido); cada etapa foi entregue testada; telas não pedidas não mudaram; a Ficha está no primeiro item do Changelog; o app foi anotado em Apps já no padrão e não sobrou cópia do core nem módulo embutido.
## 10. Login com Google e sincronia entre aparelhos

Esta seção trata de dois recursos opcionais: entrar com a conta Google e ter os mesmos dados em mais de um aparelho, em tempo real. Os dois vêm desmarcados na Ficha de Aplicação (grupos H e I), e o Cristiano é perguntado sobre eles a cada app novo ou alterado. Só se aplica o que ele marcar.

### Regra 56. Login com Google
- **O que diz:** o app mostra o botão Entrar com Google (o template de login já traz o botão) ligado ao core pela chamada `FenixCore.criarModuloAuth(app).entrarComGoogle()`. Nunca se escreve um código de login próprio. Ao abrir o app, chama-se `resultadoRedirecionamento()`, que trata a volta do Google quando o navegador do celular usa redirecionamento em vez de janela. A tela de esqueci a senha usa `redefinirSenha(email)`. O endereço do app (`fenicris-dev.github.io`) precisa estar na lista de domínios autorizados do Firebase Authentication. O primeiro acesso com Google passa pelo onboarding (regra 29) como qualquer outra conta. O botão só aparece para quem tem a licença definitiva (regra 58); sem ela, o login é só por e-mail e senha.
- **Para que serve:** ter um único jeito de entrar com Google, já testado no core, que funciona também no celular. Código de login feito à mão em cada app seria repetido e mais sujeito a erro.
- **Quando vale:** só com o grupo H marcado (login com Google). Esse grupo depende do grupo B (acesso com login).
- **Na prática:** na tela de login do app aparece o botão Entrar com Google, vindo do template. Para um cliente sem licença definitiva, o botão simplesmente não aparece e ele entra por e-mail e senha.
- **Como conferir:** o botão vem do template e chama a função do core, sem login próprio; `resultadoRedirecionamento()` é chamado na abertura; a recuperação de senha usa `redefinirSenha(email)`; o domínio `fenicris-dev.github.io` está autorizado no Firebase; sem licença definitiva, o botão fica escondido.

### Regra 57. Sincronização entre aparelhos
- **O que diz:** o app trabalha em tempo real em mais de um aparelho com a mesma conta. Exige o banco ativo (grupo A) e o login (grupo B). Usa-se só o core: `FenixCore.criarModuloDadosPessoais` e `FenixCore.criarSincronia`, com escopo pessoal (dados do usuário, sem empresa) ou de empresa. O app passa a chamar `sync.salvar` e `sync.excluir` em vez de gravar a lista direto, e redesenha a tela no `aoMudar`. Sete comportamentos são obrigatórios: (a) tempo real; (b) funcionar offline, com uma fila que sobe quando a internet volta; (c) em conflito, vale a alteração mais recente, registro por registro; (d) excluir vale em todos os aparelhos; (e) no primeiro uso, o que só existe no aparelho sobe para a nuvem sem duplicar (se o mesmo id já existir na nuvem, vale a nuvem); (f) o indicador de conexão (regra 4) mostra sincronizando, sincronizado, offline ou erro, por `aoMudarEstado`; (g) o backup (regra 44) continua valendo, e a importação passa por `sync.importarLista`, que grava registro a registro. O core oferece dois caminhos: `criarSincronia` (uma tabela por vez) para app novo e `criarModuloSincronia` (uma coleção por tabela) para app que já grava assim e precisa manter o caminho dos dados.
- **Para que serve:** o usuário vê os mesmos dados em todos os aparelhos, sem perder nada e sem registros duplicados. Os sete comportamentos definem o que acontece quando há conflito ou falta de internet, para o app não decidir isso por conta própria.
- **Quando vale:** só com o grupo I marcado (sincronização). Exige o grupo A (banco ativo) e o grupo B (login).
- **Na prática:** a pessoa cadastra um item no celular e ele aparece no computador logo depois. Se o celular estava sem internet, o item fica na fila e sobe quando a conexão volta. Se o mesmo registro foi mexido nos dois, fica o que foi alterado por último.
- **Como conferir:** o app usa só funções do core (`sync.salvar`, `sync.excluir`, `sync.importarLista`); o indicador de conexão muda de estado; o teste foi feito com dois aparelhos, ou dois navegadores, na mesma conta (regra 49), cobrindo offline, exclusão e primeiro uso sem duplicar.

---

## 11. Licença definitiva, animações, toque e preferências

Esta seção trata da licença de uso (teste, licença por tempo e definitiva), da administração dessas licenças, das animações, do som de abertura e das preferências do usuário. As regras 58 e 62 formam juntas o assunto Licença.

### Regra 58. Licença definitiva de uso
- **O que diz:** o botão Entrar com Google só aparece para quem tem licença definitiva. Essa licença é o campo `licenca` com o valor `"definitiva"` no documento `empresas/{id}`; qualquer outro valor, ou a falta do campo, é licença de teste. Só o Cristiano grava esse campo, pelo console do Firebase. Antes do login o app ainda não sabe quem é o usuário, então o botão aparece em dois casos: o aparelho já lembra a licença (`FenixCore.licenca.lembrada(app)`) ou o e-mail digitado tem o espelho `licencas/{ID}`, em que o ID é o SHA-256 do e-mail (uma "impressão digital" do e-mail, gerada por `FenixCore.licenca.hashEmail` ou pelo card Licença do Painel). Para isso usa-se `FenixCore.licenca.liberaGoogle(db, { app, email })`. Depois do login, `FenixCore.licenca.confirmarAposGoogle(db, modAuth, usuario, app)` confere de novo e, se a licença não for definitiva, sai da conta e avisa. Ao dar uma licença definitiva, criam-se os dois: o campo na empresa e o espelho do e-mail de cada usuário que usará o Google. A licença pode ter validade, no campo opcional `licencaAte` (AAAA-MM-DD, vale até o fim do dia); passada a data, deixa de liberar o Google. `FenixCore.licenca.situacao(dados)` devolve definitiva, teste ou vencida, com os dias que faltam. Quando o Google é negado, mostra-se sempre o texto único `FenixCore.licenca.MENSAGEM_GOOGLE`.
- **Para que serve:** controlar quem pode usar o login com Google. A licença é concedida só por quem administra, nunca pelo próprio app, e as regras do Firestore recusam que o app crie a empresa já como definitiva.
- **Quando vale:** só com o grupo H marcado (login com Google).
- **Na prática:** um cliente digita o e-mail na tela de login. Se esse e-mail tem o espelho de licença definitiva, o botão do Google aparece. Se a licença tiver vencido, o botão some e o app mostra a mensagem padrão.
- **Como conferir:** o botão do template começa escondido e só é mostrado por `liberaGoogle`; `confirmarAposGoogle` é chamado depois do login; a mensagem de negação é `FenixCore.licenca.MENSAGEM_GOOGLE`, sem texto próprio; o app nunca grava o campo `licenca`.

### Regra 59. Animações e toque de abertura
- **O que diz:** no login, o fundo é o degradê Fênix e um farol alto de veículo cruza a tela atrás do card (já pronto em `templates/fenix-template-login.html`). No splash, dois holofotes sobem de baixo para cima, balançando em sentidos opostos, atrás do ícone e do nome do app (pronto em `templates/fenix-template-splash.html`). As duas animações respeitam o pedido do sistema de reduzir movimento, ficam paradas e suaves nesse caso, e não podem pesar: usam só `transform` e `opacity`. O toque de abertura Asas tem três notas, Lá, Ré e Lá (440, 587,33 e 880 Hz), duas curtas e uma longa, no ritmo de Fê-ni-x. É gerado pelo core, sem arquivo de áudio, com `FenixCore.som.tocarAbertura()`. Navegadores só liberam som depois de um toque do usuário; por isso o toque sai quando o login dá certo (dentro do clique) e, no splash, só se o navegador já permitir (`{ somentePermitido: true }`), no máximo uma vez por sessão. O login traz a chave Som de abertura (`FenixCore.som.definir`), e o som vem ligado por padrão.
- **Para que serve:** reforçar a identidade da marca desde a abertura, sem pesar o app e sem incomodar quem prefere menos movimento ou menos som.
- **Quando vale:** sempre, em todos os apps. Já vem pronto nos templates de login e de splash.
- **Na prática:** ao abrir o app, aparecem os holofotes no splash. Ao entrar com sucesso no login, toca o Asas. Quem ligou Reduzir animações vê tudo parado.
- **Como conferir:** o login e o splash vêm dos templates; não há arquivo de áudio no app; o toque usa `FenixCore.som.tocarAbertura()`; com reduzir movimento ligado, as animações ficam paradas.

### Regra 60. Preferências e tema escuro
- **O que diz:** a tela Sobre, ou o menu do avatar, traz os controles Som de abertura e Reduzir animações, montados com `FenixCore.preferencias.montarTela(container, { tema: false })`. As escolhas valem no aparelho todo, e os templates de login, splash e onboarding já reagem a elas. O app chama `FenixCore.preferencias.aplicar()` ao abrir. Com o grupo J marcado, entra também o seletor Tema (Automático, Claro, Escuro), com `montarTela(container)`. O app define as cores por variáveis CSS (valores guardados com nome, para trocar todas de uma vez), seguindo o bloco `html[data-tema="escuro"]` e o mesmo bloco dentro de `@media (prefers-color-scheme: dark)`, como nos templates. No escuro vale só a paleta oficial: fundo `#020733`, cards `#041273`, texto branco, links e destaques em amarelo e botões em Dell Azul. O tema claro continua sendo o padrão e o oficial.
- **Para que serve:** dar ao usuário controle sobre som e movimento. O tema escuro opcional atende a quem prefere, sem sair da identidade visual.
- **Quando vale:** os controles de som e movimento valem em todos os apps. O seletor de tema escuro só com o grupo J marcado.
- **Na prática:** na tela Sobre há dois interruptores, Som de abertura e Reduzir animações. Num app com o grupo J, aparece também o seletor de tema.
- **Como conferir:** `preferencias.aplicar()` é chamado na abertura; os dois controles aparecem na Sobre ou no menu do avatar; com o grupo J, o seletor funciona nas três opções e só usa as cores oficiais; o tema claro segue como padrão.

### Regra 61. Selo de versões
- **O que diz:** todo app mostra, ao lado da versão dele e na tela Sobre, o selo `v3.2 | c 4.6`, em que `v` é a versão do app e `c` é a versão do core que ele usa. Quem desenha o selo é o core, com `FenixCore.versoes.montarSelo(container, "3.2", { coreMinimo: "4.6", livro: "4.6" })`; o app nunca escreve a versão do core à mão. `coreMinimo` é o core mais antigo que o app aceita, e `livro` é o mesmo valor do selo da regra 53. Na Sobre, passam-se `livro` e `coreMinimo` também a `FenixCore.sobre.montarTela`, que acrescenta as linhas Core em uso e Livro das Regras. Com internet, o core consulta o arquivo `versao.json` (no máximo a cada 6 horas): se existe core mais novo, o selo ganha um ponto amarelo com a versão nova e, ao tocar, explica que basta fechar e abrir o app com internet; se o core em uso é menor que o `coreMinimo`, o ponto é vermelho. Sem internet, ou se o `versao.json` não abrir, nada aparece e nada falha. O selo tem no mínimo 44 px de altura de toque. Se o app não tiver cabeçalho para a versão, o selo vai só na tela Sobre.
- **Para que serve:** mostrar ao cliente e ao suporte qual versão do app e do core está em uso, e avisar quando é preciso reabrir o app para pegar um core mais novo.
- **Quando vale:** sempre, em todos os apps.
- **Na prática:** no canto do cabeçalho aparece algo como `v3.2 | c 4.6`. Se houver core mais novo, surge um ponto amarelo ao lado.
- **Como conferir:** o selo é montado por `montarSelo`, sem número do core escrito à mão; aparece no cabeçalho (ou só na Sobre, se não houver cabeçalho); a Sobre mostra as linhas Core em uso e Livro das Regras; o toque tem 44 px; o `coreMinimo` está correto.

### Regra 62. Teste de 15 dias, licença e somente leitura
- **O que diz:** todo cliente usa o app por inteiro, sem custo, por 15 dias a partir do primeiro acesso. Depois, precisa de licença por tempo ou definitiva (regra 58). Sem nenhuma das duas, o app fica em somente leitura: o cliente continua vendo os registros e exporta o backup (regra 44), mas não cria, não edita e não apaga. O primeiro acesso é o campo `testeInicio` da empresa, gravado pelo servidor na criação (o app não escolhe a data). Quem mede e trava é o core: ao entrar, o app chama `FenixCore.licenca.carregar(db, uid)`, mostra `FenixCore.licenca.montarAviso(container)` no topo das telas (amarelo no teste, vermelho em somente leitura, com botão de WhatsApp para contratar) e trata o erro `FENIX_SOMENTE_LEITURA`, desligando os botões de salvar, editar e apagar quando `FenixCore.licenca.podeGravar()` for falso. Quem manda de verdade são as regras do Firestore (`empresaPodeGravar`): mesmo que o app esqueça de travar a tela, o servidor recusa a gravação. App sem login e sem banco usa `FenixCore.licenca.acessoLocal(app)`, que conta os 15 dias no próprio aparelho (trava leve, que a limpeza dos dados do navegador reinicia; a licença se confere pela chave local `ativarLocal`). Empresas criadas antes da v4.9 não têm `testeInicio` e ficam liberadas até o administrador carimbar a data (regra 63). Nos apps com login por `FenixCore.criarModuloAuth`, o core faz isso sozinho, mesmo nos antigos, com uma faixa fixa no rodapé (amarela e fechável no teste, vermelha e fixa em somente leitura). O app que chama `montarAviso` assume o aviso e a faixa automática some; `FenixCore.licenca.automatico(false)` a desliga. App antigo deve, na próxima alteração, tratar `FENIX_SOMENTE_LEITURA` e desligar os botões.
- **Para que serve:** definir o modelo comercial (teste gratuito, depois licença) com uma trava que não depende da boa vontade do app, porque quem decide de verdade é o servidor. O cliente nunca perde o acesso aos próprios dados, pois sempre pode ler e exportar.
- **Quando vale:** sempre, em todos os apps. O app sem login e sem banco usa a trava local, mais leve.
- **Na prática:** no 10º dia, o cliente vê uma faixa amarela avisando do teste. Depois do 15º dia sem licença, a faixa fica vermelha, os botões de salvar, editar e apagar ficam desligados, e o botão de exportar backup continua funcionando.
- **Como conferir:** o app chama `licenca.carregar` e `montarAviso` (ou usa `acessoLocal`, se não tiver login nem banco); trata `FENIX_SOMENTE_LEITURA`; com `podeGravar()` falso, os botões de gravação ficam desligados e o backup continua disponível; o app nunca grava `testeInicio`.

### Regra 63. Administração Fênix
- **O que diz:** a licença e a equipe são geridas na página `admin/fenix-admin.html` (Painel administrativo), com login Google. Há três níveis: administrador (tudo, inclusive a equipe), comercial (concede, prorroga e revoga licenças e reinicia testes) e suporte (só consulta os clientes). Os administradores raiz, que não dependem do banco e nunca ficam trancados para fora, são fenicris@gmail.com e fenicris.dev@gmail.com, sempre com o e-mail verificado pelo Google. Os demais ficam na coleção `equipe_fenix` (um documento por e-mail em minúsculas, com nível e ativo), mantida pela aba Equipe da página. As regras do Firestore conferem o nível em cada gravação; a página é só o controle. Depois de publicar as regras da v4.9, abre-se a página uma vez e usa-se Clientes, Carimbar início do teste: as empresas antigas passam a ter 15 dias a partir desse momento. Nenhum app chama `FenixCore.admin`, e a página não vai dentro de app.
- **Para que serve:** reunir num só lugar protegido quem pode conceder licenças e consultar clientes, cada um com o nível de permissão adequado. O carimbo dá os 15 dias de teste às empresas criadas antes da regra 62.
- **Quando vale:** é regra da biblioteca (administração da Fênix), não de app. A Ficha não a lista entre as regras dos apps, e nenhum app a usa.
- **Na prática:** quando um cliente contrata, alguém da equipe com nível administrador ou comercial abre `admin/fenix-admin.html`, entra com Google e concede a licença. Quem tem nível suporte só consulta.
- **Como conferir:** no app, nada a fazer: ele não chama `FenixCore.admin` e não leva a página dentro dele. Na biblioteca, confira se a página está em `admin/` e se os níveis e a equipe estão como o Livro descreve.

---

## 12. Segurança, dados, qualidade e continuidade

Esta seção trata de proteger usuários e dados (texto seguro, formato dos dados, cota, exclusão de conta), da qualidade antes da entrega (teste de fumaça, acessibilidade, saída protegida), de poder voltar atrás e de como a entrega é conferida. Nasceu na v5.0, com a regra 71 na v5.2 e as regras 72 e 73 na v5.3.

### Regra 64. Texto de usuário na tela
- **O que diz:** todo texto que veio do usuário, de importação ou do banco e vai para a tela é tratado como texto, nunca como código. Prefere-se `textContent`. Quando for preciso montar HTML, usa-se `FenixCore.seguranca`: `escaparHTML`, o modelo `seguranca.html` com crases (que protege cada valor colocado nele) e `urlSegura` para links vindos de dados. É proibido juntar texto de usuário em `innerHTML`, em atributo `onclick` ou em `href` sem passar por elas. Vale também para nomes de arquivo importados, observações, resultados de busca e mensagens de erro vindas de fora.
- **Para que serve:** impedir que alguém digite ou importe um texto que o navegador execute como código, o que se chama injeção de código. Isso poderia roubar dados ou quebrar a tela.
- **Quando vale:** sempre, em todos os apps. App antigo corrige na próxima alteração dele (regra 55, etapa de qualidade).
- **Na prática:** se alguém cadastrar um cliente com o nome `<b>Teste</b>`, a tela mostra exatamente esse texto, sem deixar o nome em negrito e sem executar nada.
- **Como conferir:** procure no código `innerHTML`, `onclick` e `href` montados com texto de usuário. Todos devem passar por `textContent` ou por `FenixCore.seguranca`. O teste de fumaça (regra 68) também confere isso.

### Regra 65. Versão do esquema dos dados
- **O que diz:** todo app que guarda dados no aparelho ou em coleção própria registra a versão do formato desses dados (o "esquema"). Quando o formato muda (campo novo com valor obrigatório, campo renomeado, estrutura diferente), sobe a versão do esquema e migra-se com `FenixCore.esquema.migrar(chave, versaoAtual, { 2: f, 3: g })`. Essa função guarda antes uma cópia `chave__backup_vN` e nunca apaga dados. Não se renomeia nem se troca o formato de chaves e coleções sem migração (regra 55c). A mudança é registrada no Changelog do app. No Firestore, a migração é feita pelo app na primeira abertura, em lotes, com o backup (regra 44) oferecido antes.
- **Para que serve:** quando o formato dos dados muda, os dados antigos dos usuários continuam legíveis e nada se perde.
- **Quando vale:** sempre, em todo app que guarda dados.
- **Na prática:** numa versão nova, o app passa a pedir um campo que antes não existia. A migração preenche esse campo nos registros antigos, depois de guardar uma cópia do que havia antes.
- **Como conferir:** o app registra a versão do esquema; existe migração para cada mudança de formato, com `FenixCore.esquema.migrar`; o Changelog cita a mudança; nenhuma chave existente foi renomeada sem migração.

### Regra 66. Cota do Firestore
- **O que diz:** cada leitura e cada gravação contam na cota e na conta. Listas usam limite e paginação (`limit`), e nunca se lê uma coleção inteira para mostrar poucos itens. Usa-se `onSnapshot` (escuta em tempo real) só onde o tempo real é necessário (regra 57), uma escuta por coleção, cancelada ao sair da tela. Usa-se o cache do aparelho (`initFirebaseComCache`) e não se relê o que já está na tela. Como as regras do Firestore também leem documentos para conferir licença e vínculo (regras 46 e 62), evita-se gravar em rajada: agrupa-se em lote com `salvarVarios` e `importarLista`.
- **Para que serve:** o Livro explica que leituras e gravações entram na cota e na cobrança. Economizar evita estourar a cota e gastar dinheiro à toa.
- **Quando vale:** só com o grupo A marcado (banco ativo).
- **Na prática:** uma lista de clientes carrega uma página por vez, com `limit`, em vez de trazer todos os clientes de uma vez. Uma importação grande é gravada em lote com `importarLista`.
- **Como conferir:** toda lista tem `limit`; cada `onSnapshot` é cancelado ao sair da tela; o app usa `initFirebaseComCache`; gravações em sequência usam `salvarVarios` ou `importarLista`.

### Regra 67. Excluir minha conta e meus dados
- **O que diz:** a tela Sobre, ou o menu do avatar, traz duas ações: Exportar meus dados (o backup da regra 44) e Excluir minha conta. A exclusão usa `FenixCore.criarModuloAuth(app).excluirConta(senha)`, que pede a senha de novo por segurança, e a confirmação digitando APAGAR (regra 47). A ordem é: oferecer o backup, apagar os dados pessoais que o próprio app gravou em `dados_pessoais/{uid}/...` (enquanto o usuário ainda está logado) e só então excluir a conta. Quem entra só com Google não tem senha para confirmar: o app mostra o pedido de exclusão por e-mail (o da Política de Privacidade). Dados da empresa e dados de outros membros não se apagam por aqui: o app explica que isso se pede ao dono da empresa ou à Fênix, pelo e-mail da Política.
- **Para que serve:** o usuário pode levar seus dados e sair, como a Política de Privacidade prevê. A ordem evita deixar dados órfãos de uma conta que já não existe.
- **Quando vale:** só com o grupo B marcado (acesso com login).
- **Na prática:** na Sobre, o usuário toca em Exportar meus dados, baixa o backup e depois toca em Excluir minha conta. O app pede a senha, pede para digitar APAGAR e então apaga os dados e a conta.
- **Como conferir:** as duas ações existem na Sobre ou no menu do avatar; a ordem é backup, dados pessoais e conta; a confirmação exige APAGAR; conta só com Google mostra o pedido por e-mail; o app avisa que dados da empresa não são apagados ali.

### Regra 68. Teste de fumaça
- **O que diz:** antes de entregar, roda-se o `fumaca-modelo.mjs` (na pasta `testes/app/` da biblioteca), ajustado ao app. Ele confere se o app abre sem erro de JavaScript, se não há rolagem horizontal em 360 px nem em tela maior, se os toques têm 44 px, se os campos têm rótulo, se o roteiro de criar, editar e apagar um registro funciona, se o texto digitado não vira código (regra 64) e se o app abre sem internet. Falha impede a entrega. Aviso é discutido com o Cristiano. O resultado é informado na entrega e, se não for possível rodar, diz-se o motivo.
- **Para que serve:** o teste de fumaça é uma checagem rápida dos problemas mais comuns. Pega-os automaticamente, antes de o app chegar ao cliente.
- **Quando vale:** sempre, em todos os apps.
- **Na prática:** antes de entregar a versão nova, roda-se o teste. Se ele acusar, por exemplo, rolagem horizontal no celular, o app volta para correção e só depois é entregue.
- **Como conferir:** a entrega informa o resultado do teste (sem falhas, ou os avisos combinados com o Cristiano). Se o teste não rodou, a entrega explica por quê. Esse item faz parte da Conferência de entrega (regra 72).

### Regra 69. Acessibilidade básica
- **O que diz:** todo campo tem rótulo visível (`<label>`) ou `aria-label` (rótulo lido por leitores de tela). Toda imagem tem `alt`, vazio quando for só enfeite. Botões só com ícone têm `aria-label`. O contraste mínimo entre texto e fundo é de 4,5 para 1 (a paleta Fênix cumpre com a fonte escura sobre o fundo claro e a branca sobre o azul; cuidado com cinza claro e amarelo sobre branco). O tamanho da fonte respeita o do sistema (usa-se `rem`, não `px` fixo em texto corrido). O foco do teclado fica visível. Erros e avisos aparecem em texto, não só em cor.
- **Para que serve:** permitir o uso por pessoas com baixa visão, daltonismo, ou que usam leitor de tela ou teclado.
- **Quando vale:** sempre, em todos os apps.
- **Na prática:** um botão que só tem o ícone de lixeira recebe `aria-label="Excluir"`. Uma mensagem de erro aparece escrita, e não apenas com o campo em vermelho.
- **Como conferir:** percorra o app procurando campo sem rótulo, imagem sem `alt`, botão de ícone sem `aria-label`, texto cinza claro ou amarelo sobre branco, fonte em `px` fixo e erro mostrado só por cor. Use também a tecla Tab para ver se o foco aparece.

### Regra 70. Plano de volta
- **O que diz:** a versão anterior de tudo que foi publicado continua guardada, com a versão no nome (regra 11), pronta para recolocar. Se a versão nova falhar depois de publicada (regra do Firestore recusando gravação, core quebrado, app sem abrir), o primeiro passo é recolocar a anterior: no GitHub, `git revert` do commit ou o arquivo `-vX.Y` copiado por cima do neutro. Só depois se investiga. Na entrega, diz-se qual é a versão de volta e, para as regras do Firestore, mantém-se o backup do passo 3 do checklist da regra 46. Mudança de esquema de dados (regra 65) ou de regra do Firestore não se desfaz só recolocando o app, por isso o backup vem antes.
- **Para que serve:** se algo der errado em produção, os clientes voltam a ter um app funcionando em minutos, sem ninguém precisar achar o defeito sob pressão.
- **Quando vale:** sempre, em todos os apps e também na biblioteca.
- **Na prática:** publicou-se a v3.3 e o app não abriu. Copia-se o arquivo da v3.2 por cima do `index.html`, o app volta a funcionar, e só então se investiga o defeito.
- **Como conferir:** a cópia da versão anterior, com a versão no nome, existe e está pronta; a entrega diz qual é a versão de volta; havendo mudança de esquema ou de regra do Firestore, o backup foi feito antes.

### Regra 71. Saída protegida
- **O que diz:** nenhuma tela com edição em andamento é fechada sem antes perguntar se a pessoa quer sair. Vale para fechar janela, Voltar, Cancelar e o botão Voltar do celular, para fechar ou recarregar a aba e para puxar a tela para baixo (no celular isso atualiza a página e apaga o que estava sendo digitado; o app desliga esse gesto). A pergunta tem dois botões de 44 px: Continuar editando (destacado, com o foco inicial; ESC e o toque fora também continuam editando) e Sair sem salvar. Telas só de consulta, sem nada alterado, fecham direto. Assistentes de várias etapas e telas de configuração perguntam sempre, até serem concluídos. Na tela inicial, o Voltar do celular pergunta Sair do app? Usa-se `FenixCore.saida` (`confirmar`, `guardar`, `proteger`, `formulario`), nunca o `confirm()` do navegador, e libera-se a proteção (`liberar()`) depois de salvar. A regra não substitui a confirmação por digitação ao apagar dados (regra 47).
- **Para que serve:** o Livro explica que, no celular, puxar a tela para baixo atualiza a página e apaga o que se estava digitando. A regra evita perder o trabalho por um gesto sem querer.
- **Quando vale:** sempre, em todos os apps. App antigo ganha isso na próxima alteração dele (regra 55).
- **Na prática:** a pessoa preenche metade de um cadastro e toca em Voltar. Aparece a pergunta com Continuar editando em destaque e Sair sem salvar.
- **Como conferir:** teste cada tela de edição e cada assistente com Voltar, Cancelar, fechar a janela, botão Voltar do celular e recarregar a aba; confira se a tela só de consulta fecha direto, se o puxar para atualizar está desligado e se não há `confirm()` do navegador.

### Regra 72. Conferência de entrega de app
- **O que diz:** toda entrega de app, novo ou alterado, termina com a linha "Conferência de entrega", respondendo sim ou não a nove itens: (1) arquivo com a versão no nome, no padrão `fenix-nome-do-app-vX.X.html`; (2) cópia idêntica sem versão no nome, o `index.html` do app (regra 11); (3) `.zip` com `LEIAME.txt` quando a entrega tiver mais de um arquivo (o app e suas cópias, o manual em MD e PDF, o service worker, os ícones, as pastas); (4) selo de versão visível (regras 53 e 61); (5) Changelog e Manual atualizados (regras 12 e 13); (6) teste de fumaça (regra 68) e a versão de volta (regra 70); (7) botão Compartilhar (regra 74); (8) escolha de onde guardar os dados (regra 77); (9) estrutura de pastas do repositório do app (regra 78). Todo "não" vem com o motivo. Entrega sem essa linha é incompleta, e quem recebe pode devolvê-la. A cópia `index.html` e o zip valem para app novo, alterado e antigo trazido ao padrão, e os itens 2 e 3 não são opcionais.
- **Para que serve:** garantir que nenhum item da entrega seja esquecido e dar ao Cristiano um jeito rápido de conferir o pacote. Os itens 7, 8 e 9 foram acrescentados nas versões 5.4, 5.5 e 5.7 do Livro.
- **Quando vale:** sempre, em todo app (novo, alterado ou antigo trazido ao padrão).
- **Na prática:** no fim da mensagem de entrega vem uma linha com os nove itens, cada um com sim ou não. Se algum for "não", vem o motivo ao lado.
- **Como conferir:** a linha existe, traz os nove itens na ordem e justifica cada "não". Confira também se os itens 2 e 3 (cópia `index.html` e zip) realmente estão no pacote.

### Regra 73. Quando quem constrói o app não consegue abrir os links
- **O que diz:** quem constrói o app (colaborador ou assistente de IA) muitas vezes não consegue abrir os endereços do GitHub Pages, porque o ambiente em que trabalha só acessa uma lista de sites permitidos. Os links estão certos e abrem no navegador normal. Nesse caso, quem constrói: (1) diz claramente que não conseguiu abrir, em vez de afirmar que o arquivo "existe" ou de inventar o conteúdo; (2) tenta o endereço alternativo de leitura, `https://raw.githubusercontent.com/fenicris-dev/Fenix-Core/main/` seguido do caminho do arquivo (por exemplo, `https://raw.githubusercontent.com/fenicris-dev/Fenix-Core/main/MD/fenix-livro-das-regras.md`), que em teste de 09/11/2026 abriu enquanto o GitHub Pages estava bloqueado; ele serve só para ler e conferir (o app publicado continua apontando para o GitHub Pages) e pode demorar alguns minutos para mostrar um arquivo recém-publicado; (3) se nem esse abrir, pede ao Cristiano os arquivos anexados: o pacote da biblioteca (`.zip`) ou, no mínimo, o Livro das Regras, o Guia, o `fenix-core.js` e os ícones e logos que o app usar; (4) trabalha só com o que foi lido ou anexado, nunca com uma versão lembrada de memória; (5) lembra que o app publicado carrega o core e os ícones pelo navegador do cliente, então funciona mesmo quando o assistente não abre os endereços. O Painel da biblioteca é quem confirma que os endereços estão no ar. Ao começar um app com colaborador, anexa-se o zip da biblioteca na primeira mensagem.
- **Para que serve:** evitar que quem constrói invente ou lembre errado o conteúdo do core ou das regras, o que geraria apps fora do padrão.
- **Quando vale:** sempre, para todos os apps e para todo colaborador ou assistente que os construa.
- **Na prática:** o assistente não consegue abrir o endereço do Livro. Ele avisa isso, tenta o endereço do `raw.githubusercontent.com`, e, se também falhar, pede o zip da biblioteca ao Cristiano. Enquanto não tiver os arquivos, não escreve código de memória.
- **Como conferir:** o zip da biblioteca foi anexado na primeira mensagem do app; quem constrói disse o que não abriu e usou só o que foi lido ou anexado; o Painel da biblioteca mostra os endereços no ar.

---

## 13. Compartilhar e indicar

Esta seção trata de fazer o app ser conhecido por indicação: o botão Compartilhar em todo app e a campanha "Compartilhe e ganhe", que o Cristiano liga e desliga quando quiser. O prêmio é acesso a outro app, nunca dinheiro, e só sai quando a pessoa indicada contrata a licença. Nasceu na v5.4.

### Regra 74. Compartilhar o app
- **O que diz:** todo app novo ou alterado traz o botão **Compartilhar**, com WhatsApp, e-mail, copiar link e as opções do aparelho, para quem gostar do app poder indicá-lo. Quem monta o botão é o core: o app chama uma vez, depois de iniciar o core, `FenixCore.compartilhar.iniciar({ nomeApp, url, email, container })`, com o container do menu ou da tela Sobre (botão com 44 px de toque, regra 20). A mensagem e os links vêm prontos do core (`compartilhar.links`). O endereço compartilhado é sempre o do app publicado (`index.html`), nunca o de um arquivo com versão no nome. Com o usuário logado, o app passa o `email` para o link levar o código de indicação (regra 75). O app não monta mensagem própria e nunca lê os contatos da pessoa: quem escolhe com quem compartilhar é ela. Funciona também com o banco desligado.
- **Para que serve:** quem gostou do app indica com poucos toques, e o convite sai sempre com a mesma mensagem e o link certo. Como o app não lê os contatos, a privacidade fica preservada.
- **Quando vale:** sempre, em todos os apps, também com o banco desligado.
- **Na prática:** no menu aparece o botão Compartilhar. Ao tocar, a pessoa escolhe WhatsApp, e-mail, copiar link ou as opções do aparelho, e o texto já vem pronto.
- **Como conferir:** o app chama `FenixCore.compartilhar.iniciar` uma única vez, depois do início do core; o botão aparece no menu ou na Sobre com 44 px; o link aponta para o `index.html` publicado, sem versão no nome; não há mensagem montada pelo app nem leitura de contatos. Esse item é o 7 da Conferência de entrega.

### Regra 75. Compartilhe e ganhe
- **O que diz:** o Cristiano liga e desliga a campanha pela aba Indicações da página `admin/fenix-admin.html`. A chave fica no banco do core (`config/indicacoes`) e vale para todos os apps de uma vez, sem republicar nenhum. Ligada, o app mostra na abertura, uma vez por sessão, a frase "Compartilhe e ganhe acesso de 1 ano a um dos nossos aplicativos", a lista dos apps que podem ser o prêmio e as condições da regra 76. Desligada, nada aparece e o botão Compartilhar continua. Quem desenha o aviso é o core, na mesma chamada `compartilhar.iniciar`: o app não escreve o texto nem a lista. A lista dos apps do prêmio é manual e fica no core (`FenixCore.indicacoes.APPS_PREMIO`); para incluir ou tirar um app, atualiza-se o core. **O prêmio nunca é em dinheiro:** é 1 ano de acesso a um dos apps da lista. A indicação é rastreada pelo link: cada pessoa tem um código derivado do seu e-mail, o link leva `?ind=código`, o core guarda neste aparelho o primeiro código recebido e, quando a pessoa cria a conta, grava na empresa dela o `indicadoPor`. Com o banco desligado o aviso não aparece, porque a chave está no banco; o botão Compartilhar continua.
- **Para que serve:** transformar a indicação espontânea em incentivo, com controle total do Cristiano: dá para ligar numa época de divulgação e desligar quando não convier. Um prêmio em acesso a outro app custa pouco e ainda apresenta mais um produto da Fênix.
- **Quando vale:** sempre, em todos os apps. O aviso só aparece com o banco ativo, mas o botão Compartilhar aparece sempre.
- **Na prática:** com a campanha ligada, ao abrir o app a pessoa vê o aviso "Compartilhe e ganhe acesso de 1 ano a um dos nossos aplicativos", uma vez por sessão. Desligada a campanha na página administrativa, o aviso some de todos os apps sem republicar nada.
- **Como conferir:** o app não tem texto nem lista de prêmios escritos por ele (vêm do core, na chamada de `compartilhar.iniciar`); o aviso aparece quando a campanha está ligada e com o banco ativo, e some quando desligada; o botão Compartilhar aparece nos dois casos.

### Regra 76. Prêmio só com a efetivação do indicado
- **O que diz:** o prêmio só é liberado depois que a pessoa indicada **contratar a licença**, isto é, depois que o administrador conceder a ela uma licença por tempo ou definitiva (regra 63). Cadastro, teste de 15 dias ou visita ao app não dão prêmio. A liberação é **manual**: o administrador abre a aba Indicações de `admin/fenix-admin.html`, confere o indicado e escolhe, entre os apps da lista (regra 75), o que quem indicou vai receber. O sistema só aceita indicado com licença em dia e ainda não premiado, e cada indicado vale um único prêmio. O prêmio dura 1 ano a partir da liberação (se quem indicou já tem prêmio vigente no mesmo app, soma a partir do fim dele), vale só para o app escolhido, não se converte em dinheiro e não se transfere. Auto-indicação e código sem dono aparecem como inválidos e não recebem prêmio. As regras do Firestore garantem que só o administrador grava o prêmio (`empresas/{id}.premios`) e que ninguém se dá prêmio criando a própria empresa. **Limite:** o servidor aplica o prêmio nos apps que guardam os dados do usuário em `dados_pessoais` (apps pessoais, como o Gestor do Tempo). Em app com dados da empresa, o administrador concede, no lugar, uma licença por tempo de 1 ano. Antes de ligar a campanha, o Cristiano define o regulamento (quem pode participar, prazo) e confirma com o contador as implicações fiscais do prêmio.
- **Para que serve:** evitar fraude e prejuízo: ninguém ganha criando contas falsas, porque o prêmio só sai quando entra dinheiro de verdade. A liberação manual dá ao Cristiano a palavra final em cada caso.
- **Quando vale:** é regra de administração da biblioteca (como a 63), e a Ficha não a lista entre as regras dos apps. Quem constrói o app não precisa fazer nada além das regras 74 e 75.
- **Na prática:** uma pessoa indicada cria a conta e usa o teste de 15 dias: ninguém ganha nada ainda. Quando ela contrata a licença, o administrador confere na aba Indicações e libera, à mão, 1 ano de acesso a um app da lista para quem indicou.
- **Como conferir:** no app, nada a fazer além de cumprir 74 e 75, e conferir que ele não promete nem concede prêmio por conta própria. Na administração, antes de ligar a campanha, confira se o regulamento está definido e se o contador foi consultado sobre o lado fiscal.

---

## 14. Onde ficam os dados

Esta seção trata de uma pergunta que o usuário responde no primeiro acesso: guardar os dados só no aparelho dele ou na nuvem da Fênix. O padrão é só no aparelho, e ele pode mudar de ideia depois. Nasceu na v5.5.

### Regra 77. Onde guardar os dados: neste aparelho ou na nuvem
- **O que diz:** no primeiro acesso, o app pergunta ao usuário onde guardar os dados: **só neste aparelho (padrão)** ou **na nuvem da Fênix**. Quem desenha a pergunta e os avisos é o core: o app chama uma vez, depois do `init`, `FenixCore.armazenamento.iniciar({ app, nomeApp, temNuvem, modoAtual, container, aoMudar })`. Os pontos da regra são: (a) o padrão é gravar só no aparelho, e a nuvem só liga se o usuário escolher; (b) quem fica só no aparelho vê o aviso oficial de que, se formatar o aparelho, limpar o histórico ou os dados do navegador, ou desinstalar o app, todos os dados serão perdidos, e o app mantém o lembrete de backup (regra 44); (c) a pergunta do primeiro acesso só fecha com a resposta (não some com toque fora nem com Esc), usa linguagem clara e botões de 44 px; (d) o usuário pode mudar depois, no menu Ajuda ou em Configurações (o `container` desenha o bloco "Onde guardar meus dados"), com o aviso próprio de cada troca: ao passar para a nuvem, o app envia os dados do aparelho (oferecendo backup antes); ao passar para o aparelho, desliga a sincronização e avisa que o que for registrado dali em diante ficará só nele; (e) o core não liga a sincronia sozinho: o app consulta `armazenamento.nuvem(app)` antes de iniciar a sincronia (regra 57) ou de gravar na nuvem, e usa o `aoMudar(novo, antigo)` para iniciar, parar e enviar os dados; (f) app que já usava a nuvem e é atualizado passa `modoAtual: "nuvem"`, e o usuário antigo continua na nuvem até responder (a pergunta aparece uma única vez, no primeiro acesso depois da atualização); (g) app que ainda não guarda dados na nuvem passa `temNuvem: false`, e a opção da nuvem aparece desativada; (h) login e licença seguem como são, pois a escolha é só sobre onde ficam os dados de trabalho; (i) a escolha vale por aparelho e por app (em outro aparelho, a pergunta aparece de novo); (j) os Termos de Uso e a Política de Privacidade oficiais informam essa escolha e o risco de perda dos dados quando ficam só no aparelho, e qualquer mudança nessa regra pede atualizar os dois textos.
- **Para que serve:** dar ao usuário o controle sobre os próprios dados, com a informação clara do risco de cada caminho. O padrão no aparelho respeita quem não quer enviar nada para a nuvem, e o aviso evita a surpresa de perder tudo ao formatar o celular.
- **Quando vale:** sempre, em todos os apps, novos e alterados, na próxima entrega de cada um.
- **Na prática:** no primeiro acesso aparece a pergunta com as duas opções. Quem fica só no aparelho lê o aviso de perda de dados. Depois, em Ajuda ou Configurações, pode passar para a nuvem, e o app envia o que já tinha, oferecendo backup antes.
- **Como conferir:** o app chama `armazenamento.iniciar` uma vez, depois do `init`; a pergunta só fecha com a resposta; o bloco "Onde guardar meus dados" aparece em Ajuda ou Configurações; o app consulta `armazenamento.nuvem(app)` antes de sincronizar; app antigo na nuvem passa `modoAtual: "nuvem"`; app sem nuvem passa `temNuvem: false`; os Termos e a Política continuam coerentes com a regra. Esse item é o 8 da Conferência de entrega.

---

## 15. Onde ficam os arquivos

Esta seção trata da arrumação do repositório no GitHub: o que fica solto na raiz e o que vai para pastas. A ideia é a mesma para a biblioteca e para todos os apps. Nasceu na v5.7.

### Regra 78. Estrutura de pastas do repositório
- **O que diz:** na raiz fica só o que precisa estar lá, e todo o resto vai para uma pasta, de acordo com a finalidade. **(a) Biblioteca** (repositório `Fenix-Core`): na raiz ficam `index.html` (o Painel), `fenix-core.js`, `versao.json`, `firestore.rules` e `LEIAME.txt` (mais um `fenix-admin.html` só de redirecionamento, transitório, para os favoritos antigos). Em pastas ficam `admin/` (`fenix-admin.html`), `templates/` (login, onboarding e splash), `testes/app/` e `testes/regras/`, `MD/` (documentos em Markdown), `DOC/` (documentos em Word), `Termos/`, `Icon/`, `Logo/` e `versoes/` (cópias com a versão no nome, só histórico). **(b) App** (repositório de cada app): na raiz ficam `index.html` (o app), `LEIAME.txt` e, só quando o app for PWA (aplicativo instalável), o `manifest.json` e o service worker (que precisa estar na raiz para valer para o app todo). Em pastas ficam `MD/` (manual em Markdown, regra 12), `DOC/` (manual em PDF), `Icon/` (ícones próprios do app, quando existirem; sem ícone próprio, usam-se os da biblioteca pelo endereço oficial) e `versoes/` (cópias `fenix-nome-do-app-vX.X.html`, só histórico). **(c)** Os nomes das pastas são exatamente esses, com maiúsculas e minúsculas como indicado, porque o GitHub Pages diferencia. `Icon`, `Logo`, `MD`, `DOC` e `Termos` não mudam de nome, porque apps já publicados apontam para eles. **(d)** Mover ou renomear um arquivo que app publicado usa muda o endereço e quebra o app. Isso só se faz numa versão nova do Livro, com o Painel atualizado, o Histórico registrando o endereço novo e, quando houver favorito ou link antigo, um arquivo de redirecionamento no lugar. O `fenix-core.js`, o `versao.json` e o `index.html` nunca saem da raiz. **(e)** O `.zip` de entrega já sai montado nessa estrutura, pronto para subir, e o `LEIAME.txt` diz o que vai em cada pasta (a pasta `versoes/` do zip é só controle interno). **(f)** App existente passa a seguir a regra na próxima alteração dele.
- **Para que serve:** deixar o repositório limpo e igual em todos os projetos, e evitar quebrar apps já publicados por causa de um arquivo que mudou de lugar.
- **Quando vale:** sempre, na biblioteca e em todos os apps. O app existente segue na próxima alteração dele (item 9 da Conferência de entrega).
- **Na prática:** no repositório de um app comum, a raiz mostra só `index.html` e `LEIAME.txt` (e, se for PWA, o `manifest.json` e o service worker). O manual em Markdown fica em `MD/`, o manual em PDF em `DOC/` e as versões antigas em `versoes/`.
- **Como conferir:** a raiz tem só os arquivos permitidos; as pastas têm os nomes exatos, com as maiúsculas certas; o zip já está montado nessa estrutura e o `LEIAME.txt` explica cada pasta; a pasta `versoes/` não foi para a raiz do repositório; nenhum arquivo que app publicado usa foi movido ou renomeado.

---

## As dez ideias por trás das regras

1. **Não perder dados do usuário.** Backup datado com lembrete (44), migração do esquema com cópia (65), saída protegida (71), confirmação digitada para apagar (47), proteção das chaves de dados em app antigo (55), exportar antes de excluir conta (67) e plano de volta (70).
2. **Funcionar sem internet.** O core fica guardado no aparelho (2), o app trabalha com dados locais e reconecta sozinho (3), o indicador mostra o estado (4), a sincronia tem fila offline (57) e o teste é feito sem rede (49 e 68).
3. **Mesma cara em todos os apps.** Paleta, degradê, logos, layout, rodapé, mensagens e templates de login, onboarding e splash (14 a 32, 59 e 60), para o cliente reconhecer a marca em qualquer app.
4. **Uma só fonte de código.** O core central (1), nunca copiado, e os cadastros só pelo core (41), com máscaras e formatos únicos (38 a 42): uma correção vale para todos.
5. **Segurança.** Regras do Firestore fechadas (46), texto de usuário nunca vira código (64), login só pelo core (56), conta e dados removíveis (67) e administração protegida por níveis (63).
6. **Licença e modelo comercial.** Teste de 15 dias, somente leitura (62), licença definitiva para o Google (58) e a administração dessas licenças (63), com o servidor como juiz final. Indicação com prêmio só quando o indicado contrata (74 a 76).
7. **Qualidade antes da entrega.** Validar o JS (48), testar em 360 px (49), cuidar de handlers e regressões (50 e 51), teste de fumaça (68) e acessibilidade (69).
8. **Entrega organizada e rastreável.** Versões sem saltos (7 a 9), nomes padrão (10), duas cópias (11), selos (53 e 61), Changelog, Manual e Sobre (12 e 13) e a Conferência de entrega (72), com repositório arrumado em pastas (78).
9. **Pensar em quem usa em campo.** Toque de 44 px (20), mensagens em português claro (21), barra de abas no celular (19), formatos brasileiros de moeda, data e documentos (38 a 40) e economia de cota (66).
10. **Trabalhar com ordem e sem inventar.** Ficha de aplicação perguntada a cada app (52), roteiro para app antigo (55), só o que está anexado quando os links não abrem (73), e regras que se atualizam junto com a biblioteca, sempre com o Cristiano decidindo o que ativar (grupos A, H, I e J).

---

# PARTE 2. O Fênix Core

O Fênix Core é o arquivo `fenix-core.js`, guardado em https://fenicris-dev.github.io/Fenix-Core/fenix-core.js. Pense nele como uma **caixa de ferramentas comum** que todos os apps da Fênix abrem na hora de funcionar. Em vez de cada app ter o seu próprio jeito de validar um CPF, buscar um CEP, fazer login ou guardar um backup, todos usam o mesmo, e uma correção feita no core vale para todos de uma vez (regra 1).

Cada ferramenta fica dentro de um grupo chamado **módulo** e é usada escrevendo `FenixCore.nome-do-módulo.função`. Este manual explica, em linguagem comum, o que cada módulo é, para que serve, quais regras do Livro o exigem, quais são as principais funções, um exemplo e os cuidados.

**Dois conceitos que aparecem o tempo todo:**
- **Banco ligado ou desligado.** Todo app nasce com o banco de dados (Firebase) desligado e funciona só no aparelho (regra 1). Os módulos abaixo dizem se "usam banco" ou não. Os que não usam funcionam sempre.
- **Regra de ouro do core:** ele só recebe acréscimos. Nada que já existe é removido, para nunca quebrar app antigo.

---

## Módulo `init`, `initFirebase` e `initFirebaseComCache` (ligar o core)

- **O que é:** o botão de ligar. Conecta o app ao banco de dados da Fênix (projeto Firebase "fenix-core"). As credenciais já vêm dentro do core.
- **Para que serve:** sem ligar, nenhuma função que use banco ou login funciona. Também grava o nome do app nos registros ("criado por", "atualizado por").
- **Regras relacionadas:** 1 e 2 (core central e carregador com cópia no aparelho), 3 (funcionar sem internet).
- **Principais funções:**
  - `FenixCore.init("fenix-nome-do-app")`: liga o core. Chamar uma única vez, ao abrir o app.
  - `FenixCore.initFirebase(config)`: igual, mas devolve `{ app, db }`, para apps que montam o login.
  - `FenixCore.initFirebaseComCache(config)`: igual, mas com cache offline: o app lê sem internet e as gravações feitas sem rede sobem quando ela volta.
- **Exemplo:** `FenixCore.init("fenix-controle-obras");`
- **Cuidados:** use o mesmo nome do arquivo do app. O `initFirebaseComCache` deve ser chamado antes de qualquer outro `init`. O core é um módulo ES: não funciona colado como `<script>` comum, use o carregador oficial.

## Dados fixos: `EMPRESA` e `CPF_CNPJ_DISCLOSURE`

- **O que é:** os dados da Fênix e o aviso de privacidade do CPF/CNPJ, prontos para usar.
- **Para que serve:** rodapés, documentos e tela Sobre mostram sempre os mesmos dados corretos, sem ninguém digitar de novo.
- **Regras relacionadas:** 37 (aviso do CPF/CNPJ), 14 a 22 (identidade e rodapé).
- **Principais funções:** `FenixCore.EMPRESA` (nome, razão social "60292 CRISTIANO RODRIGUES", CNPJ com e sem máscara, e-mail da empresa) e `FenixCore.CPF_CNPJ_DISCLOSURE` ("O CPF/CNPJ é usado apenas para emissão de Notas Fiscais e/ou Recibos.").
- **Exemplo:** `rodape.textContent = FenixCore.EMPRESA.nome;`
- **Cuidados:** não copie esses textos à mão; se mudarem, mudam no core.

## Módulo de texto e documento (`validarCPF`, `formatarDocumento` e companhia)

- **O que é:** pequenas ferramentas de texto que não usam banco.
- **Para que serve:** garantir que CPF e CNPJ sejam válidos de verdade (conferindo os dígitos, não só o formato) e que nomes e textos sejam escritos sempre do mesmo jeito.
- **Regras relacionadas:** 38 (formatos válidos), 41 e 42 (cadastros e padronização de nomes).
- **Principais funções:**
  - `limparDocumento(valor)`: deixa só os números.
  - `tipoDocumento(valor)`: diz se é CPF (`"fisica"`), CNPJ (`"juridica"`) ou nada.
  - `validarCPF` e `validarCNPJ`: conferem os dígitos verificadores; recusam sequências repetidas como 111.111.111-11.
  - `formatarCPF`, `formatarCNPJ`, `formatarDocumento`: colocam a máscara (a última escolhe CPF ou CNPJ sozinha).
  - `formatarNomeMaiusculo`: nomes de pessoa e empresa em MAIÚSCULAS, sem espaços sobrando.
  - `formatarTitulo`: demais textos com a primeira letra de cada palavra maiúscula, exceto preposições e artigos.
  - `normalizarBusca`: maiúsculas e sem acento, para busca.
- **Exemplo:** `formatarDocumento("12345678000199")` devolve `12.345.678/0001-99`; `normalizarBusca("  João ")` devolve `JOAO`.
- **Cuidados:** validar o formato não prova que o documento existe; apenas que os dígitos batem.

## Módulo `mascaras` (campos que se formatam sozinhos)

- **O que é:** faz o campo se formatar enquanto a pessoa digita: CPF, CNPJ, telefone, CEP, dinheiro, data, placa e outros.
- **Para que serve:** o usuário digita só números e o campo organiza. Evita dado torto e padroniza a tela em todos os apps.
- **Regras relacionadas:** 38 a 42.
- **Principais funções:**
  - `FenixCore.mascaras.auto()`: liga a máscara a todo campo marcado com `data-mask` (inclusive os que aparecerem depois, em janelas ou listas).
  - Tipos de `data-mask`: `cpfcnpj`, `cpf`, `cnpj`, `moeda`, `percentual`, `telefone`, `cep`, `data`, `hora`, `placa`, `ip`, `mac`, `numero`, `ie` (com `data-mask-uf`), `rg` e `uf`.
  - Funções de exibição (`mascaras.cpf`, `telefone`, `moeda`...) para mostrar um valor guardado.
  - `moedaParaNumero("R$ 1.234,56")` devolve `1234.56`; `numeroParaMoeda` faz o caminho contrário; `dataParaISO("25/12/2026")` devolve `2026-12-25`.
  - `valorLimpo(tipo, texto)`, `aplicar(campo, tipo)` e `definirValor(campo, valor)`.
- **Exemplo:** `<input data-mask="telefone">` e, uma vez, `FenixCore.mascaras.auto()`. Digitar `79999680880` vira `(79) 9 9968-0880`.
- **Cuidados:** moeda não aceita valor negativo. Para pôr um valor inicial num campo de moeda, use `definirValor`, não o `value` direto.

## Módulo `pessoas` (cadastro nacional de PF e PJ)

- **O que é:** o cadastro único de pessoas físicas (chave = CPF) e jurídicas (chave = CNPJ) da Fênix.
- **Para que serve:** um cliente cadastrado em um app aparece pronto em todos os outros. Nenhum app cria cadastro próprio de cliente.
- **Regras relacionadas:** 33 a 37 e 41 (cadastro PF/PJ, consulta de CNPJ e regra de ouro dos cadastros).
- **Principais funções (usam banco, salvo as indicadas):**
  - `buscar(cpfOuCnpj)`: acha a pessoa pelo documento.
  - `salvarFisica`, `salvarJuridica` e `salvar`: criam ou atualizam validando o documento e padronizando a escrita.
  - `buscarPorNome(termo, tipo, max)`: autocomplete por início do nome, sem diferenciar maiúsculas e acentos.
  - `buscarNaReceita(cnpj)` (sem banco): consulta o CNPJ na BrasilAPI.
  - `consultarCNPJ(cnpj)` (sem banco; a que a regra 35 manda usar): igual, e completa o endereço pelo CEP se faltar.
  - `disclosure`: o aviso do CPF/CNPJ.
- **Exemplo:** `const p = await FenixCore.pessoas.consultarCNPJ("60292878000170");`
- **Cuidados:** use `consultarCNPJ` dentro de `try/catch`. Cadastros anteriores à v2.0 só aparecem na busca por nome depois de salvos de novo.

## Módulo `produtos` (catálogo comum)

- **O que é:** o catálogo comum de produtos, serviços e soluções (coleção `produtos_servicos`). Usa banco.
- **Para que serve:** os apps compartilham a mesma lista de itens, com nome e categoria padronizados.
- **Regras relacionadas:** 43 (ficha de produto), 41 e 42.
- **Principais funções:** `salvar(dados)` (cria ou atualiza), `buscar(id)`, `listar({ tipo, apenasAtivos })` e `excluir(id)`.
- **Exemplo:** `await FenixCore.produtos.salvar({ nome: "Motor de portão", tipo: "produto", precoBase: 1200 });`
- **Cuidados:** na tela, exclusão sempre com confirmação digitada (regra 47).

## Módulo `localidades` (CEP, cidades e bairros)

- **O que é:** busca de endereço pelo CEP e lista de cidades e bairros já conhecidos.
- **Para que serve:** o usuário digita o CEP e o endereço vem pronto, sem erro de digitação.
- **Regras relacionadas:** 33 a 36.
- **Principais funções:**
  - `buscarPorCEPSemBanco(cep)`: ViaCEP, sem banco. É a padrão enquanto o banco estiver desligado.
  - `buscarPorCEP(cep)`: ViaCEP e grava cidade e bairro (só com banco ativo).
  - `buscarPorCEPBrasilAPI(cep)`: alternativa, sem banco.
  - `buscarCidadesPorUF(uf)`, `buscarBairros(codigoIBGE)` e `registrarBairro(codigoIBGE, nome, origem)`: usam banco.
- **Exemplo:** `const e = await FenixCore.localidades.buscarPorCEPSemBanco("49000-000");`
- **Cuidados:** o CEP precisa ter 8 dígitos (senão dá erro) e devolve `null` se não existir. Em cidade pequena o bairro pode vir vazio: deixe o campo livre para digitar.

## Módulo `criarModuloAuth` (login)

- **O que é:** o login do app, por e-mail e senha e pelo Google.
- **Para que serve:** todo app entra, sai e recupera senha do mesmo jeito. O login só pode ser feito pelo core.
- **Regras relacionadas:** 23 a 26 (layout e autenticação), 56 (Google), 58 (Google só para licença definitiva), 67 (excluir conta).
- **Principais funções:** `aoMudarEstado(callback)`, `entrar(email, senha)`, `criarConta`, `sair()`, `usuarioAtual()`, `entrarComGoogle()`, `resultadoRedirecionamento()`, `redefinirSenha(email)` (e `recuperarSenha`), `reautenticar(senha)` e `excluirConta(senha)`.
- **Exemplo:** `const auth = FenixCore.criarModuloAuth(app); auth.aoMudarEstado(u => ...);`
- **Cuidados:** o endereço do app precisa estar em Firebase > Authentication > Domínios autorizados e o provedor Google precisa estar ativado. Se o navegador bloquear a janela do Google, o core muda sozinho para o redirecionamento; ao abrir o app, chame `resultadoRedirecionamento()`. Quem só tem conta Google pede a exclusão de conta por e-mail.

## Módulos de empresas, convites e equipe (`criarModuloEmpresas`, `criarModuloConvites`, `criarModuloEquipe`)

- **O que é:** o conjunto para apps em que uma empresa tem um dono e vários técnicos (como o Fênix Ativos). Usam banco.
- **Para que serve:** cada empresa enxerga só os seus dados, e o dono convida a equipe por link.
- **Regras relacionadas:** 46 (regras do Firestore), 62 e 63 (teste, licença e administração).
- **Principais funções:**
  - Empresas: `criarEmpresa(uid, email, nome)` (cria a empresa, torna o usuário dono e grava o início do teste de 15 dias), `obterEmpresa`, `obterEmpresaDoUsuario`, `repararVinculo`.
  - Convites: `criarConvite`, `obterConvite`, `aceitarConvite`, `listarConvitesPendentes`, `cancelarConvite`. Cada convite é uma chave aleatória de uso único.
  - Equipe: `listarMembros(empresaId)` e `removerMembro(empresaId, uid)`.
- **Exemplo:** `await FenixCore.criarModuloConvites(db, baseUrl).criarConvite(empresaId, uid, email, "tecnico@x.com");`
- **Cuidados:** esses módulos só existem para apps com várias empresas; app pessoal usa os módulos abaixo.

## Módulos de dados da empresa (`criarModuloAppData`, `criarModuloCatalogoEmpresa`, `criarModuloPessoas` e atalhos)

- **O que é:** formas de guardar dados de um app dentro da empresa, sem mexer no core. Usam banco.
- **Para que serve:** cada app cria suas coleções próprias, isoladas por empresa.
- **Regras relacionadas:** 41, 46, 62 (gravação bloqueada em somente leitura).
- **Principais funções:**
  - `criarModuloAppData(db, empresaId, nomeApp)`: guarda listas inteiras na nuvem (`salvar`, `carregar` e `escutar`, que avisa a cada alteração em qualquer aparelho).
  - `criarModuloCatalogoEmpresa(db, empresaId, nomeColecao, campoChave)`: coleção própria com `listar`, `salvar` e `excluir`.
  - Atalhos prontos: `criarModuloMateriais`, `criarModuloProdutosServicos`, `criarModuloFamiliasMateriais`.
  - `criarModuloPessoas(db, empresaId)`: clientes do app dentro da empresa (`listar`, `salvar`, `arquivar`, `excluir`). Não é o cadastro nacional.
- **Exemplo:** `const cat = FenixCore.criarModuloCatalogoEmpresa(db, empresaId, "materiais", "codigo");`
- **Cuidados:** em somente leitura (teste vencido), todas as gravações são recusadas sozinhas.

## Módulo `criarModuloDadosPessoais` (dados do usuário, sem empresa)

- **O que é:** guarda dados que pertencem à pessoa, em `dados_pessoais/{uid}/{app}/{chave}`. Usa banco.
- **Para que serve:** apps pessoais (como o Gestor do Tempo) guardam os dados na nuvem, protegidos para só o dono ver.
- **Regras relacionadas:** 46, 57, 62.
- **Principais funções:** `salvar(chave, dados)`, `carregar(chave)`, `excluir(chave)`, `listar()`, `escutar(chave, aoMudar)` e `escutarTudo(aoMudar)` (os dois últimos devolvem a função que para de escutar).
- **Exemplo:** `await FenixCore.criarModuloDadosPessoais(db, uid, "fenix-gestor-do-tempo").salvar("config", { tema: "escuro" });`
- **Cuidados:** o caminho é o que as regras do Firestore já liberam; não invente outro.

## Módulos de sincronia (`criarSincronia` e `criarModuloSincronia`)

- **O que é:** mantêm a mesma tabela igual em todos os aparelhos da mesma conta, em tempo real, mesmo com internet instável.
- **Para que serve:** o usuário cadastra no celular e vê no computador. Sem sincronia, o dado fica preso ao aparelho (`localStorage`).
- **Regras relacionadas:** 3 (reconectar sozinho), 4 (indicador de conexão), 57 (sincronia entre aparelhos), 55d (não mudar o caminho dos dados de app antigo).
- **Principais funções:**
  - `criarSincronia(db, opcoes)` (para app novo): `iniciar`, `parar`, `salvar(registro)`, `excluir(id)`, `importarLista(lista)`, `forcarSincronia()`, `estado()`, `pendentes()`. Estados: `sincronizado`, `sincronizando`, `offline`, `erro`.
  - `criarModuloSincronia(db, uid, nomeApp)` (para app que já grava em `dados_pessoais/{uid}/{app}_{coleção}`): `ouvir`, `salvar`, `salvarVarios`, `excluir`, `apagarTudo`, `agora`, `relogio`, `medirRelogio`.
- **Exemplo:** `const sync = FenixCore.criarSincronia(db, { escopo: "pessoal", uid, nomeApp, tabela: "tarefas", lerLocal, gravarLocal, aoMudar: desenhar }); sync.iniciar();`
- **Cuidados:** cada registro precisa do campo `id`. Em conflito vale a alteração mais recente. Excluir grava uma marca de apagado, para valer nos outros aparelhos. Sem internet as alterações ficam numa fila e sobem ao reconectar. Se a hora do aparelho estiver muito errada, ele pode "ganhar" conflitos.

## Módulo `criarModuloAcesso` (cadastro com aprovação do administrador)

- **O que é:** o fluxo em que qualquer pessoa pede acesso e um administrador aprova ou bloqueia. Usa banco.
- **Para que serve:** apps fechados para um grupo (como os do Gestor e do Compras) controlam quem entra.
- **Regras relacionadas:** 26 e 46.
- **Principais funções:** `obter(uid)`, `ouvir(uid, aoMudar)`, `solicitar(uid, email, nome)`, `ehAdmin(uid)`, `listar(status)`, `definirStatus(uid, status, adminUid)` e `excluir(uid)`. Status: `pendente`, `aprovado` ou `bloqueado`.
- **Exemplo:** `await acesso.solicitar(uid, email, nome);`
- **Cuidados:** o administrador é criado à mão no console (`admins/{uid}`). Quem decide de verdade são as regras do Firestore.

## Módulo `licenca` (teste de 15 dias, licença e somente leitura)

- **O que é:** controla quanto tempo o cliente pode usar o app e se ele pode gravar.
- **Para que serve:** é o modelo comercial: 15 dias de uso integral a partir do primeiro acesso; depois, licença por tempo ou definitiva; sem nenhuma delas, o app só permite ver os registros e não aceita novos.
- **Regras relacionadas:** 58 (licença definitiva e login Google), 62 (teste de 15 dias), 63 (administração), 46 (o servidor impõe o mesmo).
- **Principais funções:**
  - `acesso(dados, agora)`: calcula o estado (teste, ativa ou somente leitura, dias restantes).
  - `carregar(db, uid)`: lê a empresa do usuário, calcula e guarda no aparelho, para valer também sem internet.
  - `acessoAtual()`, `podeGravar()`, `definirAcesso()`, `exigirGravacao()` (lança o erro `FENIX_SOMENTE_LEITURA`), `mensagem(acesso)`.
  - `montarAviso(container)` e, desde a v5.1, aviso automático em apps com login (`automatico(false)` desliga).
  - Sem login: `acessoLocal(app)` e `ativarLocal(db, app, email)`.
  - Prêmio de indicação: `acesso(dados, agora, app)` aceita o nome do app; com prêmio vigente nele, o acesso volta a gravar mesmo com o teste vencido.
  - Licença definitiva e Google: `ehDefinitiva`, `situacao`, `dataLimite`, `MENSAGEM_GOOGLE`, `daEmpresa`, `hashEmail`, `porEmail`, `lembrar`, `lembrada`, `liberaGoogle`, `confirmarAposGoogle`.
- **Exemplo:** `await FenixCore.licenca.carregar(db, uid); if (!FenixCore.licenca.podeGravar()) { ... }`
- **Cuidados:** empresa antiga sem data de início fica liberada até o administrador carimbar. A versão sem login é uma trava leve: limpar os dados do navegador reinicia a contagem. Exportar backup continua liberado em somente leitura (regra 44).

## Módulo `admin` (equipe, níveis e clientes)

- **O que é:** o miolo da página `admin/fenix-admin.html`. Nenhum app usa.
- **Para que serve:** o Cristiano e a equipe gerenciam clientes, licenças e colaboradores, cada um com o poder do seu nível.
- **Regras relacionadas:** 63 (administração), 62 (teste), 46 (as regras do Firestore decidem de verdade).
- **Principais funções:**
  - `ehRaiz(usuario)`: os dois e-mails raiz, só com e-mail verificado pelo Google.
  - `meuNivel(db, usuario)` e `pode(nivel, acao)`: `admin`, `comercial` ou `suporte`. Ver exige suporte ou mais, licença exige comercial ou mais, equipe exige admin.
  - `equipe.listar / salvar / excluir`.
  - `indicacoes.listar` e `indicacoes.liberarPremio`: a aba Indicações (veja o módulo `indicacoes`).
  - `clientes.listar`, `definirLicenca` (teste, tempo ou definitiva), `prorrogarTeste`, `reiniciarTeste` e `carimbarSemInicio`.
- **Exemplo:** `await FenixCore.admin.clientes.prorrogarTeste(db, empresaId, 15);`
- **Cuidados:** `carimbarSemInicio` deve ser rodada uma vez, logo depois de publicar as regras da v4.9 ("15 dias a partir da publicação"). Um nível sem permissão recebe "sem permissão".

## Módulo `backup` (cópia de segurança no aparelho)

- **O que é:** lembrete e download de backup. Não usa banco.
- **Para que serve:** evita perder tudo se o aparelho for trocado ou os dados do navegador forem limpos.
- **Regras relacionadas:** 44 (backup datado com lembrete), 65, 67, 70.
- **Principais funções:** `verificarLembrete(nomeApp, { dias, aoFazerBackup, aoRecusar })` (aviso após mais de 7 dias sem backup), `baixarJSON(nomeApp, dados)` (arquivo `nomeApp-backup-aaaa-mm-dd.json`), `registrar`, `ultimo` e `diasSemBackup`.
- **Exemplo:** `FenixCore.backup.verificarLembrete("fenix-x", { aoFazerBackup: () => FenixCore.backup.baixarJSON("fenix-x", dados) });`
- **Cuidados:** o core não importa; o app oferece o botão Importar. Ponha a versão do app dentro dos dados exportados.

## Módulo `sobre` (tela Sobre e Changelog)

- **O que é:** a tela Sobre pronta, com versão, acessos, datas e Changelog. Não usa banco.
- **Para que serve:** todo app mostra a mesma informação e o usuário vê o histórico de mudanças.
- **Regras relacionadas:** 12 e 13 (Changelog e Manual/Sobre), 53 e 61 (selos).
- **Principais funções:** `registrarAcesso(nomeApp, versao)`, `obter`, `formatarData`, `montarTela(container, { nomeApp, titulo, versao, changelog })`, `changelogHTML`, `ordenarChangelog`, `datasDoApp` e `baixarChangelogPDF`.
- **Exemplo:** `FenixCore.sobre.registrarAcesso("fenix-x", "v1.2");`
- **Cuidados:** cada abertura conta um acesso (recarregar não conta). O Changelog é uma lista de `{ versao, criadaEm, modificadaEm, mudancas }`. O PDF usa o jsPDF que o app já embute.

## Módulo `manual` (manual do usuário)

- **O que é:** mostra o manual do app em tela e em PDF. Não usa banco.
- **Para que serve:** todo app tem manual com o mesmo visual e o usuário pode baixá-lo.
- **Regras relacionadas:** 12 e 13, 64 (HTML seguro).
- **Principais funções:** `montarTela(container, md, { nomeApp, versao, titulo })`, `baixarPDF(nomeApp, versao, md)` e `paraHTML(md)` (converte o Markdown em HTML seguro).
- **Exemplo:** `FenixCore.manual.montarTela(div, textoMarkdown, { nomeApp: "fenix-x", versao: "1.2" });`
- **Cuidados:** aceita títulos, listas, negrito, links e imagens (base64 ou https).

## Módulo `dashboard` (indicadores clicáveis)

- **O que é:** cartões de indicador em que, ao clicar no número, abre a lista dos registros que o formam. Não usa banco.
- **Para que serve:** o número deixa de ser um mistério: o usuário confere de onde ele vem.
- **Regras relacionadas:** 54 (dashboard clicável) e 20 e 69 (toque e acessibilidade).
- **Principais funções:** `montar(container, indicadores, opcoes)`, que devolve `abrir(id)`, `fechar()`, `abrirLista(titulo, registros)` e `atualizar(novos)`.
- **Exemplo:** `const d = FenixCore.dashboard.montar(div, [{ id: "vendas", rotulo: "Vendas", registros: lista, moeda: true }]);`
- **Cuidados:** indicador zerado não abre e mostra "Nenhum registro". Esc fecha e funciona pelo teclado.

## Módulo `versoes` (selo de versão e aviso de core novo)

- **O que é:** o selo `v3.2 | c 4.6` que aparece em todo app: `v` é a versão do app e `c` a do core.
- **Para que serve:** enxergar de relance o que está atualizado e ser avisado quando há core novo.
- **Regras relacionadas:** 7 a 9 (versões), 53 e 61 (selos).
- **Principais funções:** `core`, `selo("3.2")`, `montarSelo(container, "3.2", { coreMinimo, livro, verificar, detalhe })`, `verificar({ forcar })` e `comparar(a, b)`.
- **Exemplo:** `FenixCore.versoes.montarSelo(div, "3.2", { coreMinimo: "4.6", livro: "5.6" });`
- **Cuidados:** ponto amarelo `⬆` significa core novo publicado (basta fechar e abrir o app com internet). Ponto vermelho `⚠` significa core abaixo do mínimo do app. Sem internet não há aviso nem erro. A consulta lê o `versao.json` publicado e guarda a resposta por 6 horas.

## Módulo `preferencias` e `som` (som, animações e tema)

- **O que é:** as escolhas do usuário guardadas no aparelho (som de abertura, reduzir animações, tema claro, escuro ou automático) e o toque de abertura "Asas".
- **Para que serve:** conforto e acessibilidade, com o mesmo comportamento em todos os apps.
- **Regras relacionadas:** 59 (toque de abertura), 60 (preferências e tema), 69 (acessibilidade).
- **Principais funções:**
  - Preferências: `montarTela(container, { tema })`, `aplicar()`, `animacoesReduzidas()`, `definirAnimacoesReduzidas(sim)`, `tema()` e `definirTema(t)`.
  - Som: `tocarAbertura({ somentePermitido, forcar })`, `ligado()`, `definir(sim)` e `sintetizar` (uso interno e testes).
- **Exemplo:** `FenixCore.preferencias.montarTela(div);`
- **Cuidados:** navegadores só liberam som depois de um toque do usuário, por isso o toque normal sai no login e não ao abrir o app. As animações param quando o aparelho pede movimento reduzido.

## Módulo `seguranca` (texto seguro)

- **O que é:** proteção para que texto digitado por usuário nunca vire código na tela.
- **Para que serve:** evita que um nome malicioso (por exemplo `<img src=x onerror=...>`) execute código quando for mostrado.
- **Regras relacionadas:** 64.
- **Principais funções:** `escaparHTML(valor)`, `html` (modelo que escapa cada valor interpolado), `bruto(trecho)` (marca HTML seu, nunca de usuário) e `urlSegura(url)` (só aceita http, https, mailto e tel).
- **Exemplo:** ``div.innerHTML = FenixCore.seguranca.html`<b>${nome}</b>`;``
- **Cuidados:** sempre que possível use `textContent`. Estas funções são para quando for preciso montar HTML.

## Módulo `esquema` (versão do formato dos dados)

- **O que é:** controla o "formato" dos dados guardados no aparelho e migra quando ele muda.
- **Para que serve:** quando uma nova versão do app muda a estrutura dos dados, os dados antigos são convertidos sem perda.
- **Regras relacionadas:** 65, 44.
- **Principais funções:** `versao(chave)` (1 se ainda não houver) e `migrar(chave, versaoAtual, { 2: f, 3: g })`, que guarda a cópia `chave__backup_v<antiga>`, aplica as funções em ordem e devolve `{ migrado, de, para, backup }`.
- **Exemplo:** `FenixCore.esquema.migrar("fenix_x_dados", 3, { 2: dados => ..., 3: dados => ... });`
- **Cuidados:** nunca apaga dados; em erro, devolve os originais. No Firestore o core não migra sozinho: o app migra na primeira abertura, em lotes, depois de oferecer o backup.

## Módulo `saida` (saída protegida)

- **O que é:** evita perder o que está sendo editado por um movimento sem querer (toque fora da janela, botão Voltar do celular, rolar para cima e a página atualizar).
- **Para que serve:** nenhuma tela é fechada sem antes perguntar se a pessoa quer sair.
- **Regras relacionadas:** 71.
- **Principais funções:** `confirmar(mensagem, opcoes)` (devolve verdadeiro para sair e falso para continuar), `guardar(fecharFn, temAlteracoes)` (para botões Fechar, Voltar e Cancelar), `proteger({ temAlteracoes, ... })` (protege a tela inteira e devolve `liberar()`) e `formulario(form)` (devolve `tem()` e `marcarSalvo()`).
- **Exemplo:** `const f = FenixCore.saida.formulario(form); const p = FenixCore.saida.proteger({ temAlteracoes: f.tem }); ... ao salvar: f.marcarSalvo(); p.liberar();`
- **Cuidados:** o aviso de fechar a aba nos celulares é decisão do navegador e pode não aparecer; por isso o botão Voltar e o puxar para atualizar têm tratamento próprio. O foco da pergunta começa em "Continuar editando".

---

## Módulo `compartilhar` (botão Compartilhar)

- **O que é:** o botão e a janela de compartilhar do app: WhatsApp, e-mail, copiar link e as opções do aparelho. Não usa banco.
- **Para que serve:** todo app indica a si mesmo do mesmo jeito, com a mensagem e o link certos.
- **Regras relacionadas:** 74 (compartilhar) e 75 (o link leva o código da campanha), 20 (toque de 44 px).
- **Principais funções:**
  - `iniciar({ nomeApp, url, email, container })`: a única chamada que o app precisa. Guarda o código de indicação do link, desenha o botão e, com a campanha ligada, mostra o aviso da regra 75.
  - `montarBotao(container, opcoes)` e `abrir(opcoes)`: só o botão ou só a janela.
  - `links({ nomeApp, url, codigo })`: devolve o link, a mensagem e os endereços de WhatsApp e e-mail, para quem quiser montar a própria tela.
- **Exemplo:** `FenixCore.compartilhar.iniciar({ nomeApp: "Gestor do Tempo", url: "https://fenicris-dev.github.io/Fenix-Gestor-do-Tempo/", email: usuario.email, container: "#menu" });`
- **Cuidados:** use sempre o endereço do app publicado, nunca o de um arquivo com versão. O app não lê contatos. Se o navegador negar copiar, a janela mostra o link para copiar à mão.

## Módulo `indicacoes` (Compartilhe e ganhe)

- **O que é:** a campanha de indicação: chave liga e desliga, aviso na abertura, lista dos apps do prêmio, código de indicação e liberação do prêmio.
- **Para que serve:** quem indica ganha 1 ano de acesso a outro app, só depois que o indicado contratar a licença, com liberação manual do Cristiano. Nunca em dinheiro.
- **Regras relacionadas:** 75 (campanha) e 76 (prêmio só com a efetivação), 62 e 63 (licença e administração), 46 (regras do Firestore).
- **Principais funções:**
  - `ativa(db)` e `definirAtiva(db, sim, por)`: lê e muda a chave (`config/indicacoes`); sem rede vale a última leitura guardada.
  - `avisoAbertura(db, opcoes)`: mostra o aviso "Compartilhe e ganhe acesso de 1 ano a um dos nossos aplicativos", uma vez por sessão. Quem chama é o `compartilhar.iniciar`.
  - `APPS_PREMIO`: a lista manual de apps do prêmio, escrita no core.
  - `codigo(email)`, `capturar()` e `codigoCapturado()`: o código de indicação que vai no link (`?ind=`) e o que fica guardado no aparelho de quem chegou por ele. O `criarEmpresa` grava esse código na empresa nova.
  - Para a página administrativa: `admin.indicacoes.listar(db)` (indicados e estado: aguardando, pode liberar, liberado ou inválida) e `admin.indicacoes.liberarPremio(db, empresaId, appId, por)`.
- **Exemplo:** `await FenixCore.admin.indicacoes.liberarPremio(db, idDoIndicado, "fenix-gestor-do-tempo", "fenicris@gmail.com");`
- **Cuidados:** confira os nomes e endereços em `APPS_PREMIO` antes de ligar a campanha. Com o banco desligado o aviso não aparece. O código só identifica quem indicou; quem confere a indicação é o administrador. A liberação só aceita indicado com licença em dia, ainda não premiado.

## Módulo `armazenamento` (onde guardar os dados)

- **O que é:** a pergunta "Onde guardar os seus dados?" (só neste aparelho ou na nuvem da Fênix) e o bloco para mudar a escolha depois. A escolha fica guardada no aparelho; não usa banco.
- **Para que serve:** o usuário decide onde ficam os dados e é avisado do risco de perdê-los se escolher só o aparelho.
- **Regras relacionadas:** 77 (onde guardar os dados), 44 (backup e lembrete), 57 (sincronia entre aparelhos), 71 e 69 (janela que não some sem querer, acessibilidade).
- **Principais funções:**
  - `iniciar({ app, nomeApp, temNuvem, modoAtual, container, aoMudar })`: a chamada que o app faz uma vez. Pergunta no primeiro acesso e, com `container`, desenha o bloco "Onde guardar meus dados" em Ajuda ou Configurações.
  - `modo(app)`, `nuvem(app)` e `escolheu(app)`: o app consulta antes de sincronizar. O padrão é `"local"`.
  - `perguntar(opcoes)` e `montarConfig(container, opcoes)`: só a janela ou só o bloco.
  - `definir(app, modo)`: grava a escolha. `AVISO_LOCAL`, `AVISO_NUVEM`, `AVISO_PARA_LOCAL` e `AVISO_PARA_NUVEM`: os textos oficiais.
- **Exemplo:** `const modo = await FenixCore.armazenamento.iniciar({ app: "fenix-gestor-do-tempo", nomeApp: "Gestor do Tempo", container: "#config", aoMudar: async (novo) => { /* iniciar, parar ou enviar a sincronia */ } });`
- **Cuidados:** o core não liga a sincronia sozinho; quem consulta `nuvem(app)` é o app. App que já usava a nuvem deve passar `modoAtual: "nuvem"`. Se a troca falhar (por exemplo, sem internet), a escolha não é gravada e o bloco avisa. Em outro aparelho a pergunta aparece de novo.

## Mapa rápido: preciso de... uso...

| Preciso de | Uso |
|---|---|
| Ligar o core no app | `init` ou `initFirebase` |
| Dados da Fênix e aviso do CPF | `EMPRESA`, `CPF_CNPJ_DISCLOSURE` |
| Validar e formatar CPF/CNPJ, nomes | Módulo de texto e documento |
| Campos que se formatam sozinhos | `mascaras` |
| Cadastro de clientes PF/PJ | `pessoas` |
| Dados da empresa na Receita | `pessoas.consultarCNPJ` |
| Endereço pelo CEP | `localidades` |
| Catálogo de produtos | `produtos` |
| Login, Google, excluir conta | `criarModuloAuth` |
| Empresa, convites e equipe | `criarModuloEmpresas`, `Convites`, `Equipe` |
| Dados do usuário na nuvem | `criarModuloDadosPessoais` |
| Mesmos dados em vários aparelhos | `criarSincronia` ou `criarModuloSincronia` |
| Aprovar quem entra | `criarModuloAcesso` |
| Teste de 15 dias e licença | `licenca` |
| Gerir clientes e colaboradores | `admin` (página `admin/fenix-admin.html`) |
| Backup e lembrete | `backup` |
| Tela Sobre e Changelog | `sobre` |
| Manual do usuário | `manual` |
| Indicadores clicáveis | `dashboard` |
| Selo de versão | `versoes` |
| Tema, som e animações | `preferencias`, `som` |
| Texto de usuário na tela | `seguranca` |
| Mudar o formato dos dados | `esquema` |
| Não perder o que está sendo editado | `saida` |
| Botão Compartilhar | `compartilhar` |
| Campanha Compartilhe e ganhe e prêmio | `indicacoes` |
| Perguntar onde guardar os dados (aparelho ou nuvem) | `armazenamento` |
