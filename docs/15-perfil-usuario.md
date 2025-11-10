# Refatoração: Perfil de Usuário em Configurações

## 1. Resumo da Necessidade

### Situação Atual

O sistema possui uma **aba "Perfil" separada** no menu de navegação, que exibe informações básicas do usuário:
- Avatar com iniciais (ex.: "ED")
- Email único (exibido 2x)
- Campos opcionais: Telefone, Endereço, Membro desde
- Botão "Editar Perfil"

### Necessidade

**Consolidar o perfil do usuário na página de Configurações**, removendo a aba separada, e expandir os campos disponíveis para capturar informações mais completas e profissionais.

### Objetivos

1. **Remover** a aba "Perfil" do menu de navegação principal
2. **Mover** todo o conteúdo de perfil para a seção "Configurações"
3. **Expandir** campos de perfil para incluir:
   - Nome e Sobrenome (separados)
   - Email
   - Foto de perfil (upload opcional)
   - 3 tipos de telefone (pessoal, profissional, clínica)
4. **Melhorar** a experiência de atualização do avatar:
   - Iniciais baseadas em Nome + Sobrenome
   - Upload de foto opcional que substitui as iniciais

### Impactos

- **UX**: Experiência mais profissional e completa
- **Navegação**: Menu principal mais limpo (uma aba a menos)
- **Dados**: Mais informações do usuário para relatórios e comunicação
- **Avatar**: Mais personalização e profissionalismo

---

## 2. Análise da Estrutura Atual

### Estrutura de Navegação Atual

```
Menu Principal:
├── Dashboard
├── Agendamentos
├── Clientes
├── Perfil          ← REMOVER
└── Configurações
```

### Estrutura de Dados Atual (User)

**Tabela `users` (provável estrutura atual)**:
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    full_name VARCHAR,          -- Nome completo em um único campo
    phone VARCHAR,              -- Telefone único
    address VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Componentes Atuais

**Páginas**:
- `src/pages/Perfil.tsx` ou similar → **REMOVER**
- `src/pages/Settings.tsx` → **EXPANDIR**

**Componentes relacionados**:
- Avatar/UserIcon (exibe iniciais)
- Header (mostra email do usuário)

---

## 3. Estrutura de Dados Proposta

### Nova Estrutura da Tabela `users`

**Campos adicionados/modificados**:
```sql
CREATE TABLE users (
    -- Campos existentes
    id INTEGER PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Campos novos/refatorados
    first_name VARCHAR NOT NULL,           -- Nome (novo, obrigatório)
    last_name VARCHAR NOT NULL,            -- Sobrenome (novo, obrigatório)
    
    profile_photo_url VARCHAR,             -- URL da foto de perfil (novo, opcional)
    
    phone_personal VARCHAR,                -- Telefone pessoal (novo, opcional)
    phone_professional VARCHAR,            -- Telefone profissional (novo, opcional)
    phone_clinic VARCHAR,                  -- Telefone da clínica (novo, opcional)
    
    -- Campos deprecados (manter para migração)
    full_name VARCHAR,                     -- Deprecado: migrar para first_name + last_name
    phone VARCHAR,                         -- Deprecado: migrar para phone_personal
    address VARCHAR                        -- Manter se usado em outro lugar
);
```

### Schema Pydantic (Backend)

**UserUpdate**:
```python
class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_personal: Optional[str] = None
    phone_professional: Optional[str] = None
    phone_clinic: Optional[str] = None
    profile_photo_url: Optional[str] = None
    
    @validator('first_name', 'last_name')
    def validate_name(cls, v):
        if v and len(v.strip()) < 2:
            raise ValueError('Nome deve ter pelo menos 2 caracteres')
        return v.strip() if v else None
    
    @validator('phone_personal', 'phone_professional', 'phone_clinic')
    def validate_phone(cls, v):
        if v:
            # Remover caracteres não numéricos
            phone_numbers = re.sub(r'\D', '', v)
            if len(phone_numbers) < 10:
                raise ValueError('Telefone deve ter pelo menos 10 dígitos')
        return v
```

