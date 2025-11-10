# Correção: Erro "Appointment cannot be scheduled in the past"

## 1. Resumo do Problema

### Sintoma

Ao criar um agendamento no AlignWork, o frontend exibe erro: **"body.startsAt: Value error. Appointment cannot be scheduled in the past"**, mesmo quando o horário selecionado está no futuro (ex.: hoje às 22:00 local).

### Contexto

Após a inclusão do seletor de **Consultório** no formulário "Novo agendamento", a criação de agendamentos passou a falhar em horários próximos ao atual (ex.: hoje às 22:00), sugerindo problema de **timezone/serialização** entre frontend e backend.

### Causas Mais Prováveis (Priorizadas)

**1. Comparação no backend usando timezone incorreto**
- O backend usa `datetime.now(dt.tzinfo)` para comparar com `starts_at` recebido.
- Se `dt.tzinfo` for UTC mas o servidor estiver em outro timezone (ou vice-versa), a comparação pode falhar.
- **Problema**: Deveria sempre usar `datetime.now(timezone.utc)` para comparação, independente do timezone do `starts_at` recebido.

**2. Serialização incorreta no frontend**
- O frontend usa `dayjs.tz(payload.startsAtLocal, 'America/Recife').utc().toISOString()`.
- Se `startsAtLocal` estiver em formato incorreto (ex.: sem timezone explícito), a conversão pode gerar UTC incorreto.
- **Problema**: O formato `"YYYY-MM-DD HH:mm"` não tem timezone, então `dayjs.tz(..., 'America/Recife')` assume que é local, mas pode haver ambiguidade.

**3. Fuso do servidor diferente do fuso do usuário**
- Servidor pode estar em UTC, enquanto o usuário está em `America/Recife` (-03:00).
- Se o frontend envia `22:00-03:00` (01:00Z do dia seguinte), mas o backend compara com `now()` do servidor (que pode estar em outro timezone), pode gerar falsos positivos de "passado".

**4. Clock skew (descompasso de relógio)**
- Relógio do servidor pode estar descompassado (adiantado ou atrasado) em relação ao relógio do cliente.
- Validação usando `now()` antes de normalizar o offset de entrada pode gerar comparação incorreta.

**5. Arredondamento de minuto/segundo**
- Cliente envia `22:00:00.000Z` (UTC), que corresponde a `19:00` local no backend se o servidor estiver em UTC-03.
- Se a validação não considerar margem de segurança (ex.: permitir até 1 minuto no passado para compensar latência), pode falhar.

---

## 2. Como Reproduzir e Coletar Evidências

### Passos para Reproduzir

1. **Iniciar backend e frontend**:
   ```bash
   # Backend
   cd backend
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   
   # Frontend
   npm run dev
   ```

2. **Abrir DevTools → Network**:
   - Filtrar por "appointments" ou "XHR"
   - Navegar até "Novo agendamento"
   - Preencher formulário com data de hoje e horário atual (ex.: 22:00)
   - Clicar em "Agendar"

3. **Capturar requisição**:
   - Localizar `POST /api/v1/appointments`
   - Anotar **Request Payload**: `startsAt` exatamente como enviado
   - Anotar **Response**: Status e mensagem de erro

### Logs no Backend

**Adicionar logs temporários** na função `create_appointment` (`backend/routes/appointments.py`):

```python
# Logar valores recebidos
print(f"🔍 DEBUG starts_at recebido: {appointment.startsAt}")
print(f"🔍 DEBUG starts_at tipo: {type(appointment.startsAt)}")

# Após parsing
starts_at = datetime.fromisoformat(appointment.startsAt.replace('Z', '+00:00'))
print(f"🔍 DEBUG starts_at parsed: {starts_at}")
print(f"🔍 DEBUG starts_at tzinfo: {starts_at.tzinfo}")

# Logar now() do servidor
now_utc = datetime.now(timezone.utc)
now_local = datetime.now()
print(f"🔍 DEBUG now (UTC): {now_utc}")
print(f"🔍 DEBUG now (local): {now_local}")
print(f"🔍 DEBUG comparação: {starts_at} < {now_utc} = {starts_at < now_utc}")
```

