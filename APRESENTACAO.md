## Apresentação do código — Sistema de Matrículas

Este documento sumariza a estrutura do backend, os fluxos críticos, decisões arquiteturais e pontos importantes por arquivo (em Português). Serve para apresentar o código a avaliadores ou novos colaboradores.

## Visão geral

- Tecnologias: Node.js (ESM) + Express, Knex.js (SQLite por padrão), JWT para autenticação, bcryptjs para senha.
- Estrutura: controllers → services → repositories → database (migrations/seeds). Middlewares para autenticação/autorização e validação de request.
- Padrões: responsabilidades separadas — controllers tratam HTTP, services regras de negócio, repositories acesso ao DB e objetos de domínio em `src/domain`.

## Contrato / pontos críticos (inputs/outputs)
- Autenticação: rota `POST /api/auth/login` retorna { accessToken, refreshToken, user } onde `user` contém { id, email, roles } (roles = array de strings).
- Registro: `POST /api/usuarios/register` cria usuário (self-registration).
- Matrícula: `POST /api/matriculas` (autenticado como ALUNO) tenta fazer matrícula de forma transacional; garante atomicidade, bloqueio da linha da turma (SELECT FOR UPDATE), verificação de conflito de horário, decremento de vagas.
- Deleção de matrícula: `DELETE /api/matriculas/:id` restaura vaga da turma dentro de transação; controller responde 204 sem body se removido com sucesso, 404 se não existe.

## Arquitetura de pastas (resumo)
- `src/controllers` — handlers HTTP e documentação OpenAPI/Swagger via comentários.
- `src/services` — regras de negócio (validações, checagens, transações).
- `src/repositories` — camada de acesso ao banco usando Knex; retorna instâncias de domínio (classes em `src/domain`).
- `src/middlewares` — `authMiddleware.js` (authenticate, authorize, authorizeOrTurmaOwner) e `validationMiddleware.js`.
- `src/security` — `jwtUtils.js` (geração/validação de tokens), `passwordUtils.js` (hash/compare).
- `src/config` — `db.js` (instância Knex) e `swagger.js` (setup e export do OpenAPI).
- `src/migrations` e `src/seeds` — scripts para criar esquema e inserir dados de exemplo, incluindo roles e usuários de teste.

## Pontos importantes por arquivo (destaco responsabilidades e observações)

### Controllers
- `src/controllers/authController.js`
  - Rota: `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/whoami`.
  - Observação: `refresh` rota rotaciona refresh token (hash no DB) e emite novo accessToken + novo refresh.

- `src/controllers/usuarioController.js`
  - Rota pública de registro: `POST /api/usuarios/register` (atenção: muitas tentativas de uso incorreto usaram `/api/usuarios`).
  - Endpoints administrativos para atribuir/remover roles e listar usuários; controla permissão (controllers delegam a service para ações).
  - `getProfessorTurmas` valida se o requester é ADMIN ou o próprio professor antes de retornar turmas.

- `src/controllers/matriculaController.js`
  - `enroll` delega para `matriculaService.enroll` (transacional).
  - `remove` foi ajustado para checar o retorno do service (número de linhas removidas) — retorna 404 quando nada é removido e 204 sem corpo quando removido.
  - `getById` e `update` aplicam lógica de autorização (ADMIN vs owner) e usam `matriculaService`.

- `src/controllers/turmaController.js`, `disciplinaController.js`, `horarioController.js`
  - Tratam validações simples e retornos HTTP; erros de negócio vindos dos services são propagados (ex.: conflitos 409).

### Services
- `src/services/authService.js`
  - Faz login, valida senha com `passwordUtils.comparePassword`, constrói payload do token com `roles` (extraído do usuário). Gera access + refresh token e grava hash do refresh token em `refresh_tokens`.
  - Observação: o payload do JWT inclui todas as roles do usuário no momento do login, portanto se um usuário tem `['ADMIN','ALUNO']` o token permitirá ações que exigem qualquer uma dessas roles.

- `src/services/usuarioService.js`
  - Criação de usuários (hash de senha), associação de roles (via `usuarioRepository.addRole`), invalidação de refresh tokens ao atribuir role (incrementa `token_version` e remove refresh tokens antigos).

- `src/services/matriculaService.js`
  - Fluxo transacional: valida role ALUNO, verifica matrícula já existente, faz SELECT FOR UPDATE na turma, checa conflito de horário, decrementa vaga e cria matrícula na mesma transação.
  - `remove` incrementa vaga de volta e deleta matrícula dentro da transação; retorna o número de linhas deletadas.
  - Importante para concorrência: uso de transação + forUpdate evita oversubscription.

- `src/services/turmaService.js` / `disciplinaService.js` / `horarioService.js`
  - Regras de validação: existência de entidades relacionadas, unicidade de códigos, conflitos de horário do professor, proibição de exclusão quando houver dependências (ex.: turmas com matrículas).