**UserResponse**:
```python
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    profile_photo_url: Optional[str] = None
    phone_personal: Optional[str] = None
    phone_professional: Optional[str] = None
    phone_clinic: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

### Tipos TypeScript (Frontend)

```typescript
export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string | null;
    phone_personal?: string | null;
    phone_professional?: string | null;
    phone_clinic?: string | null;
    created_at: string;
    updated_at: string;
}

export interface UserUpdatePayload {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_personal?: string;
    phone_professional?: string;
    phone_clinic?: string;
    profile_photo_url?: string;
}
```

---

## 4. Decisões de Design e Arquitetura

### 4.1. Upload de Foto de Perfil

**Opção A (Recomendada): Upload para Storage Local/Cloud**
- Upload de arquivo real (PNG, JPG)
- Armazenar em `backend/uploads/profile_photos/`
- Retornar URL: `/api/v1/uploads/profile_photos/{filename}`
- Validações: tamanho máx 5MB, formatos aceitos, dimensões mínimas

**Opção B (Simplificada): Base64 no banco**
- Armazenar imagem como base64 diretamente no campo `profile_photo_url`
- Mais simples mas menos performático
- Não recomendado para produção

**Decisão**: Adotar **Opção A** para escalabilidade.

### 4.2. Avatar: Foto vs Iniciais

**Lógica de exibição**:
1. Se `profile_photo_url` existe → exibir foto
2. Se `profile_photo_url` é null → exibir iniciais
3. Iniciais = primeira letra de `first_name` + primeira letra de `last_name`
4. Exemplo: "Eduardo Coimbra" → "EC"

**Componente Avatar (pseudocódigo)**:
```typescript
function Avatar({ user }) {
    if (user.profile_photo_url) {
        return <img src={user.profile_photo_url} alt="Foto de perfil" />
    }
    
    const initials = getInitials(user.first_name, user.last_name);
    return <div className="avatar-circle">{initials}</div>
}

