# Implementação: Campo de Gênero no Perfil

## 1. Resumo da Necessidade

### Situação Atual

1. **Perfil do Usuário**:
   - Contém campos: Nome, Sobrenome, Email, Telefones
   - Não possui campo de gênero
   - Mensagem de boas-vindas usa "Dr." fixo para todos

2. **Mensagem do Dashboard**:
   - Formato atual: "Dr. [Nome] [Sobrenome]"
   - Não considera o gênero do profissional
   - Pode ser inadequado para profissionais do gênero feminino

### Necessidade

1. **Adicionar campo "Gênero"** ao perfil do usuário
2. **4 opções de gênero**:
   - Masculino → usa "Dr."
   - Feminino → usa "Dra."
   - Nenhum desses → usa "Dr."
   - Prefiro não informar → usa "Dr."
3. **Atualizar mensagem do Dashboard** para respeitar o gênero selecionado

### Objetivos

- **Inclusão**: Permitir que profissionais escolham como querem ser tratados
- **Personalização**: Mensagem mais adequada ao gênero do profissional
- **UX**: Interface clara e respeitosa para seleção de gênero
- **Privacidade**: Opção "Prefiro não informar" disponível

### Impactos

- **Backend**: Novo campo no banco de dados e schema
- **Frontend**: Novo componente de seleção e lógica de mensagem
- **Dashboard**: Mensagem dinâmica baseada no gênero
- **Experiência**: Tratamento mais profissional e personalizado

---

## 2. Análise da Estrutura Atual

### Banco de Dados (`users` table)

**Campos atuais relacionados**:
- `first_name` VARCHAR
- `last_name` VARCHAR
- `email` VARCHAR

**Campo a adicionar**:
- `gender` VARCHAR (nullable, default: NULL)

### Schema Pydantic (`backend/schemas/user.py`)

**UserUpdate atual**:
```python
class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_personal: Optional[str] = None
    phone_professional: Optional[str] = None
    phone_clinic: Optional[str] = None
    profile_photo_url: Optional[str] = None
```

**Campo a adicionar**:
```python
gender: Optional[str] = None
```

### Interface TypeScript (`src/types/auth.ts`)

**User atual**:
```typescript
export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    // ... outros campos
}
```

**Campo a adicionar**:
```typescript
gender?: string | null;
```

### Componente Dashboard (`src/pages/Dashboard.tsx`)

**Função atual**:
```typescript
const getGreetingMessage = (user: User | null): string => {
  if (!user) return "Bom dia! 👋";
  
  const firstName = user.first_name?.trim() || "";
  const lastName = user.last_name?.trim() || "";

  if (firstName && lastName) {
    return `Dr. ${firstName} ${lastName}`; // ← SEMPRE "Dr."
  }
  // ...
};
```

**Precisa considerar**:
- `user.gender` para determinar "Dr." ou "Dra."

---

## 3. Estrutura de Dados

### Valores de Gênero

**Enum/Constantes**:
```typescript
// Frontend
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}

// Labels em português
export const GENDER_LABELS: Record<Gender, string> = {
  [Gender.MALE]: 'Masculino',
  [Gender.FEMALE]: 'Feminino',
  [Gender.OTHER]: 'Nenhum desses',
  [Gender.PREFER_NOT_TO_SAY]: 'Prefiro não informar'
};
```

**Backend (Python)**:
```python
# Valores aceitos: 'male', 'female', 'other', 'prefer_not_to_say', NULL
```

### Lógica de Título Profissional

**Regras**:
- `gender === 'female'` → "Dra."
- `gender === 'male'` → "Dr."
- `gender === 'other'` → "Dr."
- `gender === 'prefer_not_to_say'` → "Dr."
- `gender === null` ou não definido → "Dr." (default)

**Justificativa**:
- "Dr." é o padrão neutro/tradicional
- Apenas "Feminino" usa "Dra." explicitamente
- Respeita a escolha de quem não quer informar

---

## 4. Decisões de Design e Arquitetura

### 4.1. Campo de Banco de Dados

