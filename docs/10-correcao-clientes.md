# Correção: Pacientes "Sumiram" Após Inclusão do Seletor de Consultório

## 1. Resumo do Problema

### Sintoma 1: Lista de Pacientes Vazia

Após a implementação do seletor de consultório no formulário "Novo agendamento", a lista de **Pacientes** no sistema AlignWork deixou de exibir registros existentes. A interface mostra uma lista vazia, mesmo quando há pacientes cadastrados no banco de dados.

### Sintoma 2: Erro ao Cadastrar Paciente Existente

Ao tentar cadastrar um novo paciente com CPF já existente, o backend retorna erro **"Patient with CPF XXX already exists"**, confirmando que:
- O registro **existe no banco de dados**
- A validação de unicidade **está funcionando**
- O problema é que o paciente **não está sendo listado/exibido** na interface

### Hipóteses Prováveis (Priorizadas)

**1. Filtro indevido por consultório aplicado na listagem**
- A listagem de pacientes pode estar aplicando um `JOIN` ou `WHERE` com `clinic_id`/`consultorio_id` que oculta registros sem vínculo explícito com consultório.
- Pacientes criados antes da implementação do seletor não têm `consultorio_id` associado em agendamentos, e a query pode estar filtrando apenas pacientes que têm agendamentos com consultório.

**2. Estado/parâmetros no frontend incluindo `clinicId` por padrão**
- Após a adição do seletor de consultório, o frontend pode estar enviando `clinicId` (ou `consultorioId`) em todas as chamadas de listagem de pacientes, mesmo quando nenhum consultório foi selecionado.
- O backend pode estar interpretando `clinicId=undefined` ou `clinicId=null` como filtro obrigatório, retornando lista vazia.

**3. Escopo por `tenant_id` ou status/ativo alterado**
- Mudança em dependências/guards (ex.: `Depends(get_current_tenant)`) pode estar restringindo o escopo incorretamente.
- Novo default `status=inactive` ou campo `is_active=False` pode estar ocultando pacientes existentes.

**4. Normalização de CPF inconsistente**
- O formulário envia CPF com máscara (`061.288.474-04`), enquanto o backend pode estar armazenando somente dígitos (`06128847404`).
- A validação de duplicidade funciona (encontra o registro), mas a busca/lista aplica critério diferente (com máscara vs sem máscara), resultando em lista vazia.

---

## 2. Como Reproduzir

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

3. **Navegar até a área de Pacientes**:
   - Acesse `http://localhost:8080` (ou a porta configurada)
   - Faça login (se necessário)
   - Navegue para a seção **Pacientes** ou **Clientes**

4. **Observar o problema**:
   - A lista de pacientes está vazia (mesmo havendo registros no banco)
   - Tentar cadastrar um paciente com CPF existente retorna erro "Patient with CPF XXX already exists"

### Capturando Chamadas no DevTools

1. **Abrir DevTools** (F12) → aba **Network**
2. **Filtrar por "patients" ou "XHR"**
3. **Navegar até a lista de Pacientes**
4. **Localizar a requisição de listagem** (geralmente `GET /api/v1/patients`)
5. **Anotar**:
   - **URL completa**: Ex.: `http://localhost:8000/api/v1/patients?tenantId=xxx&page=1&page_size=50`
   - **Query Parameters**: Verificar se há `clinicId`, `consultorioId`, `clinic_id` ou similar
   - **Método HTTP**: Deve ser `GET`
   - **Status**: Verificar se é `200 OK` ou outro código
   - **Response Body**: Verificar se retorna array vazio `{"data": [], "total": 0}` ou se há dados

6. **Tentar cadastrar um paciente**:
   - Localizar requisição `POST /api/v1/patients`
   - Verificar **Request Payload**: CPF com ou sem máscara
   - Verificar **Response**: Status `400` com mensagem "Patient with CPF XXX already exists"

### Testes Diretos na API

#### Listagem sem Filtro (deve retornar pacientes)

```bash
# Ajuste tenantId conforme seu ambiente
curl -i "http://localhost:8000/api/v1/patients?tenantId=seu-tenant-id&page=1&page_size=10" \
  -H "Cookie: access_token=SEU_TOKEN"
```

**Resultado esperado**: Status `200 OK` com array de pacientes em `data`.

**Se retornar vazio**: O problema está no backend (filtro indevido ou escopo incorreto).

