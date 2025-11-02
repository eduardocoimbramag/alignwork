import axios from 'axios';
import type { Estado, Cidade } from '@/types/consultorio';

/**
 * Cliente Axios para API IBGE Localidades
 * 
 * API pública do IBGE para consulta de estados e municípios brasileiros.
 * Documentação: https://servicodados.ibge.gov.br/api/docs/localidades
 */

const ibgeClient = axios.create({
  baseURL: 'https://servicodados.ibge.gov.br/api/v1/localidades',
  timeout: 10000,
});

/**
 * Busca todos os estados brasileiros ordenados por nome
 * 
 * @returns Array de estados
 * 
 * @example
 * const estados = await buscarEstados();
 * console.log(estados[0].nome); // "Acre"
 */
export async function buscarEstados(): Promise<Estado[]> {
  try {
    const response = await ibgeClient.get<Estado[]>('/estados', {
      params: {
        orderBy: 'nome'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar estados:', error);
    throw new Error('Erro ao carregar lista de estados');
  }
}

/**
 * Busca municípios de um estado específico
 * 
 * @param uf - Sigla do estado (ex: "PE", "SP")
 * @returns Array de cidades do estado
 * 
 * @example
 * const cidades = await buscarCidadesPorEstado('PE');
 * console.log(cidades[0].nome); // "Abreu e Lima"
 */
export async function buscarCidadesPorEstado(uf: string): Promise<Cidade[]> {
  if (!uf || uf.length !== 2) {
    throw new Error('UF inválida');
  }

  try {
    const response = await ibgeClient.get<Cidade[]>(`/estados/${uf}/municipios`, {
      params: {
        orderBy: 'nome'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar cidades do estado ${uf}:`, error);
    throw new Error('Erro ao carregar lista de cidades');
  }
}

export default ibgeClient;


