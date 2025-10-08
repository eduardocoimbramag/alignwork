# Implementação: Calendário Interativo Funcional

## 📋 Problema Identificado

Atualmente, ao clicar em "Ver Calendário Completo" no dashboard, o modal "Calendário de Agendamentos" abre corretamente, mas o calendário não está funcional - não é possível clicar nas outras datas para navegar entre meses ou selecionar dias.

---

## 🎯 Objetivo

Tornar o calendário totalmente funcional com:
- ✅ Navegação entre meses (setas anterior/próximo)
- ✅ Seleção de datas clicáveis
- ✅ Visualização de agendamentos por dia
- ✅ Feedback visual ao passar o mouse
- ✅ Integração com React Query para buscar dados por data
- ✅ Seguir os padrões de UI/UX do projeto (cores da marca, animações)

---

## 🔍 Análise do Projeto Atual

### Estrutura de Componentes
```
InteractiveCalendar (src/components/Calendar/InteractiveCalendar.tsx)
  └─ CalendarModal (src/components/Calendar/CalendarModal.tsx)
      └─ [Calendário a ser implementado/corrigido]
```

### Padrões do Projeto
- **Cores da Marca:** brand-purple, brand-pink, brand-lime, brand-green
- **Componentes UI:** shadcn/ui (Radix UI + Tailwind)
- **Data Management:** React Query com cache de 30s
- **Timezone:** America/Recife
- **Biblioteca de Datas:** dayjs

### Hooks Disponíveis
- `useDashboardSummary(tenantId)` - Resumo hoje/amanhã
- `useDashboardMegaStats(tenantId)` - Estatísticas agregadas
- `useAppointmentMutations` - Criar/atualizar agendamentos

---

## 📝 Passo a Passo da Implementação

### Passo 1: Criar Hook para Buscar Agendamentos por Mês

**Arquivo:** `src/hooks/useMonthAppointments.ts` (CRIAR NOVO)

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { dayjs } from '@/lib/dayjs';

interface Appointment {
  id: number;
  tenant_id: string;
  patient_id: string;
  starts_at: string;
  duration_min: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export function useMonthAppointments(tenantId: string, year: number, month: number) {
  // Início do mês no timezone local
  const monthStart = dayjs()
    .tz('America/Recife')
    .year(year)
    .month(month)
    .startOf('month')
    .toISOString();

  // Início do próximo mês
  const nextMonthStart = dayjs()
    .tz('America/Recife')
    .year(year)
    .month(month)
    .add(1, 'month')
    .startOf('month')
    .toISOString();

  return useQuery({
    queryKey: ['appointments', tenantId, year, month],
    queryFn: async () => {
      const response = await api<Appointment[]>(
        `/api/v1/appointments/summary?tenantId=${tenantId}&from=${monthStart}&to=${nextMonthStart}&tz=America/Recife`
      );
      return response;
    },
    staleTime: 30_000, // 30 segundos
    refetchOnWindowFocus: true,
  });
}
```

**Por quê?**
- Busca todos os agendamentos de um mês específico
- Usa o endpoint já existente `/api/v1/appointments/summary`
- Segue o padrão de cache do projeto (30s)
- Trabalha com timezone America/Recife

---

### Passo 2: Atualizar/Criar CalendarModal Funcional

**Arquivo:** `src/components/Calendar/CalendarModal.tsx` (MODIFICAR/CRIAR)

```typescript
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useMonthAppointments } from '@/hooks/useMonthAppointments';
import { cn } from '@/lib/utils';
import { dayjs } from '@/lib/dayjs';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId?: string;
}