#### Listagem com Filtro de Consultório (se existir)

```bash
# Se o endpoint aceitar clinic_id como filtro opcional
curl -i "http://localhost:8000/api/v1/patients?tenantId=seu-tenant-id&clinic_id=1&page=1&page_size=10" \
  -H "Cookie: access_token=SEU_TOKEN"
```

**Observação**: Se este filtro existir e retornar resultados, mas a listagem sem filtro retornar vazio, o problema é que o filtro está sendo aplicado por padrão.

#### Busca por CPF (apenas dígitos)

```bash
# Se existir endpoint de busca por CPF
curl -i "http://localhost:8000/api/v1/patients?tenantId=seu-tenant-id&search=06128847404" \
  -H "Cookie: access_token=SEU_TOKEN"
```

**Resultado esperado**: Se encontrar o paciente, confirma que ele existe no banco mas não aparece na lista padrão.

#### Confirmação: GET por ID

```bash
# Substitua {patient_id} pelo ID de um paciente conhecido
curl -i "http://localhost:8000/api/v1/patients/{patient_id}?tenantId=seu-tenant-id" \
  -H "Cookie: access_token=SEU_TOKEN"
```

**Resultado esperado**: Status `200 OK` com dados do paciente. Se funcionar, confirma que o paciente existe e o problema é na listagem.

---

## 3. Verificações no Backend (FastAPI)

### Rotas e Dependências

**Verificar montagem do router**:
- Abrir `backend/main.py`
- Confirmar que `app.include_router(patients.router, prefix="/api")` está presente
- Verificar se não houve alteração recente que remova ou altere o prefixo

**Verificar dependências**:
- Abrir `backend/routes/patients.py`
- Localizar a função `list_patients` (endpoint `GET /`)
- Verificar se há `Depends(get_current_user)` ou `Depends(get_tenant)` que possa estar restringindo o escopo
- Confirmar que `get_db` está sendo usado corretamente

**Se houver dependência de tenant**:
- Verificar se o `tenant_id` está sendo extraído corretamente (cookie, header, ou query parameter)
- Confirmar que não há lógica que retorne lista vazia quando `tenant_id` não é encontrado

### Controlador de Listagem

**Revisar a query do endpoint `GET /api/v1/patients`**:

1. **Localizar a função `list_patients`** em `backend/routes/patients.py`

2. **Verificar se há JOIN com tabela de consultórios**:
   - Procurar por `join(Consultorio)` ou `join(Appointment)`
   - Se houver, verificar se está usando `INNER JOIN` (oculta registros sem vínculo) ou `LEFT JOIN` (inclui todos)

3. **Verificar se há filtro por `clinic_id` ou `consultorio_id`**:
   - Procurar por `filter(Patient.consultorio_id == ...)` ou similar
   - Se houver, confirmar que é **opcional** (parâmetro query opcional) e não aplicado por padrão

4. **Garantir que filtro por consultório seja opcional**:
   - Se o endpoint aceitar `clinic_id` como parâmetro, verificar:
     ```python
     clinic_id: Optional[int] = Query(None, description="Filtrar por consultório")
     ```
   - Aplicar filtro **somente** se `clinic_id` for fornecido:
     ```python
     if clinic_id:
         query = query.filter(...)  # Aplicar filtro apenas se fornecido
     ```

5. **Assegurar paginação e ordenação consistentes**:
   - Verificar que `offset` e `limit` estão sendo aplicados corretamente
   - Confirmar que a ordenação (ex.: `order_by(Patient.name)`) não está causando problemas

**Exemplo de query correta (sem filtro indevido)**:
```python
# Query base: apenas filtro por tenant_id
query = db.query(Patient).filter(Patient.tenant_id == tenant_id)

# Filtro opcional por consultório (se implementado)
# clinic_id: Optional[int] = Query(None)
# if clinic_id:
#     query = query.join(Appointment).filter(Appointment.consultorio_id == clinic_id)

# Aplicar busca, paginação e ordenação
```

### Validação de CPF

**Confirmar normalização consistente**:

1. **Na criação de paciente** (`POST /api/v1/patients`):
   - Localizar a função `create_patient`
   - Verificar se o CPF está sendo normalizado (removendo caracteres não numéricos) antes de:
     - Validar unicidade
     - Salvar no banco

