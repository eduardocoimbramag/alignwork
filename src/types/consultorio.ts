/**
 * Types e Interfaces para Consultório
 * 
 * Define os tipos de dados utilizados na funcionalidade de Gestão de Consultórios
 */

// Modelo principal de Consultório
export interface Consultorio {
  id: number;
  tenant_id: string;
  nome: string;
  estado: string;
  cidade: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  informacoes_adicionais?: string;
  created_at: Date;
  updated_at: Date;
}

// Dados do formulário (sem id e timestamps)
export interface ConsultorioFormData {
  nome: string;
  estado: string;
  cidade: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  informacoes_adicionais?: string;
}

// Estado do Brasil (API IBGE)
export interface Estado {
  id: number;
  sigla: string; // "PE", "SP", etc.
  nome: string;  // "Pernambuco", "São Paulo"
}

// Cidade/Município (API IBGE)
export interface Cidade {
  id: number;
  nome: string; // "Recife", "São Paulo"
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
        nome: string;
      }
    }
  }
}

// Resposta da API ViaCEP
export interface ViaCepResponse {
  cep: string;         // "01310-100"
  logradouro: string;  // "Avenida Paulista"
  complemento: string; // "lado ímpar"
  bairro: string;      // "Bela Vista"
  localidade: string;  // "São Paulo"
  uf: string;          // "SP"
  ibge: string;        // "3550308"
  gia: string;         // "1004"
  ddd: string;         // "11"
  siafi: string;       // "7107"
  erro?: boolean;      // true se CEP inválido
}

// View/Tela ativa dentro da aba Consultórios
export type ConsultoriosView = 'list' | 'form' | 'edit';