**Observar a saída do console** ao reproduzir o erro e anotar os valores.

### Testes Diretos na API

#### 2.1 — Descobrir Fuso/Now do Servidor

**Criar endpoint temporário de debug** (ou usar `/health` se existir):

```bash
# Se houver endpoint /health ou /debug
curl -i "http://localhost:8000/health"
```

**Ou adicionar temporariamente em `main.py`**:
```python
@app.get("/debug/time")
async def debug_time():
    from datetime import datetime, timezone
    return {
        "now_utc": datetime.now(timezone.utc).isoformat(),
        "now_local": datetime.now().isoformat(),
        "server_tz": str(datetime.now().astimezone().tzinfo)
    }
```

**Testar**:
```bash
curl -i "http://localhost:8000/debug/time"
```

**Resultado esperado**: JSON com `now_utc`, `now_local` e `server_tz` para identificar o timezone do servidor.

#### 2.2 — Testar Criação com Horário Local e Offset

```bash
# Horário local: hoje às 22:00 em -03:00 (America/Recife)
# Isso corresponde a 01:00Z do dia seguinte
curl -i -X POST "http://localhost:8000/api/v1/appointments" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN" \
  -d '{
    "tenantId": "seu-tenant-id",
    "patientId": 1,
    "startsAt": "2025-11-09T22:00:00-03:00",
    "durationMin": 60,
    "status": "pending",
    "consultorioId": 1
  }'
```

**Resultado esperado**: 
- Se aceitar offset: Status `201 Created`
- Se rejeitar: Status `422` com mensagem sobre timezone

#### 2.3 — Testar com o Mesmo Horário em UTC

```bash
# 22:00-03:00 == 01:00Z do dia seguinte
curl -i -X POST "http://localhost:8000/api/v1/appointments" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN" \
  -d '{
    "tenantId": "seu-tenant-id",
    "patientId": 1,
    "startsAt": "2025-11-10T01:00:00Z",
    "durationMin": 60,
    "status": "pending",
    "consultorioId": 1
  }'
```

**Resultado esperado**: Status `201 Created` (se o horário estiver no futuro em UTC)

**Comparar resultados**: Se 2.2 falhar mas 2.3 passar, o problema é na conversão de offset para UTC ou na comparação usando timezone incorreto.

---

## 3. Contrato e Convenções de Tempo (Decisão)

### Convenção Oficial Recomendada: UTC End-to-End

**Opção A (Recomendada): API sempre recebe e retorna UTC**

- **Frontend**: Sempre converte do fuso do usuário para UTC ao enviar (`toISOString()` com `Z`).
- **Backend**: Sempre recebe, valida e armazena em UTC.
- **Respostas**: Sempre retornam timestamps em UTC (`Z`).
- **Exibição**: Frontend converte de UTC → fuso local do usuário para exibir.

**Vantagens**:
- Consistência: não há ambiguidade de timezone
- Simplicidade: backend sempre trabalha com UTC
- Performance: não precisa converter em múltiplos pontos

**Desvantagens**:
- Frontend precisa gerenciar conversões (mas bibliotecas como dayjs facilitam)

### Alternativa: API Recebe e Retorna com Offset

**Opção B: API recebe e retorna com offset explícito**

- **Frontend**: Envia timestamp com offset do usuário (ex.: `-03:00`).
- **Backend**: Normaliza para UTC antes de persistir/validar, mas aceita offset na entrada.
- **Respostas**: Retornam com offset ou UTC (conforme configuração).

**Vantagens**:
- Flexibilidade: suporta múltiplos fusos sem conversão no frontend

**Desvantagens**:
- Complexidade: backend precisa normalizar múltiplos formatos
- Ambiguidade: pode haver confusão entre offset e UTC

### Decisão para Este Projeto

**Recomendação**: Adotar **Opção A (UTC end-to-end)**.

