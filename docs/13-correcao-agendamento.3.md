# Correção: Validação de Horários Passados no Frontend

## 1. Resumo do Problema (Com Evidência)

### Sintoma

O backend retorna erro ao criar agendamento:

```
body.startsAt: Value error. Appointment cannot be scheduled in the past.
Received: 2025-11-10T01:00:00+00:00Z, Current: 2025-11-10T02:21:18.729499+00:00Z
```

### Análise da Evidência

**Cenário reproduzido**:
- Usuário seleciona: **09 de novembro de 2025, 22:00** (fuso horário `America/Recife`, UTC-03:00)
- Frontend converte corretamente: `2025-11-10T01:00:00Z` (22:00 local = 01:00Z do dia seguinte)
- Backend recebe a requisição às **02:21Z** (servidor em UTC)
- Backend compara: `01:00Z < 02:21Z` → **válido** (horário está no passado)
- Backend retorna: `422 Unprocessable Entity` com mensagem de erro

### Causa Raiz

**A conversão local (-03) → UTC está correta**: 22:00 local = 01:00Z do dia seguinte.

**O backend está correto**: compara `starts_at_utc` com `now_utc` e detecta corretamente que o horário está no passado (01:00Z < 02:21Z).

**O problema é UX/validação no frontend**:
- Falta de **guardrail no front** para impedir horas passadas no **dia atual** do usuário
- O datepicker/timepicker permitiu selecionar 22:00 quando já eram aproximadamente **23:21 local** (ou seja, o horário selecionado já havia passado)
- O frontend não valida se o horário está no passado **antes de enviar** ao backend
- Mensagens de erro são pouco orientativas e não oferecem ação corretiva

### Impactos

- **Frustração do usuário**: tenta agendar, recebe erro, não entende o motivo
- **Reintentos desnecessários**: usuário tenta novamente com o mesmo horário inválido
- **Tickets de suporte**: aumento de suporte por causa de erro evitável
- **Perda de confiança**: sistema parece "bugado" quando na verdade está funcionando corretamente

---

## 2. Decisão de Contrato de Tempo

### Padrão Oficial

**API recebe e retorna UTC (`Z`) e o front converte local ↔ UTC**.

### Regras de Contrato

1. **Campos sempre timezone-aware**: valores **naive** (sem timezone) são rejeitados pelo backend
2. **Comparações sempre em UTC**: backend sempre compara em UTC, independente do timezone do timestamp recebido
3. **Conversão no frontend**: frontend é responsável por converter horário local do usuário para UTC antes de enviar
4. **Exibição local**: frontend converte UTC recebido do backend para timezone local do usuário para exibir

### Formato Aceito

- **UTC**: `YYYY-MM-DDTHH:mm:ssZ` (ex.: `2025-11-10T01:00:00Z`)
- **Offset**: `YYYY-MM-DDTHH:mm:ss±HH:MM` (ex.: `2025-11-09T22:00:00-03:00`)
- **Não aceito**: timestamps naive (ex.: `2025-11-10T01:00:00`)

### Exemplo de Fluxo

1. Usuário seleciona: **09/11/2025, 22:00** (local, -03:00)
2. Frontend converte: `2025-11-10T01:00:00Z` (UTC)
3. Frontend envia ao backend: `startsAt: "2025-11-10T01:00:00Z"`
4. Backend valida: compara `01:00Z` com `now_utc` (ex.: `02:21Z`)
5. Backend retorna: `422` se passado, `201` se futuro
6. Frontend exibe: converte UTC recebido para local (ex.: `09/11/2025, 22:00`)

---

## 3. Regras de UX e Validação no Frontend

### Regra F1: Bloqueio de Horários Passados no Dia Atual

**Quando**: `dataSelecionada` = hoje (data atual do usuário)

**Ação**: Bloquear horários anteriores ao **agora local arredondado** para os mesmos intervalos usados na grade de horários (5/10/15 minutos).

**Implementação**:
- Calcular `agoraLocal` = horário atual no timezone do usuário
- Arredondar para cima para o próximo slot (ex.: se são 23:17, arredondar para 23:20 ou 23:30, dependendo da grade)
- Desabilitar todas as opções de hora **< agoraLocal arredondado**
- Exibir tooltip ou mensagem discreta: "Horários passados não estão disponíveis"

**Exemplo**:
- Agora: 23:17 local
- Próximo slot: 23:30 (se grade de 30 min) ou 23:20 (se grade de 10 min)
- Bloquear: 22:00, 22:30, 23:00
- Permitir: 23:30, 00:00 (do dia seguinte)

### Regra F2: Permissão para Outros Dias

