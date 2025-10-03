import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";

/**
 * MODAL DE CADASTRO DE CLIENTE
 * 
 * Este modal permite cadastrar novos clientes no sistema.
 * Inclui validações básicas e salva os dados no contexto global.
 */

interface CadastroClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Função para formatar CPF enquanto o usuário digita
const formatarCPF = (valor: string) => {
  return valor
    .replace(/\D/g, '') // Remove tudo que não é dígito
    .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona primeiro ponto
    .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona segundo ponto
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2'); // Adiciona hífen
};

// Função para formatar telefone
const formatarTelefone = (valor: string) => {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

// Função para validar CPF (algoritmo básico)
const validarCPF = (cpf: string): boolean => {
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numeros)) return false; // CPFs com todos os dígitos iguais
  return true; // Validação simplificada para o MVP
};

export const CadastroClienteModal = ({ isOpen, onClose }: CadastroClienteModalProps) => {
  const { adicionarCliente } = useApp();
  const { toast } = useToast();

  // Estados para os campos do formulário
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    cpf: '',
    endereco: '',
    email: '',
    observacoes: ''
  });

  // Estados para controle de erros
  const [erros, setErros] = useState<Record<string, string>>({});

  // Função para limpar o formulário
  const limparFormulario = () => {
    setFormData({
      nome: '',
      telefone: '',
      cpf: '',
      endereco: '',
      email: '',
      observacoes: ''
    });
    setErros({});
  };

  // Função para validar os campos
  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (!formData.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório';
    }

    if (!formData.telefone.trim()) {
      novosErros.telefone = 'Telefone é obrigatório';
    } else if (formData.telefone.replace(/\D/g, '').length < 10) {
      novosErros.telefone = 'Telefone deve ter pelo menos 10 dígitos';
    }

    if (!formData.cpf.trim()) {
      novosErros.cpf = 'CPF é obrigatório';
    } else if (!validarCPF(formData.cpf)) {
      novosErros.cpf = 'CPF inválido';
    }

    if (!formData.endereco.trim()) {
      novosErros.endereco = 'Endereço é obrigatório';
    }

    if (formData.email && !formData.email.includes('@')) {
      novosErros.email = 'Email inválido';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Função executada quando o usuário clica em "Salvar"
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      toast({
        title: "Erro no formulário",
        description: "Por favor, corrija os campos destacados",
        variant: "destructive"
      });
      return;
    }

    try {
      adicionarCliente(formData);
      
      toast({
        title: "Cliente cadastrado!",
        description: `${formData.nome} foi adicionado com sucesso`,
      });

      limparFormulario();
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao cadastrar",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    }
  };

  // Função para fechar modal
  const handleClose = () => {
    limparFormulario();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Cadastrar Novo Cliente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Maria Silva Santos"
              className={erros.nome ? 'border-red-500' : ''}
            />
            {erros.nome && <p className="text-sm text-red-500">{erros.nome}</p>}
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone *</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                telefone: formatarTelefone(e.target.value).slice(0, 15) // Limita caracteres
              }))}
              placeholder="(11) 99999-9999"
              className={erros.telefone ? 'border-red-500' : ''}
            />
            {erros.telefone && <p className="text-sm text-red-500">{erros.telefone}</p>}
          </div>

          {/* CPF */}
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                cpf: formatarCPF(e.target.value).slice(0, 14) // Limita caracteres
              }))}
              placeholder="123.456.789-00"
              className={erros.cpf ? 'border-red-500' : ''}
            />
            {erros.cpf && <p className="text-sm text-red-500">{erros.cpf}</p>}
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço *</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
              placeholder="Rua, número, bairro - Cidade"
              className={erros.endereco ? 'border-red-500' : ''}
            />
            {erros.endereco && <p className="text-sm text-red-500">{erros.endereco}</p>}
          </div>

          {/* Email (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="cliente@email.com"
              className={erros.email ? 'border-red-500' : ''}
            />
            {erros.email && <p className="text-sm text-red-500">{erros.email}</p>}
          </div>

          {/* Observações (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Informações adicionais sobre o cliente..."
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-brand-green to-brand-lime hover:from-brand-green/80 hover:to-brand-lime/80"
            >
              Cadastrar Cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};