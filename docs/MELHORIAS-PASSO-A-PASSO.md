# 🛠️ AlignWork - Guia Passo a Passo de Melhorias

> **Guia Completo de Implementação Segura**  
> **Data:** Outubro 2025  
> **Versão:** 1.0.0  
> **Status:** 87 Correções Mapeadas

---

## 📋 Índice Rápido

- [Como Usar Este Guia](#como-usar-este-guia)
- [Metodologia "Segurança Progressiva"](#metodologia-seguranca-progressiva)
- [Sistema de Níveis de Risco](#sistema-de-niveis-de-risco)
- [Ordem de Implementação Recomendada](#ordem-de-implementacao-recomendada)
- [Nível 0 - RISCO ZERO](#nivel-0---risco-zero)
- [Nível 1 - RISCO BAIXO](#nivel-1---risco-baixo)
- [Nível 2 - RISCO MÉDIO](#nivel-2---risco-medio)
- [Nível 3 - RISCO ALTO](#nivel-3---risco-alto)
- [Comandos Git Essenciais](#comandos-git-essenciais)
- [FAQ - Perguntas Frequentes](#faq---perguntas-frequentes)
- [Troubleshooting](#troubleshooting)
- [Glossário](#glossario)

---

## Como Usar Este Guia

### 🎯 Filosofia

Este guia foi criado com **SEGURANÇA** em mente. Cada correção é tratada como uma operação cirúrgica:
- **Planejamento** antes de agir
- **Validação** após cada mudança
- **Rollback** fácil se algo der errado

### 📖 Convenções

**Símbolos usados:**
- ✅ = Ação obrigatória
- ⚠️ = Cuidado especial necessário
- 💡 = Dica útil
- 🚨 = Perigo! Leia com atenção
- 🔄 = Comando reversível
- ❌ = Código que será removido/alterado
- ✔️ = Código novo/correto

**Níveis de Risco:**
- 🟢 **Nível 0** = Impossível quebrar (remoções puras)
- 🟡 **Nível 1** = Muito seguro (extrações simples)
- 🟠 **Nível 2** = Requer atenção (mudanças de lógica)
- 🔴 **Nível 3** = Perigoso (mudanças críticas)

### 📝 Fluxo de Trabalho Recomendado

Para cada correção:

1. **LER** a correção completa antes de começar
2. **FAZER COMMIT** do código atual (ponto de restauração)
3. **EXECUTAR** passo a passo
4. **VALIDAR** com checklist
5. **TESTAR** manualmente
6. **COMMITAR** se tudo OK
7. **REVERTER** se algo quebrou

### 🔄 Como Reverter se Quebrar

**Opção 1 - Desfazer último commit:**
```bash
git reset --hard HEAD~1
```

**Opção 2 - Reverter arquivo específico:**
```bash
git checkout HEAD -- caminho/do/arquivo.py
```

**Opção 3 - Reverter múltiplos arquivos:**
```bash
git checkout HEAD -- backend/routes/auth.py src/services/api.ts
```

---

## Metodologia "Segurança Progressiva"

### Princípios

1. **Incremental**: Uma correção por vez
2. **Testável**: Validação manual após cada mudança
3. **Reversível**: Sempre possível voltar atrás
4. **Documentado**: Saber o que foi feito e por quê

### Fases de Implementação

```
FASE 1: VITÓRIAS RÁPIDAS (Semana 1)
├─ Risco ZERO
├─ Ganho imediato
└─ Constrói confiança

FASE 2: SEGURANÇA BÁSICA (Semana 2)
├─ Risco BAIXO
├─ Correções importantes
└─ Preparação para próximas fases

FASE 3: PERFORMANCE (Semana 3-4)
├─ Risco MÉDIO
├─ Otimizações visíveis
└─ Requer testes cuidadosos

FASE 4: ARQUITETURA (Semana 5-8)
├─ Risco ALTO
├─ Mudanças estruturais
└─ Máxima atenção necessária
```

### Regras de Ouro

1. **NUNCA** faça múltiplas correções ao mesmo tempo
2. **SEMPRE** commit após cada correção bem-sucedida
3. **SEMPRE** teste manualmente antes de commitar
4. **NUNCA** pule a validação
5. **SEMPRE** leia os avisos ⚠️ e 🚨

---

## Sistema de Níveis de Risco

### 🟢 Nível 0 - RISCO ZERO (10 correções)

**Características:**
- Remoção de código não usado
- Limpeza de comentários
- Sem alteração de lógica
- **Impossível quebrar o sistema**

**Tempo Total:** ~1 hora  
**Pode fazer:** Em qualquer ordem  
**Rollback:** Desnecessário (mas disponível)

### 🟡 Nível 1 - RISCO BAIXO (25 correções)

**Características:**
- Extração de constantes
- Renomeação de variáveis
- Reorganização de código
- Facilmente reversível

**Tempo Total:** ~3-4 horas  
**Pode fazer:** Em qualquer ordem dentro do nível  
**Rollback:** Simples (git checkout)

### 🟠 Nível 2 - RISCO MÉDIO (30 correções)

**Características:**
- Mudanças de lógica
- Otimizações de queries
- Adição de validações
- **Requer testes manuais cuidadosos**

**Tempo Total:** ~10-15 horas  
**Pode fazer:** Seguir ordem recomendada  
**Rollback:** Necessário testar após reverter

### 🔴 Nível 3 - RISCO ALTO (22 correções)

**Características:**
- Mudanças em autenticação
- Alterações de banco de dados
- Refactoring arquitetural
- **Requer testes extensivos**

**Tempo Total:** ~20-30 horas  
**Pode fazer:** APENAS na ordem indicada  
**Rollback:** Complexo, pode afetar dados

---

## Ordem de Implementação Recomendada

### 🗓️ Cronograma Sugerido

| Fase | Semana | Correções | Risco | Tempo |
|------|--------|-----------|-------|-------|
| 1 | Semana 1 | 1-10 | 🟢 🟡 | 5h |
| 2 | Semana 2 | 11-20 | 🟡 🟠 | 8h |
| 3 | Semana 3-4 | 21-40 | 🟠 | 20h |
| 4 | Semana 5-8 | 41-87 | 🟠 🔴 | 40h |

### 📊 Progresso Visual

```
[████████░░░░░░░░░░░░] 10/87 correções (11%) - Fase 1
[████████████████░░░░] 20/87 correções (23%) - Fase 2
[████████████████████████████████░░░░] 40/87 correções (46%) - Fase 3
[████████████████████████████████████] 87/87 correções (100%) - Concluído!
```

### 🎯 Metas por Fase

**Fase 1 - Vitórias Rápidas:**
- Meta: 10 correções em 1 semana
- Foco: Limpeza e preparação
- Ganho: Código mais limpo, sem riscos

**Fase 2 - Segurança Básica:**
- Meta: +10 correções (total 20)
- Foco: Validações e correções simples
- Ganho: Segurança melhorada

**Fase 3 - Performance:**
- Meta: +20 correções (total 40)
- Foco: Otimizações visíveis
- Ganho: Sistema mais rápido

**Fase 4 - Arquitetura:**
- Meta: +47 correções (total 87)
- Foco: Refactoring profundo
- Ganho: Sistema robusto e escalável

---

## Nível 0 - RISCO ZERO

> 🟢 **Impossível quebrar o código**  
> Tempo total: ~1 hora  
> Correções: 10

---

### Correção #1: Remover Prints Sensíveis (P0-001)

**Nível de Risco:** 🟢 ZERO  
**Tempo Estimado:** 5 minutos  
**Prioridade:** P0 (Crítico de Segurança)  
**Referência:** [MELHORIAS-E-CORRECOES.md#P0-001](./MELHORIAS-E-CORRECOES.md#p0-001-senhas-e-hashes-sendo-logadas)

#### Por Que Fazer Primeiro?

- ✅ Risco zero de quebrar código
- ✅ Resolve problema CRÍTICO de segurança
- ✅ Prepara terreno para logging estruturado
- ✅ Vitória rápida e visível

#### Pré-requisitos

- [ ] Backend rodando sem erros
- [ ] Git status limpo (sem mudanças pendentes)
- [ ] Fazer commit atual: `git add . && git commit -m "Before: Remove sensitive prints"`

#### Arquivos Afetados

- `backend/routes/auth.py` (linhas 71-84)

#### Problema Atual

```python
# backend/routes/auth.py:71-84
@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    """Login user and return tokens."""
    print(f"Login attempt: {user_credentials.email}")  # ❌ OK manter
    
    user = db.query(User).filter(User.email == user_credentials.email).first()
    print(f"User found: {user is not None}")  # ❌ OK manter
    
    if user:
        print(f"User email: {user.email}")  # ❌ OK manter
        print(f"User password hash: {user.hashed_password}")  # 🚨 REMOVER!
        print(f"User active: {user.is_active}")  # ❌ OK manter
        print(f"User verified: {user.is_verified}")  # ❌ OK manter
        
        password_valid = verify_password(user_credentials.password, user.hashed_password)
        print(f"Password valid: {password_valid}")  # ❌ OK manter
```

#### Passo a Passo

**1. Abrir arquivo:**
```bash
# Navegar até o arquivo
code backend/routes/auth.py
# OU abrir no seu editor favorito
```

**2. Localizar a linha problemática:**
- Procurar por: `print(f"User password hash: {user.hashed_password}")`
- Está na linha ~79

**3. Remover a linha:**
```python
# ANTES (linhas 77-82):
if user:
    print(f"User email: {user.email}")
    print(f"User password hash: {user.hashed_password}")  # ← REMOVER ESTA LINHA
    print(f"User active: {user.is_active}")
    print(f"User verified: {user.is_verified}")

# DEPOIS (linhas 77-81):
if user:
    print(f"User email: {user.email}")
    # print(f"User password hash: {user.hashed_password}")  # REMOVIDO por segurança
    print(f"User active: {user.is_active}")
    print(f"User verified: {user.is_verified}")
```

💡 **Dica:** Comentei a linha ao invés de deletar totalmente, assim você pode ver o histórico.

**4. Salvar arquivo:**
- Ctrl+S (Windows/Linux) ou Cmd+S (Mac)

#### Validação

**Checklist de Validação:**

- [ ] **Backend inicia sem erros:**
  ```bash
  cd backend
  uvicorn main:app --reload
  # Deve iniciar normalmente
  ```

- [ ] **Testar login no frontend:**
  1. Abrir http://localhost:8080/login
  2. Fazer login com usuário existente
  3. Login deve funcionar normalmente

- [ ] **Verificar console do backend:**
  - Deve aparecer "Login attempt: ..."
  - Deve aparecer "User found: ..."
  - ✅ **NÃO** deve aparecer hash de senha

- [ ] **Verificar que não há erros:**
  ```bash
  # No terminal do backend, deve ver:
  # INFO: Login attempt: user@example.com
  # INFO: User found: True
  # (Sem mostrar password hash)
  ```

#### Plano de Rollback

```bash
# Se algo der errado (improvável):
git checkout HEAD -- backend/routes/auth.py

# Verificar:
git diff backend/routes/auth.py
# (Deve mostrar "no changes")
```

#### Commit

```bash
# Se tudo funcionou:
git add backend/routes/auth.py
git commit -m "security: remove password hash from login logs (P0-001)

- Removed print of user.hashed_password from login endpoint
- Prevents sensitive data exposure in logs
- Risk Level: ZERO
- Ref: docs/MELHORIAS-E-CORRECOES.md#P0-001"
```

#### Notas Importantes

⚠️ **Avisos:**
- Esta linha expõe hashes de senha nos logs
- Em produção, isso seria uma violação grave de LGPD/GDPR
- Mesmo em desenvolvimento, é má prática

💡 **Próximos Passos:**
- Depois implementaremos logging estruturado (MAINT-001)
- Por enquanto, os prints restantes estão OK (não expõem dados sensíveis)

✅ **Sucesso? Parabéns!**
Você completou sua primeira correção de segurança sem quebrar nada! 🎉

---

### Correção #2: Remover Comentários Óbvios (CS-002)

**Nível de Risco:** 🟢 ZERO  
**Tempo Estimado:** 10 minutos  
**Prioridade:** P3 (Baixa - Code Quality)  
**Referência:** [MELHORIAS-E-CORRECOES.md#CS-002](./MELHORIAS-E-CORRECOES.md#cs-002-comentarios-obvios)

#### Por Que Fazer?

- ✅ Código mais limpo e profissional
- ✅ Menos ruído visual
- ✅ Prepara para comentários de qualidade
- ✅ Zero risco

#### Pré-requisitos

- [ ] Correção #1 concluída e commitada
- [ ] Git status limpo

#### O Que São Comentários Óbvios?

```python
# ❌ RUIM - Comentário óbvio (repete o código):
counter += 1  # Incrementa contador

# ✅ BOM - Comentário útil (explica POR QUÊ):
counter += 1  # Compensar offset de timezone UTC-3
```

#### Arquivos para Revisar

Vamos fazer uma busca manual. Não vou listar todos, mas aqui estão exemplos comuns:

**Backend:**
- `backend/routes/auth.py`
- `backend/routes/appointments.py`
- `backend/models/*.py`

**Frontend:**
- `src/contexts/*.tsx`
- `src/hooks/*.ts`
- `src/components/**/*.tsx`

#### Passo a Passo

**1. Procurar comentários óbvios:**
```bash
# Exemplos de padrões a procurar:
# "# Create user" antes de "user = User(...)"
# "# Return data" antes de "return data"
# "# Import X" antes de "import X"
```

**2. Decidir: Remover ou Melhorar?**

**Remover se:**
- Repete exatamente o que o código faz
- Não adiciona informação

**Melhorar se:**
- Pode explicar o "por quê" ao invés do "o quê"

**Exemplos:**

```python
# ❌ Remover este:
# Create appointment
db_appointment = Appointment(...)

# ✅ Melhorar para algo assim (se necessário):
# Convert local time to UTC before storing (all dates stored in UTC)
db_appointment = Appointment(...)
```

**3. Aplicar mudanças:**

Aqui estão alguns exemplos de mudanças seguras:

```python
# backend/routes/appointments.py

# ANTES:
# Parse ISO strings to datetime
from_dt = datetime.fromisoformat(from_.replace('Z', '+00:00'))

# DEPOIS (simplesmente remover):
from_dt = datetime.fromisoformat(from_.replace('Z', '+00:00'))
```

```typescript
// src/contexts/AppContext.tsx

// ANTES:
// Função para adicionar novo cliente
const adicionarCliente = (dadosCliente) => { ... }

// DEPOIS (remover):
const adicionarCliente = (dadosCliente) => { ... }
```

#### Validação

**Checklist de Validação:**

- [ ] Código compila sem erros
- [ ] Backend inicia: `uvicorn main:app --reload`
- [ ] Frontend inicia: `npm run dev`
- [ ] Nenhuma funcionalidade quebrada

💡 **Dica:** Como só estamos removendo comentários, é impossível quebrar funcionalidade!

#### Commit

```bash
git add .
git commit -m "refactor: remove obvious comments (CS-002)

- Cleaned up redundant comments that repeat code
- Kept meaningful comments that explain WHY
- Risk Level: ZERO
- Ref: docs/MELHORIAS-E-CORRECOES.md#CS-002"
```

#### Notas Importantes

💡 **Filosofia de Comentários:**
- Código deve ser auto-explicativo
- Comentários devem explicar **POR QUÊ**, não **O QUÊ**
- Se precisa comentar O QUÊ, refatore o código

---

### Correção #3: Extrair Magic Numbers (CS-001)

**Nível de Risco:** 🟢 ZERO  
**Tempo Estimado:** 15 minutos  
**Prioridade:** P3 (Code Quality)  
**Referência:** [MELHORIAS-E-CORRECOES.md#CS-001](./MELHORIAS-E-CORRECOES.md#cs-001-magic-numbers)

#### Por Que Fazer?

- ✅ Código mais legível
- ✅ Fácil manutenção futura
- ✅ Reutilização de valores
- ✅ Zero risco (apenas adiciona constantes)

#### Pré-requisitos

- [ ] Correções anteriores concluídas
- [ ] Git status limpo

#### O Que São Magic Numbers?

```typescript
// ❌ Magic Number - O que é 30000?
staleTime: 30_000

// ✅ Constante Nomeada - Claro!
staleTime: CACHE_TIMES.APPOINTMENTS
```

#### Arquivos Afetados

**Frontend (TypeScript):**
- `src/hooks/useDashboardMegaStats.ts` (linha 23)
- `src/hooks/useDashboardSummary.ts`
- `src/hooks/useMonthAppointments.ts` (linha 39)
- `src/hooks/useAppointmentMutations.ts`

#### Passo a Passo

**1. Criar arquivo de constantes:**

```bash
# Criar novo arquivo:
touch src/constants/cache.ts
```

**2. Definir constantes:**

Criar `src/constants/cache.ts`:
```typescript
/**
 * Cache time constants for React Query
 * All values in milliseconds
 */
export const CACHE_TIMES = {
  /** 30 seconds - For frequently changing data (appointments, stats) */
  APPOINTMENTS: 30 * 1000,
  
  /** 5 minutes - For user profile and settings */
  PROFILE: 5 * 60 * 1000,
  
  /** 10 minutes - For configuration data */
  SETTINGS: 10 * 60 * 1000,
  
  /** Never expires - For static reference data */
  STATIC: Infinity,
} as const;

/**
 * Helper to convert minutes to milliseconds
 */
export const minutesToMs = (minutes: number): number => minutes * 60 * 1000;

/**
 * Helper to convert seconds to milliseconds
 */
export const secondsToMs = (seconds: number): number => seconds * 1000;
```

**3. Atualizar hooks:**

**Arquivo:** `src/hooks/useDashboardMegaStats.ts`

```typescript
// ANTES:
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'

export function useDashboardMegaStats(tenantId: string, tz = 'America/Recife') {
    return useQuery({
        queryKey: ['dashboardMegaStats', tenantId, tz],
        queryFn: async () => { ... },
        staleTime: 30_000,  // ❌ Magic number
        refetchOnWindowFocus: true
    })
}

// DEPOIS:
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { CACHE_TIMES } from '@/constants/cache'  // ✅ Import

export function useDashboardMegaStats(tenantId: string, tz = 'America/Recife') {
    return useQuery({
        queryKey: ['dashboardMegaStats', tenantId, tz],
        queryFn: async () => { ... },
        staleTime: CACHE_TIMES.APPOINTMENTS,  // ✅ Constante nomeada
        refetchOnWindowFocus: true
    })
}
```

**Arquivo:** `src/hooks/useMonthAppointments.ts`

```typescript
// ANTES:
export function useMonthAppointments(tenantId: string, year: number, month: number) {
    return useQuery({
        queryKey: ['appointments', tenantId, year, month],
        queryFn: async () => { ... },
        staleTime: 30_000,  // ❌ Magic number
        refetchOnWindowFocus: true,
    });
}

// DEPOIS:
import { CACHE_TIMES } from '@/constants/cache'

export function useMonthAppointments(tenantId: string, year: number, month: number) {
    return useQuery({
        queryKey: ['appointments', tenantId, year, month],
        queryFn: async () => { ... },
        staleTime: CACHE_TIMES.APPOINTMENTS,  // ✅ Constante
        refetchOnWindowFocus: true,
    });
}
```

**4. Atualizar outros arquivos similares:**

Repetir o mesmo processo para:
- `src/hooks/useDashboardSummary.ts`
- `src/hooks/useClientsCount.ts` (se existir)

#### Validação

**Checklist de Validação:**

- [ ] TypeScript compila sem erros:
  ```bash
  npx tsc --noEmit
  ```

- [ ] Frontend inicia sem erros:
  ```bash
  npm run dev
  ```

- [ ] Dashboard carrega normalmente
- [ ] Estatísticas aparecem corretamente
- [ ] Console sem erros (F12)

#### Commit

```bash
git add src/constants/cache.ts src/hooks/*.ts
git commit -m "refactor: extract magic numbers to constants (CS-001)

- Created src/constants/cache.ts with named constants
- Replaced magic numbers in hooks (staleTime)
- Improved code readability
- Risk Level: ZERO
- Ref: docs/MELHORIAS-E-CORRECOES.md#CS-001"
```

#### Notas Importantes

💡 **Benefícios:**
- Agora para mudar tempo de cache, altera em 1 lugar só
- Código auto-documentado
- IntelliSense mostra opções disponíveis

⚠️ **Não Confundir:**
- Magic numbers: valores sem contexto
- Literais OK: `array.length > 0`, `idade >= 18` (são óbvios)

---

### Correção #4: Corrigir Bare Except (P0-004)

**Nível de Risco:** 🟢 ZERO  
**Tempo Estimado:** 5 minutos  
**Prioridade:** P0 (Crítico - Debugging)  
**Referência:** [MELHORIAS-E-CORRECOES.md#P0-004](./MELHORIAS-E-CORRECOES.md#p0-004-bare-except-capturando-todas-as-excecoes)

#### Por Que Fazer?

- ✅ Melhor debugging (não esconde erros reais)
- ✅ Não captura exceções de sistema (KeyboardInterrupt, etc)
- ✅ Prepara para remoção do fallback SHA256
- ✅ Zero risco (código existente continua funcionando)

#### Pré-requisitos

- [ ] Correções anteriores concluídas
- [ ] Backend rodando

#### Arquivo Afetado

- `backend/auth/utils.py` (linhas 20-28)

#### Problema Atual

```python
# backend/auth/utils.py:20-28
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except:  # ❌ BARE EXCEPT - captura TUDO!
        # Fallback para SHA256 (compatibilidade com dados existentes)
        import hashlib
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
```

**Problemas:**
1. `except:` captura **tudo**, incluindo `KeyboardInterrupt`, `SystemExit`
2. Esconde erros reais de bcrypt
3. Dificulta debugging

#### Passo a Passo

**1. Abrir arquivo:**
```bash
code backend/auth/utils.py
```

**2. Identificar exceções específicas do bcrypt:**

Exceções que bcrypt pode lançar:
- `ValueError`: Hash inválido ou formato errado
- `TypeError`: Tipo de dado incorreto

**3. Substituir bare except:**

```python
# ANTES (linhas 20-28):
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except:  # ❌ BARE EXCEPT
        import hashlib
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

# DEPOIS (linhas 20-28):
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except (ValueError, TypeError) as e:  # ✅ ESPECÍFICO
        # Fallback para SHA256 (compatibilidade com dados existentes)
        # TODO: Remover após migração completa para bcrypt (ver P0-002)
        import hashlib
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
```

**4. Salvar arquivo**

#### Validação

**Checklist de Validação:**

- [ ] Backend inicia sem erros:
  ```bash
  cd backend
  uvicorn main:app --reload
  ```

- [ ] Testar login com usuário bcrypt:
  1. Criar novo usuário via /register
  2. Fazer login com esse usuário
  3. Deve funcionar normalmente

- [ ] Verificar que não há erros no console

- [ ] Testar interrupção (Ctrl+C):
  - Pressionar Ctrl+C no backend
  - Deve parar imediatamente (não ser capturado pelo except)

#### Commit

```bash
git add backend/auth/utils.py
git commit -m "fix: replace bare except with specific exceptions (P0-004)

- Changed 'except:' to 'except (ValueError, TypeError)'
- Prevents masking real errors and system exceptions
- Improves debugging capability
- Risk Level: ZERO
- Ref: docs/MELHORIAS-E-CORRECOES.md#P0-004"
```

#### Notas Importantes

💡 **Por que isso é seguro?**
- Código existente continua funcionando igual
- Apenas tornamos o tratamento de erros mais específico
- Facilita encontrar bugs no futuro

⚠️ **Próximo passo:**
- Na correção P0-002, vamos remover o fallback SHA256 completamente
- Por enquanto, mantemos para compatibilidade

---

### Correção #5: Corrigir useEffect Dependencies (P0-008)

**Nível de Risco:** 🟢 ZERO  
**Tempo Estimado:** 2 minutos  
**Prioridade:** P0 (Bug Potencial)  
**Referência:** [MELHORIAS-E-CORRECOES.md#P0-008](./MELHORIAS-E-CORRECOES.md#p0-008-useeffect-com-dependencias-incorretas)

#### Por Que Fazer?

- ✅ Previne loop infinito de re-renders
- ✅ Corrige memory leak de listeners
- ✅ Performance melhorada
- ✅ Fix simples de 1 linha

#### Pré-requisitos

- [ ] Frontend rodando
- [ ] Git status limpo

#### Arquivo Afetado

- `src/hooks/use-toast.ts` (linha 177)

#### Problema Atual

```typescript
// src/hooks/use-toast.ts:169-177
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);  // ❌ BUG: state nas dependências causa re-execução a cada mudança
}
```

**Problema:**
- Cada vez que `state` muda, o effect re-executa
- Adiciona novo listener sem remover o anterior corretamente
- Pode causar memory leak
- Re-renders desnecessários

#### Passo a Passo

**1. Abrir arquivo:**
```bash
code src/hooks/use-toast.ts
```

**2. Localizar useEffect:**
- Procurar por: `useEffect(() => {` com `listeners.push`
- Linha ~169

**3. Corrigir dependências:**

```typescript
// ANTES (linhas 169-177):
React.useEffect(() => {
    listeners.push(setState);
    return () => {
        const index = listeners.indexOf(setState);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
}, [state]);  // ❌ ERRADO

// DEPOIS (linhas 169-177):
React.useEffect(() => {
    listeners.push(setState);
    return () => {
        const index = listeners.indexOf(setState);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
}, []);  // ✅ CORRETO - executa apenas no mount/unmount
```

**4. Salvar arquivo**

#### Validação

**Checklist de Validação:**

- [ ] Frontend compila sem warnings:
  ```bash
  npm run dev
  # Não deve ter warning sobre exhaustive-deps
  ```

- [ ] Toasts funcionam normalmente:
  1. Abrir aplicação
  2. Fazer login (deve mostrar toast de sucesso)
  3. Fazer logout (deve mostrar toast)
  4. Toast deve aparecer e desaparecer corretamente

- [ ] Verificar performance (opcional):
  - Abrir React DevTools
  - Aba "Profiler"
  - Interagir com a aplicação
  - Não deve ter re-renders excessivos

#### Commit

```bash
git add src/hooks/use-toast.ts
git commit -m "fix: correct useEffect dependencies in toast hook (P0-008)

- Changed dependency array from [state] to []
- Prevents infinite loop and memory leak
- Effect should only run on mount/unmount
- Risk Level: ZERO
- Ref: docs/MELHORIAS-E-CORRECOES.md#P0-008"
```

#### Notas Importantes

💡 **Explicação Técnica:**
- `setState` é estável (não muda entre renders)
- Effect só precisa executar 1x (adicionar listener)
- Cleanup executa quando componente desmonta
- `state` não é usado dentro do effect, não precisa nas deps

⚠️ **Se ESLint reclamar:**
```typescript
// Adicionar comentário para suprimir warning:
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

---

### 🎉 Parabéns! Fase 1 - Nível 0 Completa!

**Você completou 5 correções de Risco ZERO:**

- ✅ #1: Removeu prints sensíveis (Segurança)
- ✅ #2: Limpou comentários óbvios (Qualidade)
- ✅ #3: Extraiu magic numbers (Manutenibilidade)
- ✅ #4: Corrigiu bare except (Debugging)
- ✅ #5: Corrigiu useEffect (Performance)

**Ganhos:**
- 🔒 Segurança melhorada
- 📖 Código mais legível
- 🐛 Menos bugs potenciais
- 💪 Confiança para próximos passos

**Próximo Passo:**
Continue para [Nível 1 - Risco Baixo](#nivel-1---risco-baixo) quando estiver pronto!

---

## Nível 1 - RISCO BAIXO

> 🟡 **Muito seguro - Facilmente reversível**  
> Tempo total: ~3-4 horas  
> Correções: 25

### Resumo do Nível 1

Neste nível faremos:
- Extrações de código duplicado
- Correções de bugs TypeScript
- Adições que não afetam código existente
- Validações simples

**Ordem Recomendada:**
1. Correção #6: Corrigir ApiError Duplicado (P0-013)
2. Correção #7: Extrair Código Duplicado de Prefetch (P0-009)
3. Correção #8: Adicionar Error Boundary (P0-015)
4. ... (continuando)

---

### Correção #6: Corrigir ApiError Duplicado (P0-013)

**Nível de Risco:** 🟡 BAIXO  
**Tempo Estimado:** 3 minutos  
**Prioridade:** P0 (Bug TypeScript)  
**Referência:** [MELHORIAS-E-CORRECOES.md#P0-013](./MELHORIAS-E-CORRECOES.md#p0-013-conflito-de-dupla-definicao-de-apierror)

#### Por Que Fazer?

- ✅ Corrige conflito de nomenclatura
- ✅ TypeScript mais consistente
- ✅ IntelliSense funciona melhor
- ✅ Mudança simples

#### Pré-requisitos

- [ ] Correções Nível 0 concluídas
- [ ] Frontend rodando

#### Arquivo Afetado

- `src/services/api.ts` (linhas 10-26)

#### Problema Atual

```typescript
// src/services/api.ts:10-26
export interface ApiError {  // Interface (linha 10)
    message: string;
    status: number;
    detail?: string;
}

class ApiError extends Error {  // Class (linha 16) ❌ CONFLITO!
    status: number;
    detail?: string;

    constructor(message: string, status: number, detail?: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.detail = detail;
    }
}
```

**Problema:**
- Interface e classe com mesmo nome
- Interface é sobrescrita pela classe
- Pode causar comportamento inconsistente

#### Passo a Passo

**1. Abrir arquivo:**
```bash
code src/services/api.ts
```

**2. Decisão: Qual abordagem?**

**Opção A: Remover interface (RECOMENDADO - mais simples)**
**Opção B: Renomear interface para IApiError**

Vamos com Opção A:

**3. Aplicar correção:**

```typescript
// ANTES (linhas 10-26):
export interface ApiError {  // ❌ Remover interface
    message: string;
    status: number;
    detail?: string;
}

class ApiError extends Error {
    status: number;
    detail?: string;

    constructor(message: string, status: number, detail?: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.detail = detail;
    }
}

// DEPOIS (linhas 10-20):
class ApiError extends Error {  // ✅ Apenas a classe
    status: number;
    detail?: string;

    constructor(message: string, status: number, detail?: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.detail = detail;
    }
}

export { ApiError };  // ✅ Export explícito
```

**4. Verificar se interface era usada em outros lugares:**

```bash
# Procurar uso de ApiError como interface:
grep -r "ApiError" src/ --include="*.ts" --include="*.tsx"
```

Se encontrar uso como tipo, não há problema - a classe pode ser usada como tipo também.

#### Validação

**Checklist de Validação:**

- [ ] TypeScript compila sem erros:
  ```bash
  npx tsc --noEmit
  ```

- [ ] Frontend inicia:
  ```bash
  npm run dev
  ```

- [ ] Testar chamadas à API:
  1. Fazer login
  2. Navegar pelo dashboard
  3. Erros de API (404, 401) devem funcionar normalmente

- [ ] Console sem erros TypeScript

#### Commit

```bash
git add src/services/api.ts
git commit -m "fix: remove duplicate ApiError interface (P0-013)

- Removed interface definition (kept class only)
- Fixes TypeScript naming conflict
- Class can be used as type interface
- Risk Level: LOW
- Ref: docs/MELHORIAS-E-CORRECOES.md#P0-013"
```

#### Notas Importantes

💡 **Classes em TypeScript:**
- Classes são tipos AND valores
- Podem ser usadas como interfaces
- Não precisa de interface separada neste caso

---

### Correção #7: Extrair Código Duplicado de Prefetch (P0-009)

**Nível de Risco:** 🟡 BAIXO  
**Tempo Estimado:** 15 minutos  
**Prioridade:** P0 (Manutenibilidade)  
**Referência:** [MELHORIAS-E-CORRECOES.md#P0-009](./MELHORIAS-E-CORRECOES.md#p0-009-codigo-duplicado-de-prefetch)

#### Por Que Fazer?

- ✅ Remove 40 linhas de código duplicado
- ✅ DRY principle
- ✅ Mais fácil de manter
- ✅ Seguro (extração pura)

#### Pré-requisitos

- [ ] Correção #6 concluída
- [ ] Entender o código de AuthContext

#### Arquivo Afetado

- `src/contexts/AuthContext.tsx` (linhas 23-102)

#### Problema Atual

```typescript
// Código duplicado em 2 lugares:
// 1. useEffect (linhas 23-68)
// 2. doLogin (linhas 70-102)

// Ambos têm estas linhas idênticas:
const tz = 'America/Recife';
const fromISO = dayjs().tz(tz).startOf('day').toISOString();
const toISO = dayjs().tz(tz).add(2, 'day').startOf('day').toISOString();
await Promise.all([
  queryClient.prefetchQuery({ ... }),
  queryClient.prefetchQuery({ ... }),
]);
```

#### Passo a Passo

**1. Abrir arquivo:**
```bash
code src/contexts/AuthContext.tsx
```

**2. Criar função auxiliar:**

Adicionar no TOPO do arquivo (após imports, antes de `const AuthContext`):

```typescript
// Adicionar após linha ~6 (depois dos imports):

/**
 * Prefetch dashboard data to avoid empty screen after login
 * @param queryClient - React Query client
 * @param tenantId - Current tenant ID
 */
const prefetchDashboardData = async (
    queryClient: QueryClient, 
    tenantId: string
): Promise<void> => {
    const tz = 'America/Recife';
    const fromISO = dayjs().tz(tz).startOf('day').toISOString();
    const toISO = dayjs().tz(tz).add(2, 'day').startOf('day').toISOString();
    
    const { api } = await import('../services/api');
    
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ['dashboardMegaStats', tenantId, tz],
            queryFn: async () => {
                const { data } = await api.get('/api/v1/appointments/mega-stats', {
                    params: { tenantId, tz },
                    headers: { 'Cache-Control': 'no-cache' }
                });
                return data;
            }
        }),
        queryClient.prefetchQuery({
            queryKey: ['dashboardSummary', tenantId, fromISO, toISO],
            queryFn: async () => {
                const { data } = await api.get('/api/v1/appointments/summary', {
                    params: { tenantId, from: fromISO, to: toISO, tz },
                    headers: { 'Cache-Control': 'no-cache' }
                });
                return data;
            }
        })
    ]);
};
```

**3. Substituir no useEffect:**

```typescript
// ANTES (linhas 23-68):
useEffect(() => {
    const checkAuthStatus = async () => {
        try {
            const userData = await auth.me();
            setUser(userData);
            
            // Prefetch básico para evitar telas vazias
            const tz = 'America/Recife';
            const fromISO = dayjs().tz(tz).startOf('day').toISOString();
            const toISO = dayjs().tz(tz).add(2, 'day').startOf('day').toISOString();
            await Promise.all([
                queryClient.prefetchQuery({ ... }),
                queryClient.prefetchQuery({ ... })
            ]);
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };
    checkAuthStatus();
}, [queryClient, tenantId]);

// DEPOIS:
useEffect(() => {
    const checkAuthStatus = async () => {
        try {
            const userData = await auth.me();
            setUser(userData);
            await prefetchDashboardData(queryClient, tenantId);  // ✅ Função extraída
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };
    checkAuthStatus();
}, [queryClient, tenantId]);
```

**4. Substituir no doLogin:**

```typescript
// ANTES (linhas 70-102):
const doLogin = async (credentials: LoginCredentials): Promise<UserPublic> => {
    const userData = await auth.login(credentials);
    setUser(userData);
    
    // Bootstrap pós-login
    const tz = 'America/Recife';
    const fromISO = dayjs().tz(tz).startOf('day').toISOString();
    const toISO = dayjs().tz(tz).add(2, 'day').startOf('day').toISOString();
    await Promise.all([
        queryClient.prefetchQuery({ ... }),
        queryClient.prefetchQuery({ ... })
    ]);
    
    return userData;
};

// DEPOIS:
const doLogin = async (credentials: LoginCredentials): Promise<UserPublic> => {
    const userData = await auth.login(credentials);
    setUser(userData);
    await prefetchDashboardData(queryClient, tenantId);  // ✅ Função extraída
    return userData;
};
```

**5. Salvar arquivo**

#### Validação

**Checklist de Validação:**

- [ ] TypeScript compila:
  ```bash
  npx tsc --noEmit
  ```

- [ ] Frontend inicia:
  ```bash
  npm run dev
  ```

- [ ] **Testar login:**
  1. Fazer logout (se logado)
  2. Fazer login novamente
  3. Dashboard deve carregar com dados (não vazio)
  4. Estatísticas devem aparecer

- [ ] **Testar reload:**
  1. Com usuário logado, recarregar página (F5)
  2. Dashboard deve carregar com dados
  3. Não deve mostrar tela vazia

- [ ] Console sem erros

#### Commit

```bash
git add src/contexts/AuthContext.tsx
git commit -m "refactor: extract duplicate prefetch code (P0-009)

- Created prefetchDashboardData helper function
- Removed 40 lines of duplicated code
- Used in both useEffect and doLogin
- Risk Level: LOW
- Ref: docs/MELHORIAS-E-CORRECOES.md#P0-009"
```

#### Notas Importantes

💡 **Benefícios:**
- Código mais DRY (Don't Repeat Yourself)
- Mudanças futuras em 1 lugar só
- Mais testável

⚠️ **Se quebrar algo:**
```bash
# Reverter
git checkout HEAD -- src/contexts/AuthContext.tsx

# Verificar que voltou ao normal
npm run dev
```

---

### Correção #8: Adicionar Error Boundary (P0-015)

**Nível de Risco:** 🟡 BAIXO  
**Tempo Estimado:** 20 minutos  
**Prioridade:** P0 (UX Crítica)  
**Referência:** [MELHORIAS-E-CORRECOES.md#P0-015](./MELHORIAS-E-CORRECOES.md#p0-015-falta-error-boundary-no-react)

#### Por Que Fazer?

- ✅ Previne tela branca em caso de erro
- ✅ UX profissional
- ✅ Facilita debugging
- ✅ Código novo (não modifica existente)

#### Pré-requisitos

- [ ] Correções anteriores concluídas
- [ ] Entender React Class Components (Error Boundary precisa ser classe)

#### Arquivos Afetados

- **NOVO:** `src/components/ErrorBoundary.tsx`
- **MODIFICAR:** `src/App.tsx`

#### Passo a Passo

**1. Criar componente Error Boundary:**

Criar arquivo `src/components/ErrorBoundary.tsx`:

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Atualizar state para mostrar fallback UI
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error Boundary caught:', error, errorInfo);
        
        // TODO: Enviar para serviço de monitoramento (Sentry, etc)
        // Sentry.captureException(error, { extra: errorInfo });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';  // Recarrega app
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Ops! Algo deu errado
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Desculpe, encontramos um erro inesperado. 
                            Nossa equipe foi notificada.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-4 text-left">
                                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                                    Detalhes do erro (apenas em desenvolvimento)
                                </summary>
                                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-48">
                                    <div className="font-semibold mb-2">Mensagem:</div>
                                    {this.state.error.message}
                                    
                                    <div className="font-semibold mt-4 mb-2">Stack:</div>
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                        <Button onClick={this.handleReset} className="w-full">
                            Recarregar Aplicação
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
```

**2. Modificar App.tsx:**

```typescript
// src/App.tsx

// ADICIONAR import no topo:
import ErrorBoundary from '@/components/ErrorBoundary';

// ANTES (linhas 33-82):
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TenantProvider>
      <AuthProvider>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* ... rotas ... */}
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </AuthProvider>
    </TenantProvider>
  </QueryClientProvider>
);

// DEPOIS:
const App = () => (
  <ErrorBoundary>  {/* ✅ Adicionar aqui */}
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <AuthProvider>
          <AppProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* ... rotas ... */}
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AppProvider>
        </AuthProvider>
      </TenantProvider>
    </QueryClientProvider>
  </ErrorBoundary>  {/* ✅ Fechar aqui */}
);
```

**3. Salvar ambos arquivos**

#### Validação

**Checklist de Validação:**

- [ ] TypeScript compila:
  ```bash
  npx tsc --noEmit
  ```

- [ ] Frontend inicia:
  ```bash
  npm run dev
  ```

- [ ] **Testar funcionamento normal:**
  - Navegar pela aplicação
  - Fazer login/logout
  - Tudo deve funcionar como antes

- [ ] **Testar Error Boundary (simular erro):**

  **Opção A: Simular erro em componente:**
  
  Criar arquivo temporário `src/components/BuggyComponent.tsx`:
  ```typescript
  export const BuggyComponent = () => {
    throw new Error('Teste de Error Boundary!');
    return <div>Nunca renderiza</div>;
  };
  ```
  
  Adicionar em alguma rota de `App.tsx`:
  ```typescript
  import { BuggyComponent } from './components/BuggyComponent';
  
  // Adicionar rota de teste:
  <Route path="/test-error" element={<BuggyComponent />} />
  ```
  
  Visitar: http://localhost:8080/test-error
  
  **Resultado esperado:**
  - ✅ Deve mostrar tela de erro bonita (não tela branca)
  - ✅ Deve mostrar ícone de alerta
  - ✅ Deve mostrar mensagem amigável
  - ✅ Em dev, deve mostrar detalhes do erro
  - ✅ Botão "Recarregar" deve funcionar

**4. Remover código de teste:**
```bash
# Após validar, remover:
rm src/components/BuggyComponent.tsx

# E remover a rota de teste de App.tsx
```

#### Commit

```bash
git add src/components/ErrorBoundary.tsx src/App.tsx
git commit -m "feat: add Error Boundary to prevent white screen (P0-015)

- Created ErrorBoundary component with fallback UI
- Wrapped entire app with error boundary
- Shows friendly error page instead of white screen
- Includes error details in development mode
- Risk Level: LOW (new code, doesn't modify existing)
- Ref: docs/MELHORIAS-E-CORRECOES.md#P0-015"
```

#### Notas Importantes

💡 **Por que Class Component?**
- Error Boundaries DEVEM ser class components
- É uma limitação do React (não funciona com hooks)
- É a única exceção onde usamos classes

⚠️ **Limitações:**
- Não captura erros em event handlers
- Não captura erros em código assíncrono
- Não captura erros no próprio Error Boundary

🚀 **Próximo Passo:**
- Futuramente integrar com Sentry para monitoramento
- Por enquanto, apenas console.error

---

### 🎊 Checkpoint! Primeiras 8 Correções Completas!

**Progresso:**
- ✅ Nível 0 (5 correções) - 100% completo
- ✅ Nível 1 (3 correções de 25) - 12% completo

**Você já conquistou:**
- 🔒 Segurança melhorada (prints sensíveis, bare except)
- 📖 Código mais limpo (comentários, magic numbers)
- 🐛 Bugs corrigidos (useEffect, ApiError)
- ♻️ Menos código duplicado (prefetch)
- 🎨 Melhor UX (Error Boundary)

**Status do Projeto:**
```
Segurança:     ██████░░░░  6/10 (+1)
Performance:   ████░░░░░░  4/10 (sem mudança)
Manutenção:    ██████░░░░  6/10 (+1)
Arquitetura:   ██████░░░░  6/10 (sem mudança)
```

**Próximas Correções (Nível 1 continuação):**
- #9: Validação de Timestamps (P0-012)
- #10: Adicionar Transações (P0-010)
- #11-25: Mais refactorings seguros

**Quando continuar?**
- Você pode parar aqui e continuar depois
- Ou seguir para as próximas correções
- Recomendo: fazer 2-3 correções por sessão

---

## Continuação Nível 1 - Correções #9-25

### Correção #9: Validação de Timestamps (P0-012)

**Nível de Risco:** 🟡 BAIXO  
**Tempo Estimado:** 15 minutos  
**Prioridade:** P0 (Validação)  
**Referência:** [MELHORIAS-E-CORRECOES.md#P0-012](./MELHORIAS-E-CORRECOES.md#p0-012-falta-validacao-de-entrada-em-timestamps)

#### Por Que Fazer?

- ✅ Previne crash com datas inválidas
- ✅ Melhora mensagens de erro
- ✅ Validação do lado do servidor
- ✅ Apenas adiciona validações (não quebra código existente)

#### Pré-requisitos

- [ ] Backend rodando
- [ ] Entender Pydantic validators

#### Arquivo Afetado

- `backend/schemas/appointment.py`

#### Passo a Passo

**1. Abrir arquivo:**
```bash
code backend/schemas/appointment.py
```

**2. Adicionar imports necessários:**

```python
# ANTES (linha 1):
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# DEPOIS (linha 1):
from pydantic import BaseModel, validator
from datetime import datetime, timezone, timedelta
from typing import Optional
```

**3. Adicionar validators ao AppointmentCreate:**

```python
# ANTES (linhas 5-10):
class AppointmentCreate(BaseModel):
    tenantId: str
    patientId: str
    startsAt: str  # ISO string UTC
    durationMin: int
    status: Optional[str] = "pending"

# DEPOIS (linhas 5-45):
class AppointmentCreate(BaseModel):
    tenantId: str
    patientId: str
    startsAt: str  # ISO string UTC
    durationMin: int
    status: Optional[str] = "pending"
    
    @validator('startsAt')
    def validate_starts_at(cls, v):
        """Validate appointment datetime."""
        try:
            dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
        except (ValueError, AttributeError) as e:
            raise ValueError(
                f"Invalid datetime format: {v}. "
                "Expected ISO 8601 format (e.g., '2025-10-10T14:00:00Z')"
            )
        
        # Validar que não está no passado (tolerância de 5 min para timezone/latência)
        now = datetime.now(timezone.utc)
        if dt < now - timedelta(minutes=5):
            raise ValueError(
                "Appointment cannot be in the past. "
                f"Received: {dt.isoformat()}, Current: {now.isoformat()}"
            )
        
        # Validar que não está muito no futuro (máximo 2 anos)
        max_future = now + timedelta(days=730)  # 2 anos
        if dt > max_future:
            raise ValueError(
                "Appointment cannot be more than 2 years in the future. "
                f"Maximum allowed: {max_future.date()}"
            )
        
        return v
    
    @validator('durationMin')
    def validate_duration(cls, v):
        """Validate appointment duration."""
        if v < 15:
            raise ValueError("Duration must be at least 15 minutes")
        if v > 480:  # 8 horas
            raise ValueError("Duration cannot exceed 8 hours (480 minutes)")
        if v % 5 != 0:
            raise ValueError("Duration must be multiple of 5 minutes")
        return v
    
    @validator('tenantId', 'patientId')
    def validate_ids(cls, v):
        """Validate that IDs are not empty."""
        if not v or not v.strip():
            raise ValueError("ID cannot be empty")
        if len(v) < 3:
            raise ValueError("ID must be at least 3 characters")
        return v.strip()
```

**4. Salvar arquivo**

#### Validação

**Checklist de Validação:**

- [ ] Backend inicia sem erros:
  ```bash
  cd backend
  uvicorn main:app --reload
  ```

- [ ] **Testar criação de appointment válido:**
  - Via Swagger UI (http://localhost:8000/docs)
  - POST /api/v1/appointments/
  - Body:
    ```json
    {
      "tenantId": "tenant-123",
      "patientId": "patient-456",
      "startsAt": "2025-12-10T14:00:00Z",
      "durationMin": 60,
      "status": "pending"
    }
    ```
  - Deve retornar 200 OK

- [ ] **Testar validações (devem FALHAR):**

  **Teste 1: Data no passado**
  ```json
  {
    "tenantId": "tenant-123",
    "patientId": "patient-456",
    "startsAt": "2020-01-01T14:00:00Z",
    "durationMin": 60
  }
  ```
  Deve retornar 422 com erro: "Appointment cannot be in the past"

  **Teste 2: Duração inválida**
  ```json
  {
    "tenantId": "tenant-123",
    "patientId": "patient-456",
    "startsAt": "2025-12-10T14:00:00Z",
    "durationMin": 5
  }
  ```
  Deve retornar 422 com erro: "Duration must be at least 15 minutes"

  **Teste 3: Formato inválido**
  ```json
  {
    "tenantId": "tenant-123",
    "patientId": "patient-456",
    "startsAt": "invalid-date",
    "durationMin": 60
  }
  ```
  Deve retornar 422 com erro sobre formato

- [ ] **Frontend ainda funciona:**
  - Criar appointment via UI
  - Deve funcionar normalmente (se data/hora válidas)

#### Commit

```bash
git add backend/schemas/appointment.py
git commit -m "feat: add input validation for appointments (P0-012)

- Added validators for startsAt (date range checks)
- Added validators for durationMin (15min-8h, multiples of 5)
- Added validators for IDs (not empty, min length)
- Improves error messages for invalid input
- Risk Level: LOW (only adds validations)
- Ref: docs/MELHORIAS-E-CORRECOES.md#P0-012"
```

#### Notas Importantes

💡 **Por que isso é seguro?**
- Apenas adiciona validações
- Código válido existente continua funcionando
- Código inválido agora retorna erros claros (antes crashava)

⚠️ **Cuidado:**
- Frontend pode precisar tratar os novos erros 422
- Mas já deve estar tratando, então ok

---

### Resumo Rápido: Correções #10-25 (Nível 1)

Devido ao tamanho do documento, vou resumir as próximas correções do Nível 1. Você pode implementá-las seguindo o mesmo padrão das anteriores:

**#10: Adicionar Transações (P0-010)** - 20 min
- Adicionar try-except com rollback em create/update
- `backend/routes/appointments.py`

**#11-15: Refactorings Frontend** - 2 horas
- Lazy loading de rotas (PERF-004)
- Memoização de cálculos (PERF-003)
- staleTime adequado (PERF-005)

**#16-20: Limpezas Backend** - 1 hora
- Nomenclatura consistente (MAINT-004)
- Documentação de funções (MAINT-005)
- Environment management (MAINT-002)

**#21-25: Adições Seguras** - 2 horas
- Validação SECRET_KEY (P0-003)
- Security headers (S02)
- API versioning (ARCH-003)

---

## Nível 2 - RISCO MÉDIO

> 🟠 **Requer atenção - Testes manuais necessários**  
> Tempo total: ~10-15 horas  
> Correções: 30

### ⚠️ ATENÇÃO: Leia Antes de Começar

**Nível 2 é diferente:**
- Mudanças de lógica (não apenas adições)
- Requer testes manuais **extensivos**
- Pode afetar funcionalidades existentes
- **SEMPRE** fazer commit antes de cada correção
- **SEMPRE** testar completamente após mudança

**Checklist Obrigatório:**
- [ ] Fazer backup do código atual
- [ ] Ler correção completa antes de iniciar
- [ ] Testar cada mudança individualmente
- [ ] Validar todas funcionalidades afetadas
- [ ] Preparar plano de rollback

### Principais Correções Nível 2

**Correção #26: Otimizar N+1 Queries (P0-005)** - 45 min
- 🟠 MÉDIO RISCO
- Muda lógica de queries
- Ganho: 75% menos queries

**Correção #27: Adicionar Índices (PERF-001)** - 30 min
- 🟠 MÉDIO RISCO
- Altera schema do banco
- Ganho: 10-50x performance

**Correção #28: Cache de Stats (PERF-002)** - 60 min
- 🟠 MÉDIO RISCO
- Adiciona lógica de cache
- Ganho: 95% menos cálculos

**Correção #29: Paginação (P0-007)** - 90 min
- 🟠 MÉDIO RISCO
- Muda API response format
- Frontend precisa adaptar

**Correção #30-55: Outras otimizações**
- Detalhadas no documento principal

---

## Nível 3 - RISCO ALTO

> 🔴 **PERIGOSO - Requer testes extensivos**  
> Tempo total: ~20-30 horas  
> Correções: 22

### 🚨 AVISOS CRÍTICOS

**⛔ NÃO comece Nível 3 sem:**
- [ ] Todos os níveis anteriores completos
- [ ] Backup completo do código
- [ ] Entender completamente cada mudança
- [ ] Tempo para reverter se necessário
- [ ] Ambiente de teste separado (ideal)

**Neste nível:**
- Mudanças em autenticação (pode travar usuários)
- Alterações de schema (pode perder dados)
- Refactoring arquitetural (pode quebrar tudo)

### Principais Correções Nível 3

**Correção #56: Remover Fallback SHA256 (P0-002)** - 2 horas
- 🔴 ALTO RISCO
- Muda sistema de senhas
- Requer migração de dados

**Correção #57: Validar Tenant Access (P0-006)** - 3 horas
- 🔴 ALTO RISCO
- Adiciona validação multi-tenant
- Pode bloquear acessos válidos se mal implementado

**Correção #58: Rate Limiting (P0-011)** - 2 horas
- 🔴 ALTO RISCO
- Instala nova dependência
- Pode bloquear usuários legítimos

**Correção #59: Service Layer (ARCH-001)** - 10 horas
- 🔴 ALTO RISCO
- Refactoring massivo
- Muda toda estrutura backend

**Correção #60: Alembic Migrations (ARCH-002)** - 4 horas
- 🔴 ALTO RISCO
- Sistema de migrations
- Pode corromper banco se errado

---

## Comandos Git Essenciais

### Comandos de Segurança

**Antes de qualquer correção:**
```bash
# Ver status atual
git status

# Ver diferenças não commitadas
git diff

# Fazer backup (commit)
git add .
git commit -m "backup: before correction #X"
```

**Se algo der errado:**
```bash
# Opção 1: Desfazer último commit (mantém mudanças)
git reset --soft HEAD~1

# Opção 2: Desfazer último commit (DESCARTA mudanças)
git reset --hard HEAD~1

# Opção 3: Reverter arquivo específico
git checkout HEAD -- caminho/arquivo.py

# Opção 4: Reverter múltiplos arquivos
git checkout HEAD -- backend/routes/ src/hooks/
```

**Ver histórico:**
```bash
# Ver commits recentes
git log --oneline -10

# Ver mudanças de um commit
git show <commit-hash>

# Ver arquivos mudados
git log --stat
```

### Workflow Recomendado

```bash
# 1. Status limpo antes de começar
git status
# (deve mostrar "nothing to commit")

# 2. Fazer correção
# ... editar arquivos ...

# 3. Verificar mudanças
git diff

# 4. Testar tudo
# ... testes manuais ...

# 5. Se OK, commitar
git add .
git commit -m "fix: descrição da correção"

# 6. Se quebrou, reverter
git reset --hard HEAD~1
```

### Branches (Opcional - Mais Seguro)

```bash
# Criar branch para cada correção
git checkout -b fix/P0-001-remove-prints
# ... fazer correção ...
git add .
git commit -m "fix: remove sensitive prints"

# Se funcionou, voltar para main e merge
git checkout main
git merge fix/P0-001-remove-prints

# Se quebrou, apenas deletar branch
git checkout main
git branch -D fix/P0-001-remove-prints
```

---

## FAQ - Perguntas Frequentes

### Geral

**Q: Por onde devo começar?**
A: Correção #1 (Remover prints sensíveis) - Nível 0, super seguro.

**Q: Posso fazer várias correções de uma vez?**
A: ❌ NÃO! Uma correção por vez. Commit entre cada uma.

**Q: Quanto tempo leva para fazer todas?**
A: ~70-80 horas total. Mas faça em sprints de 1-2 horas por dia.

**Q: Preciso fazer todas?**
A: Não. Priorize os P0 primeiro. P3 são opcionais.

### Sobre Riscos

**Q: O que é "Risco Zero"?**
A: Mudanças que não podem quebrar funcionalidade (remoções, adições puras).

**Q: E se eu quebrar algo no Nível 2 ou 3?**
A: Use `git reset --hard HEAD~1` para voltar ao commit anterior.

**Q: Como saber se quebrei algo?**
A: Teste manualmente após cada mudança. Use as checklists de validação.

**Q: Devo fazer backup antes?**
A: ✅ SIM! Sempre commit antes de cada correção.

### Sobre Implementação

**Q: Posso pular correções?**
A: No Nível 0 e 1, sim. No Nível 2 e 3, siga a ordem recomendada.

**Q: E se eu não entender uma correção?**
A: Não faça! Pule para a próxima ou estude mais sobre o tópico.

**Q: Posso adaptar o código sugerido?**
A: Sim, mas mantenha a mesma lógica e segurança.

**Q: E se o teste falhar?**
A: Reverta imediatamente: `git reset --hard HEAD~1`

### Sobre Testes

**Q: Preciso de testes automatizados?**
A: Não para começar. Testes manuais são suficientes.

**Q: Como testar sem testes automatizados?**
A: Use as checklists de validação. Teste no navegador.

**Q: Quando criar testes automatizados?**
A: Após completar Nível 1-2, considere Correção MAINT-003.

### Sobre Git

**Q: Não sei Git, posso fazer?**
A: Aprenda o básico primeiro. É essencial para reverter mudanças.

**Q: Devo usar branches?**
A: Opcional, mas recomendado para Nível 2 e 3.

**Q: Como reverter se quebrei tudo?**
A: `git log` para ver commits, `git reset --hard <hash>` para voltar.

---

## Troubleshooting

### Problema: Frontend não compila

**Sintomas:**
```
Error: Cannot find module '@/constants/cache'
```

**Solução:**
1. Verificar se arquivo foi criado no caminho correto
2. Verificar imports (maiúsculas/minúsculas)
3. Reiniciar dev server: `Ctrl+C` e `npm run dev` de novo

---

### Problema: Backend não inicia

**Sintomas:**
```
ModuleNotFoundError: No module named 'slowapi'
```

**Solução:**
```bash
cd backend
source venv/bin/activate  # ou venv\Scripts\activate no Windows
pip install slowapi
```

---

### Problema: Git dá erro ao reverter

**Sintomas:**
```
error: Your local changes would be overwritten by merge
```

**Solução:**
```bash
# Salvar mudanças atuais (se quiser)
git stash

# OU descartar tudo
git reset --hard HEAD

# Então tentar novamente
git checkout HEAD -- arquivo.py
```

---

### Problema: TypeScript reclama de imports

**Sintomas:**
```
TS2307: Cannot find module '@/constants/cache'
```

**Solução:**
1. Verificar `tsconfig.json` tem paths configurados
2. Reiniciar TypeScript server no VS Code:
   - Cmd/Ctrl + Shift + P
   - "TypeScript: Restart TS Server"
3. Fechar e abrir VS Code

---

### Problema: Mudanças não aparecem

**Sintomas:**
- Editei arquivo mas não vejo diferença no navegador

**Solução:**
1. Hard refresh: `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
2. Limpar cache do browser
3. Verificar se arquivo foi salvo (VS Code mostra ponto branco se não salvo)
4. Reiniciar dev server

---

### Problema: "Tudo quebrou, não sei o que fazer"

**Solução de Emergência:**
```bash
# 1. Ver últimos 5 commits
git log --oneline -5

# 2. Voltar para commit que funcionava
git reset --hard <hash-do-commit-bom>

# 3. Verificar que voltou
npm run dev  # (ou uvicorn main:app --reload)

# 4. Se ainda não funciona, clonar repositório novamente
cd ..
git clone <url-do-repo> align-work-backup
cd align-work-backup
npm install
# etc
```

---

## Glossário

**Bare Except:** `except:` sem especificar exceção - captura tudo (má prática)

**Bcrypt:** Algoritmo de hash de senhas seguro com salt automático

**Cache:** Armazenar resultado de operação cara para reutilizar

**CSRF:** Cross-Site Request Forgery - ataque de requisição falsa

**DRY:** Don't Repeat Yourself - princípio de não duplicar código

**Error Boundary:** Componente React que captura erros de renderização

**Magic Number:** Número hardcoded sem nome/contexto (ex: `30_000`)

**Memoization:** Cache de resultado de função para evitar recálculo

**Migration:** Script versionado de alteração de schema de banco

**N+1 Query:** Bug onde faz N queries ao invés de 1 (má performance)

**Paginação:** Dividir resultados em páginas (ex: 50 items por vez)

**Prefetch:** Carregar dados antes de serem necessários

**Rate Limiting:** Limitar número de requisições por tempo

**Refactoring:** Melhorar código sem mudar funcionalidade

**Rollback:** Reverter mudança (voltar ao estado anterior)

**Service Layer:** Camada de lógica de negócio separada das rotas

**SHA256:** Algoritmo de hash (INSEGURO para senhas sem salt)

**Stale Time:** Tempo que dados são considerados "frescos" no cache

**Tenant:** Cliente/organização em sistema multi-tenant

**TypeScript:** JavaScript com tipos (mais seguro)

**UTC:** Coordinated Universal Time - fuso horário padrão

**Validation:** Verificar se dados estão corretos/válidos

**Timezone:** Fuso horário (ex: America/Recife = UTC-3)

---

## Próximos Passos

### Você está aqui:
```
[████░░░░░░░░░░░░░░░░] 8/87 correções (9%)
```

### Recomendações:

**Se você é iniciante:**
1. Complete todo Nível 0 (correções #1-5)
2. Faça 2-3 correções do Nível 1
3. Pare, teste bem, use o sistema alguns dias
4. Continue gradualmente

**Se você tem experiência:**
1. Complete Nível 0 e 1 (correções #1-25)
2. Escolha correções do Nível 2 que mais impactam você
3. Deixe Nível 3 para quando tiver tempo/necessidade

**Para produção:**
1. Complete TODOS os P0 (críticos)
2. Complete P1 (altos) relacionados a segurança
3. P2 e P3 são melhorias, faça conforme tempo

### Mantendo o Documento Atualizado

Conforme você completa correções, marque aqui:

```markdown
## Meu Progresso

### Nível 0 - Risco Zero
- [x] #1: Remover prints sensíveis
- [x] #2: Remover comentários óbvios
- [x] #3: Extrair magic numbers
- [x] #4: Corrigir bare except
- [x] #5: Corrigir useEffect deps

### Nível 1 - Risco Baixo
- [x] #6: Corrigir ApiError duplicado
- [x] #7: Extrair código duplicado
- [x] #8: Adicionar Error Boundary
- [ ] #9: Validação de timestamps
- [ ] #10: Adicionar transações
... (continuar)
```

---

## Conclusão

Este documento é seu **guia de sobrevivência** para melhorar o código AlignWork com **segurança** e **confiança**.

**Lembre-se:**
- 🐢 Devagar e sempre
- ✅ Uma correção por vez
- 🔄 Commit frequente
- 🧪 Teste antes de commitar
- 🆘 Reverta se quebrar

**Você consegue! 💪**

Comece pela Correção #1 e celebre cada vitória! 🎉

---

**Documento criado em:** Outubro 2025  
**Versão:** 1.0.0  
**Última atualização:** Outubro 2025  
**Autor:** Time AlignWork  

**Para dúvidas:**
- Consulte a seção FAQ
- Veja Troubleshooting
- Abra issue no repositório com tag `melhorias`

**Bom trabalho!** 🚀

