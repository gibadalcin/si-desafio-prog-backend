# Backend - Sistema de Matrículas

Este repositório contém o backend da aplicação de Matrículas. O projeto usa Node.js, Express e Knex. Em desenvolvimento utilizamos SQLite (arquivo local) — conforme combinado, não é necessário um banco de dados externo.

Este README descreve como o desenvolvedor front-end pode rodar o backend localmente, testar os endpoints e integrar a aplicação front.

## Enunciado do tema proposto no desafio

Sistema de atendimento e matrículas. Nesse tipo de sistema, é importante que se tenha a visão institucional e a visão do aluno. Os responsáveis pela instituição devem montar ofertas de turmas. Os alunos podem se matricular nas turmas. As turmas são compostas por: alunos, professor e uma disciplina. As turmas devem ser ofertadas num horário/turno e dia da semana, por exemplo, 21 é segunda-feira (2) de manhã (1), assim como 33 é terça-feira (3) de noite (3), ... Outros requisitos podem ser propostos pelo desenvolvedor, como: montagem da grade de ofertas, gerenciamento de pré-requisitos, controle de alocação de professores (mantendo uma carga balanceada de alocação) e etc.

## Requisitos iniciais — o que está implementado e como testar

Abaixo descrevemos, de forma objetiva, cada requisito inicial do sistema de atendimento e matrículas e como ele já está atendido neste backend.

- Visão institucional vs visão do aluno
	- Implementação: existe controle de papéis/roles (`ADMIN`, `PROFESSOR`, `ALUNO`) e middleware de autenticação/autorização que garante rotas protegidas.
	- Teste rápido: crie/entre com usuário `ADMIN` e `ALUNO` e compare respostas às rotas protegidas.

- Montagem de ofertas de turmas (responsáveis da instituição)
	- Implementação: endpoints para CRUD de turmas (`POST /api/turmas`, `PUT /api/turmas`, `DELETE /api/turmas`) restritos a ADMIN; validações no serviço asseguram disciplina, horário e professor válidos.
	- Teste rápido: logue como ADMIN e use `POST /api/turmas` para criar uma oferta.

- Matrícula de alunos nas turmas
	- Implementação: endpoint `POST /api/matriculas` disponível para ALUNO; a matricula é transacional (lock + decremento de vagas) e valida conflito de horário do aluno.
	- Teste rápido: crie turma com vagas limitadas e realize múltiplas requisições de matrícula (veja testes de concorrência em `test/`).

- Composição da turma (alunos, professor, disciplina)
	- Implementação: modelo relacional: `turmas` referencia `disciplinas` e `usuarios` (professor); `matriculas` relaciona alunos às turmas. Seeds e endpoints permitem popular e consultar essas relações.

- Horário / turno / dia da semana
	- Implementação: tabela `horarios` com campos `dia` e `turno`; regras no serviço (`turmaService`) evitam conflitos de professor em mesmo horário. Exemplo de uso: `dia=2, turno=1` representa segunda-feira de manhã (código conceitual 21).

- Requisitos opcionais (não implementados neste MVP)
	- Montagem automatizada de grade de ofertas (endpoint agregado) — não implementado, pode ser feito via query agregada.
	- Gerenciamento de pré-requisitos entre disciplinas — não implementado.
	- Heurística de balanceamento de carga de professores — não implementado.

Observação: onde aplicável, há proteção adicional a nível de banco (constraints e índices). Por exemplo, existe constraint única (professor_id + horario_id) para evitar alocação dupla do mesmo professor no mesmo horário.

## Rápido resumo (para o front-end)

- Base URL local: `http://localhost:3000`
- Autenticação: endpoints em `/api/auth` — `POST /api/auth/login` retorna `{ accessToken, refreshToken }`.
- Use o header `Authorization: Bearer <accessToken>` para acessar rotas protegidas (por exemplo `/api/turmas`).
- Refresh token: `POST /api/auth/refresh` (envia `{ refreshToken }`) — o backend implementa rotação do refresh token.
- CORS: liberado por padrão (o servidor usa `cors()` sem restrições). O front-end pode chamar direto de `localhost`.

## Pré-requisitos (dev)

- Node.js (recomenda-se v16+)
- npm