**Justificativa**:
- O projeto já usa `toISOString()` no frontend (gera UTC)
- Backend já valida timestamps com timezone
- Simplifica validações e comparações

### Regras de Contrato

**1. `starts_at` sempre com timezone explícito**:
- Formato aceito: `YYYY-MM-DDTHH:mm:ssZ` (UTC) ou `YYYY-MM-DDTHH:mm:ss±HH:MM` (offset)
- **Não aceitar**: Timestamps naive (sem timezone)

**2. Comparações de "passado/futuro" sempre em UTC**:
- Backend deve usar `datetime.now(timezone.utc)` para comparação
- **Não usar**: `datetime.now(dt.tzinfo)` (usa timezone do timestamp recebido)

**3. Banco salva em UTC**:
- Coluna `starts_at` armazena datetime em UTC
- Índices criados em `starts_at` para performance

**4. Respostas sempre em UTC**:
- API retorna `starts_at` com sufixo `Z` (UTC)
- Frontend converte para exibição local

---

## 4. Pontos de Falha Comuns e Como Checar

### Frontend (React)

**1. Evitar `new Date(local).toISOString()` quando `local` já está no horário do usuário**

**Problema**:
```typescript
// ❌ ERRADO: Se dataLocal já está em -03:00, toISOString() converte para UTC
const dataLocal = "2025-11-09 22:00"; // Assumido como -03:00
const startsAt = new Date(dataLocal).toISOString(); // Pode gerar UTC incorreto
```

**Solução**:
```typescript
// ✅ CORRETO: Usar dayjs com timezone explícito
const startsAtUTC = dayjs.tz(`${dataLocal}`, 'America/Recife').utc().toISOString();
```

**2. Combinar data + hora corretamente**

**Problema**: Se `data` e `horaInicio` são strings separadas, a concatenação pode gerar formato inválido.

**Solução**: Garantir formato `"YYYY-MM-DD HH:mm"` antes de converter:
```typescript
const dataLocal = dayjs(formData.data).format('YYYY-MM-DD');
const startsAtLocal = `${dataLocal} ${formData.horaInicio}`; // "2025-11-09 22:00"
const startsAtUTC = dayjs.tz(startsAtLocal, 'America/Recife').utc().toISOString();
```

**3. Zerar segundos/millis se necessário**

**Problema**: Se `horaInicio` incluir segundos (ex.: `22:00:30`), pode gerar timestamp com frações.

**Solução**: Garantir que segundos/millis sejam zerados:
```typescript
const startsAtUTC = dayjs.tz(startsAtLocal, 'America/Recife')
  .second(0)
  .millisecond(0)
  .utc()
  .toISOString();
```

**4. Garantir que `clinic_id`/`patient_id` são números**

**Problema**: Se enviados como string, podem causar erro de validação antes da verificação de timezone.

**Solução**: Converter explicitamente:
```typescript
const body = {
  patientId: Number(payload.patientId),
  consultorioId: payload.consultorioId ? Number(payload.consultorioId) : undefined,
  // ...
};
```

### Backend (FastAPI/Pydantic)

**1. Validar que `starts_at` é timezone-aware**

**Problema**: Se receber timestamp naive, a comparação pode falhar.

**Solução**: Rejeitar timestamps sem timezone:
```python
if dt.tzinfo is None:
    raise ValueError('startsAt must include timezone information (use Z or +00:00 for UTC)')
```

**2. Converter para UTC imediatamente**

**Problema**: Se receber com offset (ex.: `-03:00`), deve normalizar para UTC antes de comparar.

**Solução**:
```python
# Converter para UTC antes de validar
starts_at_utc = dt.astimezone(timezone.utc)
```

**3. Usar `datetime.now(timezone.utc)` para comparação**

**Problema**: Usar `datetime.now(dt.tzinfo)` compara com o timezone do timestamp recebido, não com UTC.

