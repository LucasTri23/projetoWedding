# Cultiva

Crescer, juntos. Identidade com duas folhas conectadas, disponível em `public/logo.svg`; o símbolo também aparece na interface e nos ícones da PWA.

Aplicação estática React + TypeScript para hábitos pessoais e compartilhados. Metas definem quantidade e periodicidade; agenda opcional define intenção de data; registros guardam o que aconteceu. Nenhuma atividade é distribuída automaticamente pela semana.

## Desenvolvimento

Requisitos: Node.js 22 ou superior e npm. Java 21 é necessário para os testes do emulador Firestore.

```sh
npm ci
cp .env.example .env
# Preencha .env com a configuração pública do aplicativo Web Firebase.
npm run dev
```

Sem configuração Firebase, a tela inicial apresenta instruções. Não há contas simuladas, banco alternativo ou dados fictícios. Os modelos são sugestões que só viram metas ao serem salvos.

## Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/) e registre um aplicativo Web.
2. Ative Authentication → Sign-in method → Email/password.
3. Crie um Cloud Firestore em modo de produção. Escolha a região conscientemente; ela não é alterada pelo aplicativo.
4. Copie os campos públicos do SDK para `.env`. Variáveis `VITE_` são visíveis no bundle. Nunca use credenciais administrativas ou service accounts.
5. Faça login na CLI e publique **somente regras e índices**:

```sh
npx firebase login
npx firebase deploy --only firestore:rules,firestore:indexes --project SEU_PROJECT_ID
```

6. Em Authentication → Settings → Authorized domains, adicione `localhost`, se necessário, e `SEU_USUARIO.github.io` (sem protocolo ou caminho). Domínio personalizado também precisa ser autorizado.
7. Configure o remetente, idioma e modelos de verificação de e-mail/redefinição de senha no Console.
8. Opcional: registre o aplicativo no App Check com reCAPTCHA Enterprise e defina `VITE_APP_CHECK_SITE_KEY`. Teste antes de ativar enforcement para Firestore e demais serviços suportados no Console. Não publique tokens de depuração.

O projeto não utiliza Firebase Hosting e não exige Node.js em produção.

## Contas e convites

Cada pessoa cria uma conta própria. O primeiro integrante cria o espaço no Perfil e gera um convite para o e-mail exato do segundo. O link possui 256 bits aleatórios, validade de 48 horas e não é enviado automaticamente. Compartilhe o link diretamente com a pessoa convidada.

A pessoa convidada deve verificar o e-mail, autenticar-se e aceitar no Perfil. O app atualiza o token antes de aceitar. Convite, membros do casal e perfil são atualizados por uma transação. As regras verificam o estado anterior e posterior via `getAfter`, e impedem aceites parciais, reutilizados, expirados, substituídos ou destinados a outro e-mail. Um novo convite substitui o anterior. Convites não permitem listagem.

Não há backend privilegiado para vinculação: a autorização acontece no backend Firestore pelas regras. O proprietário não pode adicionar outro UID diretamente. Casais têm no máximo dois integrantes. Separação/transferência/exclusão de contas não fazem parte desta versão e exigiriam um fluxo próprio de integridade e retenção.

## Dados e privacidade

