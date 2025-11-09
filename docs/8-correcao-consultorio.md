# Correção: Erro 404 ao Cadastrar Consultórios

## 1. Resumo do Problema

O erro **"Not Found (404)"** ao cadastrar Consultórios no AlignWork ocorre quando o frontend React tenta fazer uma requisição HTTP para um endpoint que não existe ou não está acessível no backend FastAPI. Em aplicações React + FastAPI, este erro geralmente indica um **desalinhamento entre o caminho da URL chamada pelo frontend e a rota exposta pelo backend**.

### Causas Mais Prováveis para Este Projeto

Com base na arquitetura do AlignWork (frontend React + Vite; backend FastAPI com prefixos `/api` e `/v1`), as três causas mais prováveis são:

1. **Rota de Consultórios não implementada no backend**: O frontend chama `POST /consultorios`, mas o backend não possui um `APIRouter` para consultórios montado em `main.py`. As rotas existentes (`appointments`, `patients`, `auth`) seguem o padrão `/api/v1/{recurso}`, enquanto consultórios pode estar ausente.

2. **Mismatch de path entre frontend e backend**: O frontend pode estar chamando `/consultorios` (sem prefixo `/api/v1/`), enquanto o backend espera `/api/v1/consultorios` ou `/api/v1/clinics` (se houver tradução pt-BR → en). Outras rotas do projeto usam `/api/v1/appointments/` e `/api/v1/patients`, indicando que consultórios deveria seguir o mesmo padrão.

3. **Trailing slash divergente ou método HTTP incorreto**: O FastAPI é sensível a trailing slashes (`/api/v1/consultorios` vs `/api/v1/consultorios/`). Se o frontend chama sem barra final mas o backend espera com barra (ou vice-versa), ou se o método HTTP está incorreto (`PUT` vs `POST`), ocorre 404.

### Contexto Técnico

- **Backend**: FastAPI com rotas montadas via `app.include_router(router, prefix="/api")` e routers com `APIRouter(prefix="/v1/{recurso}")`, resultando em URLs finais como `/api/v1/appointments/`.
- **Frontend**: Serviço `api.ts` constrói URLs como `${API_URL}${path}`, onde `API_URL` vem de `VITE_API_URL` (padrão: `http://localhost:8000`).
- **Autenticação**: Uso de cookies `httpOnly` com `credentials: 'include'`, então 404 não é causado por CORS (que retornaria erro diferente).

---

## 2. Reproduzindo o Erro

### Passos para Reproduzir Localmente

1. **Iniciar o backend**:
   ```bash
   cd backend
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Iniciar o frontend** (em outro terminal):
   ```bash
   npm run dev
   # ou
   yarn dev
   ```
   O frontend geralmente roda em `http://localhost:8080` (conforme `CORS` no `main.py`).

3. **Reproduzir o erro**:
   - Acesse `http://localhost:8080`
   - Faça login (se necessário)
   - Navegue para **Configurações → Consultórios**
   - Clique em **"Cadastrar consultório"**
   - Preencha o formulário (exemplo abaixo)
   - Clique em **"Confirmar"** ou **"Cadastrar"**
   - Observe o toast: **"Erro ao cadastrar — Not Found"**

### Teste Manual com curl/httpie

Para testar diretamente o endpoint esperado de criação de consultório:

#### Com curl:
```bash
# Teste 1: Tentar POST /consultorios (sem prefixo)
curl -X POST http://localhost:8000/consultorios \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "nome": "Consultório Centro",
    "estado": "SP",
    "cidade": "São Paulo",
    "cep": "01310-100",
    "rua": "Avenida Paulista",
    "numero": "1000",
    "bairro": "Bela Vista",
    "complemento": "Sala 101",
    "tenant_id": "seu-tenant-id"
  }'

# Teste 2: Tentar POST /api/v1/consultorios (com prefixo padrão)
curl -X POST http://localhost:8000/api/v1/consultorios \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "nome": "Consultório Centro",
    "estado": "SP",
    "cidade": "São Paulo",
    "cep": "01310-100",
    "rua": "Avenida Paulista",
    "numero": "1000",
    "bairro": "Bela Vista",
    "complemento": "Sala 101",
    "tenant_id": "seu-tenant-id"
  }'

# Teste 3: Tentar POST /api/v1/consultorios/ (com trailing slash)
curl -X POST http://localhost:8000/api/v1/consultorios/ \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "nome": "Consultório Centro",
    "estado": "SP",
    "cidade": "São Paulo",
    "cep": "01310-100",
    "rua": "Avenida Paulista",
    "numero": "1000",
    "bairro": "Bela Vista",
    "complemento": "Sala 101",
    "tenant_id": "seu-tenant-id"
  }'
```