**Decisão**: Adicionar coluna `gender VARCHAR(50)` nullable.

**Justificativas**:
- VARCHAR para flexibilidade futura
- Nullable para permitir usuários sem gênero definido
- Default NULL para usuários existentes

**Migração**:
- Adicionar coluna `gender` à tabela `users`
- Não migrar dados existentes (deixar NULL)
- Usuários poderão atualizar posteriormente

### 4.2. Componente de Seleção

**Decisão**: Usar `Select` (dropdown) do shadcn/ui.

**Justificativas**:
- Interface clara e consistente
- Fácil de usar em mobile e desktop
- Validação automática de valores

**Alternativas consideradas**:
- Radio buttons: ocupa muito espaço vertical
- Input texto: permite valores inválidos

### 4.3. Posicionamento no Formulário

**Decisão**: Adicionar após o campo Email, antes da seção de Contatos.

**Estrutura proposta**:
```
Informações Pessoais
├── Nome *
├── Sobrenome *
├── Email *
└── Gênero

Contatos
├── Telefone Pessoal
├── Telefone Profissional
└── Telefone da Clínica
```

### 4.4. Obrigatoriedade

**Decisão**: Campo **opcional** (não obrigatório).

**Justificativas**:
- Respeita privacidade do usuário
- Permite uso do sistema sem fornecer essa informação
- Opção "Prefiro não informar" já existe para quem quiser marcar explicitamente

---

## 5. Plano de Implementação (Sem Diffs)

### Etapa 1: Migração do Banco de Dados

**Arquivo**: `backend/migrate_gender.py` (temporário)

1. **Criar script de migração**:
   - Conectar ao banco `alignwork.db`
   - Criar backup: `alignwork.backup-gender`
   - Adicionar coluna: `ALTER TABLE users ADD COLUMN gender VARCHAR(50)`
   - Verificar estrutura com `PRAGMA table_info(users)`

2. **Executar migração**:
   - Rodar script: `python backend/migrate_gender.py`
   - Verificar sucesso
   - Deletar script após execução

### Etapa 2: Backend - Modelo e Schema

**Arquivo**: `backend/models/user.py`

1. **Adicionar campo ao modelo**:
   - `gender = Column(String(50), nullable=True)`
   - Posicionar após `last_name`

**Arquivo**: `backend/schemas/user.py`

1. **Atualizar `UserUpdate`**:
   - Adicionar: `gender: Optional[str] = None`
   - Adicionar validador para valores aceitos

2. **Atualizar `UserResponse`**:
   - Adicionar: `gender: Optional[str] = None`

3. **Criar validador de gênero**:
   ```python
   @validator('gender')
   def validate_gender(cls, v):
       if v is not None and v not in ['male', 'female', 'other', 'prefer_not_to_say']:
           raise ValueError('Gênero inválido')
       return v
   ```

### Etapa 3: Frontend - Tipos

**Arquivo**: `src/types/auth.ts`

1. **Atualizar interface `User`**:
   - Adicionar: `gender?: string | null;`

2. **Atualizar interface `UserUpdatePayload`**:
   - Adicionar: `gender?: string;`

3. **Criar enum e labels**:
   ```typescript
   export enum Gender {
     MALE = 'male',
     FEMALE = 'female',
     OTHER = 'other',
     PREFER_NOT_TO_SAY = 'prefer_not_to_say'
   }
   
   export const GENDER_LABELS: Record<Gender, string> = {
     [Gender.MALE]: 'Masculino',
     [Gender.FEMALE]: 'Feminino',
     [Gender.OTHER]: 'Nenhum desses',
     [Gender.PREFER_NOT_TO_SAY]: 'Prefiro não informar'
   };
   ```

### Etapa 4: Frontend - Componente de Formulário

**Arquivo**: `src/components/Settings/ProfileFormContent.tsx`

1. **Adicionar campo de gênero** após o campo Email:
   - Usar componente `Select` do shadcn/ui
   - Label: "Gênero"
   - Placeholder: "Selecione seu gênero (opcional)"
   - Opções: Masculino, Feminino, Nenhum desses, Prefiro não informar