**Quando**: `dataSelecionada` ≠ hoje

**Ação**: Permitir qualquer horário dentro do expediente (ex.: 08:00 - 20:00).

**Justificativa**: Não há necessidade de bloquear horários passados em dias futuros, pois o usuário pode estar agendando para qualquer momento futuro.

### Regra F3: Ajuste Automático ao Trocar Data/Hora

**Quando**: Usuário altera a data ou hora e o horário selecionado cai no passado para aquela data

**Ação**:
- **Ajustar automaticamente** para o próximo slot válido
- Exibir aviso **não bloqueante** (toast ou mensagem discreta): "Horário ajustado para [próximo slot]"

**Exemplo**:
- Usuário seleciona: hoje, 22:00
- Sistema detecta: 22:00 já passou (são 23:21)
- Sistema ajusta: para 23:30 (próximo slot)
- Sistema exibe: "Horário ajustado para 23:30"

### Regra F4: Grace Period (Tolerância)

**Quando**: Opcional, para compensar latência e drift de relógio

**Ação**: Adotar **tolerância configurável** (ex.: 5 minutos) para permitir pequenas diferenças entre relógio do cliente e servidor.

**Implementação**:
- Configurar `GRACE_PERIOD_MINUTES = 5` (ou via env)
- Considerar horário válido se: `starts_at_utc >= now_utc - grace_period`
- Aplicar tanto no frontend (pré-validação) quanto no backend (validação final)

**Exemplo**:
- Agora: 23:17 local (02:17Z)
- Grace: 5 minutos
- Horário mínimo aceito: 23:12 local (02:12Z)
- Horário bloqueado: 23:11 local (02:11Z)

### Regra F5: Mensagem Clara e Ação Corretiva

**Quando**: Backend retorna `422` com código `PAST_START`

**Ação**:
- Exibir mensagem descritiva: **"O horário selecionado já passou na sua região. Selecione um novo horário."**
- **Sugerir** o próximo slot válido (ex.: "Próximo horário disponível: 23:30")
- Exibir botão **"Usar próximo horário livre"** que pré-preenche o formulário com o horário sugerido

**Exemplo de UI**:
```
┌─────────────────────────────────────────┐
│ ⚠️ Horário inválido                     │
│                                         │
│ O horário selecionado (22:00) já       │
│ passou na sua região.                  │
│                                         │
│ Próximo horário disponível: 23:30      │
│                                         │
│ [Usar 23:30]  [Cancelar]               │
└─────────────────────────────────────────┘
```

### Regra F6: Pré-validação Antes do Submit

**Quando**: Usuário clica em "Agendar" (antes de enviar POST)

**Ação**:
1. Construir `starts_at_utc` a partir de `dataSelecionada` + `horaSelecionada`
2. Obter `now_utc` = `Date.now()` convertido para UTC
3. Comparar: se `starts_at_utc < now_utc - grace_period`, **impedir envio**
4. Exibir mensagem de erro no formulário (não toast genérico)
5. Destacar campo de hora com borda vermelha

**Implementação**:
```typescript
// Pseudocódigo (não é código real, apenas diretriz)
const startsAtLocal = `${dataSelecionada} ${horaSelecionada}`;
const startsAtUTC = dayjs.tz(startsAtLocal, 'America/Recife').utc();
const nowUTC = dayjs.utc();
const gracePeriod = dayjs.duration(5, 'minutes');

if (startsAtUTC.isBefore(nowUTC.subtract(gracePeriod))) {
  // Bloquear submit e exibir erro
  setError('hora', 'Este horário já passou. Selecione um horário futuro.');
  return;
}
```

---

## 4. Ajustes no Backend (Sem Diffs)

### Validação de `starts_at`

**Requisitos**:
1. `starts_at` deve ser **timezone-aware** (rejeitar naive)
2. Normalizar para UTC: `starts_at_utc = dt.astimezone(timezone.utc)`
3. Comparar com `now_utc = datetime.now(timezone.utc)`
4. Aplicar grace period se configurado

**Implementação sugerida**:
- No validador `@validator('startsAt')`:
  - Parse do timestamp recebido
  - Verificar timezone (rejeitar naive)
  - Normalizar para UTC
  - Comparar com `now_utc` considerando grace period
  - Retornar erro estruturado se inválido

### Grace Period Configurável

**Variável de ambiente**: `APPOINTMENT_MIN_LEAD_TIME_MINUTES` (default: 0)

**Comportamento**:
- Se `APPOINTMENT_MIN_LEAD_TIME_MINUTES=5`:
  - Aceitar: `starts_at_utc >= now_utc - timedelta(minutes=5)`
  - Rejeitar: `starts_at_utc < now_utc - timedelta(minutes=5)`