#### Com httpie:
```bash
http POST http://localhost:8000/api/v1/consultorios \
  Content-Type:application/json \
  Cookie:session=... \
  nome="Consultório Centro" \
  estado="SP" \
  cidade="São Paulo" \
  cep="01310-100" \
  rua="Avenida Paulista" \
  numero="1000" \
  bairro="Bela Vista" \
  complemento="Sala 101" \
  tenant_id="seu-tenant-id"
```

**Resultado esperado**: Todos os testes acima retornarão `404 Not Found` se a rota não existir.

### Capturando a Chamada Real do Frontend

1. **Abra o DevTools** (F12 no navegador)
2. **Vá para a aba Network** (Rede)
3. **Limpe o log** (ícone de limpar)
4. **Reproduza o erro** (clique em "Cadastrar" no formulário)
5. **Localize a requisição** que falhou (geralmente destacada em vermelho)
6. **Clique na requisição** e anote:
   - **URL completa**: Ex.: `http://localhost:8000/consultorios`
   - **Método HTTP**: Deve ser `POST`
   - **Status**: `404 Not Found`
   - **Request Headers**: Verifique `Content-Type: application/json` e presença de `Cookie`
   - **Request Payload**: Copie o JSON enviado (deve conter `nome`, `estado`, `cidade`, `cep`, `rua`, `numero`, `bairro`, `tenant_id`, etc.)

### Ativando Logs do Uvicorn

Para verificar se o backend está recebendo a requisição e retornando "No route matches":

1. **Execute o backend com logs verbosos**:
   ```bash
   cd backend
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level debug
   ```

2. **Observe a saída do console** ao reproduzir o erro. Você verá algo como:
   ```
   INFO:     127.0.0.1:xxxxx - "POST /consultorios HTTP/1.1" 404 Not Found
   ```
   Ou, se o FastAPI não encontrar a rota:
   ```
   WARNING: No route matches /consultorios
   ```

3. **Verifique também o Swagger** (`http://localhost:8000/docs`) para ver quais rotas estão documentadas. Se `/api/v1/consultorios` não aparecer na lista, a rota não está montada.

---

## 3. Mapa de Rotas (Backend)

### Listando Todas as Rotas FastAPI

Para listar todas as rotas registradas no FastAPI, execute no console Python (ou crie um script temporário):

```python
# No diretório backend/
from main import app

# Listar todas as rotas
for route in app.routes:
    if hasattr(route, 'path') and hasattr(route, 'methods'):
        methods = [m for m in route.methods if m != 'HEAD']
        print(f"{', '.join(methods):<10} {route.path}")
```

**Resultado esperado** (exemplo):
```
GET         /
GET         /health
POST        /api/login
POST        /api/register
GET         /api/v1/appointments/
POST        /api/v1/appointments/
PATCH       /api/v1/appointments/{appointment_id}
GET         /api/v1/patients
POST        /api/v1/patients
...
```

**Se `/api/v1/consultorios` ou `/consultorios` não aparecer na lista, a rota não está implementada.**

### Verificando se a Rota Existe

#### Checklist de Validação:

1. **Existe `POST /v1/consultorios`?**
   - Verifique se há um arquivo `backend/routes/consultorios.py` (ou `clinics.py`, `offices.py`)

2. **Existe `/v1/clinics` ou `/v1/offices`?**
   - O backend pode usar nomenclatura em inglês. Verifique se há tradução pt-BR → en

