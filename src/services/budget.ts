import { apiClient } from '../api/apiClient';

export interface BudgetBab {
  id: number;
  bab_code: string;
  name_ps: string;
  name_fa: string;
  description?: string;
}

export interface BudgetFasl {
  id: number;
  bab_id: number;
  fasl_code: string;
  name_ps: string;
  name_fa: string;
  bab_code?: string;
  bab_name_ps?: string;
  description?: string;
}

export const budgetService = {
  getBabs: (): Promise<BudgetBab[]> => apiClient.get('/budget/babs'),
  getBabById: (id: number): Promise<BudgetBab> => apiClient.get(`/budget/babs/${id}`),
  getFaslsByBab: (babId: number): Promise<BudgetFasl[]> => apiClient.get(`/budget/babs/${babId}/fasls`),
  getAllFasls: (): Promise<BudgetFasl[]> => apiClient.get('/budget/fasls'),
  search: (q: string): Promise<{ babs: BudgetBab[]; fasls: BudgetFasl[] }> =>
    apiClient.get(`/budget/search?q=${encodeURIComponent(q)}`),
  import: (babs: Omit<BudgetBab, 'id'>[], fasls: any[]) =>
    apiClient.post('/budget/import', { babs, fasls }),
};
