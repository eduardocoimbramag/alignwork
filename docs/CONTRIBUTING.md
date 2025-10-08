# 🤝 AlignWork - Guia de Contribuição

> **Fonte:** Consolidado de `_archive/guia-desenvolvimento.md` (seções workflow e boas práticas)  
> **Última atualização:** Outubro 2025

---

## 🎯 Quando usar este documento

Use este documento para:
- Entender o workflow de contribuição
- Criar branches e commits corretos
- Submeter pull requests
- Seguir padrões de código
- Fazer code review

---

## 📋 Índice

- [Workflow de Desenvolvimento](#workflow-de-desenvolvimento)
- [Branches](#branches)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [Code Review](#code-review)
- [Padrões de Código](#padroes-de-codigo)
- [Testes](#testes)
- [Documentação](#documentacao)

---

## Workflow de Desenvolvimento

### 1. Criar Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/nome-da-feature
```

**Convenções de nome:**
- `feature/` - Nova funcionalidade
- `fix/` - Correção de bug
- `refactor/` - Refatoração de código
- `docs/` - Documentação
- `chore/` - Tarefas de manutenção
- `test/` - Adição/correção de testes

**Exemplos:**
```bash
git checkout -b feature/patient-crud
git checkout -b fix/login-validation
git checkout -b refactor/appointment-service
git checkout -b docs/api-endpoints
git checkout -b chore/update-dependencies
```

### 2. Desenvolver

```bash
# Fazer alterações no código
# Testar localmente
# Verificar lint/tipos
```

### 3. Commit

```bash
git add .
git commit -m "feat: adiciona CRUD de pacientes"
```

Ver seção [Commits](#commits) para convenções.

### 4. Push

```bash
git push origin feature/nome-da-feature
```

### 5. Pull Request

1. Ir para GitHub/GitLab
2. Criar Pull Request de `feature/nome-da-feature` → `main`
3. Preencher template de PR
4. Aguardar review

---

## Branches

### Branch Principal

- **main**: Branch de produção
  - Sempre estável
  - Deploy automático (futuro)
  - Protegida (requer PR + review)

### Branches de Desenvolvimento

```
main
├── feature/patient-crud
├── feature/dashboard-stats
├── fix/login-bug
└── refactor/api-service
```

### Regras

1. **Nunca commitar direto em `main`**
2. **Criar branch a partir de `main` atualizada**
3. **Deletar branch após merge**
4. **Manter branches focadas (uma feature por branch)**

---

## Commits

### Conventional Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Quando usar | Exemplo |
|------|-------------|---------|
| `feat` | Nova feature | `feat: adiciona filtro por data` |
| `fix` | Bug fix | `fix: corrige erro 404 na API` |
| `refactor` | Refatoração sem mudança de funcionalidade | `refactor: simplifica lógica de auth` |
| `docs` | Documentação | `docs: atualiza README` |
| `style` | Formatação, lint | `style: formata código com Black` |
| `test` | Testes | `test: adiciona testes de auth` |
| `chore` | Manutenção | `chore: atualiza dependências` |
| `perf` | Performance | `perf: otimiza query de appointments` |
| `ci` | CI/CD | `ci: adiciona GitHub Actions` |
| `build` | Build system | `build: atualiza Vite config` |
| `revert` | Reverter commit | `revert: desfaz commit abc123` |

### Scope (Opcional)

```bash
feat(auth): adiciona login com Google
fix(api): corrige timeout em appointments
docs(readme): atualiza instruções de instalação
```

### Subject

- Usar imperativo ("adiciona", não "adicionado")
- Não capitalizar primeira letra
- Sem ponto final
- Máximo 50 caracteres

### Body (Opcional)

```bash
git commit -m "feat: adiciona filtro por data

- Adiciona DatePicker component
- Cria hook useFilterByDate
- Atualiza API para aceitar query params
"
```

### Footer (Opcional)

```bash
git commit -m "fix: corrige erro 404 na API

Closes #123
```

### Exemplos Completos

```bash
# Feature simples
git commit -m "feat: adiciona botão de exportar CSV"

# Bug fix com issue
git commit -m "fix: corrige erro de timezone

Closes #45"

# Refactor com escopo
git commit -m "refactor(api): simplifica validação de schemas"

# Breaking change
git commit -m "feat: migra de SQLite para PostgreSQL

BREAKING CHANGE: DATABASE_URL deve ser PostgreSQL agora"

# Múltiplas linhas
git commit -m "feat: adiciona dashboard de estatísticas

- Cria componente DashboardStats
- Adiciona hook useDashboardMegaStats
- Implementa endpoint /mega-stats no backend

Closes #67"
```

---

## Pull Requests

### Template de PR

```markdown
## Descrição

Breve descrição do que foi feito.

## Tipo de mudança

- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Checklist

- [ ] Código testado localmente
- [ ] Sem erros de lint/tipos
- [ ] Documentação atualizada (se necessário)
- [ ] Testes adicionados/atualizados (futuro)
- [ ] CHANGELOG atualizado (se release)

## Screenshots (se aplicável)

[Adicionar prints antes/depois]

## Issues relacionadas

Closes #123
Relates to #456
```

### Boas Práticas

1. **Título descritivo:**
   ```
   ✅ feat: adiciona filtro por data no dashboard
   ❌ Update dashboard.tsx
   ```

2. **PR focado:**
   - Uma feature/fix por PR
   - Máximo ~500 linhas mudadas
   - Se maior, dividir em múltiplos PRs

3. **Descrição clara:**
   - O que foi feito
   - Por que foi feito
   - Como testar

4. **Screenshots/GIFs:**
   - Para mudanças visuais
   - Antes e depois

5. **Linkar issues:**
   ```markdown
   Closes #123
   Fixes #456
   Relates to #789
   ```

---

## Code Review

### Como Revisor

**O que verificar:**
- [ ] Código segue padrões do projeto
- [ ] Lógica está correta
- [ ] Sem código duplicado
- [ ] Nomes de variáveis/funções claros
- [ ] Sem erros óbvios
- [ ] Performance não foi prejudicada
- [ ] Segurança (inputs validados, sem SQL injection, etc.)
- [ ] Documentação/comentários se necessário

**Como comentar:**
```markdown
# Sugestão
💡 Considere usar `useMemo` aqui para performance

# Pergunta
❓ Por que mudou de POST para PUT?

# Problema crítico
🚨 Este código pode causar SQL injection

# Aprovação
✅ LGTM! (Looks Good To Me)
```

### Como Autor

**Respondendo comentários:**
- Responder todos os comentários
- Fazer mudanças solicitadas
- Explicar decisões se necessário
- Agradecer feedback

**Quando aprovar:**
- Após pelo menos 1 aprovação
- Todos os comentários resolvidos
- CI passa (futuro)

---

## Padrões de Código

### Nomenclatura

**Backend (Python):**
```python
# snake_case para variáveis e funções
user_email = "test@example.com"
def get_user_by_email(email: str):
    ...

# PascalCase para classes
class UserCreate(BaseModel):
    ...

# UPPER_CASE para constantes
SECRET_KEY = "..."
MAX_RETRIES = 3
```

**Frontend (TypeScript):**
```typescript
// camelCase para variáveis e funções
const userEmail = "test@example.com";
function getUserByEmail(email: string) {
  ...
}

// PascalCase para componentes e tipos
interface UserProfile { ... }
function UserCard() { ... }

// UPPER_CASE para constantes
const API_URL = "...";
const MAX_ITEMS = 100;
```

### Type Safety

**Backend:**
```python
# Sempre usar type hints
def create_user(email: str, password: str) -> User:
    ...

# Pydantic para validação
class UserCreate(BaseModel):
    email: EmailStr
    password: str
```

**Frontend:**
```typescript
// Sempre tipear
interface Props {
  userId: string;
  onSave: (user: User) => void;
}

// Evitar `any`
const data: User = await api<User>('/users/1');
```

### Error Handling

**Backend:**
```python
from fastapi import HTTPException

@router.get("/{id}")
def get_user(id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id).first()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"User {id} not found"
        )
    
    return user
```

**Frontend:**
```typescript
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    toast.success('Usuário criado!');
  },
  onError: (error: any) => {
    toast.error(error.message || 'Erro ao criar usuário');
  }
});
```

### React Query Best Practices

```typescript
// Query keys consistentes
const QUERY_KEYS = {
  users: (tenantId: string) => ['users', tenantId],
  user: (id: string) => ['user', id],
};

// Invalidação específica
onSuccess: () => {
  queryClient.invalidateQueries(QUERY_KEYS.users(tenantId));
}

// Stale time apropriado
useQuery({
  queryKey: QUERY_KEYS.users(tenantId),
  queryFn: fetchUsers,
  staleTime: 5 * 60 * 1000,  // 5 minutos
});
```

### Componentização

**Divida componentes grandes:**
```
❌ Dashboard.tsx (500 linhas)

✅ Dashboard/
  ├── Dashboard.tsx (layout, orquestração)
  ├── DashboardStats.tsx
  ├── DashboardCalendar.tsx
  └── DashboardActions.tsx
```

### DRY (Don't Repeat Yourself)

```typescript
// ❌ Repetição
function Component1() {
  const { data } = useQuery(...);
  if (!data) return <Loader />;
  // ...
}

function Component2() {
  const { data } = useQuery(...);
  if (!data) return <Loader />;
  // ...
}

// ✅ Custom hook
function useDataWithLoader(queryKey, queryFn) {
  const { data, isLoading } = useQuery(queryKey, queryFn);
  if (isLoading) return { data: null, loader: <Loader /> };
  return { data, loader: null };
}
```

---

## Testes

**Status:** Planejado (não implementado ainda)

### Backend (pytest)

```python
# tests/test_auth.py
def test_register_user(client):
    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "Test123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
```

### Frontend (Vitest + RTL)

```typescript
// tests/LoginForm.test.tsx
test('submits login form', async () => {
  render(<LoginForm />);
  
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' }
  });
  
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'Test123' }
  });
  
  fireEvent.click(screen.getByText('Login'));
  
  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalled();
  });
});
```

---

## Documentação

### Quando Atualizar

- ✅ Nova feature pública
- ✅ Mudança em API
- ✅ Mudança em setup/instalação
- ✅ Breaking changes
- ❌ Mudanças internas pequenas

### Onde Atualizar

| Mudança | Documento |
|---------|-----------|
| Novo endpoint | [API.md](./API.md) |
| Nova arquitetura | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Mudança em setup | [RUNBOOK.md](./RUNBOOK.md) |
| Nova feature planejada | [ROADMAP.md](./ROADMAP.md) |
| Mudança de segurança | [SECURITY.md](./SECURITY.md) |

### Comentários no Código

**Quando comentar:**
```python
# ✅ Lógica complexa
# Converte timezone local para UTC porque o banco armazena em UTC
# e precisamos garantir consistência entre diferentes fusos
utc_time = local_time.astimezone(timezone.utc)