function getInitials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0).toUpperCase() || '';
    const last = lastName?.charAt(0).toUpperCase() || '';
    return first + last;
}
```

### 4.3. Validação de Email Único

**Regra**: Email deve ser único por usuário (já implementado).

**Validação no backend**:
- Ao atualizar email, verificar se já existe outro usuário com esse email
- Retornar erro 422 se email duplicado

### 4.4. Campos Obrigatórios vs Opcionais

**Obrigatórios** (não podem ser null/vazio):
- `first_name`
- `last_name`
- `email`

**Opcionais**:
- `profile_photo_url`
- `phone_personal`
- `phone_professional`
- `phone_clinic`

---

## 5. Plano de Implementação (Sem Diffs)

### Etapa 1: Migração do Banco de Dados

**Arquivo**: `backend/migrate_user_profile.py`

1. Adicionar colunas novas à tabela `users`:
   - `first_name VARCHAR`
   - `last_name VARCHAR`
   - `profile_photo_url VARCHAR`
   - `phone_personal VARCHAR`
   - `phone_professional VARCHAR`
   - `phone_clinic VARCHAR`

2. Migrar dados existentes:
   - Se `full_name` existe, tentar dividir em `first_name` e `last_name`
   - Se `phone` existe, copiar para `phone_personal`
   - Valores default para campos novos: NULL

3. Adicionar índices:
   - Índice em `first_name` (para busca)
   - Índice em `last_name` (para busca)

### Etapa 2: Backend - Schema e Endpoints

**Arquivo**: `backend/schemas/user.py`

1. Atualizar `UserUpdate` com novos campos
2. Atualizar `UserResponse` com novos campos
3. Adicionar validadores para nome e telefones

**Arquivo**: `backend/routes/users.py` ou `auth.py`

1. **Endpoint existente** `GET /api/v1/users/me`:
   - Retornar novos campos na resposta

2. **Endpoint existente** `PATCH /api/v1/users/me`:
   - Aceitar novos campos no payload
   - Validar campos obrigatórios se fornecidos
   - Atualizar banco de dados

3. **Endpoint novo** `POST /api/v1/users/me/profile-photo`:
   - Aceitar upload de arquivo (multipart/form-data)
   - Validar formato (PNG, JPG) e tamanho (max 5MB)
   - Salvar em `backend/uploads/profile_photos/`
   - Atualizar `profile_photo_url` no banco
   - Retornar URL da foto

4. **Endpoint novo** `DELETE /api/v1/users/me/profile-photo`:
   - Remover foto do storage
   - Setar `profile_photo_url = NULL` no banco
   - Retornar sucesso

5. **Endpoint para servir fotos** `GET /api/v1/uploads/profile_photos/{filename}`:
   - Servir arquivo estático com validação de segurança

### Etapa 3: Frontend - Tipos e API

**Arquivo**: `src/types/user.ts`

1. Atualizar interface `User` com novos campos
2. Criar interface `UserUpdatePayload`

**Arquivo**: `src/services/api.ts`

1. Função `getCurrentUser()` → já existe, não precisa alterar
2. Função `updateUser(payload: UserUpdatePayload)` → atualizar
3. Função `uploadProfilePhoto(file: File)` → criar
4. Função `deleteProfilePhoto()` → criar

### Etapa 4: Frontend - Componente Avatar

**Arquivo**: `src/components/ui/avatar.tsx` ou `src/components/Avatar.tsx`

1. Criar componente reutilizável `Avatar`:
   - Props: `user: User`, `size: 'sm' | 'md' | 'lg'`
   - Lógica: exibir foto se disponível, senão iniciais
   - Estilos: circular, bordas, cores

2. Função auxiliar `getInitials(firstName, lastName)`

### Etapa 5: Frontend - Remover Aba Perfil

**Arquivo**: `src/App.tsx` ou `src/routes.tsx`

1. Remover rota `/perfil` ou similar
2. Remover import do componente `Perfil`

**Arquivo**: `src/components/Layout/Header.tsx` ou `Sidebar.tsx`

1. Remover link/botão para "Perfil"
2. Manter apenas: Dashboard, Agendamentos, Clientes, Configurações

**Arquivo**: `src/pages/Perfil.tsx`

1. **Deletar** arquivo completo (será incorporado em Settings)

### Etapa 6: Frontend - Expandir Página de Configurações

**Arquivo**: `src/pages/Settings.tsx`

**Nova estrutura da página**:
```
Configurações
├── Seção: Informações Pessoais
│   ├── Avatar (foto ou iniciais) com botão "Alterar foto"
│   ├── Campo: Nome *
│   ├── Campo: Sobrenome *
│   └── Campo: Email *
│
├── Seção: Contatos
│   ├── Campo: Telefone Pessoal
│   ├── Campo: Telefone Profissional
│   └── Campo: Telefone da Clínica
│
├── Seção: Segurança (se existir)
│   └── Alterar Senha
│
└── Botões:
    ├── Salvar Alterações
    └── Cancelar
```

**Componentes internos**:

1. **ProfilePhotoUpload**:
   - Exibe foto atual ou iniciais
   - Botão "Alterar foto" → abre file picker
   - Preview da foto antes de salvar
   - Botão "Remover foto" se foto existe
   - Validação: formato, tamanho

2. **FormulárioInformaçõesPessoais**:
   - Inputs controlados para nome, sobrenome, email
   - Validação em tempo real
   - Destaque de campos obrigatórios (*)

3. **FormulárioContatos**:
   - Inputs controlados para 3 telefones
   - Máscara de telefone (ex.: (XX) XXXXX-XXXX)
   - Validação de formato

**Estados**:
```typescript
const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone_personal: user.phone_personal || '',
    phone_professional: user.phone_professional || '',
    phone_clinic: user.phone_clinic || ''
});