- Se `APPOINTMENT_MIN_LEAD_TIME_MINUTES=0`:
  - Aceitar: `starts_at_utc >= now_utc` (sem tolerância)

### Erro Estruturado

**Formato de resposta 422**:
```json
{
  "detail": [
    {
      "loc": ["body", "startsAt"],
      "msg": "Appointment cannot be scheduled in the past",
      "type": "value_error",
      "code": "PAST_START",
      "ctx": {
        "received_utc": "2025-11-10T01:00:00Z",
        "now_utc": "2025-11-10T02:21:18.729499Z",
        "suggested_next_utc": "2025-11-10T02:30:00Z"
      }
    }
  ]
}
```

**Campos**:
- `code`: `"PAST_START"` (código identificador do erro)
- `received_utc`: timestamp recebido em UTC
- `now_utc`: horário atual do servidor em UTC
- `suggested_next_utc`: próximo slot válido sugerido (opcional, calculado com base no grace period + intervalo mínimo)

### Documentação Swagger

**Atualizar `/docs` (Swagger UI)**:
- Documentar regra de "não passado" no campo `startsAt`
- Incluir exemplos de conversão UTC ↔ -03:00
- Explicar grace period e variável de ambiente
- Incluir exemplos de erro `PAST_START`

**Exemplo de documentação**:
```yaml
startsAt:
  type: string
  format: date-time
  description: |
    Timestamp do início do agendamento em UTC (ISO 8601).
    Deve ser timezone-aware (use 'Z' para UTC ou offset ±HH:MM).
    Não pode ser no passado (considerando grace period).
    
    Exemplos:
    - UTC: "2025-11-10T01:00:00Z"
    - Offset: "2025-11-09T22:00:00-03:00" (equivale a 01:00Z)
    
    Grace period: configurável via APPOINTMENT_MIN_LEAD_TIME_MINUTES (default: 0)
```

---

## 5. Implementação no Frontend (Diretrizes, Sem Código)

### Construção de `starts_at`

**Passo 1: Combinar data e hora no timezone do usuário**
- `dataSelecionada`: formato `YYYY-MM-DD` (ex.: `"2025-11-09"`)
- `horaSelecionada`: formato `HH:mm` (ex.: `"22:00"`)
- Combinar: `"2025-11-09 22:00"` (sem timezone, será interpretado como local)

**Passo 2: Converter para UTC**
- Usar `dayjs.tz(startsAtLocal, 'America/Recife')` para interpretar como local
- Converter: `.utc().toISOString()`
- Resultado: `"2025-11-10T01:00:00.000Z"`

**Passo 3: Serializar (opcional, remover milissegundos)**
- Se a API exigir sem milissegundos: `.replace(/\.\d{3}Z$/, 'Z')`
- Resultado: `"2025-11-10T01:00:00Z"`

### Bloqueio Interativo

**Desabilitar opções de hora < agora local**:
- Quando `dataSelecionada` = hoje:
  - Calcular `agoraLocal` = horário atual no timezone do usuário
  - Arredondar para cima para o próximo slot (ex.: 23:17 → 23:30)
  - Desabilitar todas as opções de hora **< agoraLocal arredondado**
  - Exibir tooltip: "Horários passados não estão disponíveis"

**Recalcular validade ao focar botão "Agendar"**:
- Se o usuário abrir o modal e demorar (ex.: 5 minutos), recalcular validade quando focar o botão
- Se o horário selecionado agora está no passado, exibir aviso e bloquear submit

### Tratamento de Erro 422 (PAST_START)

**Detectar código de erro**:
- Verificar se `error.detail[0].code === "PAST_START"` ou `error.detail.code === "PAST_START"`

**Exibir mensagem descritiva**:
- Título: "Horário inválido"
- Descrição: "O horário selecionado já passou na sua região. Selecione um novo horário."
- Se disponível, mostrar `suggested_next_utc` convertido para local

**Botão "Usar próximo horário livre"**:
- Se o backend enviar `suggested_next_utc`, converter para local e pré-preencher o formulário
- Exibir toast de confirmação: "Horário ajustado para [próximo slot]"

### Sincronização de Relógio

**Usar `performance.now()` para comparações temporárias**:
- `performance.now()` é monotônico (não é afetado por ajustes de relógio do sistema)
- Usar como base para comparações temporárias no frontend
- Converter para UTC apenas no último momento (antes de enviar)