2. **Na verificação de unicidade**:
   - Confirmar que a query usa CPF normalizado:
     ```python
     # Normalizar CPF antes de buscar
     cpf_normalized = re.sub(r'\D', '', patient.cpf)
     existing_patient = db.query(Patient).filter(
         Patient.cpf == cpf_normalized,
         Patient.tenant_id == patient.tenant_id  # IMPORTANTE: escopo por tenant
     ).first()
     ```

3. **Na listagem/busca**:
   - Se houver busca por CPF, garantir que também normaliza o termo de busca
   - Manter coerência: sempre usar CPF sem máscara no banco e nas queries

**Problema comum**: Se o CPF é salvo com máscara (`061.288.474-04`) mas a busca usa apenas dígitos (`06128847404`), a lista não encontra os registros.

### Status/Visibilidade

**Checar campos de status**:

1. **Verificar se há campo `is_active` ou `status`** no modelo `Patient`:
   - Abrir `backend/models/patient.py`
   - Procurar por colunas como `is_active`, `status`, `deleted_at`

2. **Se houver campo de status**:
   - Verificar se ganhou default diferente após as mudanças
   - Confirmar que a listagem padrão filtra apenas ativos:
     ```python
     query = query.filter(Patient.is_active == True)  # Se houver campo is_active
     ```
   - Permitir incluir inativos via parâmetro explícito:
     ```python
     include_inactive: bool = Query(False, description="Incluir pacientes inativos")
     if not include_inactive:
         query = query.filter(Patient.is_active == True)
     ```

3. **Se não houver campo de status**:
   - Confirmar que não foi adicionado recentemente sem migração adequada
   - Verificar se não há soft delete implementado que oculta registros

### Contrato da API

**Documentar parâmetros aceitos**:

O endpoint `GET /api/v1/patients` deve aceitar (conforme implementação atual):
- `tenantId` (obrigatório): ID do tenant
- `search` (opcional): Buscar por nome ou CPF
- `page` (opcional, default: 1): Número da página
- `page_size` (opcional, default: 50): Itens por página
- `clinic_id` (opcional, se implementado): Filtrar por consultório

**Se `clinic_id` for implementado**:
- Deve ser **opcional** (não obrigatório)
- Quando ausente, **não** deve aplicar filtro
- Quando fornecido, deve filtrar apenas pacientes que têm agendamentos com aquele consultório

---

## 4. Verificações no Banco de Dados

### Validar UniqueConstraint e Conteúdo

**Verificar constraint de unicidade**:

```sql
-- Verificar estrutura da tabela
.schema patients

-- Ou em SQLite:
SELECT sql FROM sqlite_master WHERE type='table' AND name='patients';
```

**Confirmar que há constraint composta**:
- Deve existir `UNIQUE(tenant_id, cpf)` ou similar
- Isso garante que o mesmo CPF pode existir em tenants diferentes, mas não no mesmo tenant

**Consultar pacientes existentes**:

```sql
-- Listar todos os pacientes (ajuste tenant_id conforme necessário)
SELECT id, tenant_id, cpf, name, created_at 
FROM patients 
WHERE tenant_id = 'seu-tenant-id'
ORDER BY created_at DESC
LIMIT 10;
```

**Verificar CPF com máscara vs normalizado**:

```sql
-- Buscar CPF específico (com máscara)
SELECT id, tenant_id, cpf, name 
FROM patients 
WHERE cpf LIKE '%061.288.474-04%';

-- Buscar CPF específico (sem máscara)
SELECT id, tenant_id, cpf, name 
FROM patients 
WHERE cpf LIKE '%06128847404%';

-- Verificar se há CPFs com caracteres não numéricos
SELECT id, cpf 
FROM patients 
WHERE cpf GLOB '*[^0-9]*';
-- (SQLite) Se retornar resultados, há CPFs com máscara armazenados
```

**Se houver CPFs com máscara**:
- Isso indica problema de normalização
- Planejar migração para normalizar todos os CPFs

### Verificar Vínculo com Consultório

**Se existir tabela de associação paciente↔consultório**:

```sql
-- Verificar se há tabela de associação (ex.: patient_clinic, patient_consultorio)
.tables

-- Se existir, verificar quantos pacientes têm vínculo
SELECT COUNT(DISTINCT patient_id) as pacientes_com_consultorio
FROM patient_clinic;  -- Ajuste nome da tabela

-- Verificar quantos pacientes NÃO têm vínculo
SELECT COUNT(*) as pacientes_sem_consultorio
FROM patients p
LEFT JOIN patient_clinic pc ON pc.patient_id = p.id
WHERE pc.patient_id IS NULL;
```