## Instalação e inicialização (dev)

No PowerShell, dentro da pasta `backend`:

```powershell
npm install
```

Executar migrações e seeds (SQLite local, sem servidor externo):

```powershell
roda automático ao iniciar a api: npm start

ou rodar independente:
npm run migrate   # roda knex migrate:latest
npm run seed      # roda knex seed:run
```

### Variáveis de ambiente (.env)

Antes de iniciar a API, crie um arquivo `.env` local a partir do exemplo fornecido (`.env.example`). Por segurança, **não** comite seu `.env` com segredos reais.

PowerShell (Windows):

```powershell
Copy-Item .env.example .env
```

Bash / macOS / WSL:

```bash
cp .env.example .env
```

Depois de copiar, edite `.env` e ajuste `JWT_SECRET`, `DATABASE_FILENAME` e outras variáveis conforme necessário.


Iniciar a API:

```powershell
npm run dev   # ou: npm start
```

Se a porta 3000 já estiver sendo usada, o servidor tenta retries; em ambiente dev você pode habilitar fallback para porta ephem definindo `DEV_PORT_FALLBACK=1` no `.env`.

## Endpoints úteis (exemplos)

Observação: abaixo há exemplos em PowerShell (Invoke-RestMethod) e em cURL/Fetch para referência do front-end.

1) Health check (pública)

PowerShell:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/ -Method GET | ConvertTo-Json
```

cURL:

```bash
curl http://localhost:3000/
```

2) Login — obter access + refresh token

PowerShell (exemplo):

```powershell
$body = @{ email='teste@mail.com'; senha='12345' } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json
```

cURL:

```bash
curl -X POST http://localhost:3000/api/auth/login \
	-H "Content-Type: application/json" \
	-d '{"email":"teste@mail.com","senha":"12345"}'
```

Resposta (exemplo):

```json
{
	"accessToken": "eyJhbGci...",
	"refreshToken": "c29tZS1vcGFxdWUtc3RyaW5n",
	"user": { "id": 1, "email": "teste@mail.com", "roles": ["ADMIN"] }
}
```

3) Usar o access token nas requisições protegidas

Header HTTP: `Authorization: Bearer <accessToken>`

PowerShell (listar turmas — rota protegida):

```powershell
$token = '<ACCESS_TOKEN_AQUI>'
Invoke-RestMethod -Uri http://localhost:3000/api/turmas -Method GET -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json
```

cURL:

```bash
curl http://localhost:3000/api/turmas -H "Authorization: Bearer <ACCESS_TOKEN_AQUI>"
```

Fetch (exemplo front-end, vanilla JS):

```javascript
// após login
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);

const resp = await fetch('http://localhost:3000/api/disciplinas', {
	headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
});
const disciplinas = await resp.json();
```

Axios (exemplo):

```javascript
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000' });
api.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;

const resp = await api.get('/api/disciplinas');
```

4) Refresh token — trocar quando o access token expirar

PowerShell:

```powershell
$body = @{ refreshToken = '<REFRESH_TOKEN>' } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/auth/refresh -Method POST -Body $body -ContentType 'application/json' | ConvertTo-Json
```

cURL:

```bash
curl -X POST http://localhost:3000/api/auth/refresh -H "Content-Type: application/json" -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

Resposta: novo `{ accessToken, refreshToken }` (o backend faz rotação segura do refresh token).

5) Exemplo de criar uma turma (rota protegida — necessita papel ADMIN)

PowerShell:

```powershell
$token = '<ACCESS_TOKEN_ADMIN>'
# Inclua o professor_id (ID do usuário com papel PROFESSOR) e o campo 'vagas'
$body = @{ codigo='TURMA2025A'; disciplina_id=1; horario_id=1; professor_id=3; vagas=40 } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/turmas -Method POST -Headers @{ Authorization = "Bearer $token" } -Body $body -ContentType 'application/json' | ConvertTo-Json
```

Se a conta utilizada não for ADMIN, o servidor retornará 403 (forbidden).

## Dicas de integração para o front-end