**Solução**:
```python
# ❌ ERRADO
now = datetime.now(dt.tzinfo)  # Usa timezone do timestamp recebido
if dt < now:
    raise ValueError('Appointment cannot be scheduled in the past')

# ✅ CORRETO
now_utc = datetime.now(timezone.utc)  # Sempre UTC
starts_at_utc = dt.astimezone(timezone.utc)  # Normalizar para UTC
if starts_at_utc < now_utc:
    raise ValueError('Appointment cannot be scheduled in the past')
```

**4. Mensagens de erro informativas**

**Problema**: Mensagem genérica não ajuda a depurar.

**Solução**: Incluir horário recebido e horário atual:
```python
if starts_at_utc < now_utc:
    raise ValueError(
        f'Appointment cannot be scheduled in the past. '
        f'Received: {starts_at_utc.isoformat()}Z, '
        f'Current: {now_utc.isoformat()}Z'
    )
```

### Infra/Relógio

**1. Verificar `TZ` do processo**

**Problema**: Se o processo Python não tiver `TZ` definido, `datetime.now()` pode usar timezone do sistema.

**Solução**: Definir `TZ=UTC` no ambiente ou usar sempre `timezone.utc`:
```python
# Sempre usar UTC explicitamente
now = datetime.now(timezone.utc)
```

**2. NTP/Clock Sync**

**Problema**: Se o relógio do servidor estiver descompassado, comparações podem falhar.

**Solução**: 
- Verificar sincronização NTP: `ntpdate -q pool.ntp.org`
- Considerar margem de segurança (ex.: permitir até 1 minuto no "passado" para compensar latência)

**3. Logs com timestamps em UTC**

**Problema**: Se logs usam timezone local, dificulta depuração.

**Solução**: Configurar logs para usar UTC:
```python
import logging
logging.Formatter.default_time_format = '%Y-%m-%d %H:%M:%S UTC'
```

---

## 5. Plano de Correção (Sem Diffs)

### Escolher a Convenção

**Recomendação**: Adotar **UTC end-to-end** (Opção A).

**Justificativa**:
- Já está parcialmente implementado (frontend usa `toISOString()`)
- Simplifica validações no backend
- Evita ambiguidade de timezone

### Backend

**1. No schema/validador: normalizar para UTC antes de comparar**

- No `@validator('startsAt')` de `AppointmentCreate`:
  - Exigir que `starts_at` tenha timezone (rejeitar naive)
  - Converter para UTC imediatamente: `starts_at_utc = dt.astimezone(timezone.utc)`
  - Comparar com `datetime.now(timezone.utc)` (não `datetime.now(dt.tzinfo)`)
  - Retornar `starts_at_utc.isoformat()` (ou manter UTC para persistência)

**2. No repositório: persistir em UTC**

- Na função `create_appointment`:
  - Usar `starts_at_utc` (já normalizado) para salvar no banco
  - Garantir que a coluna `starts_at` armazena datetime em UTC

**3. Responses sempre em UTC**

- No `AppointmentResponse`:
  - Retornar `starts_at` com sufixo `Z` (UTC)
  - Exemplo: `"2025-11-10T01:00:00Z"`

**4. Ajustar testes de unidade/integração**

- Criar testes que cobrem:
  - Entrada com `Z` (UTC): `"2025-11-10T01:00:00Z"`
  - Entrada com offset equivalente: `"2025-11-09T22:00:00-03:00"` (deve gerar mesmo UTC)
  - Entrada naive: deve rejeitar com erro claro
  - Horário 5 min no passado: deve falhar
  - Horário 5 min no futuro: deve passar

### Frontend

**1. Ao submeter: construir `starts_at` de forma determinística**

- No `useAppointmentMutations.ts`:
  - Garantir que `startsAtLocal` está no formato `"YYYY-MM-DD HH:mm"` (sem timezone)
  - Usar `dayjs.tz(startsAtLocal, 'America/Recife')` para interpretar como local
  - Converter para UTC: `.utc().toISOString()`
  - Garantir que segundos/millis são zerados

**2. Exibir mensagens de erro do backend**