**Se a listagem depender de vínculo com consultório**:
- Pacientes sem vínculo não aparecerão na lista
- Isso explica por que pacientes antigos "sumiram"

**Confirmar que não há dependência indevida**:
- A listagem padrão **não** deve exigir vínculo com consultório
- Apenas quando filtro `clinic_id` for aplicado, deve restringir a pacientes com agendamentos naquele consultório

### Confirmar Consistência de Normalização

**Estratégia recomendada**:
- **Armazenar**: CPF sempre sem máscara (somente dígitos) no banco
- **Exibir**: Aplicar máscara no frontend para visualização
- **Validar**: Normalizar antes de comparar/validar

**Verificar se todos os CPFs estão normalizados**:

```sql
-- Contar CPFs com caracteres não numéricos
SELECT COUNT(*) 
FROM patients 
WHERE cpf GLOB '*[^0-9]*';
```

**Se houver CPFs não normalizados**:
- Planejar script de migração para normalizar todos
- Atualizar validação no backend para normalizar antes de salvar

---

## 5. Verificações no Frontend

### Localizar Serviço de Listagem

**Arquivo**: `src/services/api.ts` ou similar

**Função**: `fetchPatients` ou equivalente

**Verificar se após adição do seletor de consultório**:

1. **O frontend passou a incluir `clinicId` em todas as chamadas**:
   - Abrir `src/services/api.ts`
   - Localizar função `fetchPatients`
   - Verificar se `params` inclui `clinicId` ou `consultorioId` por padrão
   - Confirmar que é adicionado **somente** quando um consultório é selecionado

2. **A queryKey do React Query foi alterada**:
   - Procurar por `useQuery` que busca pacientes
   - Verificar `queryKey`: `['patients', tenantId, ...]`
   - Se houver `clinicId` na queryKey, confirmar que não está sendo definido como `undefined` ou `0` por padrão

3. **Há filtro local aplicado**:
   - Procurar por componente de lista de pacientes
   - Verificar se há `filter()` ou `useMemo` que filtra por consultório
   - Confirmar que o filtro é aplicado **somente** quando há seleção

### Corrigir para Filtro Opcional

**Ajustar serviço da lista**:

1. **Garantir que `clinicId` não é enviado por padrão**:
   ```typescript
   // ❌ ERRADO: Envia clinicId mesmo quando undefined
   const queryParams = {
     tenantId: params.tenantId,
     clinicId: params.clinicId  // Pode ser undefined
   };
   
   // ✅ CORRETO: Inclui clinicId apenas se fornecido
   const queryParams: Record<string, string | number> = {
     tenantId: params.tenantId,
   };
   
   if (params.clinicId) {
     queryParams.clinicId = params.clinicId;
   }
   ```

2. **Ajustar interface de parâmetros**:
   ```typescript
   export interface FetchPatientsParams {
     tenantId: string;
     search?: string;
     page?: number;
     page_size?: number;
     clinicId?: number;  // Opcional: somente quando filtro é aplicado
   }
   ```

**Garantir que seletor de consultório só altera lista quando selecionado**:

1. **Estado do filtro**:
   - Inicializar como `null` ou `undefined` (não `0` ou string vazia)
   - Aplicar filtro **somente** quando valor for válido (`> 0`)

2. **Resetar filtro**:
   - Botão "Limpar filtros" deve definir `clinicId = undefined`
   - Ao limpar, a lista deve voltar a exibir todos os pacientes

**Normalização de CPF no submit**:

1. **Ao salvar paciente**:
   - Remover máscara antes de enviar ao backend
   - Exemplo:
     ```typescript
     const cpfNormalized = cpf.replace(/\D/g, '');  // Remove não-dígitos
     const payload = {
       ...formData,
       cpf: cpfNormalized
     };
     ```

2. **Ao exibir CPF**:
   - Aplicar máscara apenas para visualização
   - Exemplo:
     ```typescript
     const formatCPF = (cpf: string) => {
       const digits = cpf.replace(/\D/g, '');
       return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
     };
     ```

**Invalidar cache após criar/editar**:

