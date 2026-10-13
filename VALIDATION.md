# Verificação local — 13/10/2026

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
