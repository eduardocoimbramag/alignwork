# 🔧 Reparo 3 - Nome dos Pacientes Não Aparece Após Reiniciar

**Data:** 01/11/2025  
**Status:** 🟡 MÉDIO - Dados persistem mas nomes não são exibidos  
**Autor:** Diagnóstico Técnico - Parte 3

---

## 📋 Sumário Executivo

Após aplicar as correções dos documentos **1-reparo--cadastro.md** e **2-reparo--cadastro.md**, um novo problema foi identificado:

- ✅ **Clientes são salvos** e persistem no banco
- ✅ **Appointments são criados** e persistem no banco
- ✅ **Dashboard mostra contadores corretos** (Total de Clientes: 2)
- ✅ **Calendário mostra appointments** após reiniciar
- ❌ **Nome dos pacientes não aparece** - mostra apenas ID (ex: "2" ao invés de "Maria Eduarda")

### 🔍 Evidências:

Na imagem fornecida, a seção "Próximas Consultas" mostra:
```
2              03:00
Consulta • Hoje  Pendente
```

**Esperado:**
```
Maria Eduarda    03:00
Consulta • Hoje  Pendente
```

---

## 🔍 Análise Técnica do Problema

### **Causa Raiz: Incompatibilidade de Tipos no Lookup do Map**

No documento **2-reparo--cadastro.md**, mudamos `patient_id` de `String` para `Integer` no banco de dados e nos schemas.

**Porém**, o frontend ainda usa **strings como chaves** do Map de clientes, mas tenta buscar usando **números** (integers).

### **Fluxo do Problema:**

**Arquivo:** `src/contexts/AppContext.tsx` (linhas 156-192)

```typescript
// 1. Criar Map de clientes (CHAVES SÃO STRINGS)
const clientesCarregados: Cliente[] = patientsResponse.data.map((patient: Patient) => ({
  id: patient.id.toString(),  // ← ID convertido para STRING
  nome: patient.name,
  // ...
}));

// 2. Criar Map com chave STRING
const clientesMap = new Map(clientesCarregados.map(c => [c.id, c]));
// clientesMap = Map { "1" => {...}, "2" => {...} }
//                      ^^^          ^^^
//                    STRINGS!

// 3. Transformar appointments
const agendamentosCarregados = appointmentsResponse.data.map((appointment: Appointment) => {
  // Buscar nome do cliente no mapa
  const cliente = clientesMap.get(appointment.patient_id);
  //                               ^^^^^^^^^^^^^^^^^^^^^^^^
  //                               ESTE É NUMBER (2), NÃO STRING ("2")!
  
  return {
    id: appointment.id.toString(),
    clienteId: appointment.patient_id,  // ← NUMBER (ex: 2)
    cliente: cliente?.nome || appointment.patient_id,  // ← Fallback para ID
    // ...
  };
});
```

### **Por que o Map.get() falha?**

```javascript
// Map de clientes
const clientesMap = new Map([
  ["1", { id: "1", nome: "João Silva" }],
  ["2", { id: "2", nome: "Maria Eduarda" }]
]);

// Appointment vem do backend
const appointment = {
  id: 3,
  patient_id: 2,  // ← NUMBER (não STRING)
  // ...
};

// Tentativa de buscar
const cliente = clientesMap.get(appointment.patient_id);
//              clientesMap.get(2)  ← Busca com NUMBER
//              Mas o Map tem chave "2" (STRING)
//              2 !== "2" em JavaScript
//              Resultado: undefined

// Fallback
const nome = cliente?.nome || appointment.patient_id;
//           undefined      || 2
//           Resultado: 2 (o ID numérico)
```

### **Diagrama do Fluxo:**

```
Backend → Retorna Appointment
          {
            id: 3,
            patient_id: 2 (INTEGER)
          }
          ↓
Frontend → Cria Map de Clientes
          Map {
            "1" => { nome: "João" },
            "2" => { nome: "Maria" }
          }
          Chaves são STRINGS!
          ↓
Frontend → Tenta buscar cliente
          clientesMap.get(2)  ← NUMBER
          Não encontra (chave é "2", não 2)
          ↓
Frontend → Usa fallback
          cliente?.nome || appointment.patient_id
          undefined || 2
          ↓
Frontend → Exibe "2" ao invés de "Maria"
```