const [photoFile, setPhotoFile] = useState<File | null>(null);
const [photoPreview, setPhotoPreview] = useState<string | null>(null);
const [isUploading, setIsUploading] = useState(false);
```

**Fluxo de salvamento**:
1. Usuário edita campos
2. Clica em "Salvar Alterações"
3. **Se foto foi alterada**: fazer upload primeiro
4. Atualizar dados do perfil com `PATCH /api/v1/users/me`
5. Refetch do usuário para atualizar contexto
6. Exibir toast de sucesso

### Etapa 7: Atualizar Contexto de Autenticação

**Arquivo**: `src/contexts/AuthContext.tsx`

1. Garantir que contexto armazena usuário completo com novos campos
2. Função `refetchUser()` para recarregar após atualização
3. Avatar no header deve usar novo componente `Avatar`

---

## 6. Estrutura de Pastas e Arquivos

### Backend

```
backend/
├── models/
│   └── user.py                    (atualizar modelo)
├── schemas/
│   └── user.py                    (atualizar schemas)
├── routes/
│   └── users.py                   (novos endpoints)
├── uploads/
│   └── profile_photos/            (criar pasta)
│       └── .gitkeep
└── migrate_user_profile.py        (criar script de migração)
```

### Frontend

```
src/
├── components/
│   ├── Avatar.tsx                 (criar componente)
│   └── Settings/
│       ├── ProfilePhotoUpload.tsx (criar)
│       ├── PersonalInfoForm.tsx   (criar)
│       └── ContactsForm.tsx       (criar)
├── pages/
│   ├── Settings.tsx               (refatorar)
│   └── Perfil.tsx                 (DELETAR)
├── types/
│   └── user.ts                    (atualizar)
├── services/
│   └── api.ts                     (adicionar funções)
└── contexts/
    └── AuthContext.tsx            (atualizar)
