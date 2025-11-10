# Implementação: Seleção de Consultórios no Formulário de Novo Agendamento

## 1. Objetivo e Escopo

### Objetivo

Adicionar um campo de seleção de Consultório no formulário "Novo agendamento" do AlignWork, permitindo que o usuário escolha entre os consultórios previamente cadastrados na área de Configurações → Consultórios. O consultório selecionado será associado ao agendamento e armazenado no banco de dados.

### Escopo

**Backend:**
- Criar endpoint leve para listagem de consultórios (formato otimizado para select/combobox)
- Adicionar validação de `clinic_id` (ou `consultorio_id`) na criação de agendamentos
- Garantir que o consultório pertence ao tenant do usuário (isolamento multi-tenant)
- Atualizar schema de `AppointmentCreate` para incluir o campo de consultório

**Frontend:**
- Adicionar campo de seleção (combobox pesquisável) no formulário "Novo agendamento"
- Integrar com a API de listagem de consultórios
- Implementar validação obrigatória do campo
- Enviar `clinic_id` no payload de criação de agendamento

**Banco de Dados:**
- Verificar se a coluna `clinic_id` (ou `consultorio_id`) existe na tabela `appointments`
- Se ausente, planejar migração em duas etapas (adicionar nullable + backfill → tornar obrigatório)

---

## 2. Requisitos Funcionais

### RF1: Listagem de Consultórios
- O usuário deve visualizar uma lista de consultórios disponíveis ao abrir o campo de seleção no formulário "Novo agendamento".
- Cada item da lista deve exibir o nome do consultório e, opcionalmente, endereço abreviado (rua, número, bairro) para facilitar a identificação.
- A lista deve ser ordenada alfabeticamente por nome.

### RF2: Campo Obrigatório
- O campo "Consultório" é obrigatório no formulário de novo agendamento.
- Não é possível salvar um agendamento sem selecionar um consultório.
- O formulário deve exibir mensagem de erro clara quando o campo estiver vazio: "Selecione um consultório".

### RF3: Isolamento Multi-Tenant
- A lista de consultórios deve respeitar o escopo do tenant do usuário logado.
- Apenas consultórios cadastrados para o tenant atual devem aparecer na lista.
- O backend deve validar que o `clinic_id` enviado pertence ao tenant do usuário antes de criar o agendamento.

### RF4: Validação e Persistência
- Ao salvar um agendamento, o backend deve validar:
  - `clinic_id` está presente no payload
  - `clinic_id` é um número inteiro positivo (> 0)
  - `clinic_id` existe na tabela `consultorios` (ou `clinics`)
  - `clinic_id` pertence ao tenant do usuário
- Em caso de sucesso, retornar **201 Created** com o objeto do agendamento incluindo `clinic_id`.
- Em caso de falha de validação, retornar **422 Unprocessable Entity** com mensagem clara.

---

## 3. Requisitos Não Funcionais

### RNF1: Performance
- Tempo de carregamento da lista de consultórios < 300ms em ambiente local (backend + frontend).
- Implementar cache no frontend com TTL de 5 minutos (React Query `staleTime`) ou equivalente.
- Endpoint de listagem deve retornar apenas campos essenciais (`id`, `label`) para reduzir payload.

### RNF2: Segurança
- Manter `credentials: 'include'` em todas as requisições para preservar cookies httpOnly.
- Não expor dados sensíveis no label do consultório (ex.: CPF, telefone de contato, informações financeiras).
- Validar permissões de acesso ao consultório no backend (tenant isolation).

### RNF3: Acessibilidade
- Componente de seleção deve ser focável via teclado (Tab).
- Suportar busca/pesquisa por texto dentro do combobox.
- Rótulo associado ao campo ("Consultório") deve ser claro e visível.
- Mensagens de erro devem ser anunciadas por leitores de tela.

---

## 4. Modelagem e Dados

### Estrutura da Tabela `appointments`

**Estado Atual:**
A tabela `appointments` possui as seguintes colunas:
- `id` (Integer, PK)
- `tenant_id` (String, index)
- `patient_id` (Integer, FK → `patients.id`)
- `starts_at` (DateTime, UTC)
- `duration_min` (Integer)
- `status` (String)
- `created_at` (DateTime)
- `updated_at` (DateTime)

