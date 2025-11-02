import { useState } from 'react';
import type { Consultorio, ConsultoriosView } from '@/types/consultorio';
import { ConsultoriosListContent } from './ConsultoriosListContent';
import { ConsultorioFormContent } from './ConsultorioFormContent';

/**
 * Componente Principal: ConsultoriosContent
 * 
 * Gerencia a navegação entre as diferentes views da aba Consultórios:
 * - 'list': Listagem de consultórios cadastrados
 * - 'form': Formulário para novo consultório
 * - 'edit': Formulário para editar consultório existente
 */

export const ConsultoriosContent = () => {
  const [currentView, setCurrentView] = useState<ConsultoriosView>('list');
  const [selectedConsultorio, setSelectedConsultorio] = useState<Consultorio | null>(null);

  // Handler: Navegar para formulário de cadastro
  const handleCadastrar = () => {
    setSelectedConsultorio(null);
    setCurrentView('form');
  };

  // Handler: Navegar para formulário de edição
  const handleEditar = (consultorio: Consultorio) => {
    setSelectedConsultorio(consultorio);
    setCurrentView('edit');
  };

  // Handler: Voltar para listagem
  const handleVoltar = () => {
    setSelectedConsultorio(null);
    setCurrentView('list');
  };

  // Renderização condicional baseada na view ativa
  return (
    <>
      {currentView === 'list' && (
        <ConsultoriosListContent 
          onCadastrar={handleCadastrar}
          onEditar={handleEditar}
        />
      )}
      
      {(currentView === 'form' || currentView === 'edit') && (
        <ConsultorioFormContent 
          onVoltar={handleVoltar}
          consultorio={selectedConsultorio}
        />
      )}
    </>
  );
};