2. **Atualizar props**:
   - Adicionar `gender` ao `formData`
   - Adicionar handler para mudança de gênero

3. **Estilo**:
   - Mesma largura dos outros campos
   - Ícone opcional (User ou Users)

### Etapa 5: Frontend - Página de Settings

**Arquivo**: `src/pages/Settings.tsx`

1. **Atualizar estado `formData`**:
   - Adicionar: `gender: user.gender || ''`

2. **Hidratar campo quando usuário carregar**:
   ```typescript
   useEffect(() => {
     if (user) {
       setFormData({
         // ... outros campos
         gender: user.gender || ''
       });
     }
   }, [user]);
   ```

3. **Incluir no payload de salvamento**:
   ```typescript
   const payload: UserUpdatePayload = {
     // ... outros campos
     gender: formData.gender || undefined
   };
   ```

### Etapa 6: Frontend - Lógica de Mensagem do Dashboard

**Arquivo**: `src/pages/Dashboard.tsx`

1. **Atualizar função `getGreetingMessage()`**:
   ```typescript
   const getGreetingMessage = (user: User | null): string => {
     if (!user) return "Bom dia! 👋";
     
     const firstName = user.first_name?.trim() || "";
     const lastName = user.last_name?.trim() || "";
     
     if (firstName && lastName) {
       // Determinar título baseado no gênero
       const title = user.gender === 'female' ? 'Dra.' : 'Dr.';
       return `${title} ${firstName} ${lastName}`;
     }
     
     if (firstName) {
       const title = user.gender === 'female' ? 'Dra.' : 'Dr.';
       return `${title} ${firstName}`;
     }
     
     return "Bom dia! 👋";
   };
   ```

2. **Adicionar emoji de saudação**:
   - Opcionalmente adicionar "👋" ao final da mensagem
   - Exemplo: "Dr. Eduardo Coimbra 👋"

### Etapa 7: Verificação e Ajustes

1. **Verificar que mensagem aparece corretamente**:
   - Se `first_name` e `last_name` estiverem vazios, mensagem será "Bom dia! 👋"
   - Orientar usuário a preencher nome em Configurações → Perfil

2. **Adicionar logging para debug**:
   ```typescript
   console.log('[Dashboard] User data:', {
     firstName: user?.first_name,
     lastName: user?.last_name,
     gender: user?.gender
   });
   ```

---

## 6. Estrutura de Pastas e Arquivos

### Backend

```
backend/
├── models/
│   └── user.py                    (adicionar campo gender)
├── schemas/
│   └── user.py                    (adicionar gender + validador)
└── migrate_gender.py              (criar → executar → deletar)
```

### Frontend

```
src/
├── types/
│   └── auth.ts                    (adicionar gender + enum + labels)
├── components/
│   └── Settings/
│       └── ProfileFormContent.tsx (adicionar campo Select de gênero)
├── pages/
│   ├── Settings.tsx               (adicionar gender ao formData)
│   └── Dashboard.tsx              (atualizar getGreetingMessage)
```

---

## 7. Validações e Regras de Negócio

### Validação de Valores

**Backend**:
- Aceitar apenas: `'male'`, `'female'`, `'other'`, `'prefer_not_to_say'`, `NULL`
- Rejeitar outros valores com erro 422

**Frontend**:
- Pré-validação: Select só permite valores do enum
- Não é possível enviar valor inválido

### Formatação da Mensagem

**Regras**:
1. Se `gender === 'female'` → título = "Dra."
2. Caso contrário (male, other, prefer_not_to_say, null) → título = "Dr."
3. Se não houver nome completo → fallback "Bom dia! 👋"

**Casos especiais**:
- Usuário novo sem nome preenchido → "Bom dia! 👋"
- Usuário antigo sem gênero definido (NULL) → "Dr." (default)
- Usuário que escolheu "Prefiro não informar" → "Dr." (neutro)

---

## 8. Fluxo de Usuário (UX)

### Fluxo 1: Usuário Define Gênero pela Primeira Vez