**Estado Desejado:**
Adicionar coluna `clinic_id` (ou `consultorio_id`) como Foreign Key para `consultorios.id`:
- `clinic_id` (Integer, FK → `consultorios.id`, nullable=False após migração)

### Plano de Migração (se `clinic_id` não existir)

**Etapa 1: Adicionar Coluna Nullable**
- Criar migração Alembic para adicionar `clinic_id` com `nullable=True`.
- Executar migração sem quebrar agendamentos existentes.

**Etapa 2: Backfill (se necessário)**
- Se houver agendamentos existentes, definir estratégia de backfill:
  - Opção A: Atribuir consultório padrão do tenant (se existir).
  - Opção B: Deixar `NULL` e tornar obrigatório apenas para novos agendamentos.
  - Opção C: Exigir que usuário selecione consultório ao editar agendamentos antigos.

**Etapa 3: Tornar Obrigatório**
- Após backfill, criar segunda migração para tornar `clinic_id` `nullable=False`.
- Adicionar constraint `NOT NULL` e validar no schema Pydantic.

### Representação Leve para Select

**Formato do Label:**
```
label = "<nome> – <rua> <número> – <bairro>"
```

**Exemplos:**
- `"Consultório Centro – Avenida Paulista 1000 – Bela Vista"`
- `"Clínica Sul – Rua das Flores 250 – Jardim América"`
- `"Unidade Norte – Rua Principal 50 – Centro"` (se número estiver vazio, omitir)

**Campos Opcionais:**
- Se `rua` estiver vazio, usar apenas `"<nome> – <bairro>"`.
- Se `bairro` estiver vazio, usar apenas `"<nome> – <rua> <número>"`.
- Se ambos estiverem vazios, usar apenas `"<nome>"`.

**Estrutura JSON de Resposta:**
```json
[
  {
    "id": 1,
    "label": "Consultório Centro – Avenida Paulista 1000 – Bela Vista"
  },
  {
    "id": 2,
    "label": "Clínica Sul – Rua das Flores 250 – Jardim América"
  }
]
```

---

## 5. API de Suporte (Backend)

### Endpoint: GET `/api/v1/consultorios/light`

**Objetivo:** Retornar lista leve de consultórios formatada para alimentar componente de seleção.

**Path:** `/api/v1/consultorios/light` (sem trailing slash, seguindo padrão do projeto)

**Query Parameters:**
- `tenant_id` (obrigatório): ID do tenant para filtrar consultórios

**Response 200:**
```json
[
  {
    "id": 1,
    "label": "Consultório Centro – Avenida Paulista 1000 – Bela Vista"
  },
  {
    "id": 2,
    "label": "Clínica Sul – Rua das Flores 250 – Jardim América"
  }
]
```

**Response 401/403:** Se usuário não autenticado ou sem permissão.

**Implementação:**
- Criar rota `@router.get("/light")` no router de consultórios (`backend/routes/consultorios.py`).
- Filtrar por `tenant_id` fornecido no query parameter.
- Ordenar por `nome` (ascendente).
- Construir `label` concatenando `nome`, `rua`, `numero` e `bairro` conforme regras da Seção 4.
- Retornar apenas `id` e `label` (sem campos desnecessários).

**Verificação de Montagem:**
- Confirmar que o router de consultórios está montado em `main.py` com `app.include_router(consultorios.router, prefix="/api")`.
- Confirmar que o router usa `prefix="/v1/consultorios"` (ou `/v1/consultorios`).
- URL final esperada: `/api/v1/consultorios/light`.

### Validação na Criação de Agendamento

**Endpoint:** `POST /api/v1/appointments`

**Checagens Obrigatórias:**

1. **Presença do Campo:**
   - Verificar que `clinic_id` (ou `consultorio_id`) está presente no payload.
   - Se ausente, retornar **422** com `{"detail": "clinic_id is required"}`.

2. **Tipo e Valor:**
   - Validar que `clinic_id` é um número inteiro positivo (> 0).
   - Se inválido, retornar **422** com `{"detail": "clinic_id must be a positive integer"}`.