**Considerar solicitar `now_utc` do backend**:
- Endpoint opcional: `GET /api/v1/time` retorna `{ "now_utc": "2025-11-10T02:21:18.729499Z" }`
- Usar para reduzir drift entre relógio do cliente e servidor
- Cachear por alguns segundos (ex.: 30s) para evitar requisições excessivas

---

## 6. Testes Manuais (Copiar/Colar)

### Caso Feliz: Horário Futuro

**Cenário**: Hoje, 10 minutos à frente do agora local (ex.: 22:30 local → 01:30Z)

```bash
curl -i -X POST "http://localhost:8000/api/v1/appointments" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN" \
  -d '{
    "tenantId": "seu-tenant-id",
    "patientId": 1,
    "startsAt": "2025-11-10T01:30:00Z",
    "durationMin": 60,
    "status": "pending",
    "consultorioId": 1
  }'
```

**Resultado esperado**: Status `201 Created` com objeto do agendamento.

### Caso Inválido: Horário Passado

**Cenário**: 01:00Z quando agora já > 02:21Z

```bash
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

**Resultado esperado**: Status `422 Unprocessable Entity` com:
```json
{
  "detail": [
    {
      "loc": ["body", "startsAt"],
      "msg": "Appointment cannot be scheduled in the past",
      "type": "value_error",
      "code": "PAST_START",
      "ctx": {
        "received_utc": "2025-11-10T01:00:00Z",
        "now_utc": "2025-11-10T02:21:18.729499Z"
      }
    }
  ]
}
```

### Caso Grace Period: Tolerância de 5 Minutos

**Configurar**: `APPOINTMENT_MIN_LEAD_TIME_MINUTES=5`

**Teste 1: Falha (2 minutos à frente)**
```bash
# Calcular: now_utc + 2 minutos
# Exemplo: se agora é 02:21Z, usar 02:23Z
curl -i -X POST "http://localhost:8000/api/v1/appointments" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN" \
  -d '{
    "tenantId": "seu-tenant-id",
    "patientId": 1,
    "startsAt": "2025-11-10T02:23:00Z",
    "durationMin": 60,
    "status": "pending",
    "consultorioId": 1
  }'
```

**Resultado esperado**: Status `422` com `code="PAST_START"` (2 min < 5 min de grace)

**Teste 2: Sucesso (6 minutos à frente)**
```bash
# Calcular: now_utc + 6 minutos
# Exemplo: se agora é 02:21Z, usar 02:27Z
curl -i -X POST "http://localhost:8000/api/v1/appointments" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN" \
  -d '{
    "tenantId": "seu-tenant-id",
    "patientId": 1,
    "startsAt": "2025-11-10T02:27:00Z",
    "durationMin": 60,
    "status": "pending",
    "consultorioId": 1
  }'
```

**Resultado esperado**: Status `201 Created` (6 min >= 5 min de grace)

### Caso Equivalência Offset

**Teste: Mesmo horário com offset**
```bash
# 22:30-03:00 == 01:30Z (deve gerar mesmo resultado)
curl -i -X POST "http://localhost:8000/api/v1/appointments" \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=SEU_TOKEN" \
  -d '{
    "tenantId": "seu-tenant-id",
    "patientId": 1,
    "startsAt": "2025-11-09T22:30:00-03:00",
    "durationMin": 60,
    "status": "pending",
    "consultorioId": 1
  }'
```

**Resultado esperado**: 
- Se suportar offset: Status `201 Created` (mesmo resultado do caso feliz)
- Se não suportar: Status `422` com mensagem sobre formato de timezone

---

## 7. Checklist de Aceite

A correção está completa quando todos os itens abaixo forem atendidos:

- [ ] **O usuário não consegue escolher horários passados no dia atual**
  - Datepicker/timepicker bloqueia opções de hora < agora local quando data = hoje
  - Tooltip ou mensagem discreta explica o bloqueio

- [ ] **Submissões são bloqueadas no front antes do POST quando o horário está no passado**
  - Pré-validação antes do submit compara `starts_at_utc` com `now_utc`
  - Se inválido, impede envio e exibe erro no formulário
  - Campo de hora destacado com borda vermelha

- [ ] **Backend retorna 201 para horários futuros e 422 (PAST_START) com detalhes úteis para horários passados**
  - Status `201 Created` para horários futuros (considerando grace period)
  - Status `422` com `code="PAST_START"` para horários passados
  - Resposta inclui `received_utc`, `now_utc`, `suggested_next_utc` (opcional)

- [ ] **A mensagem no front é clara e oferece ação para corrigir (usar próximo slot)**
  - Mensagem: "O horário selecionado já passou na sua região. Selecione um novo horário."
  - Botão "Usar próximo horário livre" pré-preenche formulário com horário sugerido
  - Toast de confirmação quando horário é ajustado

- [ ] **Swagger documenta a política de horário e exemplos UTC/offset**
  - Campo `startsAt` documentado com regra de "não passado"
  - Exemplos de conversão UTC ↔ -03:00
  - Explicação de grace period e variável de ambiente
  - Exemplos de erro `PAST_START`

---

## 8. Observabilidade

### Logs

**Registrar na criação de agendamento** (sem PII):
- `starts_at_original`: timestamp recebido (string)
- `starts_at_utc`: timestamp normalizado para UTC
- `now_utc`: horário atual do servidor em UTC
- `lead_time_minutes`: diferença em minutos entre `starts_at_utc` e `now_utc`
- `is_past`: boolean indicando se está no passado (após grace period)

**Exemplo de log**:
```
🔍 POST /api/v1/appointments - 
  starts_at_original=2025-11-10T01:00:00Z, 
  starts_at_utc=2025-11-10T01:00:00+00:00, 
  now_utc=2025-11-10T02:21:18.729499+00:00, 
  lead_time_minutes=-81, 
  is_past=true