# ✅ Workaround temporário
# TODO: Remover após migração para PostgreSQL
# SQLite não suporta timezone nativo
connection.execute("SET timezone = 'UTC'")

# ❌ Óbvio
# Incrementa contador
counter += 1
```

---

## Lint e Formatação

**Status:** Planejado

### Backend

```bash
# Black (formatação)
black backend/

# Flake8 (lint)
flake8 backend/

# mypy (type checking)
mypy backend/
```

**Configuração (.flake8):**
```ini
[flake8]
max-line-length = 100
exclude = venv,__pycache__
```

### Frontend

```bash
# ESLint
npm run lint

# Prettier (formatação)
npm run format
```

**Configuração (eslint.config.js):**
```javascript
export default {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn'
  }
};
```

---

## Perguntas Frequentes

**Q: Posso commitar direto em `main`?**  
A: Não. Sempre criar PR.

**Q: Preciso de aprovação para fazer merge?**  
A: Sim, pelo menos 1 aprovação.

**Q: E se meu PR tem conflitos?**  
A: Atualizar branch com `main`:
```bash
git checkout main
git pull origin main
git checkout feature/minha-branch
git merge main
# Resolver conflitos
git push origin feature/minha-branch
```

**Q: Quando devo atualizar a documentação?**  
A: Sempre que houver mudanças visíveis para usuários/desenvolvedores.

---

**Próximas seções:** Ver [ROADMAP.md](./ROADMAP.md) para features planejadas e [SECURITY.md](./SECURITY.md) para práticas de segurança.