3. **Existência no Banco:**
   - Consultar tabela `consultorios` (ou `clinics`) para verificar se `clinic_id` existe.
   - Se não existir, retornar **422** com `{"detail": "Consultorio with ID {clinic_id} not found"}`.

4. **Isolamento Multi-Tenant:**
   - Verificar que o consultório pertence ao `tenant_id` do usuário.
   - Query: `SELECT * FROM consultorios WHERE id = {clinic_id} AND tenant_id = {user_tenant_id}`.
   - Se não pertencer, retornar **422** com `{"detail": "Consultorio does not belong to your tenant"}` ou **403 Forbidden**.

**Atualização do Schema:**
- Adicionar campo `clinic_id` (ou `consultorio_id`) em `AppointmentCreate` (`backend/schemas/appointment.py`).
- Adicionar validador Pydantic para garantir que é inteiro positivo.
- Atualizar modelo `Appointment` (`backend/models/appointment.py`) para incluir coluna `clinic_id` (se ainda não existir).

**Observações:**
- Padronizar trailing slash: usar `/api/v1/consultorios/light` (sem barra final), seguindo padrão de `/api/v1/patients`.
- Manter cookies `SameSite=Lax` e `Secure` (se HTTPS) para preservar autenticação.
- Garantir que `credentials: 'include'` está configurado no frontend.

---

## 6. Contratos (Request/Response)

### GET `/api/v1/consultorios/light`

**Request:**
```
GET /api/v1/consultorios/light?tenant_id=tenant-123
Headers:
  Cookie: access_token=...
```

**Response 200:**
```json
[
  {
    "id": 1,
    "label": "Consultório Centro – Avenida Paulista 1000 – Bela Vista"
  },
  {
    "id": 2,
    "label": "Clínica Sul – Rua das Flores 250 – Jardim América"
  },
  {
    "id": 3,
    "label": "Unidade Norte"
  }
]
```

**Response 401:**
```json
{
  "detail": "Not authenticated"
}
```

**Response 422 (tenant_id ausente):**
```json
{
  "detail": "tenant_id is required"
}
```

### POST `/api/v1/appointments`

**Request Exemplo:**
```json
{
  "tenantId": "tenant-123",
  "patientId": 123,
  "startsAt": "2025-11-10T14:00:00-03:00",
  "durationMin": 50,
  "status": "pending",
  "clinicId": 1
}
```

**Observação:** O frontend pode enviar `clinicId` (camelCase) e o backend deve mapear para `clinic_id` (snake_case) no schema, ou padronizar para um formato único.

**Response 201 Created:**
```json
{
  "id": 456,
  "tenant_id": "tenant-123",
  "patient_id": 123,
  "clinic_id": 1,
  "starts_at": "2025-11-10T17:00:00Z",
  "duration_min": 50,
  "status": "pending",
  "created_at": "2025-11-09T10:30:00Z",
  "updated_at": "2025-11-09T10:30:00Z"
}
```

**Response 422 (clinic_id inválido):**
```json
{
  "detail": [
    {
      "loc": ["body", "clinicId"],
      "msg": "Consultorio with ID 999 not found",
      "type": "value_error"
    }
  ]
}
```

**Response 422 (clinic_id ausente):**
```json
{
  "detail": [
    {
      "loc": ["body", "clinicId"],
      "msg": "clinic_id is required",
      "type": "value_error"
    }
  ]
}
```

**Response 401/403:**
```json
{
  "detail": "Not authenticated"
}
```
ou
```json
{
  "detail": "Not enough permissions"
}
```

---

## 7. Integração no Frontend (Sem Código, Apenas Diretrizes)

### Serviço de Dados

**Função de Busca:**
- Criar função assíncrona para buscar `/api/v1/consultorios/light?tenant_id={tenantId}`.
- Usar serviço `api.ts` existente com `credentials: 'include'`.
- Retornar array de `{ id: number; label: string }`.

**Exemplo de Assinatura (referência):**
```typescript
async function fetchConsultoriosLight(tenantId: string): Promise<{ id: number; label: string }[]>
```

