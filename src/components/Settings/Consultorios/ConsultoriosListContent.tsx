import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Building, MapPin, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTenant } from '@/contexts/TenantContext';
import { useConsultorioMutations } from '@/hooks/useConsultorioMutations';
import { api } from '@/services/api';
import type { Consultorio } from '@/types/consultorio';

interface ConsultoriosListContentProps {
  onCadastrar: () => void;
  onEditar: (consultorio: Consultorio) => void;
}

export const ConsultoriosListContent = ({ onCadastrar, onEditar }: ConsultoriosListContentProps) => {
  const { tenantId } = useTenant();
  const { deleteConsultorio, isDeleting } = useConsultorioMutations();
  const [consultorioToDelete, setConsultorioToDelete] = useState<number | null>(null);

  // Query: Buscar consultórios do tenant
  const { data: consultorios, isLoading } = useQuery({
    queryKey: ['consultorios', tenantId],
    queryFn: async () => {
      const response = await api.get(`/consultorios?tenant_id=${tenantId}`);
      return response.data as Consultorio[];
    },
    enabled: !!tenantId,
  });

  const handleDelete = async () => {
    if (consultorioToDelete) {
      await deleteConsultorio(consultorioToDelete);
      setConsultorioToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Consultórios Cadastrados
        </h2>
        <p className="text-muted-foreground">
          Gerencie os locais de atendimento
        </p>
      </div>

      {/* Botão de Ação */}
      <div className="flex items-center justify-between">
        <Button 
          onClick={onCadastrar}
          className="bg-brand-purple hover:bg-brand-purple/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Cadastrar consultório
        </Button>
      </div>

      {/* Lista de Consultórios */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      )}

      {!isLoading && (!consultorios || consultorios.length === 0) && (
        <EmptyState onCadastrar={onCadastrar} />
      )}

      {!isLoading && consultorios && consultorios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {consultorios.map((consultorio) => (
            <Card 
              key={consultorio.id} 
              className="rounded-2xl bg-white border border-black/10 shadow-lg hover:shadow-xl transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center">
                      <Building className="w-5 h-5 text-brand-purple" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{consultorio.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {consultorio.cidade} - {consultorio.estado}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>{consultorio.rua}, {consultorio.numero}</p>
                    <p className="text-muted-foreground">
                      {consultorio.bairro} - CEP {consultorio.cep}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEditar(consultorio)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setConsultorioToDelete(consultorio.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={consultorioToDelete !== null} onOpenChange={() => setConsultorioToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover consultório?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O consultório será permanentemente removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Removendo...' : 'Confirmar exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ onCadastrar }: { onCadastrar: () => void }) => (
  <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
    <CardContent className="py-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-purple/10">
          <Building className="w-8 h-8 text-brand-purple" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">
            Nenhum consultório cadastrado
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Comece cadastrando seu primeiro local de atendimento
          </p>
        </div>
        <Button 
          onClick={onCadastrar}
          className="bg-brand-purple hover:bg-brand-purple/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Cadastrar primeiro consultório
        </Button>
      </div>
    </CardContent>
  </Card>
);