- No tratamento de erro:
  - Capturar `error.response?.data?.detail` (mensagem do backend)
  - Exibir mensagem completa (não genérica)
  - Se houver horários na mensagem, destacar para o usuário

**3. Validar horário antes de enviar (opcional)**

- Adicionar validação no frontend:
  - Converter `startsAtLocal` para UTC
  - Comparar com `now()` em UTC
  - Se estiver no passado, exibir erro antes de enviar ao backend

### Observabilidade

**Adicionar log estruturado**:

- Na função `create_appointment`:
  - Logar `starts_at_original` (string recebida)
  - Logar `starts_at_utc` (após normalização)
  - Logar `now_utc` (horário atual do servidor)
  - Logar resultado da comparação (passado/futuro)

**Exemplo de log**:
```python
logger.info(
    f"POST /api/v1/appointments - "
    f"starts_at_original={appointment.startsAt}, "
    f"starts_at_utc={starts_at_utc.isoformat()}Z, "
    f"now_utc={now_utc.isoformat()}Z, "
    f"is_past={starts_at_utc < now_utc}"
)
```

**Sem PII**: Não logar `patient_id` ou `tenant_id` em logs de produção (apenas em debug).

---

## 6. Testes Manuais e de Contrato

### Caso Feliz (UTC)

**Teste 1: Horário futuro em UTC**

```bash
# Hoje às 22:00 em -03:00 => 01:00Z do dia seguinte
# Ajuste a data para um horário futuro
curl -i -X POST "http://localhost:8000/api/v1/appointments" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN" \
  -d '{
    "tenantId": "seu-tenant-id",
    "patientId": 1,
    "startsAt": "2025-11-10T01:00:00Z",
    "durationMin": 60,
    "status": "pending",
    "consultorioId": 1
  }'
```

**Resultado esperado**: Status `201 Created` com objeto do agendamento.

### Equivalência com Offset (Se Suportado)

**Teste 2: Mesmo horário com offset**

```bash
# 22:00-03:00 == 01:00Z (deve gerar mesmo resultado)
curl -i -X POST "http://localhost:8000/api/v1/appointments" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN" \
  -d '{
    "tenantId": "seu-tenant-id",
    "patientId": 1,
    "startsAt": "2025-11-09T22:00:00-03:00",
    "durationMin": 60,
    "status": "pending",
    "consultorioId": 1
  }'
```

**Resultado esperado**: 
- Se suportar offset: Status `201 Created` (mesmo resultado do Teste 1)
- Se não suportar: Status `422` com mensagem sobre formato de timezone

### Validação "Passado" Controlada

**Teste 3: Horário 5 minutos no passado (deve falhar)**

```bash
# Calcular horário 5 min atrás em UTC
# Exemplo: Se agora é 01:00Z, usar 00:55Z
curl -i -X POST "http://localhost:8000/api/v1/appointments" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN" \
  -d '{
    "tenantId": "seu-tenant-id",
    "patientId": 1,
    "startsAt": "2025-11-10T00:55:00Z",
    "durationMin": 60,
    "status": "pending",
    "consultorioId": 1
  }'
```

**Resultado esperado**: Status `422` com mensagem "Appointment cannot be scheduled in the past".

**Teste 4: Horário 5 minutos no futuro (deve passar)**

```bash
# Calcular horário 5 min à frente em UTC
# Exemplo: Se agora é 01:00Z, usar 01:05Z
curl -i -X POST "http://localhost:8000/api/v1/appointments" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN" \
  -d '{
    "tenantId": "seu-tenant-id",
    "patientId": 1,
    "startsAt": "2025-11-10T01:05:00Z",
    "durationMin": 60,
    "status": "pending",
    "consultorioId": 1
  }'
```

**Resultado esperado**: Status `201 Created`.

### Lista por Intervalo (Confirma Persistência)

**Teste 5: Verificar agendamento criado**

```bash
# Listar agendamentos do intervalo
curl -i "http://localhost:8000/api/v1/appointments?tenantId=seu-tenant-id&from=2025-11-09T00:00:00Z&to=2025-11-10T06:00:00Z" \
  -H "Cookie: access_token=SEU_TOKEN"
```