### Estado e Cache

**React Query (Recomendado):**
- Criar query com `useQuery` do React Query.
- Configurar `staleTime: 5 * 60 * 1000` (5 minutos) para cache.
- Query key: `['consultorios', 'light', tenantId]`.
- Habilitar query apenas quando `tenantId` estiver disponível.

**Alternativa (sem React Query):**
- Usar `useState` e `useEffect` para buscar consultórios ao montar o componente.
- Implementar cache manual com timestamp (verificar se dados têm menos de 5 minutos).

### Formulário

**Campo `clinicId` (camelCase no form):**
- Adicionar campo `clinicId` no estado do formulário (`formData`).
- Tipo: `number | null` ou `string` (converter para número no submit).
- Valor inicial: `null` ou `''`.

**Validação:**
- Adicionar validação no método `validarFormulario`:
  - Se `clinicId === null` ou `clinicId === ''` ou `clinicId === undefined`, adicionar erro: `"Selecione um consultório"`.
- Exibir mensagem de erro abaixo do campo quando inválido.

**Componente de Seleção:**
- Usar **Combobox pesquisável** do shadcn/ui (componente `Command` com `Popover`).
- Exibir `label` de cada consultório na lista.
- Armazenar `id` no estado `formData.clinicId`.
- Permitir busca por texto (filtrar por `label` que contenha o termo digitado).

**Regras de UX:**
- **Placeholder:** "Selecionar consultório…" (quando nenhum item selecionado).
- **Estado "Carregando…":** Exibir enquanto `isLoading` da query estiver `true`.
- **Estado "Vazio":** Se lista retornar vazia, exibir "Nenhum consultório encontrado. Cadastre um consultório em Configurações → Consultórios.".
- **Ícone:** Usar ícone de prédio/edifício (`Building` do lucide-react) ao lado do campo.

**Mapeamento no Submit:**
- No método `handleSubmit`, mapear `clinicId` (camelCase) para `clinic_id` (snake_case) no payload enviado ao backend.
- Ou padronizar para `clinicId` se o backend aceitar camelCase.

### Envio do Payload

**Atualizar `createAppointment`:**
- Garantir que `clinic_id` (ou `clinicId`) é incluído no objeto enviado para `POST /api/v1/appointments`.
- Exemplo de payload:
  ```typescript
  {
    patientId: formData.clienteId,
    startsAtLocal: startsAtLocal,
    durationMin: formData.duracao,
    status: 'pending',
    clinicId: formData.clinicId  // ou clinic_id
  }
  ```

### Tratamento de Erros

**Erro 422 (clinic_id inválido):**
- Capturar erro na mutation de criação de agendamento.
- Exibir toast com mensagem: "Consultório selecionado não é válido. Por favor, selecione outro consultório.".
- Sugerir recarregar a lista de consultórios (invalidar cache da query).

**Erro de Rede:**
- Se falhar ao buscar lista de consultórios, exibir mensagem: "Erro ao carregar consultórios. Tente novamente.".
- Permitir retry manual (botão "Tentar novamente").

**Erro de Validação (campo vazio):**
- Exibir mensagem de erro inline abaixo do campo (não apenas toast).
- Destacar campo com borda vermelha.

---

## 8. Testes Manuais (Comandos)

### Listar Consultórios (Light)

**Com curl:**
```bash
curl -i "http://localhost:8000/api/v1/consultorios/light?tenant_id=tenant-123" \
  -H "Cookie: access_token=SEU_TOKEN_AQUI"
```

**Resultado esperado:**
- Status: `200 OK`
- Body: Array JSON com `id` e `label` de cada consultório.

**Com httpie:**
```bash
http GET "http://localhost:8000/api/v1/consultorios/light?tenant_id=tenant-123" \
  Cookie:access_token=SEU_TOKEN_AQUI
```

### Criar Agendamento com Consultório

**Com curl:**
```bash
curl -i -X POST "http://localhost:8000/api/v1/appointments" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN_AQUI" \
  -d '{
    "tenantId": "tenant-123",
    "patientId": 123,
    "startsAt": "2025-11-10T14:00:00-03:00",
    "durationMin": 50,
    "status": "pending",
    "clinicId": 1
  }'
```

