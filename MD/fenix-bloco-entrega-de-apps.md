# Bloco de entrega de apps Fênix (v5.6)

Cole este bloco no começo do chat de cada app, junto com o pacote da biblioteca (.zip) anexado.

## Antes de começar
1. Use o Livro das Regras e o Guia da biblioteca ANEXADOS (a versão do pacote). Se não conseguir abrir os endereços do GitHub Pages, diga isso e peça os arquivos; nunca trabalhe de memória (regra 73).
2. Confirme comigo a Ficha de aplicação (grupos A a J) antes de construir.

## Toda entrega de app (novo, alterado ou trazido ao padrão)
- Arquivo com a versão no nome: `fenix-nome-do-app-vX.X.html` (sequência 1.0, 1.1 ... 1.9, 2.0; nunca pule versão).
- Cópia IDÊNTICA sem versão no nome: `index.html` (é a que vai para o GitHub Pages).
- Quando houver mais de um arquivo (app e cópias, manual MD e PDF, service worker, ícones, pastas): também um `.zip` com tudo e um `LEIAME.txt` dizendo o que vai em cada pasta, além dos arquivos soltos.
- Versão visível no rodapé e selo `v | c` (versão do app e do core).
- Changelog e Manual (MD e PDF) atualizados.
- Botão Compartilhar (regra 74): `FenixCore.compartilhar.iniciar({ nomeApp, url, email, container })` uma vez, depois do `init`. O aviso "Compartilhe e ganhe" (regra 75) vem do core, quando o Cristiano liga a campanha; o app não escreve nada dele.
- Onde guardar os dados (regra 77): `FenixCore.armazenamento.iniciar({ app, nomeApp, temNuvem, modoAtual, container, aoMudar })` uma vez, depois do `init`: pergunta no primeiro acesso (padrão: só neste aparelho, com o aviso de perda de dados) e deixa mudar em Ajuda ou Configurações; o app só sincroniza se `armazenamento.nuvem(app)` for verdadeiro.
- Teste de fumaça e a versão de volta informada.

## Última linha de TODA entrega (obrigatória)
> Conferência de entrega: versão no nome: sim/não | index.html: sim/não | zip com LEIAME: sim/não/não se aplica | selo: sim/não | Changelog e Manual: sim/não | teste de fumaça: sim/não | versão de volta: vX.X | botão Compartilhar: sim/não | onde guardar os dados: sim/não

Todo "não" vem com o motivo. Sem essa linha, a entrega está incompleta.