3. **Há trailing slash?**
   - Compare: `/api/v1/consultorios` vs `/api/v1/consultorios/`
   - FastAPI trata como rotas diferentes

4. **Há prefixo `/api` no `include_router`?**
   - No `main.py`, verifique se há: `app.include_router(consultorios.router, prefix="/api")`
   - Se o router já tem `prefix="/v1/consultorios"`, a rota final será `/api/v1/consultorios`

### Localizando o Router de Consultórios

1. **Verifique se existe o arquivo de rotas**:
   ```bash
   ls backend/routes/
   # Deve listar: auth.py, appointments.py, patients.py
   # Se não houver consultorios.py (ou clinics.py), a rota não existe
   ```

2. **Se o arquivo existir, verifique o conteúdo**:
   - Abra `backend/routes/consultorios.py` (ou nome similar)
   - Procure por: `router = APIRouter(prefix="/v1/consultorios", ...)`
   - Verifique se há decorator `@router.post("/", ...)`

3. **Verifique se o router está montado no `main.py`**:
   - Abra `backend/main.py`
   - Procure por: `from routes import consultorios` (ou `clinics`, `offices`)
   - Procure por: `app.include_router(consultorios.router, prefix="/api")`
   - **Se essas linhas não existirem, a rota não está ativa**

### Checklist de Causas Comuns de 404 no FastAPI

Para este caso específico, verifique cada item:

- [ ] **1. Rota não incluída via `include_router` no `main.py`**
  - **Solução**: Adicionar `app.include_router(consultorios.router, prefix="/api")` em `main.py`

- [ ] **2. Prefixo divergente entre frontend e backend**
  - **Frontend chama**: `/consultorios` (sem `/api/v1/`)
  - **Backend expõe**: `/api/v1/consultorios`
  - **Solução**: Alinhar frontend para usar `/api/v1/consultorios` ou ajustar backend para aceitar `/consultorios`

- [ ] **3. Nomenclatura diferente (pt-BR vs en)**
  - **Frontend chama**: `/consultorios`
  - **Backend expõe**: `/api/v1/clinics` ou `/api/v1/offices`
  - **Solução**: Padronizar nomenclatura (recomendado: usar `/api/v1/consultorios` para manter pt-BR)

- [ ] **4. Trailing slash divergente**
  - **Frontend chama**: `/api/v1/consultorios` (sem barra)
  - **Backend expõe**: `/api/v1/consultorios/` (com barra)
  - **Solução**: Padronizar (recomendado: sem barra final, como em `/api/v1/patients`)

- [ ] **5. Método HTTP incorreto**
  - **Frontend envia**: `PUT` ou `GET`
  - **Backend espera**: `POST`
  - **Solução**: Verificar `useConsultorioMutations.ts` e garantir que usa `api.post()`

- [ ] **6. Rota condicionada a `Depends` (tenant/role)**
  - A rota pode existir, mas retornar 404 lógico se `tenant_id` estiver ausente ou inválido
  - **Solução**: Verificar dependências de autenticação/tenant no router

---

## 4. Mapa de Chamadas (Frontend)

### Localizando o Serviço/Fetch de Consultórios

O serviço responsável por Consultórios está localizado em:

- **Arquivo**: `src/hooks/useConsultorioMutations.ts`
- **Função de criação**: `createMutation` (linha ~21-45)
- **URL construída**: `api.post('/consultorios', ...)` (linha ~23)

### Verificando a URL Construída

1. **Abra `src/hooks/useConsultorioMutations.ts`**
2. **Localize a função `createMutation`**:
   ```typescript
   mutationFn: async (data: ConsultorioFormData) => {
     const response = await api.post('/consultorios', {
       ...data,
       tenant_id: tenantId
     });
     return response.data;
   }
   ```
3. **A URL final será**: `${API_URL}/consultorios`
   - Onde `API_URL` vem de `src/services/api.ts`: `import.meta.env.VITE_API_URL ?? "http://localhost:8000"`

### Verificando a Base URL