```

---

## 7. Validações e Regras de Negócio

### Frontend (Pré-validação)

**Nome e Sobrenome**:
- Obrigatórios
- Mínimo 2 caracteres
- Máximo 100 caracteres
- Apenas letras, espaços, hífens

**Email**:
- Obrigatório
- Formato válido de email
- Único (validação no backend)

**Telefones**:
- Opcionais
- Se preenchido: mínimo 10 dígitos
- Máscara: `(XX) XXXXX-XXXX` ou `(XX) XXXX-XXXX`

**Foto de Perfil**:
- Opcional
- Formatos aceitos: PNG, JPG, JPEG
- Tamanho máximo: 5MB
- Dimensões mínimas: 200x200px (recomendado)

### Backend (Validação Final)

**Campos obrigatórios**:
- `first_name`: not null, length >= 2
- `last_name`: not null, length >= 2
- `email`: not null, format válido, unique

**Telefones**:
- Normalizar para apenas números
- Mínimo 10 dígitos se fornecido

**Upload de foto**:
- Content-Type: image/png, image/jpeg
- Tamanho max: 5MB
- Nome do arquivo: hash único + extensão
- Segurança: validar extensão real do arquivo (não apenas header)

---

## 8. Fluxo de Usuário (UX)

### Fluxo 1: Atualizar Nome

1. Usuário acessa "Configurações"
2. Visualiza campos Nome e Sobrenome preenchidos
3. Edita Nome: "Eduardo" → "Eduardo José"
4. Clica "Salvar Alterações"
5. Sistema valida e salva
6. Toast: "Perfil atualizado com sucesso!"
7. Avatar atualiza iniciais: "EC" → "EJ" (se sobrenome = "José")

### Fluxo 2: Adicionar Foto de Perfil

1. Usuário acessa "Configurações"
2. Visualiza avatar com iniciais "EC"
3. Clica em "Alterar foto" ou ícone de câmera
4. Seleciona foto do computador
5. Preview da foto aparece
6. Clica "Salvar Alterações"
7. Sistema faz upload da foto
8. Sistema atualiza perfil
9. Avatar agora exibe a foto
10. Toast: "Foto de perfil atualizada!"

### Fluxo 3: Remover Foto de Perfil

1. Usuário tem foto de perfil
2. Passa mouse sobre a foto
3. Aparece botão "Remover foto" ou ícone X
4. Clica em "Remover"
5. Modal de confirmação: "Tem certeza?"
6. Confirma
7. Sistema remove foto do storage
8. Avatar volta para iniciais
9. Toast: "Foto removida com sucesso!"

### Fluxo 4: Adicionar Telefones

1. Usuário acessa "Configurações"
2. Navega até seção "Contatos"
3. Vê 3 campos vazios: Pessoal, Profissional, Clínica
4. Preenche "Telefone Pessoal": (81) 99999-9999
5. Preenche "Telefone da Clínica": (81) 3333-3333
6. Deixa "Profissional" vazio
7. Clica "Salvar Alterações"
8. Sistema valida e salva
9. Toast: "Contatos atualizados com sucesso!"

---

## 9. Tratamento de Erros

### Erros Comuns e Mensagens

**Email duplicado** (422):
```json
{
  "detail": "Email já está em uso por outro usuário"
}
```
**Exibir**: Toast vermelho com mensagem

**Nome muito curto** (422):
```json
{
  "detail": [
    {
      "loc": ["body", "first_name"],
      "msg": "Nome deve ter pelo menos 2 caracteres"
    }
  ]
}
```
**Exibir**: Borda vermelha no campo + mensagem abaixo

**Foto muito grande** (413):
```json
{
  "detail": "Arquivo muito grande. Tamanho máximo: 5MB"
}
```
**Exibir**: Toast vermelho

**Formato de foto inválido** (422):
```json
{
  "detail": "Formato de arquivo não suportado. Use PNG ou JPG"
}
```
**Exibir**: Toast vermelho

**Erro ao fazer upload** (500):
```json
{
  "detail": "Falha ao fazer upload da foto. Tente novamente."
}
```
**Exibir**: Toast vermelho + log no console

---

## 10. Testes de Validação

### Teste 1: Atualizar Nome e Sobrenome

**Passos**:
1. Acessar Configurações
2. Alterar Nome: "Eduardo" → "Eduardo José"
3. Alterar Sobrenome: "Coimbra" → "Coimbra Nascimento"
4. Clicar "Salvar"

**Resultado esperado**:
- Status 200
- Banco atualizado
- Avatar exibe "EN" (Eduardo Nascimento)
- Toast: "Perfil atualizado com sucesso!"

### Teste 2: Upload de Foto Válida

**Passos**:
1. Acessar Configurações
2. Clicar "Alterar foto"
3. Selecionar foto PNG de 2MB
4. Visualizar preview
5. Clicar "Salvar"

**Resultado esperado**:
- Upload bem-sucedido
- Foto salva em `/backend/uploads/profile_photos/`
- `profile_photo_url` atualizado no banco
- Avatar exibe a foto
- Toast: "Foto atualizada!"

### Teste 3: Upload de Foto Muito Grande

**Passos**:
1. Tentar fazer upload de foto de 10MB

**Resultado esperado**:
- Status 413
- Mensagem: "Arquivo muito grande"
- Foto não é salva
- Avatar não muda

### Teste 4: Remover Foto de Perfil

**Passos**:
1. Usuário com foto
2. Clicar "Remover foto"
3. Confirmar

**Resultado esperado**:
- Foto deletada do storage
- `profile_photo_url = NULL` no banco
- Avatar volta para iniciais
- Toast: "Foto removida!"

### Teste 5: Adicionar Telefones

**Passos**:
1. Preencher 3 telefones
2. Salvar

**Resultado esperado**:
- Telefones salvos no banco (normalizados)
- Toast: "Contatos atualizados!"

### Teste 6: Email Duplicado

**Passos**:
1. Tentar alterar email para um já existente

**Resultado esperado**:
- Status 422
- Mensagem: "Email já em uso"
- Email não é alterado

### Teste 7: Campos Obrigatórios Vazios

**Passos**:
1. Limpar campo Nome
2. Tentar salvar

**Resultado esperado**:
- Validação no frontend bloqueia
- Mensagem: "Nome é obrigatório"
- Campo destacado em vermelho

---

## 11. Checklist de Aceitação

A implementação está completa quando:

- [ ] **Banco de dados migrado**
  - Colunas `first_name`, `last_name`, `profile_photo_url`, `phone_*` adicionadas
  - Dados existentes migrados de `full_name` → `first_name` + `last_name`
  - Dados existentes migrados de `phone` → `phone_personal`

- [ ] **Backend funcionando**
  - `GET /api/v1/users/me` retorna novos campos
  - `PATCH /api/v1/users/me` aceita e valida novos campos
  - `POST /api/v1/users/me/profile-photo` faz upload com sucesso
  - `DELETE /api/v1/users/me/profile-photo` remove foto
  - `GET /api/v1/uploads/profile_photos/{filename}` serve foto

- [ ] **Frontend - Navegação**
  - Aba "Perfil" removida do menu
  - Rota `/perfil` removida
  - Arquivo `Perfil.tsx` deletado

- [ ] **Frontend - Configurações**
  - Página Configurações exibe seção "Informações Pessoais"
  - Campos Nome e Sobrenome funcionam
  - Upload de foto funciona
  - Preview de foto funciona
  - Remoção de foto funciona
  - 3 campos de telefone funcionam

- [ ] **Avatar atualizado**
  - Exibe foto se disponível
  - Exibe iniciais (primeira letra nome + primeira letra sobrenome) se sem foto
  - Avatar atualiza após salvar alterações

- [ ] **Validações funcionando**
  - Nome e sobrenome obrigatórios
  - Email único
  - Telefone com máscara
  - Foto: tamanho e formato validados

- [ ] **Mensagens de erro**
  - Erros exibidos com mensagens claras
  - Toast para sucesso/erro
  - Campos inválidos destacados

- [ ] **Testes manuais passaram**
  - Todos os 7 testes de validação executados com sucesso

---

## 12. Observabilidade

### Logs Recomendados

**Backend**:
```python
# Ao atualizar perfil
print(f"✏️ User profile updated: user_id={user.id}, fields={changed_fields}")