1. Usuário acessa Configurações → Perfil
2. Vê campo "Gênero" (opcional, sem valor selecionado)
3. Clica no dropdown
4. Vê 4 opções: Masculino, Feminino, Nenhum desses, Prefiro não informar
5. Seleciona "Feminino"
6. Clica "Salvar alterações"
7. Sistema salva `gender = 'female'`
8. Volta ao Dashboard
9. Mensagem agora exibe: "Dra. Maria Silva"

### Fluxo 2: Usuário Altera Gênero

1. Usuário com gênero "Masculino" cadastrado
2. Dashboard exibe: "Dr. João Santos"
3. Acessa Configurações → Perfil
4. Campo "Gênero" mostra "Masculino" selecionado
5. Altera para "Prefiro não informar"
6. Salva alterações
7. Sistema atualiza `gender = 'prefer_not_to_say'`
8. Dashboard continua exibindo: "Dr. João Santos" (default neutro)

### Fluxo 3: Usuário Sem Nome Preenchido

1. Usuário novo faz login
2. `first_name` e `last_name` estão vazios
3. Dashboard exibe: "Bom dia! 👋" (fallback)
4. Acessa Configurações → Perfil
5. Preenche Nome, Sobrenome e Gênero (Feminino)
6. Salva alterações
7. Dashboard agora exibe: "Dra. Ana Costa"

### Fluxo 4: Usuário Limpa Gênero

1. Usuário com gênero "Feminino" cadastrado
2. Acessa Configurações → Perfil
3. No dropdown de gênero, seleciona opção vazia (se disponível)
4. OU: backend permite enviar `gender: null` para limpar
5. Sistema atualiza `gender = NULL`
6. Dashboard volta a usar: "Dr. Ana Costa" (default)

---

## 9. Tratamento de Erros

### Erros Comuns e Mensagens

**Gênero inválido** (422):
```json
{
  "detail": [
    {
      "loc": ["body", "gender"],
      "msg": "Gênero inválido. Valores aceitos: male, female, other, prefer_not_to_say"
    }
  ]
}
```
**Exibir**: Toast vermelho com mensagem

**Erro ao salvar perfil** (500):
```json
{
  "detail": "Failed to update profile. Please try again later."
}
```
**Exibir**: Toast vermelho genérico

---

## 10. Testes de Validação

### Teste 1: Adicionar Campo de Gênero no Formulário

**Passos**:
1. Acessar Configurações → Perfil
2. Verificar campo "Gênero"
3. Clicar no dropdown

**Resultado esperado**:
- Campo "Gênero" aparece após Email
- Dropdown abre com 4 opções
- Labels corretos: Masculino, Feminino, Nenhum desses, Prefiro não informar

### Teste 2: Salvar Gênero Feminino

**Passos**:
1. Selecionar "Feminino" no dropdown
2. Clicar "Salvar alterações"
3. Verificar toast de sucesso
4. Voltar ao Dashboard

**Resultado esperado**:
- Salvamento com sucesso
- `gender = 'female'` no banco
- Dashboard exibe "Dra. [Nome] [Sobrenome]"

### Teste 3: Salvar Gênero Masculino

**Passos**:
1. Selecionar "Masculino" no dropdown
2. Salvar alterações
3. Voltar ao Dashboard

**Resultado esperado**:
- `gender = 'male'` no banco
- Dashboard exibe "Dr. [Nome] [Sobrenome]"

### Teste 4: Gênero "Nenhum desses" ou "Prefiro não informar"

**Passos**:
1. Selecionar "Nenhum desses"
2. Salvar alterações
3. Verificar Dashboard

**Resultado esperado**:
- `gender = 'other'` no banco
- Dashboard exibe "Dr. [Nome] [Sobrenome]" (neutro)

### Teste 5: Usuário Sem Gênero Definido (NULL)

**Passos**:
1. Não selecionar nenhum gênero (deixar vazio)
2. Salvar perfil
3. Verificar Dashboard

