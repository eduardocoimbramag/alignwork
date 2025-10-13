# 🚀 AlignWork - Sistema de Gestão de Consultórios

> **Sistema SaaS completo** para gerenciamento de consultas e agendamentos  
> **Documentação consolidada:** Outubro 2025

## 📋 Navegação Rápida

| Documento | O que você encontra |
|-----------|---------------------|
| **[INDEX.md](./INDEX.md)** 📚 | **COMECE AQUI** - Índice completo da documentação |
| [ARCHITECTURE.md](./ARCHITECTURE.md) 🏗️ | Stack, padrões arquiteturais, decisões técnicas |
| [API.md](./API.md) 🔌 | Referência completa de endpoints REST |
| [RUNBOOK.md](./RUNBOOK.md) ⚙️ | Setup, instalação, comandos, debug |
| [CONTRIBUTING.md](./CONTRIBUTING.md) 🤝 | Workflow Git, commits, PRs, code review |
| [ROADMAP.md](./ROADMAP.md) 🗺️ | Features planejadas, releases futuras |
| [SECURITY.md](./SECURITY.md) 🔒 | Práticas de segurança, compliance |
| [CHANGELOG.md](./CHANGELOG.md) 📝 | Histórico de versões e mudanças |
| **[MELHORIAS-E-CORRECOES.md](./MELHORIAS-E-CORRECOES.md)** 🔍 | **Análise completa de código - 87 itens** |
| **[MELHORIAS-PASSO-A-PASSO.md](./MELHORIAS-PASSO-A-PASSO.md)** 🛠️ | **Guia de implementação segura - 4 níveis de risco** |

---

## Visão Geral do Projeto

### O que é o AlignWork?

**AlignWork** é um sistema completo de gerenciamento de consultas e agendamentos para profissionais de saúde. O sistema oferece uma interface moderna e intuitiva para:

- Gerenciar agendamentos de consultas
- Cadastrar e acompanhar pacientes
- Visualizar calendário interativo
- Registrar anotações de consultas
- Acompanhar estatísticas e métricas do consultório

### Principais Características

- ✅ **Autenticação JWT** com tokens httpOnly cookies
- 📅 **Calendário Interativo Funcional** com navegação entre meses, seleção de datas e visualização de agendamentos
- 👥 **Gestão de Pacientes** completa
- 📊 **Dashboard** com estatísticas em tempo real
- 🔄 **React Query** para gerenciamento de estado assíncrono e cache
- 🎨 **UI Moderna** com shadcn/ui e Tailwind CSS + animações suaves
- 🌐 **Multi-timezone** suporte (America/Recife)
- 📱 **Responsivo** para desktop e mobile
- 🎯 **Indicadores visuais** com badges coloridos por status

---

## Stack Tecnológica

### Backend
- **Framework**: FastAPI 0.104.1+
- **Banco de Dados**: SQLite com SQLAlchemy 2.0.23+
- **Autenticação**: JWT com python-jose
- **Validação**: Pydantic 2.5.0+
- **Hash de Senhas**: bcrypt via passlib
- **CORS**: FastAPI middleware

### Frontend
- **Framework**: React 18.3.1 com TypeScript 5.8.3
- **Build Tool**: Vite 5.4.19
- **Gerenciamento de Estado**: 
  - React Query (@tanstack/react-query 5.83.0)
  - Context API (AuthContext, AppContext)
- **UI Components**: shadcn/ui com Radix UI
- **Estilização**: Tailwind CSS 3.4.17
- **Formulários**: React Hook Form 7.61.1 + Zod 3.25.76
- **Datas**: dayjs 1.11.18 + date-fns 3.6.0
- **HTTP Client**: Axios 1.12.2
- **Roteamento**: React Router DOM 6.30.1
- **Ícones**: Lucide React 0.462.0

### Ferramentas de Desenvolvimento
- **Linting**: ESLint 9.32.0
- **Type Checking**: TypeScript strict mode
- **Hot Reload**: Vite HMR
- **Auto Import**: Vite aliases (@/)

---

## Estrutura do Projeto