# Ao fazer upload de foto
print(f"📷 Profile photo uploaded: user_id={user.id}, filename={filename}, size={file_size}MB")

# Ao remover foto
print(f"🗑️ Profile photo removed: user_id={user.id}")
```

### Métricas

- **Taxa de usuários com foto**: `COUNT(profile_photo_url IS NOT NULL) / COUNT(*)`
- **Tamanho médio de fotos**: `AVG(file_size)`
- **Taxa de atualização de perfil**: eventos de `PATCH /users/me` por dia

---

## 13. Migração de Dados Existentes

### Script de Migração

**Arquivo**: `backend/migrate_user_profile.py`

**Lógica de migração de `full_name`**:
```python
# Exemplo: "Eduardo Coimbra" → first_name="Eduardo", last_name="Coimbra"
# Exemplo: "Maria" → first_name="Maria", last_name=""
# Exemplo: "José da Silva Santos" → first_name="José", last_name="da Silva Santos"

def split_full_name(full_name):
    if not full_name:
        return ("Usuário", "Padrão")  # Default
    
    parts = full_name.strip().split()
    if len(parts) == 0:
        return ("Usuário", "Padrão")
    elif len(parts) == 1:
        return (parts[0], "")
    else:
        first_name = parts[0]
        last_name = " ".join(parts[1:])
        return (first_name, last_name)