---

## 🛠️ Solução Completa

### **Opção A: Converter patient_id para String ao Buscar (RECOMENDADO)**

Garantir que sempre convertemos para string ao buscar no Map.

**Arquivo:** `src/contexts/AppContext.tsx`

**Linha 180 - Antes:**
```typescript
// Buscar nome do cliente no mapa
const cliente = clientesMap.get(appointment.patient_id);

return {
  id: appointment.id.toString(),
  clienteId: appointment.patient_id,
  cliente: cliente?.nome || appointment.patient_id,
  tipo: 'Consulta' as const,
  data: startsAtLocal.toDate(),
  horaInicio: startsAtLocal.format('HH:mm'),
  duracao: appointment.duration_min,
  status: statusMap[appointment.status] || 'pendente'
};
```

**Linha 180 - Depois:**
```typescript
// Buscar nome do cliente no mapa (convertendo patient_id para string)
const cliente = clientesMap.get(appointment.patient_id.toString());

return {
  id: appointment.id.toString(),
  clienteId: appointment.patient_id.toString(),  // ← Também converter aqui
  cliente: cliente?.nome || `Cliente #${appointment.patient_id}`,  // ← Melhor fallback
  tipo: 'Consulta' as const,
  data: startsAtLocal.toDate(),
  horaInicio: startsAtLocal.format('HH:mm'),
  duracao: appointment.duration_min,
  status: statusMap[appointment.status] || 'pendente'
};
```

**Por quê esta é a melhor opção?**
- ✅ Mudança mínima (apenas 2 linhas)
- ✅ Mantém consistência: IDs são sempre strings no frontend
- ✅ Não precisa mudar a estrutura do Map
- ✅ Funciona mesmo se o backend retornar number ou string

---

### **Opção B: Criar Map com Chaves Numéricas**

Mudar o Map para usar números como chaves.

**Arquivo:** `src/contexts/AppContext.tsx`

**Linha 167 - Antes:**
```typescript
// Criar mapa de clientes para lookup rápido
const clientesMap = new Map(clientesCarregados.map(c => [c.id, c]));
//                                                       ^^^^
//                                                      STRING
```

**Linha 167 - Depois:**
```typescript
// Criar mapa de clientes para lookup rápido (chave numérica)
const clientesMap = new Map(clientesCarregados.map(c => [parseInt(c.id), c]));
//                                                       ^^^^^^^^^^^^^^^
//                                                       Converter para NUMBER
```

**Desvantagem:**
- ❌ Inconsistente: IDs são strings no tipo `Cliente` mas números no Map
- ❌ Pode causar bugs se outras partes do código esperam string
- ❌ Não resolve o problema do `clienteId` (ainda precisa converter)

**Não recomendado.**

---

### **Opção C: Mudar Tipo no Backend para String**

Reverter a mudança do documento 2 e manter `patient_id` como string.

**Desvantagem:**
- ❌ Perde a integridade referencial (Foreign Key)
- ❌ Perde validação de tipo no banco
- ❌ Não é a arquitetura correta
- ❌ Volta ao problema original

**Definitivamente não recomendado.**

---

## 📝 Implementação da Solução (Opção A)

### **Arquivo a Modificar:** `src/contexts/AppContext.tsx`

**Localização:** Linhas 171-192 (dentro do `useEffect` de carregamento)

**Mudança Completa:**

```typescript
// Transformar appointments da API para o formato do contexto
const agendamentosCarregados = appointmentsResponse.data.map((appointment: Appointment) => {
  const startsAtLocal = dayjs.utc(appointment.starts_at).tz('America/Recife');
  const statusMap: Record<string, Agendamento['status']> = {
    'pending': 'pendente',
    'confirmed': 'confirmado',
    'cancelled': 'desmarcado'
  };
  
  // CORREÇÃO: Converter patient_id para string ao buscar no Map
  const patientIdStr = appointment.patient_id.toString();
  const cliente = clientesMap.get(patientIdStr);
  
  return {
    id: appointment.id.toString(),
    clienteId: patientIdStr,  // ← Usar string convertida
    cliente: cliente?.nome || `Cliente #${appointment.patient_id}`,  // ← Fallback melhorado
    tipo: 'Consulta' as const,
    data: startsAtLocal.toDate(),
    horaInicio: startsAtLocal.format('HH:mm'),
    duracao: appointment.duration_min,
    status: statusMap[appointment.status] || 'pendente'
  };
});
```

### **Explicação das Mudanças:**

1. **Linha 180 - Nova variável:**
   ```typescript
   const patientIdStr = appointment.patient_id.toString();
   ```
   - Converte `patient_id` (number) para string
   - Armazena em variável para reusar

2. **Linha 181 - Busca corrigida:**
   ```typescript
   const cliente = clientesMap.get(patientIdStr);
   ```
   - Usa a versão string para buscar no Map
   - Agora encontra o cliente corretamente

3. **Linha 185 - clienteId como string:**
   ```typescript
   clienteId: patientIdStr,
   ```
   - Usa a versão string (consistente com o tipo `Cliente`)
   - Evita misturar types number/string

4. **Linha 186 - Fallback melhorado:**
   ```typescript
   cliente: cliente?.nome || `Cliente #${appointment.patient_id}`,
   ```
   - Ao invés de mostrar apenas "2"
   - Mostra "Cliente #2" se não encontrar o nome
   - Mais amigável ao usuário

---

## 🔍 Verificação dos Tipos

### **Type Definition no Frontend:**

**Arquivo:** `src/types/appointment.ts`

```typescript
export interface Appointment {
  id: number;
  tenant_id: string;
  patient_id: number;  // ← Agora é number (mudamos no documento 2)
  starts_at: string;
  duration_min: number;
  status: string;
  created_at: string;
  updated_at: string;
}
```

### **Type no Contexto:**

**Arquivo:** `src/contexts/AppContext.tsx`

```typescript
export interface Cliente {
  id: string;  // ← ID é string no frontend
  nome: string;
  telefone: string;
  cpf: string;
  endereco: string;
  email?: string;
  observacoes?: string;
  dataCadastro: Date;
}

