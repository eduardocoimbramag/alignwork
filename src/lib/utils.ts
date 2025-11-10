import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata CPF para exibição (adiciona máscara)
 * @param cpf - CPF sem máscara (somente dígitos)
 * @returns CPF formatado (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string | undefined | null): string {
  if (!cpf) return '';
  // Remove caracteres não numéricos (caso já tenha máscara)
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf; // Retorna original se não tiver 11 dígitos
  // Aplica máscara
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
