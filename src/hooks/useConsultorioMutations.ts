import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/services/api';
import type { ConsultorioFormData } from '@/types/consultorio';

/**
 * Hook useConsultorioMutations
 * 
 * Centraliza as mutations (create, update, delete) de consultórios
 * com gerenciamento automático de cache e feedback ao usuário.
 * 
 * @returns Objeto com funções de mutation e estados de loading
 */
export function useConsultorioMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tenantId } = useTenant();

  // Mutation: Criar consultório
  const createMutation = useMutation({
    mutationFn: async (data: ConsultorioFormData) => {
      const response = await api.post('/api/v1/consultorios', {
        ...data,
        tenant_id: tenantId
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalida a query para forçar refetch da lista
      queryClient.invalidateQueries({ queryKey: ['consultorios', tenantId] });
      toast({
        title: 'Consultório cadastrado!',
        description: 'O local de atendimento foi adicionado com sucesso.',
      });
    },
    onError: (error: any) => {
      console.error('Erro ao cadastrar consultório:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: error.response?.data?.detail || 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    }
  });

  // Mutation: Atualizar consultório
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ConsultorioFormData }) => {
      const response = await api.put(`/api/v1/consultorios/${id}?tenant_id=${tenantId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultorios', tenantId] });
      toast({
        title: 'Consultório atualizado!',
        description: 'As alterações foram salvas com sucesso.',
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar consultório:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.response?.data?.detail || 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    }
  });

  // Mutation: Deletar consultório
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/v1/consultorios/${id}?tenant_id=${tenantId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultorios', tenantId] });
      toast({
        title: 'Consultório removido',
        description: 'O local de atendimento foi excluído.',
      });
    },
    onError: (error: any) => {
      console.error('Erro ao deletar consultório:', error);
      toast({
        title: 'Erro ao remover',
        description: error.response?.data?.detail || 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    }
  });

  return {
    createConsultorio: createMutation.mutateAsync,
    updateConsultorio: updateMutation.mutateAsync,
    deleteConsultorio: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