export interface Agendamento {
  id: string;
  clienteId: string;  // ← clienteId também é string
  cliente: string;  // Nome do cliente
  tipo: 'Consulta' | 'Tratamento' | 'Retorno';
  data: Date;
  horaInicio: string;
  duracao: number;
  status: 'pendente' | 'confirmado' | 'concluido' | 'desmarcado';
  observacoes?: string;
  anotacoes?: string;
  prescriptions?: Prescription[];
}
```

**Conclusão:** O frontend usa **strings para IDs**, então precisamos converter.

---

## 🧪 Como Testar a Solução

### **Teste 1: Verificar Nome Aparece Corretamente**

1. Reiniciar backend e frontend
2. Fazer login
3. Dashboard deve mostrar:
   ```
   Maria Eduarda        03:00
   Consulta • Hoje  Pendente
   ```
4. ✅ Nome completo aparece (não mais apenas "2")

### **Teste 2: Criar Novo Appointment**

1. Cadastrar novo cliente "João Silva"
2. Criar appointment para "João Silva"
3. **Sem reiniciar**, verificar que nome aparece
4. **Reiniciar servidor e frontend**
5. Fazer login novamente
6. Verificar que "João Silva" ainda aparece corretamente
7. ✅ Persistência funciona

### **Teste 3: Console do Navegador**

Abrir DevTools (F12) e verificar logs:

```
🔍 DEBUG: Dados carregados do backend
   - Clientes: 2
   - Agendamentos: 3
   - Clientes: [
       { id: "1", nome: "Maria Eduarda", ... },
       { id: "2", nome: "João Silva", ... }
     ]
   - Agendamentos: [
       { id: "3", clienteId: "2", cliente: "João Silva", ... },
       { id: "4", clienteId: "1", cliente: "Maria Eduarda", ... }
     ]
