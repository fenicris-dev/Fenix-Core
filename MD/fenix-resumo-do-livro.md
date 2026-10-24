# RESUMO DO LIVRO DAS REGRAS FÊNIX (v4.8)

Uma folha para começar. Ela diz **quais regras valem em cada tipo de trabalho**. Os detalhes de cada regra estão no Livro das Regras; o que cada função do core faz está no Guia da biblioteca. Se o resumo e o livro divergirem, vale o livro.

Endereço base: https://fenicris-dev.github.io/Fenix-Core/

## 1. Vale sempre, em qualquer entrega

- **Versão:** sobe a cada alteração, sem pular número, com uma casa decimal; declare a versão no texto da entrega (regras 7 a 9).
- **Nome e cópias:** `fenix-nome-do-app-vX.X.html` mais a cópia neutra sem versão; tudo que tem versão sai em duas cópias; mais de um arquivo leva também um `.zip` com `LEIAME.txt` (regras 10 e 11).
- **Core:** o app carrega o `fenix-core.js` oficial, com o banco desligado até eu dar o sinal (regras 1 e 2). Nada de cópia do core dentro do app.
- **Selo:** `fenix-livro` e `fenix-ficha` no `<head>` (regra 53) e o selo de versões `v3.2 | c 4.8` (regra 61).
- **Visual:** paleta, degradê, fundo, rodapé, águia e toque de 44 px (regras 14 a 22).
- **Splash, animações e preferências:** regras 32, 59 e 60.
- **Texto e formato:** mensagens em português claro, moeda `R$ 0.000,00`, datas `dd/mm/aaaa` (regras 21, 39 e 40).
- **Ajuda:** Changelog, Manual e tela Sobre dentro do app (regras 12 e 13).
- **Qualidade:** apagar exige digitar APAGAR; `node --check` igual a 0; teste em 360 px e sem internet (regras 47 a 51).
- **Guia atualizado** em todo pacote da biblioteca, em `.md` e `.docx`.

## 2. App novo

1. Preencha a Ficha comigo (regra 52) e pergunte sempre os grupos H (Google), I (tempo real) e J (tema escuro).
2. Use os templates oficiais de login, onboarding e splash (regras 23 a 32).
3. Cadastros de pessoas e CNPJ pelas funções do core, com máscaras (regras 33 a 43).
4. Backup, PDF padrão e dashboard clicável, conforme a Ficha (regras 44, 45 e 54).
5. Entregue conforme "Como entregar" e registre a Ficha no primeiro item do Changelog.

## 3. App antigo que eu trouxer (regra 55)

1. Leia o selo (regra 53) e preencha a Ficha comigo.
2. Faça o inventário (o que já cumpre e o que falta) e me mostre antes de mexer.
3. Proteja os dados: não mude nomes nem formato de chaves e coleções; se precisar, migração e backup antes.
4. Entregue em etapas testadas: core e selo; identidade; acesso; cadastros e máscaras; qualidade.
5. Cópia do core ou módulo embutido sai do app e entra a função do core. Depois, acrescente o app em "Apps já no padrão".

## 4. Só uma alteração pequena em app que já está no padrão

- Suba a versão, atualize o Changelog e o Manual se a tela mudou, mantenha o selo (o selo do livro só muda quando o livro for aplicado) e entregue com as duas cópias.
- Não mude visual nem comportamento que eu não pedi (regra 55f).

## 5. Quando o app tiver...

| Se o app tiver | Regras |
|---|---|
| Login | 23 a 32 e 56 |
| Google (só licença definitiva) | 56 e 58 |
| Sincronização entre aparelhos | 57 (teste com dois aparelhos) |
| Dados no aparelho | 44 (backup) |
| Banco ativo (Firestore) | 3, 4 e 46 (regras de segurança) |
| CPF, CNPJ, CEP ou telefone | 35, 37 e 38 (máscaras e consulta do CNPJ) |
| Pessoas cadastradas | 33, 34, 36, 41 e 42 |
| Produto ou equipamento | 43 |
| PDF | 45 |
| Dashboard | 54 |
| Tema escuro | 60 (grupo J) |

## 6. Biblioteca (core, templates, regras do Firestore)

- Livro, guia, resumo, core, `versao.json`, regras do Firestore, templates e documentos legais sobem juntos para o mesmo número (regra 7).
- O core só recebe acréscimos; nenhuma função é removida (regra 11).
- Antes de entregar: varredura de versões antigas em todos os arquivos, validação do JS e Painel em "Testar tudo".
- Regras do Firestore: rode os testes de `testes-regras/` no seu computador, copie as regras atuais para um backup, teste no Playground e só então publique (regra 46).
- Depois de publicar: Painel em "Testar tudo" e o "Teste de aparelho" no celular.

## 7. Se algo conflitar

Avise e pergunte antes de executar (último item de "Como entregar").