1. **Após criar paciente**:
   ```typescript
   queryClient.invalidateQueries({ queryKey: ['patients', tenantId] });
   ```

2. **Após editar paciente**:
   ```typescript
   queryClient.invalidateQueries({ queryKey: ['patients', tenantId] });
   ```

---

## 6. Plano de Correção (Sem Diffs)

### Backend

**1. Tornar `clinic_id` parâmetro opcional na listagem**

- Se o endpoint `GET /api/v1/patients` aceitar `clinic_id` como filtro:
  - Garantir que é **opcional** (`Optional[int] = Query(None)`)
  - Quando ausente, **não** aplicar `JOIN`/`WHERE` de consultório
  - Quando fornecido, aplicar filtro via `JOIN` com `Appointment` e `WHERE Appointment.consultorio_id == clinic_id`

- Se o endpoint **não** aceitar `clinic_id`:
  - **Não** adicionar este filtro agora (evitar complexidade desnecessária)
  - Focar em corrigir a listagem padrão

**2. Documentar claramente os filtros**

- Atualizar docstring do endpoint `list_patients`:
  - Listar todos os parâmetros aceitos: `tenantId`, `search`, `page`, `page_size`
  - Se `clinic_id` for implementado, documentar como opcional
  - Exemplos de uso no Swagger

**3. Normalizar CPF em criação/edição**

- Na função `create_patient`:
  - Normalizar CPF removendo caracteres não numéricos antes de validar unicidade
  - Normalizar antes de salvar no banco
  - Garantir que a validação de unicidade usa CPF normalizado **e** `tenant_id`

- Na função `update_patient` (se houver):
  - Aplicar mesma normalização se CPF for atualizado

**4. Revisar dependências de tenant**

- Garantir que `tenant_id` é extraído corretamente (query parameter `tenantId`)
- Confirmar que não há lógica que retorne lista vazia quando `tenant_id` é válido
- Se houver `Depends(get_current_tenant)`, verificar que não está ocultando resultados válidos

### Frontend

**1. Ajustar serviço da lista para não enviar `clinicId` por padrão**

- Na função `fetchPatients`:
  - Incluir `clinicId` nos `queryParams` **somente** se fornecido e válido
  - Não enviar `clinicId: undefined`, `clinicId: null` ou `clinicId: 0`

**2. Garantir que seletor de consultório só altera lista quando escolhido**

- No componente de lista de pacientes:
  - Estado inicial: `selectedClinicId = null` (não `0` ou `undefined`)
  - Aplicar filtro **somente** quando `selectedClinicId !== null && selectedClinicId > 0`
  - Botão "Limpar filtros" deve resetar para `null`

**3. Ao salvar paciente, strip de máscara do CPF antes do POST**

- No formulário de cadastro/edição:
  - Função de normalização: `const normalizeCPF = (cpf: string) => cpf.replace(/\D/g, '')`
  - Aplicar antes de enviar payload ao backend
  - Manter máscara apenas para exibição no input

**4. Invalidar/refresh da cache após criar/editar pacientes**

- Após mutation de criar paciente:
  - `queryClient.invalidateQueries({ queryKey: ['patients', tenantId] })`
- Após mutation de editar paciente:
  - `queryClient.invalidateQueries({ queryKey: ['patients', tenantId] })`

### Dados (Se Necessário)

**Backfill de CPFs para formato somente dígitos**

- Se houver CPFs armazenados com máscara:
  - Criar script de migração Python ou SQL
  - Normalizar todos os CPFs: `UPDATE patients SET cpf = REGEXP_REPLACE(cpf, '[^0-9]', '')`
  - Validar constraint de unicidade após migração
  - Executar em ambiente de teste antes de produção

**Checagem em migração**

- Adicionar validação que garante CPF sem caracteres não numéricos
- Se encontrar CPF com máscara, aplicar normalização automaticamente

---

## 7. Testes Manuais (Comandos)

### Sem Filtro (Deve Listar Todos)

```bash
# Listagem padrão (sem filtro de consultório)
curl -i "http://localhost:8000/api/v1/patients?tenantId=seu-tenant-id&page=1&page_size=10" \
  -H "Cookie: access_token=SEU_TOKEN"
```

**Resultado esperado**:
- Status: `200 OK`
- Body: `{"data": [...], "total": N, "page": 1, ...}` com array de pacientes

**Se retornar vazio**: Problema no backend (filtro indevido ou escopo incorreto)

