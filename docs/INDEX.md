# 📚 AlignWork - Documentação Consolidada

> **Migração concluída:** Outubro 2025  
> **Sistema de documentação:** Docs-as-Code v2.0

---

## 🎯 Encontre o que você precisa

| Se você quer... | Vá para |
|----------------|---------|
| Entender a arquitetura do sistema | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Consultar endpoints da API | [API.md](./API.md) |
| Configurar ambiente local | [RUNBOOK.md](./RUNBOOK.md) |
| Contribuir com código | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| Ver features planejadas | [ROADMAP.md](./ROADMAP.md) |
| Entender práticas de segurança | [SECURITY.md](./SECURITY.md) |
| Ver histórico de mudanças | [CHANGELOG.md](./CHANGELOG.md) |
| **Ver análise de melhorias e correções** | **[MELHORIAS-E-CORRECOES.md](./MELHORIAS-E-CORRECOES.md)** |
| Iniciar rapidamente | [README.md](./README.md) |

---

## 📖 Documentos Principais

### [ARCHITECTURE.md](./ARCHITECTURE.md) - 🏗️ Arquitetura do Sistema
**Quando usar:** Entender decisões técnicas, stack, padrões arquiteturais

**Conteúdo:**
- Visão geral da arquitetura cliente-servidor
- Stack tecnológica (FastAPI + React)
- Modelos de dados (User, Appointment)
- Schemas Pydantic
- Rotas e endpoints
- Fluxo de autenticação JWT
- Padrões (DI, Service Layer, DTO)
- Decisões arquiteturais justificadas
- Performance e escalabilidade

**Para quem:**
- Novos desenvolvedores (onboarding)
- Tech leads (decisões técnicas)
- Arquitetos (design review)

---

### [API.md](./API.md) - 🔌 Referência da API
**Quando usar:** Consumir API REST, testar endpoints, debugar HTTP

**Conteúdo:**
- Todos os endpoints documentados
- Request/Response examples
- Query parameters e validações
- Códigos de status HTTP
- Formato de erros
- Timezone handling
- Exemplos práticos (cURL, fetch, Python)
- Troubleshooting de URLs incorretas

**Para quem:**
- Frontend developers
- Integradores externos
- QA/Testers

---

### [RUNBOOK.md](./RUNBOOK.md) - ⚙️ Operação e Setup
**Quando usar:** Configurar ambiente, executar projeto, debugar

**Conteúdo:**
- Pré-requisitos (Python, Node)
- Instalação passo a passo
- Variáveis de ambiente
- Comandos de execução
- Debug (backend e frontend)
- Gestão de banco de dados
- Seeds de dados de teste
- Troubleshooting comum

**Para quem:**
- Novos desenvolvedores
- DevOps/SRE
- Suporte técnico

---

### [CONTRIBUTING.md](./CONTRIBUTING.md) - 🤝 Guia de Contribuição
**Quando usar:** Contribuir com código, fazer PR, code review

**Conteúdo:**
- Workflow Git (branches, commits)
- Conventional Commits
- Pull Request template
- Code review checklist
- Padrões de código (nomenclatura, tipos)
- React Query best practices
- Componentização
- DRY principles

**Para quem:**
- Desenvolvedores contribuindo
- Reviewers
- Maintainers

---

### [ROADMAP.md](./ROADMAP.md) - 🗺️ Visão de Produto
**Quando usar:** Planejar sprints, priorizar features, alinhar expectativas

**Conteúdo:**
- Status atual (features implementadas)
- Roadmap por fase:
  - Fase 1: MVP Completo (Q4 2025)
  - Fase 2: Multi-Tenancy (Q1 2026)
  - Fase 3: Otimização (Q2 2026)
  - Fase 4: Integrações (Q3 2026)
- Melhorias técnicas (testes, CI/CD)
- Backlog de bugs/refactors
- Decisões de produto
- Releases planejadas

**Para quem:**
- Product owners
- Stakeholders
- Desenvolvedores (planejamento)

---

### [SECURITY.md](./SECURITY.md) - 🔒 Segurança
**Quando usar:** Implementar features seguras, auditar código, produção