| Coleção                 | Conteúdo e acesso                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users/{uid}`           | Perfil, preferências, fuso, metas ministeriais. Apenas titular.                                                                                                        |
| `couples/{id}`          | UIDs e nomes explícitos do espaço; membros e destinatário autenticado de convite vigente.                                                                              |
| `invitations/{token}`   | E-mail destinatário, expiração e estado; proprietário e destinatário verificado.                                                                                       |
| `goals/{id}`            | Quantidade, período, categoria, tipo, favorita e arquivo. Pessoais privadas; paralelas e compartilhadas visíveis ao casal. Apenas criador edita.                       |
| `activityLogs/{id}`     | Atividades, estudos profundos e ministério. Registros pessoais e paralelos privados; registros de metas compartilhadas visíveis ao casal. Apenas criador pode excluir. |
| `plans/{id}`            | Calendário privado ou compartilhado com participantes e início/término. Apenas criador edita ou exclui.                                                                |
| `sharedNotes/{id}`      | Notas, refeições, compras, revisão mensal e categorias personalizadas. Compartilhamento explícito. Criador edita/exclui.                                               |
| `referenceLibrary/{id}` | Links oficiais salvos pelo titular. Referências iniciais públicas ficam no código, sem cópia de publicações.                                                           |

Estudos, refeições e preferências foram consolidados em coleções com tipos para reduzir duplicação. Documentos usam responsável, casal quando aplicável e timestamps do servidor. `referenceLibrary` usa o identificador do documento Firestore como ID. Datas de atividade usam `YYYY-MM-DD` no fuso do perfil (padrão `America/Sao_Paulo`); agendamentos usam data e hora local. A semana vai de segunda a domingo. A meta anual ministerial usa **ano civil**. Não há conversão automática de metas em horas segundo modalidade.

Meta paralela: ambos veem a meta, mas cada um registra e lê seu próprio histórico. Meta compartilhada: um registro de uma atividade conjunta contribui para os dois. Não são gerados dois registros automaticamente. Registros repetidos de atividades realmente distintas no mesmo dia são permitidos. O casal deve combinar quem registra cada atividade conjunta.

O dashboard mostra progresso individual do titular e atividades explicitamente compartilhadas. No Perfil, cada pessoa pode publicar voluntariamente um resumo numérico do seu progresso, leitura, estudos, exercícios e horas ministeriais. O casal pode ler esse retrato em `sharedSummaries/{uid}`; os registros e observações continuam privados. A atualização é manual e a data aparece no dashboard. O titular pode parar de compartilhar, removendo o resumo do servidor; dados já visualizados pelo parceiro não podem ser retroativamente apagados de sua memória ou de exportações.

Não inclua dados de terceiros em notas ministeriais. Use descrições genéricas como “preparar próxima revisita”. Não existe ranking, competição, pontuação ou notificações push.

## Funcionalidades

- Dashboard com progresso real, comparação semanal, sequência bíblica, atividades compartilhadas e agenda.
- CRUD de metas com categorias personalizadas, periodicidade diária/semanal/mensal, quantidades, duração, favoritas, cópia e arquivamento.
- Registro de atividades sem agenda, exercícios e estudos com assunto/materiais/aplicações em campo estruturado por texto.
- Ministério individual: modalidade, metas configuráveis, horas, restante, projeção, histórico mensal e meta anual opcional.
- Agenda flexível e caderno com compras, refeições, conversas e revisão mensal.
- Calendário mensal compartilhado com início/término, participantes, filtros e edição. O módulo Ministério mostra esse mesmo calendário filtrado por categoria; programar não soma horas automaticamente.
- Hábitos livres com categorias Saúde, Financeiro ou uma categoria personalizada diretamente no formulário.
- Biblioteca com seis referências verificadas em 13/10/2026 e links oficiais personalizados.
- Relatórios por período/categoria/participante, evolução semanal/mensal, histórico e exclusão de registros. Exportação JSON dos dados disponíveis ao usuário e PDF via impressão do navegador.
- Layout responsivo, navegação inferior, modo escuro, diálogos nativos com foco contido, feedback e estados vazios.

## PWA e offline

O build gera manifest e service worker para cache dos arquivos estáticos. Firestore usa cache persistente com suporte a múltiplas abas. O SDK pode recorrer a memória em navegadores sem suporte. Autenticação inicial, recuperação de senha e transações de convites exigem internet. Escritas comuns podem ficar pendentes e serão validadas pelo servidor ao reconectar; sucesso local não garante aprovação futura pelas regras. O indicador offline deixa essa diferença explícita. Evite dispositivos compartilhados: a persistência conserva dados no navegador.

O ícone SVG atende navegadores compatíveis; os ícones PNG de 192/512 px são gerados pelo script `scripts/icons.mjs` para instalação em dispositivos que exigem raster. No iOS, use Compartilhar → Adicionar à Tela de Início; a disponibilidade de instalação depende do navegador e HTTPS.

## Validação

```sh
npm run lint
npm test
npm run build
npm run test:rules
```

Os testes de negócio verificam frequência flexível, virada de períodos/fuso, separação de paralelas, registro compartilhado, sequência e horas ministeriais. Os testes Firestore verificam perfis, criação atômica de casal, convite destinado/expirado/reutilizado/substituído, escalada de privilégios, isolamento, metas, registros e consultas. O workflow executa os dois conjuntos antes do deploy. Use apenas `demo-juntos` para testes, sem banco de produção.

Para desenvolvimento com emuladores, preencha `.env` com `VITE_FIREBASE_PROJECT_ID=demo-juntos` e valores de desenvolvimento para os outros campos obrigatórios; configure `VITE_USE_EMULATORS=true`. Em terminais separados execute:

```sh
npx firebase emulators:start --only auth,firestore --project demo-juntos
npm run dev
```

Verifique manualmente criação de conta, login/logout, recuperação de senha, dois perfis separados, verificação de e-mail, convite, registro compartilhado, meta paralela, reconexão e navegação por teclado antes de disponibilizar para uso real. As regras devem permanecer publicadas e os testes de emulador devem passar.

## GitHub Pages

1. Envie o projeto para seu repositório e use a branch `main`.
2. Settings → Pages → Source: **GitHub Actions**.
3. Settings → Secrets and variables → Actions → **Variables**: defina todos os campos públicos `VITE_FIREBASE_*` do `.env.example` e `VITE_APP_CHECK_SITE_KEY` se utilizado.
4. Faça push. `.github/workflows/pages.yml` instala, valida, testa regras, gera build e publica `dist`.

Vite detecta `GITHUB_REPOSITORY`: repositório `metas` gera base `/metas/`; repositório `usuario.github.io` gera `/`. Para build manual de repositório de projeto, defina `PAGES_BASE_PATH=/metas/`. Para domínio próprio, configure `PAGES_BASE_PATH=/` no passo de build e um arquivo `public/CNAME`. Rotas usam hash (`#/habitos`), evitando 404 na atualização. Não adicione configuração de Hosting Firebase.

## Arquitetura

`src/features/` contém os módulos de interface; `src/components/` contém elementos compartilhados; `src/lib/service.ts` concentra operações Firebase e transações; `context.tsx` mantém autenticação e assinaturas delimitadas por dono/casal; `business.ts` contém regras puras de períodos e progresso; `firestore.rules` é a fronteira de autorização. O SDK Firebase carrega somente configuração pública.

O projeto privilegia componentes HTML acessíveis e CSS/Tailwind, sem uma biblioteca adicional de componentes. Não há armazenamento de senhas, administrador frontend ou fallback de produção para dados locais. Alterações e registros dependem exclusivamente do Firebase.