**Resultado esperado**:
- `gender = NULL` no banco
- Dashboard exibe "Dr. [Nome] [Sobrenome]" (default)

### Teste 6: Usuário Sem Nome

**Passos**:
1. Usuário novo sem nome preenchido
2. Acessar Dashboard

**Resultado esperado**:
- Dashboard exibe "Bom dia! 👋" (fallback)
- Não quebra com erro

### Teste 7: Alternar Entre Gêneros

**Passos**:
1. Selecionar "Feminino" e salvar → Dashboard "Dra."
2. Alterar para "Masculino" e salvar → Dashboard "Dr."
3. Alterar para "Prefiro não informar" e salvar → Dashboard "Dr."

**Resultado esperado**:
- Todas as transições funcionam
- Dashboard atualiza corretamente

---

## 11. Checklist de Aceitação

A implementação está completa quando:

- [ ] **Banco de dados migrado**
  - Coluna `gender` adicionada à tabela `users`
  - Tipo VARCHAR(50), nullable
  - Backup criado

- [ ] **Backend atualizado**
  - Modelo `User` tem campo `gender`
  - Schema `UserUpdate` aceita `gender`
  - Schema `UserResponse` retorna `gender`
  - Validador aceita apenas valores corretos

- [ ] **Frontend - Tipos**
  - Interface `User` tem campo `gender`
  - Enum `Gender` criado
  - Labels `GENDER_LABELS` criados

- [ ] **Frontend - Formulário**
  - Campo de gênero aparece em Configurações → Perfil
  - Dropdown com 4 opções corretas
  - Salva corretamente no backend

- [ ] **Frontend - Dashboard**
  - Função `getGreetingMessage()` considera gênero
  - "Dra." para feminino
  - "Dr." para masculino, other, prefer_not_to_say, null
  - Fallback "Bom dia! 👋" funciona

- [ ] **Testes manuais passaram**
  - Todos os 7 testes executados com sucesso
  - Mensagem atualiza dinamicamente

- [ ] **Sem erros de lint**
  - Código passa em validações
  - Sem imports não utilizados

---

## 12. Observabilidade

### Logs Recomendados

**Backend**:
```python
# Ao atualizar perfil com gênero
print(f"✏️ User profile updated: user_id={user.id}, gender={user.gender}")
```

**Frontend** (console.log para debug):
```typescript
// Ao exibir mensagem
console.log(`[Dashboard] Greeting: ${greeting}, gender: ${user?.gender}`);

// Ao salvar gênero
console.log(`[Settings] Saving gender: ${formData.gender}`);
```

### Métricas (Opcional)

- **Distribuição de gênero**: Quantos usuários de cada tipo
- **Taxa de preenchimento**: % usuários que preencheram o campo
- **Preferência de privacidade**: Quantos escolheram "Prefiro não informar"

---

## 13. Considerações de Privacidade

### LGPD e Dados Sensíveis

- **Gênero é dado pessoal**: Deve ser tratado com cuidado
- **Opcional**: Usuário não é obrigado a fornecer
- **Controle**: Usuário pode alterar ou remover a qualquer momento
- **Finalidade**: Apenas para personalizar tratamento (Dr./Dra.)

### Boas Práticas

1. **Não expor publicamente**: Gênero não deve aparecer em URLs ou logs públicos
2. **Consentimento implícito**: Ao selecionar, usuário consente com uso
3. **Direito ao esquecimento**: Permitir limpar/remover o dado
4. **Armazenamento seguro**: Banco de dados com backup regular

---

## 14. Diagnóstico: "Mensagem não aparecendo"

### Possíveis Causas

**Problema**: Mensagem "Dr. [Nome] [Sobrenome]" não aparece, continua "Bom dia! 👋"

**Causa 1: Campos vazios**
- `first_name` ou `last_name` estão vazios/null
- **Solução**: Preencher nome em Configurações → Perfil

**Causa 2: Dados não carregados**
- `user` é `null` (ainda carregando)
- **Solução**: Adicionar loading state ou aguardar