**Resultado esperado:**
- Status: `201 Created`
- Body: Objeto do agendamento com `clinic_id: 1` incluído.

**Teste de Validação (clinic_id inválido):**
```bash
curl -i -X POST "http://localhost:8000/api/v1/appointments" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN_AQUI" \
  -d '{
    "tenantId": "tenant-123",
    "patientId": 123,
    "startsAt": "2025-11-10T14:00:00-03:00",
    "durationMin": 50,
    "status": "pending",
    "clinicId": 999
  }'
```

**Resultado esperado:**
- Status: `422 Unprocessable Entity`
- Body: `{"detail": "Consultorio with ID 999 not found"}` ou similar.

### Verificação no DevTools (Network Tab)

**Passos:**
1. Abrir DevTools (F12) → aba Network.
2. Filtrar por "consultorios" ou "XHR".
3. Abrir formulário "Novo agendamento".
4. Verificar requisição `GET /api/v1/consultorios/light?tenant_id=...`:
   - Status: `200`
   - Response: Array com `id` e `label`.
5. Preencher formulário e clicar em "Salvar".
6. Verificar requisição `POST /api/v1/appointments`:
   - Status: `201` (sucesso) ou `422` (erro de validação).
   - Request Payload: Deve conter `clinicId` (ou `clinic_id`).

---

## 9. Checklist de Aceitação

A implementação está completa quando todos os itens abaixo forem atendidos:

- [ ] **Campo "Consultório" visível no formulário "Novo agendamento"**
  - Campo aparece entre os outros campos do formulário (após "Cliente" e antes de "Data/Hora" ou em posição lógica).
  - Componente é um combobox pesquisável (não um select simples).

- [ ] **Campo é pesquisável e obrigatório**
  - Usuário pode digitar para filtrar consultórios na lista.
  - Mensagem de erro aparece quando campo está vazio e usuário tenta salvar.
  - Formulário não permite submit sem selecionar consultório.

- [ ] **GET `/api/v1/consultorios/light` retorna lista correta**
  - Endpoint retorna status `200 OK`.
  - Response contém array com objetos `{ id: number, label: string }`.
  - Labels estão formatados corretamente (nome + endereço abreviado).
  - Lista está ordenada alfabeticamente por nome.
  - Apenas consultórios do tenant atual aparecem na lista.

- [ ] **POST `/api/v1/appointments` grava `clinic_id` e retorna 201**
  - Payload de criação inclui `clinic_id` (ou `clinicId`).
  - Backend persiste `clinic_id` na tabela `appointments`.
  - Response 201 inclui `clinic_id` no objeto retornado.
  - Agendamento criado pode ser consultado e exibe consultório associado.

- [ ] **Erros de validação são tratados e exibidos**
  - Se `clinic_id` for inválido (não existe), backend retorna 422 com mensagem clara.
  - Frontend exibe toast ou mensagem inline quando validação falha.
  - Se `clinic_id` não pertencer ao tenant, backend retorna 422/403.

- [ ] **Rotas aparecem documentadas no Swagger**
  - Acessar `http://localhost:8000/docs`.
  - Seção "consultorios" (ou "clinics") contém `GET /api/v1/consultorios/light`.
  - Seção "appointments" mostra `POST /api/v1/appointments` com campo `clinicId` (ou `clinic_id`) no schema de request.

---

## 10. Considerações de Observabilidade e Segurança

### Observabilidade

**Logging:**
- Logar hits da rota `/api/v1/consultorios/light` sem expor PII (Personal Identifiable Information).
- Exemplo de log: `INFO: GET /api/v1/consultorios/light?tenant_id=xxx - 200 OK - 2 results - 45ms`.
- Monitorar latência: alertar se tempo de resposta > 500ms.

**Métricas:**
- Contar quantas vezes a lista é carregada por sessão.
- Rastrear taxa de erro (422) na criação de agendamentos por `clinic_id` inválido.

### Performance e Escalabilidade

