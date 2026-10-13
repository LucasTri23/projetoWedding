# Verificação local — 13/10/2026

## Atualização: leitura bíblica e adoração em família

- Lint e 32 testes locais passaram. Novos testes cobrem habilitação da aba por meta diária ativa, 66 livros/1189 capítulos, links e limites de capítulos, avanço sequencial e estrutura dos roteiros.
- A aba Leitura da Bíblia é condicional; a rota sem meta ativa redireciona para Hábitos. Há atalhos para definir uma leitura individual/paralela ou compartilhada.
- Leituras são registradas na coleção activityLogs existente, com texto identificando o capítulo e reflexões do usuário. A modalidade da meta determina a privacidade.
- Adoração em família oferece cinco temas com sínteses breves e perguntas originais. Anotações pessoais e conjuntas são guardadas em sharedNotes, usando as regras existentes.
- Livros e capítulos abrem links oficiais de compartilhamento no jw.org. Áudio, texto completo e disponibilidade permanecem no leitor oficial; não há player incorporado nem extração automática de publicações.
- Termos e recursos consultados: https://www.jw.org/pt/termos-de-uso/ e https://www.jw.org/pt/ajuda-online/como-usar-jw-org/biblia-estudo-tnm/.
- A ferramenta de navegador automatizado continua indisponível; a validação visual e os fluxos com duas contas precisam ser conferidos no ambiente configurado.

## Atualização: responsividade e recorrência

- 26 testes locais passaram, incluindo atividades únicas, intervalos diários/semanais, meses menores e bissextos, limite de um ano e exclusão das ocorrências futuras de uma série.
- Lint passou. Diálogos agora possuem margem automática explícita, rolagem interna, título acessível e bloqueio da rolagem do fundo. Formulários e controles se reorganizam em telas pequenas.
- A recorrência salva documentos normais na coleção plans em lote atômico; as ocorrências não geram conclusões ou horas ministeriais automaticamente. A estrutura das regras não foi alterada por esta funcionalidade.
- Referências oficiais e sugestões futuras estão em SUGESTOES-JW.md. Essas sugestões não foram acrescentadas como funcionalidades nesta atualização.
- A ferramenta de navegador automatizado continua indisponível; os ajustes visuais precisam ser conferidos em dispositivos reais após publicação.

## Atualização: calendário compartilhado

- Lint, build de produção e 18 testes locais passaram.
- As regras atualizadas compilaram e passaram em 12 simulações de leitura na API oficial Firebase Rules (titular, membro e usuário externo), sem gravar dados.
- O perfil e o vínculo no Firestore foram conferidos; o usuário confirmou que o acesso foi resolvido após verificar a conta.
- Calendário mensal: participantes, início/término, filtros, programação pessoal/compartilhada e edição pelo criador. Ministério exibe o mesmo calendário filtrado.
- Hábitos livres: nome, frequência, Saúde, Financeiro e categoria personalizada.
- As consultas aguardam a confirmação do vínculo; erros são identificados por módulo e permitem tentar novamente.
- Novas regras do calendário ainda NÃO publicadas: a revisão automática exige aprovação explícita para alterar permissões de escrita em produção.
- Os testes completos do emulador continuam pendentes pelo runtime Java incompleto; a suíte inclui as consultas exatas do aplicativo e segurança da edição de eventos.

## Registro da implementação inicial

- `npm run lint`: passou.
- `npm test`: 13 testes passaram (negócio, datas, privacidade dos cálculos e caminhos do GitHub Pages).
- `npm run build`: passou, com TypeScript estrito. Manifest, ícones, service worker e arquivos estáticos estão em `dist/`.
- O build informa o tamanho do chunk Firebase (aproximadamente 813 kB antes de gzip / 202 kB comprimido). Gráficos e relatórios usam carregamento por demanda.
- `npm run test:rules`: não concluído localmente. O Java não está no PATH. Foi encontrado um runtime Java 21 incluído no PDFsam, mas ele não contém `jdk.httpserver`, necessário ao emulador. O download de uma distribuição completa foi bloqueado pelo filtro corporativo. O runtime do PDF24 também não contém esse módulo. Nenhuma instalação do sistema foi alterada.
- 14 testes de autorização Firestore e 2 testes de autenticação estão preparados para o comando do emulador. O workflow usa Java 21 completo e exige a aprovação desses testes antes de publicar.
- Não houve verificação visual em navegador automatizado: essa ferramenta não está disponível nesta sessão.
- Firebase de produção não foi configurado, regras/índices não foram publicados e não houve deploy remoto. Isso depende do projeto Firebase e do repositório GitHub do usuário.

Antes de uso real, configure os serviços conforme o README, conclua os testes do emulador e faça a verificação manual de duas contas, convites, compartilhamento, responsividade, teclado e reconexão.