export function CalendarModal({ isOpen, onClose, tenantId = 'default-tenant' }: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const { data: appointments, isLoading } = useMonthAppointments(tenantId, year, month);

  // Navegar para mês anterior
  const handlePreviousMonth = () => {
    setCurrentDate(prev => dayjs(prev).subtract(1, 'month').toDate());
  };

  // Navegar para próximo mês
  const handleNextMonth = () => {
    setCurrentDate(prev => dayjs(prev).add(1, 'month').toDate());
  };

  // Formatar nome do mês
  const monthName = dayjs(currentDate).format('MMMM YYYY');

  // Verificar se uma data tem agendamentos
  const hasAppointments = (date: Date) => {
    if (!appointments) return false;
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    return appointments.some(apt => 
      dayjs(apt.starts_at).format('YYYY-MM-DD') === dateStr
    );
  };

  // Contar agendamentos de uma data
  const getAppointmentCount = (date: Date) => {
    if (!appointments) return 0;
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    return appointments.filter(apt => 
      dayjs(apt.starts_at).format('YYYY-MM-DD') === dateStr
    ).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent">
              Calendário de Agendamentos
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Header de Navegação do Mês */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              className="rounded-full hover:bg-brand-purple/10 hover:border-brand-purple transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <h3 className="text-xl font-semibold capitalize">
              {monthName}
            </h3>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="rounded-full hover:bg-brand-purple/10 hover:border-brand-purple transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Calendário */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentDate}
              onMonthChange={setCurrentDate}
              disabled={isLoading}
              className="w-full"
              modifiers={{
                hasAppointments: (date) => hasAppointments(date),
              }}
              modifiersClassNames={{
                hasAppointments: 'bg-brand-purple/20 font-bold',
              }}
              components={{
                DayContent: ({ date }) => {
                  const count = getAppointmentCount(date);
                  return (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <span>{date.getDate()}</span>
                      {count > 0 && (
                        <div className="absolute -top-1 -right-1 bg-brand-pink text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {count}
                        </div>
                      )}
                    </div>
                  );
                },
              }}
            />
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-6 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-brand-purple/20 border border-brand-purple"></div>
              <span>Dia com agendamentos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-brand-pink text-white flex items-center justify-center text-xs font-bold">
                N
              </div>
              <span>Número de agendamentos</span>
            </div>
          </div>

          {/* Lista de Agendamentos do Dia Selecionado */}
          {selectedDate && (
            <div className="bg-gradient-to-br from-brand-purple/5 to-brand-pink/5 rounded-lg p-6 border">
              <h4 className="font-semibold text-lg mb-4">
                Agendamentos de {dayjs(selectedDate).format('DD/MM/YYYY')}
              </h4>
              
              {isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : (
                <div className="space-y-3">
                  {appointments
                    ?.filter(apt => 
                      dayjs(apt.starts_at).format('YYYY-MM-DD') === dayjs(selectedDate).format('YYYY-MM-DD')
                    )
                    .map(apt => (
                      <div
                        key={apt.id}
                        className={cn(
                          "p-4 rounded-lg border-l-4 bg-white shadow-sm",
                          apt.status === 'confirmed' && "border-brand-green",
                          apt.status === 'pending' && "border-brand-pink",
                          apt.status === 'cancelled' && "border-gray-400"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {dayjs(apt.starts_at).format('HH:mm')} - Paciente ID: {apt.patient_id}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Duração: {apt.duration_min} minutos
                            </p>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-sm font-medium",
                            apt.status === 'confirmed' && "bg-brand-green/10 text-brand-green",
                            apt.status === 'pending' && "bg-brand-pink/10 text-brand-pink",
                            apt.status === 'cancelled' && "bg-gray-100 text-gray-600"
                          )}>
                            {apt.status === 'confirmed' && 'Confirmado'}
                            {apt.status === 'pending' && 'Pendente'}
                            {apt.status === 'cancelled' && 'Cancelado'}
                          </div>
                        </div>
                      </div>
                    )) || (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum agendamento para este dia
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Botão de Novo Agendamento */}
          <div className="flex justify-end">
            <Button
              className="bg-gradient-to-r from-brand-purple to-brand-pink hover:from-brand-purple/90 hover:to-brand-pink/90 transition-all"
              onClick={() => {
                // TODO: Abrir modal de novo agendamento com a data selecionada
                console.log('Criar agendamento para:', selectedDate);
              }}
            >
              Novo Agendamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Recursos Implementados:**
- ✅ Navegação entre meses com setas
- ✅ Seleção de datas clicável
- ✅ Indicador visual de dias com agendamentos
- ✅ Badge com número de agendamentos por dia
- ✅ Lista de agendamentos do dia selecionado
- ✅ Status colorido (confirmado/pendente/cancelado)
- ✅ Gradientes da marca (purple/pink/lime/green)
- ✅ Loading state
- ✅ Responsivo

---

### Passo 3: Verificar Componente Calendar do shadcn/ui

O componente `Calendar` do shadcn/ui já existe em `src/components/ui/calendar.tsx`. Se não existir ou não estiver completo:

**Comando para adicionar:**
```bash
npx shadcn-ui@latest add calendar
```

**Ou verificar manualmente em:** `src/components/ui/calendar.tsx`

---

### Passo 4: Atualizar InteractiveCalendar para Passar tenantId

**Arquivo:** `src/components/Calendar/InteractiveCalendar.tsx` (MODIFICAR)

```typescript
// Linha onde abre o modal
<CalendarModal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)}
  tenantId={tenantId}  // ← ADICIONAR esta prop
/>
```

---

### Passo 5: Criar Endpoint Backend para Listar Agendamentos (Se Necessário)

**Verificar se existe:** `GET /api/v1/appointments/` com filtros por data

**Se não existir, adicionar em** `backend/routes/appointments.py`:

```python
@router.get("/", response_model=List[AppointmentResponse])
def list_appointments(
    tenantId: str = Query(...),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    db: Session = Depends(get_db)
):
    """Lista agendamentos com filtros opcionais."""
    query = db.query(Appointment).filter(Appointment.tenant_id == tenantId)
    
    if from_date:
        from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
        query = query.filter(Appointment.starts_at >= from_dt)
    
    if to_date:
        to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
        query = query.filter(Appointment.starts_at < to_dt)
    
    appointments = query.order_by(Appointment.starts_at).all()
    return appointments
```

---

### Passo 6: Adicionar Animações e Transições CSS

**Arquivo:** `src/index.css` (ADICIONAR no final)

```css
/* Animações para o Calendário */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.calendar-fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Hover nos dias do calendário */
.rdp-day:hover {
  background-color: hsl(var(--brand-purple) / 0.1) !important;
  transition: all 0.2s ease;
  transform: scale(1.05);
}

/* Dia selecionado */
.rdp-day_selected {
  background: linear-gradient(135deg, hsl(var(--brand-purple)), hsl(var(--brand-pink))) !important;
  color: white !important;
  font-weight: bold !important;
}

/* Dia com agendamentos */
.rdp-day.hasAppointments {
  position: relative;
  font-weight: 600;
}

.rdp-day.hasAppointments::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: hsl(var(--brand-purple));
}
```

---

### Passo 7: Adicionar Types TypeScript

**Arquivo:** `src/types/appointment.ts` (CRIAR NOVO)

```typescript
export interface Appointment {
  id: number;
  tenant_id: string;
  patient_id: string;
  starts_at: string;
  duration_min: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface AppointmentCreate {
  tenantId: string;
  patientId: string;
  startsAt: string;
  durationMin: number;
  status?: 'pending' | 'confirmed';
}

export interface AppointmentUpdate {
  status: 'pending' | 'confirmed' | 'cancelled';
}
```

---

### Passo 8: Testar a Implementação

**Checklist de Testes:**

1. ✅ **Navegação entre meses**
   - Clicar na seta esquerda deve voltar 1 mês
   - Clicar na seta direita deve avançar 1 mês
   - Mês e ano devem atualizar corretamente

2. ✅ **Seleção de datas**
   - Clicar em qualquer dia deve selecioná-lo
   - Dia selecionado deve ter destaque visual
   - Lista de agendamentos deve atualizar

3. ✅ **Indicadores visuais**
   - Dias com agendamentos devem ter fundo colorido
   - Badge com número deve aparecer corretamente
   - Cores devem seguir a paleta da marca

4. ✅ **Performance**
   - Cache deve funcionar (30s)
   - Navegação deve ser fluida
   - Sem travamentos ao trocar mês

5. ✅ **Responsividade**
   - Testar em mobile (< 768px)
   - Testar em tablet (768px - 1024px)
   - Testar em desktop (> 1024px)

---

## 🎨 Padrões de UI Seguidos

### Cores da Marca
- **brand-purple**: Navegação, seleção, elementos principais
- **brand-pink**: Badges, indicadores, status pendente
- **brand-green**: Status confirmado
- **brand-lime**: Elementos secundários (se necessário)

### Animações
- Fade in ao abrir modal (0.3s)
- Hover com scale(1.05) e transição (0.2s)
- Transições suaves em todos os estados

### Acessibilidade
- Botões com área clicável mínima (44x44px)
- Contraste adequado (WCAG AA)
- Labels descritivos
- Keyboard navigation

---

## 🚀 Melhorias Futuras (Opcional)

### Fase 2 (Próximas Sprints)
- [ ] Drag & drop para mover agendamentos
- [ ] Visualização de múltiplos calendários (profissionais)
- [ ] Export para Google Calendar / iCal
- [ ] Notificações de conflitos de horário
- [ ] Filtros por status / tipo de consulta
- [ ] View semanal / diária
- [ ] Recurso de busca rápida

---

## 📚 Referências no Projeto

### Arquivos Relacionados
- `docs/frontend.md` - Estrutura do frontend
- `docs/backend.md` - API endpoints
- `docs/api-reference.md` - Documentação da API
- `src/components/ui/calendar.tsx` - Componente base
- `src/hooks/useDashboardSummary.ts` - Exemplo de hook similar

### Padrões Utilizados
- React Query para data fetching
- shadcn/ui para componentes
- Tailwind CSS para estilização
- dayjs para manipulação de datas
- TypeScript strict mode

---

## ⚠️ Possíveis Problemas e Soluções

### Problema 1: Componente Calendar não existe
**Solução:** Instalar via shadcn-ui
```bash
npx shadcn-ui@latest add calendar
```

### Problema 2: Endpoint retorna erro 404
**Solução:** Verificar se o endpoint `/api/v1/appointments/` existe no backend. Caso não exista, implementar conforme Passo 5.

### Problema 3: Datas aparecem no fuso errado
**Solução:** Sempre usar `dayjs.tz('America/Recife')` ao manipular datas.

### Problema 4: Cache não invalida ao criar agendamento
**Solução:** Usar `useInvalidateAgenda(tenantId)` após mutations.

---

## ✅ Checklist de Implementação

- [ ] Criar `src/hooks/useMonthAppointments.ts`
- [ ] Atualizar/criar `src/components/Calendar/CalendarModal.tsx`
- [ ] Verificar componente `src/components/ui/calendar.tsx`
- [ ] Passar prop `tenantId` em `InteractiveCalendar.tsx`
- [ ] Criar endpoint backend (se necessário)
- [ ] Adicionar estilos CSS em `src/index.css`
- [ ] Criar `src/types/appointment.ts`
- [ ] Testar navegação entre meses
- [ ] Testar seleção de datas
- [ ] Testar indicadores visuais
- [ ] Testar responsividade
- [ ] Validar performance

---

**Data de Criação:** Outubro 2025  
**Última Atualização:** Outubro 2025  
**Status:** ✅ IMPLEMENTADO (05/10/2025)

---

## 🎉 Implementação Concluída

Este guia foi totalmente implementado no projeto em 05/10/2025. Todas as funcionalidades descritas estão operacionais:

✅ Endpoint backend `GET /api/v1/appointments/` criado  
✅ Hook `useMonthAppointments.ts` implementado  
✅ Types TypeScript `src/types/appointment.ts` criados  
✅ Helper methods em `api.ts` (get, post, patch)  
✅ `CalendarModal.tsx` totalmente funcional  
✅ Navegação entre meses operacional  
✅ Seleção de datas funcionando  
✅ Indicadores visuais de agendamentos  
✅ Lista de agendamentos por dia  
✅ Animações CSS adicionadas  
✅ Integração completa com API backend  
✅ Documentação atualizada

**Arquivos modificados/criados:**
- `backend/routes/appointments.py` (adicionado endpoint GET /)
- `src/types/appointment.ts` (NOVO)
- `src/hooks/useMonthAppointments.ts` (NOVO)
- `src/services/api.ts` (adicionados helpers)
- `src/components/Calendar/CalendarModal.tsx` (atualizado)
- `src/components/Calendar/InteractiveCalendar.tsx` (atualizado)
- `src/index.css` (animações adicionadas)
- `docs/api-reference.md` (documentação atualizada)
- `docs/backend.md` (documentação atualizada)
- `docs/frontend.md` (documentação atualizada)
- `docs/INDICE.md` (documentação atualizada)