- O servidor já habilita CORS sem restrições para simplificar o desenvolvimento local. Em produção, restrinja as origens permitidas.
- Guarde o `accessToken` em memória ou em um storage seguro (ex.: memory store, ou httpOnly cookie via backend se for possível alterar o fluxo). Evite armazenar tokens de longa vida no localStorage sem considerar XSS.
- Use o `refreshToken` para obter novos `accessToken` quando receber 401 do servidor. A API implementa rotação de refresh tokens (o refresh antigo é revogado e substituído por um novo), então atualize o storage com os novos tokens retornados.
- Para chamadas protegidas em SPA, implemente um interceptor (Axios/fetch wrapper) que, ao receber 401, tenta `POST /api/auth/refresh` com o refreshToken e repete a requisição original em caso de sucesso.

## Banco de dados (nota importante do professor)

Conforme solicitado, mantemos SQLite no desenvolvimento — não é necessário um servidor de banco de dados externo para rodar localmente. O arquivo padrão é `dev.sqlite3` (ou o que estiver em `DATABASE_FILENAME` no `.env`).

Para recriar o banco (migrations + seeds):

```powershell
# apagar arquivo sqlite (se quiser começar do zero)
Remove-Item .\\dev.sqlite3 -ErrorAction SilentlyContinue
npm run migrate
npm run seed
```

## Endpoints e contratos principais

- `POST /api/auth/login` — body: `{ email, senha }` → retorna `{ accessToken, refreshToken, user }`
- `POST /api/auth/refresh` — body: `{ refreshToken }` → retorna `{ accessToken, refreshToken }`
- `GET /api/disciplinas` — lista disciplinas (pública)
- `GET /api/horarios` — lista horários (pública)
- `GET /api/turmas` — protegida (precisa de token)
- `POST /api/turmas` — protegida + ADMIN
- `POST /api/matriculas` — protegida (para matricular um aluno)

Para documentação completa consulte as rotas com Swagger UI enquanto o servidor estiver rodando:

- Abra: http://localhost:3000/api-docs

Exportar/usar a especificação OpenAPI (JSON)
-----------------------------------------

Além da UI, o JSON da especificação OpenAPI está disponível em:

- http://localhost:3000/api-docs.json

Esse arquivo pode ser importado pelo Postman ou por ferramentas de CI para validar contratos.

Coleção Postman incluída
------------------------

Há duas coleções Postman no diretório `dev/` para uso local:

- `dev/postman_collection.json` — coleção principal com endpoints úteis para desenvolvimento.
- `dev/postman_collection.capacity.json` — fluxo de teste de capacidade (CRIAR turma com 2 vagas e tentar matricular 3 alunos).

Para importar no Postman: File → Import → selecione o JSON correspondente ou use a URL `http://localhost:3000/api-docs.json` para criar requests automaticamente.


Observações rápidas:

- Todos os endpoints protegidos exigem o header `Authorization: Bearer <accessToken>`.
- Para rotas que exigem papel ADMIN, use credenciais de um usuário com `roles` contendo `ADMIN`.
- Se estiver usando o Postman collection importado, há variáveis de ambiente pré-definidas (`baseUrl`, `accessToken`, `refreshToken`) que facilitam os testes.


Importando e usando as coleções Postman (passo-a-passo)
-----------------------------------------------------

1) Abra o Postman.
2) Clique em File → Import → selecione a aba "File" e carregue um dos arquivos:
	- `dev/postman_collection.json` — coleção principal com requests úteis;
	- `dev/postman_collection.capacity.json` — fluxo de teste de capacidade (cria turma com 2 vagas e tenta matricular 3 alunos).
	- Ou cole a URL `http://localhost:3000/api-docs.json` na aba "Link" para gerar a collection a partir do OpenAPI.
3) Após importar, crie/edite um Environment no Postman com as variáveis usadas pela coleção (ex.: `baseUrl`, `accessToken`, `refreshToken`).
	- `baseUrl` normalmente: `http://localhost:3000`.
	- `accessToken`/`refreshToken`: deixe em branco até fazer login com um usuário (use o request `Auth → Login` e copie o token para a variável do Environment).
4) Teste manualmente um fluxo simples:
	- Primeiro: execute `Auth → Login` com credenciais de um usuário ADMIN (ou registre/insira via seed);
	- Copie o `accessToken` retornado para a variável `accessToken` do Environment;
	- Execute `Public → POST Turma (ADMIN)` para criar uma turma (ou use `Turmas → POST Turma (ADMIN)`).