**Resultado esperado**: Status `200 OK` com array contendo o agendamento criado, com `starts_at` em UTC.

### Teste de Timestamp Naive (Deve Rejeitar)

**Teste 6: Timestamp sem timezone**

```bash
# Timestamp naive (sem Z ou offset)
curl -i -X POST "http://localhost:8000/api/v1/appointments" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN" \
  -d '{
    "tenantId": "seu-tenant-id",
    "patientId": 1,
    "startsAt": "2025-11-10T01:00:00",
    "durationMin": 60,
    "status": "pending",
    "consultorioId": 1
  }'
```

**Resultado esperado**: Status `422` com mensagem "startsAt must include timezone information (use Z or +00:00 for UTC)".

---

## 7. Checklist de Aceitação

A correção está completa quando todos os itens abaixo forem atendidos:

- [ ] **Agendamentos criados para "hoje 22:00" não falham por passado**
  - Quando a hora local ainda não ocorreu (ex.: são 21:00 e usuário agenda 22:00), o agendamento é criado com sucesso
  - Não há erro "Appointment cannot be scheduled in the past" para horários futuros

- [ ] **`starts_at` com timezone é aceito; entradas naive são rejeitadas**
  - Timestamp com `Z` (UTC): aceito
  - Timestamp com offset (ex.: `-03:00`): aceito (se suportado) ou convertido para UTC
  - Timestamp naive (sem timezone): rejeitado com erro claro

- [ ] **Backend armazena/retorna UTC e comparação usa `now()` em UTC**
  - Coluna `starts_at` no banco armazena datetime em UTC
  - Validação usa `datetime.now(timezone.utc)` para comparação
  - Response retorna `starts_at` com sufixo `Z` (UTC)

- [ ] **Front exibe e envia horários de forma consistente**
  - Ao enviar: converte horário local → UTC usando `toISOString()`
  - Ao exibir: converte UTC → horário local do usuário
  - Formato de data/hora no formulário é claro (ex.: "DD/MM/YYYY HH:mm")

- [ ] **Swagger documenta a convenção e exemplos**
  - Endpoint `POST /api/v1/appointments` documenta formato de `startsAt`
  - Exemplos incluem UTC (`Z`) e offset (`±HH:MM`) se suportado
  - Mensagens de erro são claras sobre timezone requerido

---

## 8. Apêndice

### Guia Sucinto de Formatação ISO 8601

**Formato UTC (recomendado)**:
```
YYYY-MM-DDTHH:mm:ssZ
```
- Exemplo: `2025-11-10T01:00:00Z`
- `Z` indica UTC (Zulu time)
- Equivalente a `+00:00`

**Formato com Offset**:
```
YYYY-MM-DDTHH:mm:ss±HH:MM
```
- Exemplo: `2025-11-09T22:00:00-03:00`
- `-03:00` indica 3 horas atrás de UTC (America/Recife)
- `+05:30` indica 5 horas e 30 minutos à frente de UTC

**Formato com Millisegundos (opcional)**:
```
YYYY-MM-DDTHH:mm:ss.sssZ
```
- Exemplo: `2025-11-10T01:00:00.000Z`
- Geralmente não necessário para agendamentos (zerar segundos/millis)

**Formato Date-Only (não usar para timestamps)**:
```
YYYY-MM-DD
```
- Exemplo: `2025-11-10`
- Não inclui hora, não usar para `starts_at`

### Tabela de Conversão (Local -03:00 → UTC)

| Horário Local (America/Recife) | UTC Equivalente | Observação |
|--------------------------------|-----------------|------------|
| 22:00 (09/11) | 01:00 (10/11) | Dia seguinte em UTC |
| 00:00 (10/11) | 03:00 (10/11) | Mesmo dia em UTC |
| 12:00 (10/11) | 15:00 (10/11) | Mesmo dia em UTC |
| 23:59 (10/11) | 02:59 (11/11) | Dia seguinte em UTC |