1. **Abra `src/services/api.ts`**
2. **Localize a constante `API_URL`** (linha ~10):
   ```typescript
   export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
   ```
3. **Verifique o arquivo `.env` ou `.env.local`** na raiz do projeto:
   ```bash
   cat .env
   # Ou
   cat .env.local
   ```
   - Procure por: `VITE_API_URL=http://localhost:8000`
   - Se não existir, o padrão `http://localhost:8000` será usado

4. **Verifique a porta do backend**:
   - O backend deve estar rodando na porta **8000** (conforme `main.py` linha ~90)
   - Se o frontend usar `VITE_API_URL=http://localhost:3000`, haverá mismatch

### Verificando o Caminho da Rota

1. **No `useConsultorioMutations.ts`, linha ~23**:
   - URL atual: `/consultorios` (sem prefixo `/api/v1/`)
   - Compare com outras rotas do projeto:
     - `fetchAppointments` usa: `/api/v1/appointments/` (com prefixo e trailing slash)
     - `fetchPatients` usa: `/api/v1/patients` (com prefixo, sem trailing slash)

2. **Conclusão**: O frontend está chamando `/consultorios`, mas deveria chamar `/api/v1/consultorios` para seguir o padrão do projeto.

### Verificando Método HTTP e Headers

1. **Método HTTP**: Verifique que `api.post()` está sendo usado (linha ~23 de `useConsultorioMutations.ts`)
2. **Headers**: Verifique `src/services/api.ts`:
   - `Content-Type: application/json` é adicionado automaticamente (linha ~43)
   - `credentials: 'include'` é adicionado automaticamente (linha ~48)
3. **Payload**: O payload inclui `tenant_id` automaticamente (linha ~25 de `useConsultorioMutations.ts`)

---

## 5. Diagnóstico Guiado (Passo a Passo)

Siga este fluxo decisório para isolar a causa em menos de 10 minutos:

### Passo 1: Confirmar URL Real Disparada pelo Frontend

1. Abra o DevTools (F12) → aba Network
2. Reproduza o erro (clique em "Cadastrar")
3. Anote a URL completa da requisição que retornou 404
   - Exemplo: `http://localhost:8000/consultorios`

### Passo 2: Comparar com o Mapa de Rotas do Backend

1. Execute o script Python para listar rotas (Seção 3.1)
2. Procure por rotas que contenham "consultorio", "clinic" ou "office"
3. **Se não encontrar nenhuma rota relacionada**:
   - **Causa identificada**: Rota não implementada no backend
   - **Ação**: Pule para a Seção 6 (Plano de Correção)

### Passo 3: Verificar Trailing Slash e Método HTTP

Se a rota existir no backend mas o frontend ainda retornar 404:

1. **Compare trailing slash**:
   - Frontend chama: `/consultorios` ou `/api/v1/consultorios`
   - Backend expõe: `/api/v1/consultorios` ou `/api/v1/consultorios/`
   - Se divergirem, essa é a causa

2. **Compare método HTTP**:
   - Frontend envia: `POST` (verifique no Network tab)
   - Backend espera: `POST` (verifique no decorator `@router.post(...)`)
   - Se divergirem, essa é a causa

### Passo 4: Verificar Dependências (Tenant/Role)

Se a rota existir e o path/método estiverem corretos:

1. **Verifique se a rota usa `Depends`**:
   - Abra o arquivo de rotas de consultórios (se existir)
   - Procure por: `Depends(get_current_user)` ou `Depends(get_tenant)`
   - Se houver, a rota pode retornar 404 lógico se o tenant não for encontrado

2. **Teste manualmente com curl incluindo cookie de sessão**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/consultorios \
     -H "Content-Type: application/json" \
     -H "Cookie: session=seu-cookie-aqui" \
     -d '{"nome": "Teste", "tenant_id": "seu-tenant-id", ...}'
   ```
   - Se retornar 401/403, o problema é autenticação (não 404)
   - Se retornar 404, o problema é a rota em si

### Passo 5: Validar Variáveis de Ambiente

1. **Verifique `VITE_API_URL` no frontend**:
   ```bash
   # No diretório raiz do projeto
   cat .env
   # Ou
   echo $VITE_API_URL
   ```
   - Deve ser: `http://localhost:8000` (ou a porta onde o backend está rodando)