### Repositories
- `src/repositories/*` — encapsulam consultas Knex; retornam instâncias das classes de domínio (`src/domain`).
- `usuarioRepository.findByEmail` agrega roles a partir da tabela `usuario_roles` quando possível — por isso o `user.roles` no login pode conter todas as roles.
- `refreshTokensRepository` armazena hash do token (sha256) em `refresh_tokens` e oferece rotação/revogação.

### Domain
- `src/domain/*.js` — classes simples que modelam as entidades (Disciplina, Horario, Turma, Matricula, Usuario). Contêm helpers como `hasVagas()`, `ocuparVaga()`, `isActive()`.
- Útil para serialização e para encapsular regras simples — a maior parte da lógica permanece nos services.

### Middlewares de autorização
- `src/middlewares/authMiddleware.js`
  - `authenticate` decodifica o JWT e injeta `req.user` (payload). Se invalidado/expirado, responde 403.
  - `authorize(requiredRoles)` verifica se *alguma* das roles do usuário está presente (behavior: OR entre roles requisitadas). Importante: se requisitar ['ADMIN'] e o usuário tiver ['ALUNO','ADMIN'] acesso será concedido.
  - `authorizeOrTurmaOwner` permite ADMIN ou o PROFESSOR dono da turma; usado para operações de atualização de turma.

### Validators
- `src/validators/*` usam `express-validator` para checagens declarativas e são usados nas rotas antes do `validationMiddleware`.

### Config
- `src/config/db.js` — instancia o Knex com `knexfile.js`.
- `src/config/swagger.js` — constrói `swaggerSpec` via `swagger-jsdoc` e monta `/api-docs` + `/api-docs.json`.

### Migrations/Seeds
- `src/migrations/` — esquema principal: `usuarios`, `roles`, `usuario_roles`, `disciplinas`, `horarios`, `turmas`, `matriculas`, `refresh_tokens`, etc.
- `src/seeds/00_roles.js` cria roles: `ADMIN`, `PROFESSOR`, `ALUNO`.
- `src/seeds/01_users.js` insere um usuário de teste `teste@mail.com` com senha `12345` e roles `['ADMIN','ALUNO']` (por isso o token desse usuário carrega ambas as roles).
- Seeds extras adicionam professores, turmas e dados auxiliares.

## Como rodar localmente
1. Copie `.env.example` para `.env` e ajuste variáveis (JWT_SECRET, DATABASE_CLIENT, DATABASE_FILENAME se quiser um DB persistente).
2. Instale dependências:
   - npm install
3. Rodar migrações e seeds:
   - npm run migrate
   - npm run seed
   (ou `npm run start:dev` que chama migrate + seed antes de iniciar)
4. Iniciar servidor:
   - npm run dev
5. Acesse docs em: http://localhost:3000/api-docs

## Comportamento de tokens / roles (esclarecimento)
- O payload do access token contém `roles` (array). O middleware `authorize(['ADMIN'])` verifica se o array do token inclui `ADMIN` — portanto o token permite ações caso possua *qualquer* role necessária.
- Se um usuário recebeu múltiplas roles via seed (ex.: `['ADMIN','ALUNO']`), o token do login apresentará ambas as roles e esse usuário poderá acessar rotas protegidas por qualquer uma delas.
- Recomenda-se criar contas de teste com roles isoladas quando quiser validar permissões específicas (ex.: apenas `ALUNO`).

## Observações de segurança e operação
- Mantenha `JWT_SECRET` e outras chaves em `.env` e fora do código.
- Refresh tokens são armazenados no DB como hash (sha256) — boa prática para segurança.
- Ao modificar roles em runtime (atribuir ou remover roles), o service incrementa `token_version` e revoga refresh tokens — isso ajuda a invalidar tokens antigos.
- Concorrência: `matriculaService.enroll` usa transação com `forUpdate` para evitar oversubscription — teste de carga deve validar esse comportamento.

## Próximos passos sugeridos (baixa complexidade)
- Adicionar testes unitários/integração para cenários de concorrência de matrícula (já existem alguns scripts de teste; revisar e ampliar).
- Normalizar o modelo de roles retornado: garantir sempre um array (atualmente há parsing condicional de JSON string em alguns pontos).
- Adicionar logs estruturados para auditoria de operações sensíveis (atribuição de roles, exclusões).

## Contato / notas finais
- Arquivos centrais para revisão inicial: `src/services/matriculaService.js`, `src/middlewares/authMiddleware.js`, `src/repositories/usuarioRepository.js`, `src/controllers/usuarioController.js`.
- Se desejar, eu posso:
  - (a) Gerar comentários inline adicionais nos arquivos (edições no repositório).
  - (b) Rodar verificações automatizadas (linters/testes) e corrigir eventuais falhas.
  - (c) Gerar um diagrama simples de fluxo (matrícula) ou checklist de testes para concorrência.

---
Documento gerado automaticamente por análise do repositório em 2025-11-02.