```

### Métricas

**Contadores**:
- `appointments.created.success`: contador de agendamentos criados com sucesso
- `appointments.created.failed.past_start`: contador de falhas por `PAST_START`
- `appointments.created.failed.other`: contador de falhas por outros motivos

**Histogramas**:
- `appointments.created.latency`: latência do POST (ms)
- `appointments.created.lead_time_minutes`: distribuição de lead time (minutos entre criação e início)

**Taxa de sucesso por faixa horária**:
- Agrupar por hora do dia (00:00-23:59) e calcular taxa de sucesso
- Identificar padrões (ex.: pico de falhas em horários próximos ao atual)

### Alertas

**Pico de 422 PAST_START**:
- Alertar se taxa de `422 PAST_START` > 10% das requisições em 5 minutos
- Possíveis causas:
  - Relógios dos clientes descompassados
  - Relógio do servidor descompassado
  - Problema de sincronização NTP

**Drift de relógio**:
- Comparar `now_utc` do servidor com `now_utc` de um servidor de referência (ex.: NTP)
- Alertar se drift > 1 minuto

---

## 9. Apêndice

### Mini-guia ISO 8601

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

### Tabela de Conversão -03:00 → UTC

| Horário Local (America/Recife) | UTC Equivalente | Observação |
|--------------------------------|-----------------|------------|
| 21:00 (09/11) | 00:00 (10/11) | Meia-noite em UTC |
| 22:00 (09/11) | 01:00 (10/11) | Dia seguinte em UTC |
| 23:00 (09/11) | 02:00 (10/11) | Dia seguinte em UTC |
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

### Observações sobre Horário de Verão (DST)

**Por que normalizamos em UTC no backend**:
- **Consistência**: UTC não muda com horário de verão
- **Simplicidade**: Não precisa lidar com mudanças de offset
- **Performance**: Comparações são mais rápidas (não precisa converter timezone)

**Horário de verão no Brasil**:
- **Histórico**: Brasil tinha horário de verão (outubro a fevereiro), mas foi **abolido em 2019**
- **Atual**: `America/Recife` está sempre em UTC-03:00 (sem mudanças)
- **Futuro**: Se houver mudanças, o frontend deve usar biblioteca atualizada (ex.: `dayjs` com timezone data)

**Recomendação**:
- Sempre usar bibliotecas atualizadas de timezone (ex.: `dayjs` com plugin `timezone`)
- Não hardcodar offsets (ex.: `-03:00`), usar timezone names (ex.: `America/Recife`)
- Testar mudanças de DST se o sistema for usado em regiões que ainda têm horário de verão

---

## Conclusão

Este documento fornece um guia completo para corrigir a validação de horários passados no frontend, melhorando a UX e reduzindo erros evitáveis. Siga as seções na ordem apresentada para implementar as correções.

**Prioridade de implementação**:
1. **Regra F6 (pré-validação)**: Bloquear submit quando horário está no passado
2. **Regra F1 (bloqueio interativo)**: Desabilitar opções de hora passadas no datepicker/timepicker
3. **Regra F5 (mensagem clara)**: Melhorar mensagens de erro e oferecer ação corretiva
4. **Backend (erro estruturado)**: Retornar `code="PAST_START"` com detalhes úteis
5. **Regra F4 (grace period)**: Implementar tolerância configurável (opcional)

**Convenção recomendada**: UTC end-to-end (frontend envia UTC, backend valida/armazena UTC, frontend converte para exibição local).