2. **Verifique a porta do backend**:
   - No `main.py`, linha ~90: `uvicorn.run(app, host="0.0.0.0", port=8000)`
   - Confirme que o backend está rodando na porta 8000

3. **Teste conectividade**:
   ```bash
   curl http://localhost:8000/health
   # Deve retornar: {"status": "healthy"}
   ```

### Fluxograma de Decisão (ASCII)

```
Início: Erro 404 ao cadastrar Consultório
  │
  ├─> [Passo 1] Capturar URL real (Network tab)
  │     │
  │     └─> URL: http://localhost:8000/consultorios
  │
  ├─> [Passo 2] Listar rotas do backend (Python script)
  │     │
  │     ├─> Rota NÃO existe?
  │     │     └─> [Causa 1] Rota não implementada → Seção 6
  │     │
  │     └─> Rota existe?
  │           │
  │           ├─> [Passo 3] Comparar path/método
  │           │     │
  │           │     ├─> Trailing slash divergente?
  │           │     │     └─> [Causa 2] Mismatch de path → Seção 6
  │           │     │
  │           │     └─> Método HTTP incorreto?
  │           │           └─> [Causa 3] Método divergente → Seção 6
  │           │
  │           └─> [Passo 4] Verificar Depends
  │                 │
  │                 ├─> Rota usa Depends(tenant)?
  │                 │     └─> Testar com cookie → Se 401/403, problema de auth
  │                 │
  │                 └─> [Passo 5] Validar VITE_API_URL
  │                       │
  │                       └─> Porta/URL incorreta?
  │                             └─> [Causa 4] Variável de ambiente → Seção 6
```

---

## 6. Plano de Correção (Sem Código, mas com Referências)

### Opção 1: Alinhar Frontend para Usar `/api/v1/consultorios`

**Descrição**: Atualizar o frontend para chamar a rota com o prefixo padrão do projeto (`/api/v1/consultorios`), assumindo que o backend será implementado seguindo o mesmo padrão.

**Arquivos a modificar**:
- `src/hooks/useConsultorioMutations.ts`: Alterar `api.post('/consultorios', ...)` para `api.post('/api/v1/consultorios', ...)`
- `src/components/Settings/Consultorios/ConsultoriosListContent.tsx`: Alterar `api.get('/consultorios?tenant_id=...` para `api.get('/api/v1/consultorios?tenant_id=...`

**Vantagens**: Mantém consistência com outras rotas (`/api/v1/appointments/`, `/api/v1/patients`)

**Desvantagens**: Requer que o backend implemente a rota com o mesmo path

### Opção 2: Criar Router de Consultórios no Backend

**Descrição**: Criar o arquivo `backend/routes/consultorios.py` seguindo o padrão de `patients.py` e `appointments.py`, e montá-lo em `main.py`.

**Arquivos a criar/modificar**:
- **Criar**: `backend/routes/consultorios.py`
  - Definir `router = APIRouter(prefix="/v1/consultorios", tags=["consultorios"])`
  - Implementar `@router.post("/", ...)` para criação
  - Implementar `@router.get("/", ...)` para listagem
  - Implementar `@router.put("/{id}", ...)` para atualização
  - Implementar `@router.delete("/{id}", ...)` para exclusão
- **Criar**: `backend/models/consultorio.py` (se não existir)
  - Definir modelo SQLAlchemy `Consultorio` com campos: `id`, `tenant_id`, `nome`, `estado`, `cidade`, `cep`, `rua`, `numero`, `bairro`, `informacoes_adicionais`, `created_at`, `updated_at`
- **Criar**: `backend/schemas/consultorio.py` (se não existir)
  - Definir Pydantic schemas: `ConsultorioCreate`, `ConsultorioUpdate`, `ConsultorioResponse`
- **Modificar**: `backend/main.py`
  - Adicionar: `from routes import consultorios`
  - Adicionar: `app.include_router(consultorios.router, prefix="/api")`