```
align-work/
├── backend/                    # API FastAPI
│   ├── auth/                  # Módulo de autenticação
│   │   ├── dependencies.py    # Dependências (get_db, get_current_user)
│   │   └── utils.py          # Utilitários JWT e hash de senha
│   ├── models/               # Modelos SQLAlchemy
│   │   ├── user.py          # Modelo User
│   │   └── appointment.py   # Modelo Appointment
│   ├── schemas/             # Schemas Pydantic
│   │   ├── auth.py         # Schemas de autenticação
│   │   ├── user.py        # Schemas de usuário
│   │   └── appointment.py # Schemas de agendamento
│   ├── routes/            # Rotas da API
│   │   ├── auth.py       # Rotas de autenticação
│   │   └── appointments.py # Rotas de agendamentos
│   ├── main.py          # Ponto de entrada da API
│   └── requirements.txt # Dependências Python
│
├── src/                    # Frontend React
│   ├── components/        # Componentes React
│   │   ├── auth/         # Componentes de autenticação
│   │   ├── Calendar/     # Componentes de calendário
│   │   ├── Dashboard/    # Componentes do dashboard
│   │   ├── Layout/       # Componentes de layout
│   │   ├── Modals/       # Modais da aplicação
│   │   └── ui/           # Componentes shadcn/ui
│   ├── contexts/         # Contextos React
│   │   ├── AuthContext.tsx # Contexto de autenticação
│   │   └── AppContext.tsx  # Contexto da aplicação
│   ├── hooks/           # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useAppointmentMutations.ts
│   │   ├── useDashboardSummary.ts
│   │   └── useInvalidateAgenda.ts
│   ├── pages/          # Páginas da aplicação
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Profile.tsx
│   │   ├── Settings.tsx
│   │   └── NotFound.tsx
│   ├── services/       # Serviços de API
│   │   ├── api.ts     # Cliente HTTP
│   │   └── auth.ts    # Serviço de autenticação
│   ├── types/         # Tipos TypeScript
│   │   ├── auth.ts
│   │   └── consulta.ts
│   ├── lib/          # Utilitários
│   │   ├── utils.ts
│   │   ├── calendar.ts
│   │   └── dayjs.ts
│   ├── App.tsx       # Componente raiz
│   └── main.tsx      # Ponto de entrada
│
├── docs/                   # Documentação (este diretório)
├── public/                # Arquivos estáticos
├── alignwork.db          # Banco de dados SQLite
├── package.json         # Dependências Node.js
├── vite.config.ts      # Configuração Vite
├── tailwind.config.ts  # Configuração Tailwind
├── tsconfig.json      # Configuração TypeScript
└── README.md         # README principal

```

---

## Configuração e Instalação

### Pré-requisitos
- Node.js 18+ e npm
- Python 3.8+ (para o backend)

### Configuração do Frontend

```bash
# Instalar dependências
npm install

# Criar arquivo .env na raiz
echo "VITE_API_URL=http://localhost:8000" > .env

# Iniciar servidor de desenvolvimento (porta 8080)
npm run dev
```

### Configuração do Backend

```bash
# Navegar para o diretório do backend
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual (Windows)
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Criar arquivo .env
echo "SECRET_KEY=sua_chave_secreta_aqui" > .env
echo "DATABASE_URL=sqlite:///../alignwork.db" >> .env
echo "ACCESS_TOKEN_EXPIRE_MINUTES=15" >> .env
echo "REFRESH_TOKEN_EXPIRE_DAYS=7" >> .env

# Iniciar servidor FastAPI (porta 8000)
uvicorn main:app --reload --port 8000
```

---

## Fluxo de Autenticação

O sistema utiliza JWT tokens armazenados em httpOnly cookies para segurança:

1. **Registro/Login**: Usuário envia credenciais → Backend retorna tokens
2. **Tokens**: Access token (15 min) + Refresh token (7 dias)
3. **Cookies**: Tokens armazenados em httpOnly cookies (não acessíveis via JS)
4. **Requisições**: Cookies enviados automaticamente em cada requisição (credentials: 'include')
5. **Bootstrap de sessão**: Após login e no reload, chamar `/api/auth/me` e pré-carregar dados iniciais (stats/summary) usando o `tenantId` do `TenantProvider`
6. **Refresh**: Token expirado → Refresh automático → Novos tokens
7. **Logout**: Cookies são limpos

---

## 📖 Próximos Passos

### Primeira Vez no Projeto?

1. **[INDEX.md](./INDEX.md)** 📚 - Comece aqui para navegar pela documentação completa
2. **[RUNBOOK.md](./RUNBOOK.md)** ⚙️ - Configure seu ambiente de desenvolvimento
3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** 🏗️ - Entenda a arquitetura do sistema
4. **[CONTRIBUTING.md](./CONTRIBUTING.md)** 🤝 - Aprenda o workflow de contribuição

### Referências Úteis

- **[API.md](./API.md)** 🔌 - Todos os endpoints documentados
- **[SECURITY.md](./SECURITY.md)** 🔒 - Práticas de segurança
- **[ROADMAP.md](./ROADMAP.md)** 🗺️ - Visão de produto e features futuras
- **[CHANGELOG.md](./CHANGELOG.md)** 📝 - Histórico de mudanças

### Documentos Arquivados

Os documentos antigos foram consolidados e movidos para `_archive/`:
- `api-reference.md` → Consolidado em [API.md](./API.md)
- `arquitetura.md`, `autenticacao.md`, `backend.md`, `frontend.md` → Consolidado em [ARCHITECTURE.md](./ARCHITECTURE.md)
- `guia-desenvolvimento.md` → Dividido em [RUNBOOK.md](./RUNBOOK.md) e [CONTRIBUTING.md](./CONTRIBUTING.md)
- Ver [INDEX.md](./INDEX.md) para detalhes completos da migração

---

## Contribuindo

Este é um projeto em desenvolvimento ativo. Para contribuir:

1. Clone o repositório
2. Crie uma branch para sua feature
3. Faça commit das suas alterações
4. Abra um Pull Request

---

## Licença

Informações sobre licença a serem definidas.

---

**Última atualização:** Outubro 2025 - Documentação Consolidada v2.0