**Causa 3: Cache do navegador**
- Dados antigos em cache
- **Solução**: Ctrl+Shift+R (hard refresh)

**Causa 4: API não retorna campos novos**
- Backend não incluiu `first_name`/`last_name` na resposta
- **Solução**: Verificar `UserResponse` no backend

### Como Verificar

1. Abrir Console do navegador (F12)
2. Verificar dados do usuário:
   ```typescript
   console.log('User:', user);
   console.log('First name:', user?.first_name);
   console.log('Last name:', user?.last_name);
   ```
3. Se vazios → preencher em Configurações
4. Se cheios mas não aparece → verificar função `getGreetingMessage()`

---

## 15. Apêndice

### Exemplo de Script de Migração

```python
# backend/migrate_gender.py
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "alignwork.db"

def migrate():
    print("=" * 60)
    print("MIGRAÇÃO: Adicionar campo gender à tabela users")
    print("=" * 60)
    
    if not DB_PATH.exists():
        print(f"[ERRO] Banco de dados não encontrado: {DB_PATH}")
        return
    
    # Criar backup
    backup_path = DB_PATH.parent / f"{DB_PATH.stem}.backup-gender"
    print(f"\n1. Criando backup: {backup_path.name}")
    import shutil
    shutil.copy2(DB_PATH, backup_path)
    print("[OK] Backup criado")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Verificar se coluna já existe
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'gender' in columns:
            print("\n[AVISO] Coluna 'gender' já existe")
            conn.close()
            return
        
        # Adicionar coluna
        print("\n2. Adicionando coluna 'gender'")
        cursor.execute("ALTER TABLE users ADD COLUMN gender VARCHAR(50)")
        conn.commit()
        print("[OK] Coluna adicionada")
        
        # Verificar
        cursor.execute("SELECT COUNT(*) FROM users")
        total = cursor.fetchone()[0]
        print(f"\n3. Total de usuários: {total}")
        print("[OK] MIGRAÇÃO CONCLUÍDA!")
        
    except Exception as e:
        print(f"\n[ERRO] {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
```

### Exemplo de Componente Select

```typescript
<div className="space-y-2">
  <Label htmlFor="gender">Gênero</Label>
  <Select
    value={formData.gender}
    onValueChange={(value) => onChange('gender', value)}
  >
    <SelectTrigger id="gender">
      <SelectValue placeholder="Selecione seu gênero (opcional)" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="male">Masculino</SelectItem>
      <SelectItem value="female">Feminino</SelectItem>
      <SelectItem value="other">Nenhum desses</SelectItem>
      <SelectItem value="prefer_not_to_say">Prefiro não informar</SelectItem>
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground">
    Usado para personalizar seu tratamento (Dr./Dra.)
  </p>
</div>
```

### Tabela de Mapeamento Gênero → Título

| Valor no Banco | Label no Frontend | Título Usado |
|----------------|-------------------|--------------|
| `'male'` | Masculino | Dr. |
| `'female'` | Feminino | Dra. |
| `'other'` | Nenhum desses | Dr. |
| `'prefer_not_to_say'` | Prefiro não informar | Dr. |
| `NULL` | (não selecionado) | Dr. |

---

## Conclusão

Este documento fornece um guia completo para adicionar o campo de gênero ao perfil do usuário e usar essa informação para personalizar a mensagem de boas-vindas no Dashboard.

**Abordagem**: Seguir as etapas na ordem apresentada:
1. Migrar banco de dados (adicionar coluna `gender`)
2. Atualizar backend (modelo + schema + validador)
3. Atualizar frontend (tipos + formulário + Dashboard)
4. Testar todos os cenários

**Prioridade**:
1. Migração do banco (crítico)
2. Backend (schemas e validação)
3. Frontend (formulário em Configurações)
4. Dashboard (lógica de mensagem)

**Diagnóstico**: Se a mensagem não aparecer corretamente, verificar se `first_name` e `last_name` estão preenchidos no perfil do usuário.

**Convenção recomendada**: Usar "Dr." como padrão neutro e "Dra." apenas quando gênero for explicitamente "Feminino".