```

**Tratamento de casos especiais**:
- Se `full_name` é NULL → usar "Usuário" + "Padrão"
- Se `full_name` tem 1 palavra → usar como `first_name`, `last_name` vazio
- Se `full_name` tem 2+ palavras → primeira palavra = `first_name`, resto = `last_name`

---

## 14. Considerações de Segurança

### Upload de Foto

1. **Validar tipo de arquivo**:
   - Não confiar apenas em extensão
   - Verificar magic bytes do arquivo
   - Usar biblioteca como `python-magic` ou `filetype`

2. **Prevenir path traversal**:
   - Gerar nome de arquivo com UUID
   - Não usar nome original do usuário
   - Exemplo: `{user_id}_{uuid}.{ext}`

3. **Prevenir execução de código**:
   - Nunca servir arquivos com permissão de execução
   - Servir com header `Content-Type: image/png` ou `image/jpeg`

4. **Limitar tamanho**:
   - FastAPI: configurar `max_upload_size`
   - Rejeitar arquivos > 5MB

### Privacidade

- Fotos de perfil são visíveis apenas para o próprio usuário (ou admin)
- Não expor fotos publicamente sem autenticação
- Telefones não devem ser expostos em logs

---

## 15. Apêndice

### Exemplo de Payload Completo

**PATCH /api/v1/users/me**:
```json
{
  "first_name": "Eduardo",
  "last_name": "Coimbra",
  "email": "eduardocoimbramag@gmail.com",
  "phone_personal": "(81) 99999-9999",
  "phone_professional": "(81) 98888-8888",
  "phone_clinic": "(81) 3333-3333"
}
```

**Resposta (200)**:
```json
{
  "id": 1,
  "email": "eduardocoimbramag@gmail.com",
  "first_name": "Eduardo",
  "last_name": "Coimbra",
  "profile_photo_url": null,
  "phone_personal": "(81) 99999-9999",
  "phone_professional": "(81) 98888-8888",
  "phone_clinic": "(81) 3333-3333",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-11-10T12:00:00Z"
}
```

### Exemplo de Upload de Foto

**POST /api/v1/users/me/profile-photo**:
```
Content-Type: multipart/form-data

file: [binary data]
```

**Resposta (200)**:
```json
{
  "profile_photo_url": "/api/v1/uploads/profile_photos/1_a1b2c3d4.jpg",
  "message": "Foto de perfil atualizada com sucesso"
}
```

### Estrutura de Pastas de Upload

```
backend/uploads/profile_photos/
├── 1_a1b2c3d4e5f6.jpg          # user_id=1
├── 2_f6e5d4c3b2a1.png          # user_id=2
├── 3_123456789abc.jpg          # user_id=3
└── .gitkeep
```

### Exemplo de Iniciais

| Nome            | Sobrenome      | Iniciais |
|-----------------|----------------|----------|
| Eduardo         | Coimbra        | EC       |
| Maria           | Silva          | MS       |
| José            | da Silva       | JS       |
| Ana             | (vazio)        | A        |
| (vazio)         | Santos         | S        |

---

## Conclusão

Este documento fornece um guia completo para refatorar o perfil de usuário, movendo-o para Configurações e expandindo os campos disponíveis.

**Abordagem**: Seguir as etapas na ordem apresentada:
1. Migrar banco de dados
2. Atualizar backend (schemas + endpoints)
3. Atualizar frontend (tipos + API)
4. Remover aba Perfil
5. Expandir página Configurações
6. Testar todos os fluxos

**Prioridade**:
1. Migração de dados (crítico)
2. Campos básicos (nome, sobrenome, email)
3. Upload de foto
4. Telefones adicionais

**Convenção recomendada**: Sempre armazenar nome e sobrenome separados (facilita ordenação, busca e personalização).

