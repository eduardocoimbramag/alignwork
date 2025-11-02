import axios from 'axios';
import type { ViaCepResponse } from '@/types/consultorio';

/**
 * Cliente Axios para API ViaCEP
 * 
 * API pública e gratuita para consulta de CEPs brasileiros.
 * Documentação: https://viacep.com.br/
 */

const viaCepClient = axios.create({
  baseURL: 'https://viacep.com.br/ws',
  timeout: 10000,
});

/**
 * Busca endereço completo por CEP
 * 
 * @param cep - CEP formatado (00000-000) ou apenas números (00000000)
 * @returns Dados do endereço ou lança erro se CEP inválido
 * 
 * @example
 * const endereco = await buscarEnderecoPorCep('01310-100');
 * console.log(endereco.logradouro); // "Avenida Paulista"
 */
export async function buscarEnderecoPorCep(cep: string): Promise<ViaCepResponse> {
  // Remove caracteres não numéricos
  const cepLimpo = cep.replace(/\D/g, '');
  
  // Valida formato (8 dígitos)
  if (cepLimpo.length !== 8) {
    throw new Error('CEP deve conter 8 dígitos');
  }

  try {
    const response = await viaCepClient.get<ViaCepResponse>(`/${cepLimpo}/json/`);
    
    // ViaCEP retorna {erro: true} para CEPs não encontrados
    if (response.data.erro) {
      throw new Error('CEP não encontrado');
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        throw new Error('CEP inválido');
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout ao consultar CEP');
      }
      if (!error.response) {
        throw new Error('Erro de conexão com o serviço de CEP');
      }
    }
    throw error;
  }
}

export default viaCepClient;


