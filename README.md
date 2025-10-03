# AlignWork

Sistema de agendamento e gestão de consultas médicas desenvolvido com React, TypeScript e FastAPI.

## Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Lucide React
- **Backend**: FastAPI + SQLite
- **Autenticação**: JWT

## Instalação e Desenvolvimento

### Pré-requisitos
- Node.js 18+ e npm
- Python 3.8+ (para o backend)

### Frontend
```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Backend
```bash
# Navegar para o diretório do backend
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Iniciar servidor FastAPI
uvicorn main:app --reload --port 8000
```

## Variáveis de Ambiente

### Frontend
Crie um arquivo `.env` na raiz do projeto:
```
VITE_API_URL=http://localhost:8000
```

### Backend
Crie um arquivo `.env` no diretório `backend/`:
```
SECRET_KEY=sua_chave_secreta_aqui
DATABASE_URL=sqlite:///./alignwork.db
```

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run build:dev` - Gera build de desenvolvimento
- `npm run lint` - Executa o linter ESLint
- `npm run preview` - Visualiza o build de produção

## Funcionalidades

- Sistema de autenticação (login/registro)
- Dashboard com estatísticas
- Agendamento de consultas
- Gestão de pacientes
- Calendário interativo
- Interface responsiva

## Estrutura do Projeto

```
├── src/                    # Código-fonte do frontend
│   ├── components/         # Componentes React
│   ├── pages/             # Páginas da aplicação
│   ├── services/          # Serviços de API
│   ├── contexts/          # Contextos React
│   └── types/             # Definições TypeScript
├── backend/               # API FastAPI
│   ├── routes/           # Rotas da API
│   ├── models/           # Modelos de dados
│   ├── schemas/          # Schemas Pydantic
│   └── auth/             # Módulo de autenticação
└── public/               # Arquivos estáticos
```