### Com Filtro de Consultório (Se Existir)

```bash
# Se o endpoint aceitar clinic_id como filtro opcional
curl -i "http://localhost:8000/api/v1/patients?tenantId=seu-tenant-id&clinic_id=1&page=1&page_size=10" \
  -H "Cookie: access_token=SEU_TOKEN"
```

**Resultado esperado**:
- Status: `200 OK`
- Body: Array de pacientes que têm agendamentos no consultório ID 1

**Observação**: Se este retornar resultados mas a listagem sem filtro retornar vazio, o problema é que o filtro está sendo aplicado por padrão.

### Criação com CPF Normalizado

```bash
# CPF sem máscara (formato esperado)
curl -i -X POST "http://localhost:8000/api/v1/patients" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN" \
  -d '{
    "tenant_id": "seu-tenant-id",
    "name": "João Silva",
    "cpf": "06128847404",
    "phone": "11999999999",
    "address": "Rua Teste, 123",
    "email": "joao@example.com"
  }'
```

**Resultado esperado**:
- Se CPF não existe: Status `201 Created` com dados do paciente
- Se CPF já existe no mesmo tenant: Status `400 Bad Request` com mensagem "Patient with CPF 06128847404 already exists"

### Busca por CPF (Apenas Dígitos)

```bash
# Busca usando parâmetro search (se implementado)
curl -i "http://localhost:8000/api/v1/patients?tenantId=seu-tenant-id&search=06128847404" \
  -H "Cookie: access_token=SEU_TOKEN"
```

**Resultado esperado**:
- Status: `200 OK`
- Body: Array com paciente(s) cujo CPF contém "06128847404"

**Se encontrar**: Confirma que o paciente existe no banco mas não aparece na lista padrão (problema de filtro)

### Verificação no Swagger

1. Acessar `http://localhost:8000/docs`
2. Expandir `GET /api/v1/patients`
3. Verificar parâmetros documentados
4. Testar "Try it out" com `tenantId` válido
5. Confirmar que retorna lista de pacientes

---

## 8. Critérios de Aceite

A correção está completa quando todos os itens abaixo forem atendidos:

- [ ] **Pacientes existentes voltaram a aparecer na lista padrão**
  - Lista de pacientes exibe todos os registros do tenant (sem filtro de consultório)
  - Pacientes criados antes da implementação do seletor aparecem normalmente
  - Contador de pacientes corresponde ao total no banco

- [ ] **Criar novo paciente com CPF existente retorna erro somente quando de fato já existe no mesmo tenant**
  - Tentar criar paciente com CPF existente no mesmo tenant: retorna `400` com mensagem clara
  - Tentar criar paciente com CPF existente em outro tenant: retorna `201` (cria com sucesso)
  - Mensagem de erro é amigável: "Patient with CPF XXX already exists"

- [ ] **Filtro por consultório funciona apenas quando aplicado**
  - Lista padrão (sem filtro) exibe todos os pacientes do tenant
  - Ao selecionar consultório no filtro, lista apenas pacientes com agendamentos naquele consultório
  - Ao limpar filtro, lista volta a exibir todos os pacientes
  - Filtro nunca esconde todos os pacientes por padrão

- [ ] **Swagger reflete parâmetros e exemplos atualizados**
  - Endpoint `GET /api/v1/patients` documenta todos os parâmetros aceitos
  - Exemplos de request/response estão corretos
  - Se `clinic_id` for implementado, está documentado como opcional

- [ ] **CPF é enviado e armazenado normalizado**
  - Formulário envia CPF sem máscara (somente dígitos)
  - Backend armazena CPF sem máscara no banco
  - Validação de unicidade usa CPF normalizado
  - Busca por CPF funciona com ou sem máscara no termo de busca (normaliza internamente)

---

## 9. Observabilidade e Salvaguardas

### Logging e Métricas

**Adicionar logs na listagem de pacientes**:

- Logar filtros recebidos (sem PII):
  ```python
  logger.info(f"GET /api/v1/patients - tenant_id={tenant_id}, clinic_id={clinic_id}, search={search}, page={page}")
  ```

- Logar volume de resultados:
  ```python
  logger.info(f"GET /api/v1/patients - total={total}, returned={len(patients)}")
  ```