**Lista Grande:**
- Se a lista de consultórios puder crescer muito (> 100 itens), considerar:
  - Paginação server-side (ex.: `?page=1&page_size=50`).
  - Busca server-side (ex.: `?search=centro`).
  - Limitar resultados iniciais e carregar mais sob demanda (infinite scroll).

**Cache:**
- Implementar cache no backend (TTL de 5 minutos) se a lista for consultada frequentemente.
- Invalidar cache quando consultório for criado/editado/deletado.

### Segurança

**Restrição de Dados no Label:**
- Não incluir CPF, telefone, email ou informações financeiras no `label`.
- Limitar `label` a: nome, endereço público (rua, número, bairro).
- Se necessário, truncar `label` para evitar payload muito grande (máx. 200 caracteres).

**Validação de Tenant:**
- Sempre validar que `clinic_id` pertence ao `tenant_id` do usuário.
- Não confiar apenas no frontend: validar no backend em todas as operações.

**Rate Limiting:**
- Aplicar rate limiting na rota `/api/v1/consultorios/light` se necessário (ex.: 100 req/min por IP).

---

## 11. Apêndice

### Tabela de Mapeamento de Nomenclatura (pt-BR ↔︎ en)

| Termo (pt-BR) | Termo (en) | Rota/Coluna Usada | Observação |
|---------------|------------|-------------------|------------|
| Consultório   | Clinic     | `/api/v1/consultorios` | Padrão do projeto: manter pt-BR |
| Consultório   | Office     | `/api/v1/offices` | Alternativa menos comum |
| Agendamento   | Appointment | `/api/v1/appointments` | Já implementado |
| Paciente      | Patient    | `/api/v1/patients` | Já implementado |

**Recomendação:** Usar `consultorios` (pt-BR) para manter consistência com a interface e evitar confusão. Se o backend usar `clinics`, mapear no frontend ou padronizar para um formato único.

### Convenção de Trailing Slash e Plural

**Trailing Slash:**
- **Padrão do projeto:** Sem trailing slash (ex.: `/api/v1/consultorios`, `/api/v1/patients`).
- **Exceção:** Algumas rotas usam trailing slash (ex.: `/api/v1/appointments/`).
- **Recomendação:** Seguir o padrão existente. Para novas rotas, usar sem trailing slash.

**Plural:**
- Recursos sempre no plural: `consultorios`, `appointments`, `patients`.
- Endpoints de ação podem ser singulares: `/api/v1/appointments/{id}` (GET/PUT/DELETE de um único item).

### Como Diferenciar 404 Real, 404 Lógico por Depends e CORS

| Erro | Status HTTP | Causa | Como Identificar |
|------|-------------|-------|------------------|
| **404 Real** | `404` | Rota não existe ou path incorreto | Network tab mostra `404`, backend não recebe requisição (ou recebe mas não encontra rota). Log do backend: "No route matches /path". |
| **404 Lógico (Depends)** | `404` | Rota existe, mas `Depends(get_tenant)` ou similar retorna 404 por segurança | Network tab mostra `404`, backend recebe requisição mas retorna 404 após validação de dependência. Log do backend: "Tenant not found" ou similar. Diferença: resposta pode conter `{"detail": "Resource not found"}` em vez de rota inexistente. |
| **CORS** | `0` ou erro de rede | Política de origem bloqueada | Console do navegador mostra "CORS policy" ou "Failed to fetch". Network tab mostra status `0` ou "Failed to fetch". Requisição não chega ao backend (bloqueada pelo navegador). |

**Para este caso específico:**
- Se `GET /api/v1/consultorios/light` retornar 404, verificar se rota está montada em `main.py`.
- Se `POST /api/v1/appointments` retornar 404 ao validar `clinic_id`, pode ser 404 lógico (consultório não encontrado ou não pertence ao tenant).

---

## Conclusão

Este documento fornece um guia completo para implementar a seleção de consultórios no formulário "Novo agendamento" do AlignWork. Siga as seções na ordem apresentada para garantir que backend, frontend e banco de dados estejam alinhados. Se após seguir todos os passos houver dúvidas ou problemas, consulte os logs do backend e do navegador para identificar erros adicionais não cobertos neste guia.