```

**Verificar:**
- ✅ `clienteId` é string (ex: "2", não 2)
- ✅ `cliente` é o nome (ex: "João Silva", não 2)

---

## 🔍 Troubleshooting

### Problema: Ainda mostra ID ao invés do nome

**Causa 1:** Mudança não foi aplicada corretamente.

**Solução:**
1. Verificar se o arquivo foi salvo
2. Reiniciar o servidor frontend (Vite hot-reload pode não pegar)
3. Fazer hard-refresh no navegador (Ctrl+F5)

**Causa 2:** Cache do navegador.

**Solução:**
```bash
# Limpar cache e reiniciar
npm run dev
```

### Problema: "Cliente #2" aparece ao invés do nome

**Causa:** Cliente com ID 2 não existe no banco ou não foi carregado.

**Debug:**
```typescript
// Adicionar log temporário no AppContext.tsx
console.log('🔍 Clientes carregados:', clientesCarregados);
console.log('🔍 Map de clientes:', Array.from(clientesMap.entries()));
console.log('🔍 Appointment patient_id:', appointment.patient_id, typeof appointment.patient_id);
console.log('🔍 Buscando cliente:', patientIdStr, clientesMap.get(patientIdStr));
```

### Problema: Erro "Cannot read property 'toString' of undefined"

**Causa:** `appointment.patient_id` é null ou undefined.

**Solução:** Adicionar validação:

```typescript
// Validação defensiva
const patientIdStr = appointment.patient_id?.toString() || 'unknown';
const cliente = clientesMap.get(patientIdStr);
```

---

## 📊 Checklist de Validação

Após aplicar a correção:

- [ ] Arquivo `src/contexts/AppContext.tsx` foi modificado
- [ ] Linha com `clientesMap.get()` usa `.toString()`
- [ ] `clienteId` no objeto retornado é string
- [ ] Fallback usa template string `Cliente #${id}`
- [ ] Frontend reiniciado (Ctrl+C e `npm run dev`)
- [ ] Cache do navegador limpo (Ctrl+F5)
- [ ] Dashboard mostra **nomes** (não IDs) nas próximas consultas
- [ ] Após reiniciar servidor, nomes continuam aparecendo
- [ ] Console do navegador mostra `clienteId` como string nos logs
- [ ] Novo appointment criado mostra nome corretamente

---

## 🎯 Resumo Técnico

### **Problema:**
- Backend retorna `patient_id` como `number` (Integer)
- Frontend cria Map com chaves `string`
- Lookup falha: `Map.get(2)` não encontra chave `"2"`
- Fallback retorna ID numérico ao invés do nome

### **Solução:**
- Converter `patient_id` para string antes de buscar no Map
- Garantir `clienteId` também é string (consistência de tipos)
- Melhorar fallback para ser mais user-friendly

### **Impacto:**
- ✅ 1 arquivo modificado (`AppContext.tsx`)
- ✅ 4 linhas alteradas
- ✅ Sem mudanças no backend
- ✅ Sem mudanças no banco de dados
- ✅ Correção simples e efetiva

---

## 📈 Por Que Isso Aconteceu?

Esta é uma **consequência esperada** das mudanças feitas nos documentos anteriores:

1. **Documento 1:** Mudamos `patient_id` de String para Integer no **banco de dados**
2. **Documento 2:** Mudamos `patient_id` para Integer nos **schemas do backend**
3. **Documento 3 (este):** Precisamos ajustar o **frontend** para lidar com Integer

É um exemplo clássico de **mudança de tipo propagando** através das camadas da aplicação:

```
Banco de Dados (Integer)
    ↓
Backend Models (Integer)
    ↓
Backend Schemas (Integer)
    ↓
API Response (number)
    ↓
Frontend Types (number)
    ↓
Frontend Logic (precisa converter para string) ← ESTE DOCUMENTO
```

---

## ✅ Conclusão

Este documento resolve o problema de **nomes não aparecerem** após reiniciar o servidor.

**A causa** foi a incompatibilidade de tipos entre:
- Backend retornando `patient_id` como `number`
- Frontend usando `string` como chave do Map de clientes

**A solução** é simples e direta:
- Converter `patient_id` para string ao buscar no Map
- Manter consistência de tipos no frontend (IDs são strings)

Após aplicar esta correção:
- ✅ Nomes aparecem corretamente nas próximas consultas
- ✅ Dados persistem entre reinicializações
- ✅ Sistema está 100% funcional

**Tempo estimado para aplicação:** 2-3 minutos  
**Complexidade:** Muito Baixa  
**Risco:** Mínimo (apenas ajuste de tipos)

---

**Próximo passo:** Aplicar a mudança no arquivo `src/contexts/AppContext.tsx` e testar! 🚀