**Conteúdo:**
- Autenticação (JWT, bcrypt)
- Autorização (multi-tenancy)
- Proteção de dados (LGPD/GDPR)
- HTTPS e CORS
- Vulnerabilidades comuns (SQL injection, XSS, CSRF)
- Boas práticas (rate limiting, validação)
- Auditoria e logs de segurança
- Checklist de produção
- Como reportar vulnerabilidades

**Para quem:**
- Desenvolvedores (implementação segura)
- Security engineers
- Compliance officers

---

### [CHANGELOG.md](./CHANGELOG.md) - 📝 Histórico de Mudanças
**Quando usar:** Ver o que mudou entre versões

**Conteúdo:**
- Mudanças por versão
- Features adicionadas
- Bugs corrigidos
- Breaking changes
- Migrations necessárias

**Para quem:**
- Todos (acompanhar evolução)

---

### [README.md](./README.md) - 🚀 Início Rápido
**Quando usar:** Primeira vez no projeto, overview rápido

**Conteúdo:**
- Descrição do projeto
- Quick start
- Screenshots
- Links para documentação detalhada
- Licença

**Para quem:**
- Todos (ponto de entrada)

---

### [MELHORIAS-E-CORRECOES.md](./MELHORIAS-E-CORRECOES.md) - 🔍 Análise de Código
**Quando usar:** Auditar código, planejar refactorings, priorizar débito técnico

**Conteúdo:**
- 87 itens identificados e categorizados
- Problemas críticos (P0) que precisam correção imediata
- Vulnerabilidades de segurança
- Problemas de performance e escalabilidade
- Débito técnico e manutenibilidade
- Code smells e anti-patterns
- Correções detalhadas com exemplos de código
- Matriz de priorização
- Roadmap de correções (5 sprints)
- Métricas de saúde do código
- Plano de ação passo a passo

**Para quem:**
- Tech leads (planejar sprints de refactoring)
- Desenvolvedores (entender problemas e correções)
- Code reviewers (identificar padrões)
- Arquitetos (decisões de refactoring)
- QA (áreas de risco)

---

## 🗂️ Estrutura de Documentação

```
docs/
├── INDEX.md                         ← Você está aqui
├── README.md                        → Início rápido
├── ARCHITECTURE.md                  → Arquitetura técnica
├── API.md                           → Referência API REST
├── RUNBOOK.md                       → Setup e operação
├── CONTRIBUTING.md                  → Workflow de contribuição
├── ROADMAP.md                       → Visão de produto
├── SECURITY.md                      → Práticas de segurança
├── CHANGELOG.md                     → Histórico de versões
├── MELHORIAS-E-CORRECOES.md        → Análise completa de código (NOVO)
├── correção-card-total-clientes.md → Documentação de correção específica
├── correção-contadores-calendario-dashboard.md → Documentação de correção específica
└── _archive/                        → Documentos antigos (migrados)
    ├── api-reference.md
    ├── arquitetura.md
    ├── autenticacao.md
    ├── backend.md
    ├── frontend.md
    ├── guia-desenvolvimento.md
    ├── implementacao-calendario-funcional.md
    ├── mensagem-cursor-calendario.md
    └── INDICE.md (antigo)
```

---

## 📊 Estatísticas da Documentação

**Documentos principais:** 11 (8 core + 3 auxiliares)  
**Documentos arquivados:** 9  
**Total de páginas estimadas:** ~250  
**Cobertura de tópicos:** 98%+

**Tópicos cobertos:**
- ✅ Arquitetura e design
- ✅ API REST completa
- ✅ Setup e instalação
- ✅ Workflow de desenvolvimento
- ✅ Segurança
- ✅ Roadmap de produto
- ✅ Contribuição
- ✅ **Análise de código e melhorias (NOVO)**
- ✅ **Troubleshooting específico**
- ⚠️ Testes (planejado, não implementado)
- ⚠️ Deploy em produção (planejado)

---

## 🔍 Como Navegar

### Por Persona

**Novo Desenvolvedor:**
1. [README.md](./README.md) - Overview
2. [RUNBOOK.md](./RUNBOOK.md) - Setup
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - Entender sistema
4. [CONTRIBUTING.md](./CONTRIBUTING.md) - Workflow