**Regra geral**: Para converter de `-03:00` para UTC, **adicionar 3 horas**.

**Exemplo prático**:
- Usuário seleciona: **09/11/2025 às 22:00** (local)
- Frontend envia: `2025-11-10T01:00:00Z` (UTC)
- Backend valida: Compara `01:00Z` com `now()` em UTC
- Backend armazena: `2025-11-10 01:00:00` (UTC no banco)
- Frontend exibe: Converte `01:00Z` → `22:00` local para mostrar ao usuário

### Diferença entre `toISOString()` e `toLocaleString()`

**`toISOString()` (sempre UTC)**:
```javascript
const date = new Date('2025-11-09T22:00:00-03:00');
date.toISOString(); // "2025-11-10T01:00:00.000Z" (UTC)
```
- **Uso**: Enviar para API (sempre UTC)
- **Formato**: `YYYY-MM-DDTHH:mm:ss.sssZ`

**`toLocaleString()` (apenas display)**:
```javascript
const date = new Date('2025-11-10T01:00:00Z');
date.toLocaleString('pt-BR', { timeZone: 'America/Recife' }); // "09/11/2025 22:00:00" (local)
```
- **Uso**: Exibir para usuário (converte para timezone local)
- **Formato**: Depende da locale (pt-BR, en-US, etc.)

**Recomendação**: 
- **Enviar**: Usar `toISOString()` (UTC)
- **Exibir**: Usar `toLocaleString()` ou `dayjs().tz('America/Recife').format()`

### Exemplo de Fluxo Completo

**1. Usuário seleciona no formulário**:
- Data: 09/11/2025
- Hora: 22:00

**2. Frontend constrói timestamp local**:
```typescript
const dataLocal = "2025-11-09";
const horaInicio = "22:00";
const startsAtLocal = `${dataLocal} ${horaInicio}`; // "2025-11-09 22:00"
```

**3. Frontend converte para UTC**:
```typescript
const startsAtUTC = dayjs.tz(startsAtLocal, 'America/Recife').utc().toISOString();
// Resultado: "2025-11-10T01:00:00.000Z"
```

**4. Frontend envia ao backend**:
```json
{
  "tenantId": "tenant-123",
  "patientId": 1,
  "startsAt": "2025-11-10T01:00:00.000Z",
  "durationMin": 60,
  "consultorioId": 1
}
```

**5. Backend recebe e valida**:
- Parse: `datetime.fromisoformat("2025-11-10T01:00:00+00:00")`
- Normaliza: `starts_at_utc = dt.astimezone(timezone.utc)` → `2025-11-10 01:00:00+00:00`
- Compara: `starts_at_utc < datetime.now(timezone.utc)` → `False` (se 01:00Z está no futuro)
- Persiste: Salva `2025-11-10 01:00:00` (UTC) no banco

**6. Backend retorna**:
```json
{
  "id": 456,
  "starts_at": "2025-11-10T01:00:00Z",
  // ...
}
```

**7. Frontend exibe**:
- Converte UTC → local: `dayjs("2025-11-10T01:00:00Z").tz('America/Recife')` → `09/11/2025 22:00`
- Mostra ao usuário: "09 de novembro de 2025 às 22:00"

---

## Conclusão

Este documento fornece um guia completo para diagnosticar e corrigir o erro "Appointment cannot be scheduled in the past" relacionado a timezone/serialização. Siga as seções na ordem apresentada para isolar a causa raiz e aplicar a correção adequada.

**Prioridade de investigação**:
1. Verificar se o backend usa `datetime.now(timezone.utc)` para comparação (não `datetime.now(dt.tzinfo)`)
2. Confirmar que o frontend converte corretamente de local → UTC antes de enviar
3. Validar que timestamps são sempre timezone-aware (não naive)
4. Verificar se há clock skew ou problema de timezone do servidor

**Convenção recomendada**: UTC end-to-end (frontend envia UTC, backend valida/armazena UTC, frontend converte para exibição local).

