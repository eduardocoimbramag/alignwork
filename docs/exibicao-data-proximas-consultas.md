# 📅 Exibição de Data em “Próximas Consultas”

> Última atualização: Outubro 2025  
> Relacionado: [`API.md`](./API.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`confirmacao-de-consultas.md`](./confirmacao-de-consultas.md), [`hover-e-confirmacao-de-consultas.md`](./hover-e-confirmacao-de-consultas.md), [`integracao-confirmacao-consultas-backend.md`](./integracao-confirmacao-consultas-backend.md)

---

## 1) Problema Técnico Atual

- A lista “Próximas Consultas” exibe apenas: nome do paciente, tipo (ex.: “Consulta”, “Retorno”, “Tratamento”) e horário.
- A ausência da data dificulta a leitura quando existem itens que não são do mesmo dia.
- Integração: a fonte dos dados pode ser o estado local (`AppContext`) ou o backend (endpoints de appointments). Precisamos padronizar a exibição da data para ambos os casos.

Observações técnicas:
- Quando os dados vêm do backend, o campo comum é `starts_at` (UTC) no modelo/response.  
- No estado local (MVP), há `consulta.data: Date` e `consulta.horaInicio: string` que já compõem a hora local.

---

## 2) Comportamento Esperado e Lógica de Formatação

- A data deve aparecer ao lado do tipo, na mesma linha, com fonte pequena e sutil (mesma hierarquia do tipo).
- Regras:
  - Se a consulta for no dia atual (timezone da aplicação), exibir: **Hoje** (em destaque leve, ex.: `font-semibold`).
  - Caso contrário, exibir a data: **DD-MM-YYYY** (ex.: `11-10-2025`).
- Timezone: utilizar o fuso configurado da aplicação (atual: `America/Recife` via `dayjs.tz`).
- Comparação:
  - `isToday = dayjs(consultaLocal).isSame(dayjs().tz(TZ), 'day')`
  - Onde `consultaLocal` é a data/hora no fuso local (ver seção de implementação abaixo).

---

## 3) Partes do Sistema a Ajustar

- Componente: `src/components/Dashboard/RecentAppointments.tsx` (render da linha do item).
- Utilitários de data: `src/lib/dayjs.ts` (já configura `utc` + `timezone` e `setDefault('America/Recife')`).
- Origem dos dados:
  - Estado local (`AppContext`): campos `data` (Date) e `horaInicio` (string HH:mm).
  - Backend (opcional/agora ou futuro): `starts_at` (UTC) — endpoints em [`API.md`](./API.md) na seção Appointments.
- Queries/Hooks (se os dados vierem do backend): `useMonthAppointments`, `useDashboardSummary`, `useDashboardMegaStats` (sincronismo visual com stats, se necessário).

---

## 4) Passo a Passo de Implementação

1. Ler a data/hora da consulta
   - Estado local (MVP):
     - `const local = dayjs(consulta.data).tz(TZ)`
     - Se quiser compor com a hora: `local.hour(hh).minute(mm)` a partir de `consulta.horaInicio`.
   - Backend (UTC):
     - `const local = dayjs.utc(starts_at).tz(TZ)`

2. Calcular rótulo “Hoje” ou data formatada
   - `const isHoje = local.isSame(dayjs().tz(TZ), 'day')`
   - `const label = isHoje ? 'Hoje' : local.format('DD-MM-YYYY')`

3. Renderizar ao lado do tipo (mesma linha)
   - No bloco onde hoje renderiza o tipo, adicionar o separador (p. ex. `•`) e o `label`:
   - Sugestão (conceitual):
     ```tsx
     <p className="text-sm text-muted-foreground whitespace-nowrap">
       {consulta.tipo}
       <span className="mx-1">•</span>
       <span className={isHoje ? 'font-semibold' : ''}>{label}</span>
     </p>
     ```
   - `whitespace-nowrap` evita quebra de linha e mantém o alinhamento à esquerda.

4. Responsividade e consistência
   - Em telas muito estreitas, se houver risco de overflow, usar `truncate` no container e `title` com a data completa para tooltip nativo.
   - Manter o estilo do card: não alterar espaçamentos verticais; manter fonte pequena.

5. Integração com backend (se aplicável)
   - Quando a listagem estiver consumindo o backend, garantir que o parsing UTC → local (via `dayjs.utc(...).tz(TZ)`) seja aplicado antes da comparação/format.
   - Se a origem for mista (local + backend), padronizar criando uma pequena função utilitária que recebe `Date | string` e devolve `{ isHoje, label }`.

---

## 5) Recomendações de Estilo, Acessibilidade e Responsividade

- Estilo sutil: `text-sm text-muted-foreground` para se manter discreto, com `font-semibold` apenas quando **Hoje**.
- Linha única: `whitespace-nowrap` para evitar quebra; se necessário, envolver o bloco em um container `flex` com `gap-1`.
- Acessibilidade: manter contraste adequado; se usar tooltip nativo (`title`), evitar textos longos.
- Não interferir no foco/cursor dos elementos clicáveis definidos (ver `hover-e-confirmacao-de-consultas.md`).

---

## 6) Resumo

- Problema: a data não é exibida nas “Próximas Consultas”, dificultando a identificação de itens que não são do dia.
- Solução: mostrar a data ao lado do tipo, com lógica adaptativa (**Hoje** para o mesmo dia, **DD-MM-YYYY** caso contrário), respeitando timezone e mantendo fonte pequena/alinhamento à esquerda. A implementação é simples, compatível com dados locais e com retorno do backend (UTC), e preserva a consistência visual do componente.