5) Para rodar o teste de capacidade automaticamente:
	- Abra a coleção `Sistema Matrículas - Capacity Test` importada (ou importe `dev/postman_collection.capacity.json`).
	- Clique em "Runner" (Collection Runner), selecione a collection, o Environment correto e clique em "Run".

Dica rápida: para regenerar o OpenAPI JSON localmente (útil antes de importar por link), execute no terminal:

```powershell
cd backend
npm run openapi:export
# o arquivo será gerado em docs/openapi.json
```

### Credenciais criadas pelos seeds

Ao executar `npm run seed` o projeto insere alguns usuários de exemplo. Use as credenciais abaixo para testar rapidamente:

- Admin / Aluno (user de teste):

```text
email: teste@mail.com
senha: 12345
roles: [ADMIN, ALUNO]
```

- Professores (senha comum nos seeds):

```text
email: professor1@mail.com  — senha: prof123  — nome seed: Prof. Ana Silva
email: professor2@mail.com  — senha: prof123  — nome seed: Prof. Bruno Costa
email: professor3@mail.com  — senha: prof123  — nome seed: Prof. Carla Lima
```

Observação: as senhas nos seeds são hashes gerados com `bcrypt`; os valores acima são as senhas em texto plano usadas durante a criação (úteis para testes locais). Se você alterar `SALT_ROUNDS` ou modificar os seeds, atualize estes exemplos.


## Exemplos práticos de payloads (JSON)

Abaixo há exemplos práticos de payloads que você pode usar nas requisições (copiar/colar no Postman ou em Fetch/Axios).

- Login (obter accessToken / refreshToken)

```json
{
	"email": "teste@mail.com",
	"senha": "12345"
}
```

- Criar usuário professor (apenas ADMIN)

```json
{
	"nome": "João Silva",
	"email": "joao.silva@instituicao.edu",
	"senha": "senhaSegura123",
	"roles": ["PROFESSOR"]
}
```

- Criar disciplina (ADMIN)

```json
{
	"codigo": "MAT101",
	"nome": "Cálculo I",
	"descricao": "Introdução ao cálculo diferencial"
}
```

- Criar turma (ADMIN) — exemplo de body para `POST /api/turmas`

```json
{
	"codigo": "TURMA2025A",
	"disciplina_id": 1,
	"horario_id": 2,
	"professor_id": 3,
	"vagas": 40
}
```

- Matricular aluno (ALUNO) — `POST /api/matriculas`

```json
{
	"turma_id": 10
}
```

## Troubleshooting rápido: porta ocupada (EADDRINUSE)

Se ao iniciar o servidor aparecer `EADDRINUSE`, veja qual processo está usando a porta 3000 e finalize-o (somente se for um processo seu):

```powershell
netstat -ano | findstr :3000
# obtém PID => tasklist /FI "PID eq <PID>"
# matar (se for seu processo): taskkill /PID <PID> /F
```

---

## Checklist de pré-start (rápido)

Use este checklist antes de iniciar a API localmente. Os comandos abaixo funcionam no diretório `backend`.

- 1) Instalar dependências

PowerShell:

```powershell
npm install
```

Bash:

```bash
npm install
```

- 2) Criar `.env` a partir do exemplo

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash / macOS / WSL:

```bash
cp .env.example .env
```

- 3) Ajustar variáveis do `.env` (p.ex. `JWT_SECRET`, `DATABASE_FILENAME`, `PORT`)

- 4) Rodar migrations

```powershell
npm run migrate
```

- 5) Rodar seeds para popular dados de teste

```powershell
npm run seed
```

- 6) Iniciar a API (modo dev ou produção simples)

Modo desenvolvimento (recarregamento):

```powershell
npm run dev
```

Modo produção simples:

```powershell
npm start
```

Opcional: exportar OpenAPI JSON antes de importar no Postman

```powershell
npm run openapi:export
# gera docs/openapi.json
```

Depois de seguir o checklist você deverá conseguir acessar `http://localhost:3000` e usar os endpoints documentados em `/api-docs`.