**Vantagens**: Implementa a funcionalidade completa no backend

**Desvantagens**: Requer mais trabalho (modelo, schemas, rotas)

### Opção 3: Padronizar Nomenclatura (pt-BR ↔︎ en)

**Descrição**: Decidir se o projeto usará nomenclatura em português (`/consultorios`) ou inglês (`/clinics` ou `/offices`), e alinhar frontend e backend.

**Tabela de Mapeamento Sugerido**:

| Recurso (pt-BR) | Rota Padrão Proposta | Alternativa (en) |
|-----------------|----------------------|------------------|
| Consultórios    | `/api/v1/consultorios` | `/api/v1/clinics` |
| Pacientes       | `/api/v1/patients` (já existe) | - |
| Agendamentos    | `/api/v1/appointments` (já existe) | - |

**Recomendação**: Usar `/api/v1/consultorios` para manter consistência com a interface em pt-BR e evitar confusão.

### Opção 4: Padronizar Trailing Slash

**Descrição**: Definir uma convenção para trailing slashes e aplicá-la consistentemente.

**Convenção sugerida**: **Sem trailing slash** (como em `/api/v1/patients`)

**Arquivos a verificar**:
- Backend: Garantir que decorators usem `@router.post("/", ...)` (sem barra no path do router, mas com barra no decorator)
- Frontend: Garantir que chamadas usem `/api/v1/consultorios` (sem barra final)

**Exceção**: Se outras rotas usam trailing slash (ex.: `/api/v1/appointments/`), manter consistência com o padrão existente.

### Opção 5: Adicionar Testes de Contrato

**Descrição**: Criar testes automatizados para validar que a rota de consultórios funciona corretamente.

**Estrutura de teste sugerida** (usando `pytest + httpx`):

1. **Teste de criação bem-sucedida (201 Created)**:
   - Enviar `POST /api/v1/consultorios` com payload válido
   - Validar resposta: status 201, JSON com `id`, `nome`, `tenant_id`, etc.
   - Validar que registro foi criado no banco

2. **Teste de validação (422 Unprocessable Entity)**:
   - Enviar `POST /api/v1/consultorios` com campos obrigatórios ausentes
   - Validar resposta: status 422, JSON com `detail` contendo erros de validação

3. **Teste de 404 quando tenant_id inexistente**:
   - Enviar `POST /api/v1/consultorios` com `tenant_id` inválido
   - Validar resposta: status 404 ou 403 (dependendo da lógica de negócio)

**Arquivo de teste sugerido**: `backend/tests/test_consultorios.py` (ou `test_clinics.py`)

---

## 7. Checklist de Aceitação

A correção está completa quando todos os itens abaixo forem atendidos:

- [ ] **Submeter Consultório cria registro e retorna 201**
  - Ao clicar em "Cadastrar" no formulário, o toast exibe "Consultório cadastrado!" (não "Erro ao cadastrar")
  - A requisição no Network tab retorna status `201 Created`
  - O JSON de resposta contém `id`, `nome`, `tenant_id`, `created_at`, etc.

- [ ] **POST documentado no Swagger (`/docs`)**
  - Acessar `http://localhost:8000/docs`
  - Localizar a seção "consultorios" (ou "clinics")
  - Expandir `POST /api/v1/consultorios`
  - Verificar que o schema de request mostra todos os campos: `nome`, `estado`, `cidade`, `cep`, `rua`, `numero`, `bairro`, `informacoes_adicionais`, `tenant_id`
  - Verificar que o schema de response mostra o objeto `Consultorio` completo

- [ ] **Frontend aponta para o mesmo path do backend**
  - No `useConsultorioMutations.ts`, a URL usada em `api.post()` corresponde à rota exposta no backend
  - Exemplo: Se backend expõe `/api/v1/consultorios`, frontend chama `/api/v1/consultorios`

- [ ] **Teste manual via curl passa**
  - Executar: `curl -X POST http://localhost:8000/api/v1/consultorios -H "Content-Type: application/json" -d '{...}'`
  - Resultado: `201 Created` com JSON válido (não `404 Not Found`)