**Métricas**:
- Contar requisições de listagem por tenant
- Rastrear tempo de resposta (latência)
- Alertar se volume de resultados cair abaixo de threshold esperado

### Alertas

**Quedas bruscas no volume de resultados**:
- Se `total` de pacientes retornados for `0` mas o tenant tem pacientes cadastrados, gerar alerta
- Monitorar taxa de requisições que retornam lista vazia vs total de requisições

### Job/Bot Opcional

**Detectar CPFs armazenados com caracteres não numéricos**:
- Script periódico que verifica se há CPFs com máscara no banco
- Se encontrar, gerar relatório e aplicar normalização automática (se configurado)

---

## 10. Apêndice

### Notas sobre Erros HTTP

| Erro | Status HTTP | Causa | Como Identificar |
|------|-------------|-------|------------------|
| **404 Lógico (Depends)** | `404` | Rota existe, mas `Depends(get_tenant)` retorna 404 por segurança | Network tab mostra `404`, backend recebe requisição mas retorna 404 após validação. Log: "Tenant not found". Resposta: `{"detail": "Resource not found"}`. |
| **422 Validação** | `422` | Dados inválidos (ex.: CPF duplicado no mesmo tenant) | Network tab mostra `422`, resposta contém `{"detail": "Patient with CPF XXX already exists"}` ou array de erros de validação. |
| **401/403** | `401`/`403` | Não autenticado ou sem permissão | Network tab mostra `401`/`403`, resposta: `{"detail": "Not authenticated"}` ou `{"detail": "Not enough permissions"}`. |
| **400 Bad Request** | `400` | Requisição malformada ou regra de negócio violada | Network tab mostra `400`, resposta: `{"detail": "Patient with CPF XXX already exists"}` (quando CPF duplicado). |

**Para este caso específico**:
- Se `GET /api/v1/patients` retornar `200` com `{"data": [], "total": 0}`, o problema é filtro indevido ou escopo incorreto (não é 404).
- Se `POST /api/v1/patients` retornar `400` com "CPF already exists", o paciente existe mas não aparece na lista (problema de listagem, não de criação).

### Tabela de Parâmetros Recomendados para Pacientes

| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
|-----------|------|-------------|-----------|---------|
| `tenantId` | string | Sim | ID do tenant (isolamento multi-tenant) | `"tenant-123"` |
| `search` | string | Não | Buscar por nome ou CPF | `"João"` ou `"06128847404"` |
| `page` | integer | Não | Número da página (1-indexed, default: 1) | `1` |
| `page_size` | integer | Não | Itens por página (default: 50, max: 100) | `50` |
| `clinic_id` | integer | Não | Filtrar por consultório (opcional, somente quando filtro é aplicado) | `1` |
| `status` | string | Não | Filtrar por status (se implementado: "active", "inactive") | `"active"` |
| `include_inactive` | boolean | Não | Incluir pacientes inativos (se campo `is_active` existir) | `false` |

**Observação**: `clinic_id` deve ser implementado **somente** se houver necessidade de filtrar pacientes por consultório. Se não for necessário, **não** adicionar este filtro para evitar complexidade.

### Dicas de UX para Indicar Filtro Ativo

**Chips/Badges**:
- Exibir badge "Filtro: Consultório X" quando filtro de consultório estiver ativo
- Permitir clicar no badge para remover o filtro

**Botão "Limpar filtros"**:
- Exibir quando pelo menos um filtro estiver ativo
- Ao clicar, remover todos os filtros e recarregar lista completa

**Indicador visual**:
- Mostrar contador: "X pacientes" (quando sem filtro) vs "X pacientes encontrados" (quando com filtro)
- Destaque visual no seletor de consultório quando filtro está ativo

---

## Conclusão

Este documento fornece um guia completo para diagnosticar e corrigir o problema onde pacientes "sumiram" após a inclusão do seletor de consultório. Siga as seções na ordem apresentada para isolar a causa raiz e aplicar a correção adequada. Se após seguir todos os passos o problema persistir, verifique logs do backend e do navegador para identificar erros adicionais não cobertos neste guia.

**Prioridade de investigação**:
1. Verificar se há filtro por `clinic_id` sendo aplicado indevidamente na listagem
2. Confirmar normalização de CPF (máscara vs dígitos)
3. Validar escopo por `tenant_id` e dependências
4. Revisar estado/parâmetros no frontend que possam estar enviando `clinicId` por padrão