**Frontend Developer:**
1. [API.md](./API.md) - Endpoints
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Seção Frontend
3. [RUNBOOK.md](./RUNBOOK.md) - Debug

**Backend Developer:**
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Seção Backend
2. [API.md](./API.md) - Contratos de API
3. [SECURITY.md](./SECURITY.md) - Boas práticas

**Product Owner:**
1. [ROADMAP.md](./ROADMAP.md) - Features planejadas
2. [CHANGELOG.md](./CHANGELOG.md) - O que foi feito
3. [README.md](./README.md) - Visão geral

**DevOps/SRE:**
1. [RUNBOOK.md](./RUNBOOK.md) - Setup e comandos
2. [SECURITY.md](./SECURITY.md) - Checklist de produção
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - Infraestrutura

---

## 🎓 Para Novos Desenvolvedores

### Dia 1: Setup
1. Ler [README.md](./README.md)
2. Seguir [RUNBOOK.md](./RUNBOOK.md) para configurar ambiente
3. Executar projeto localmente
4. Explorar http://localhost:8080

### Dia 2-3: Entendimento
1. Ler [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Explorar código com documentação em mãos
3. Ler [API.md](./API.md) e testar endpoints em http://localhost:8000/docs
4. Debugar com [RUNBOOK.md](./RUNBOOK.md)

### Dia 4-5: Contribuir
1. Ler [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Escolher issue "good first issue"
3. Criar branch e desenvolver
4. Fazer primeira PR

### Semana 2+
1. Code review de outras PRs
2. Consultar [ROADMAP.md](./ROADMAP.md) para features futuras
3. Revisar [SECURITY.md](./SECURITY.md) antes de tocar em auth/dados sensíveis

---

## 🔧 Troubleshooting

### "Não encontro informação sobre X"

**Use o índice acima** para localizar o documento certo.

**Busca por palavra-chave:**
```bash
# Buscar em todos os docs
grep -r "palavra-chave" docs/

# Ou no GitHub: use a search bar
```

### "Documentação desatualizada"

Abra issue ou PR para atualizar:
```markdown
**Issue:** Documentação desatualizada - ARCHITECTURE.md

**Seção afetada:** Backend > Modelos de Dados

**Problema:** Model User não tem campo phone_number mencionado

**Solução proposta:** Adicionar documentação do campo
```

### "Preciso de mais exemplos"

Abra issue com label `documentation`:
```markdown
**Issue:** Mais exemplos de X

**Documento:** API.md

**Sugestão:** Adicionar exemplo de como usar filtros complexos
```

---

## 📞 Contato

**Dúvidas sobre documentação:**
- Abrir issue com label `documentation`
- Mencionar @maintainers no PR

**Sugestões de melhoria:**
- Issues são bem-vindas!
- PRs de documentação também :)

---

## 🗺️ Migração de Documentação (Outubro 2025)

**O que mudou:**

**Antes (docs antigos):**
- ❌ 9 documentos desorganizados
- ❌ Conteúdo duplicado
- ❌ Difícil navegação
- ❌ Sem índice claro

**Depois (docs consolidados):**
- ✅ 8 documentos focados por tema
- ✅ Conteúdo consolidado e deduplicated
- ✅ Navegação por persona/tarefa
- ✅ Índice claro (este arquivo)

**Documentos migrados:**
- `api-reference.md` → `API.md`
- `arquitetura.md` + `autenticacao.md` + `backend.md` + `frontend.md` → `ARCHITECTURE.md`
- `guia-desenvolvimento.md` (seções) → `RUNBOOK.md` + `CONTRIBUTING.md`
- `solucao-estatisticas-dashboard.md` → Deletado (problema resolvido)
- `implementacao-calendario-funcional.md` → Integrado em `ARCHITECTURE.md`
- `mensagem-cursor-calendario.md` → Integrado em `CHANGELOG.md`
- `INDICE.md` (antigo) → `INDEX.md` (novo)

**Arquivos mantidos:**
- `CHANGELOG.md` → Atualizado
- `README.md` → Atualizado

**Novos documentos:**
- `ROADMAP.md` → Criado
- `SECURITY.md` → Criado

---

**🎉 Bem-vindo ao AlignWork! Comece pelo [README.md](./README.md)**