- [ ] **Nenhuma chamada de Consultórios retorna 404 inesperado**
  - Testar: Criar, listar, editar, deletar consultório
  - Todas as operações retornam status esperado (201, 200, 200, 200) e não 404
  - Verificar com e sem trailing slash (se aplicável)

---

## 8. Apêndice

### Snippets de Comandos Úteis

#### Listar Rotas do FastAPI

```python
# Criar arquivo temporário: backend/list_routes.py
from main import app

print("Rotas registradas no FastAPI:\n")
for route in app.routes:
    if hasattr(route, 'path') and hasattr(route, 'methods'):
        methods = [m for m in route.methods if m != 'HEAD']
        print(f"{', '.join(methods):<10} {route.path}")
```

Execute: `python backend/list_routes.py`

#### Testar Endpoint com curl

```bash
# POST com payload JSON
curl -X POST http://localhost:8000/api/v1/consultorios \
  -H "Content-Type: application/json" \
  -H "Cookie: session=seu-cookie" \
  -d '{
    "nome": "Consultório Teste",
    "estado": "SP",
    "cidade": "São Paulo",
    "cep": "01310-100",
    "rua": "Avenida Paulista",
    "numero": "1000",
    "bairro": "Bela Vista",
    "informacoes_adicionais": "Sala 101",
    "tenant_id": "tenant-123"
  }' \
  -v  # -v para ver headers completos
```

#### Capturar Logs do Uvicorn

```bash
# Backend com logs verbosos
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level debug

# Ou salvar logs em arquivo
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level debug 2>&1 | tee uvicorn.log
```

#### Capturar Requisição no Network Tab (DevTools)

1. Abra DevTools (F12) → Network
2. Marque "Preserve log" (preservar log)
3. Filtre por "consultorios" ou "XHR"
4. Reproduza o erro
5. Clique na requisição → aba "Headers"
   - **Request URL**: Copie a URL completa
   - **Request Method**: Verifique se é `POST`
   - **Status Code**: Deve ser `404`
6. Clique na aba "Payload" (ou "Request") para ver o JSON enviado

### Tabela de Mapeamento pt-BR ↔︎ en

| Termo (pt-BR) | Termo (en) | Rota Sugerida | Observação |
|---------------|------------|---------------|------------|
| Consultório   | Clinic     | `/api/v1/consultorios` | Manter pt-BR para consistência |
| Consultório   | Office     | `/api/v1/offices` | Alternativa menos comum |
| Paciente      | Patient    | `/api/v1/patients` | Já implementado |
| Agendamento   | Appointment | `/api/v1/appointments` | Já implementado |

**Recomendação**: Usar `/api/v1/consultorios` para manter a interface em português e evitar confusão com traduções.

### Notas sobre Diferenças: 404 vs CORS vs 401/403

| Erro | Status HTTP | Causa | Como Identificar |
|------|-------------|-------|------------------|
| **404 Not Found** | `404` | Rota não existe ou path incorreto | Network tab mostra `404`, backend não recebe requisição (ou recebe mas não encontra rota) |
| **CORS** | `0` ou erro de rede | Política de origem bloqueada | Console do navegador mostra "CORS policy", Network tab mostra "Failed to fetch" ou status `0` |
| **401 Unauthorized** | `401` | Não autenticado | Network tab mostra `401`, resposta contém `{"detail": "Not authenticated"}` |
| **403 Forbidden** | `403` | Autenticado mas sem permissão | Network tab mostra `403`, resposta contém `{"detail": "Not enough permissions"}` |

**Para este caso específico**: Se o erro é `404 Not Found`, a causa é **rota inexistente ou path incorreto**, não CORS ou autenticação.

---

## Conclusão

Este documento fornece um guia completo para diagnosticar e corrigir o erro 404 ao cadastrar Consultórios no AlignWork. Siga as seções na ordem apresentada para isolar a causa e aplicar a correção adequada. Se após seguir todos os passos o problema persistir, verifique logs do backend e do navegador para identificar erros adicionais não cobertos neste guia.

