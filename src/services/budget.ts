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

// ── Fallback seed data (matches backend seed) ───────────────────────────────
const SEED_BABS: BudgetBab[] = [
  { id: 1, bab_code: '21', name_ps: 'معاشات او مزدونه',     name_fa: 'معاشات و مزدها' },
  { id: 2, bab_code: '22', name_ps: 'اجناس او خدمات',       name_fa: 'کالاها و خدمات' },
  { id: 3, bab_code: '23', name_ps: 'پانګه اچونه',           name_fa: 'سرمایه‌گذاری' },
  { id: 4, bab_code: '24', name_ps: 'د پروژو مصارف',        name_fa: 'مصارف پروژه‌ها' },
  { id: 5, bab_code: '25', name_ps: 'نور مصارف',             name_fa: 'سایر مصارف' },
];

const SEED_FASLS: BudgetFasl[] = [
  { id: 1,  bab_id: 1, fasl_code: '2101', name_ps: 'اساسي معاشات',           name_fa: 'معاشات اساسی' },
  { id: 2,  bab_id: 1, fasl_code: '2102', name_ps: 'اضافه معاشات',            name_fa: 'حق‌الزحمه اضافی' },
  { id: 3,  bab_id: 2, fasl_code: '2201', name_ps: 'قرطاسیه او دفتري مواد',  name_fa: 'قرطاسیه و لوازم دفتری' },
  { id: 4,  bab_id: 2, fasl_code: '2202', name_ps: 'کمپیوټري مواد',           name_fa: 'لوازم کامپیوتری' },
  { id: 5,  bab_id: 2, fasl_code: '2203', name_ps: 'د چاپ او خپرونې مصارف',  name_fa: 'مصارف چاپ و نشر' },
  { id: 6,  bab_id: 2, fasl_code: '2204', name_ps: 'مخابراتي مصارف',          name_fa: 'مصارف مخابراتی' },
  { id: 7,  bab_id: 2, fasl_code: '2205', name_ps: 'د لارې مصارف',            name_fa: 'مصارف ترانسپورتی' },
  { id: 8,  bab_id: 2, fasl_code: '2206', name_ps: 'برق او اوبه',             name_fa: 'برق و آب' },
  { id: 9,  bab_id: 2, fasl_code: '2207', name_ps: 'د پاکولو مواد',           name_fa: 'مواد نظافتی' },
  { id: 10, bab_id: 2, fasl_code: '2208', name_ps: 'د ماشین الاتو ساتنه',     name_fa: 'نگهداری ماشین‌آلات' },
  { id: 11, bab_id: 2, fasl_code: '2209', name_ps: 'د دفتر کرایه',            name_fa: 'اجاره دفتر' },
  { id: 12, bab_id: 2, fasl_code: '2210', name_ps: 'نور اجناس او خدمات',      name_fa: 'سایر کالاها و خدمات' },
  { id: 13, bab_id: 3, fasl_code: '2301', name_ps: 'فرنیچر او وسایل',         name_fa: 'مبلمان و لوازم' },
  { id: 14, bab_id: 3, fasl_code: '2302', name_ps: 'کمپیوټر او تجهیزات',      name_fa: 'کامپیوتر و تجهیزات' },
  { id: 15, bab_id: 3, fasl_code: '2303', name_ps: 'موټر او وسیله',            name_fa: 'وسایط نقلیه' },
  { id: 16, bab_id: 3, fasl_code: '2304', name_ps: 'د ودانیو جوړول',           name_fa: 'ساخت و ساز' },
  { id: 17, bab_id: 4, fasl_code: '2401', name_ps: 'د پراختیا پروژه',         name_fa: 'پروژه توسعه‌ای' },
  { id: 18, bab_id: 5, fasl_code: '2501', name_ps: 'نور مصارف',               name_fa: 'سایر مصارف' },
];

// ── Budget service with backend + localStorage fallback ──────────────────────
export const budgetService = {
  getBabs: async (): Promise<BudgetBab[]> => {
    try {
      const data: BudgetBab[] = await apiClient.get('/budget/babs');
      // If backend returns empty, use seed data
      if (Array.isArray(data) && data.length > 0) return data;
      return SEED_BABS;
    } catch {
      return SEED_BABS;
    }
  },

  getBabById: async (id: number): Promise<BudgetBab> => {
    try {
      return await apiClient.get(`/budget/babs/${id}`);
    } catch {
      return SEED_BABS.find(b => b.id === id) || SEED_BABS[0];
    }
  },

  getFaslsByBab: async (babId: number): Promise<BudgetFasl[]> => {
    try {
      // Backend uses real DB ids; seed fallback uses sequential ids 1-5 for babs
      const data: BudgetFasl[] = await apiClient.get(`/budget/babs/${babId}/fasls`);
      if (Array.isArray(data) && data.length > 0) return data;
      // Fallback: match by seed bab_id (1-5 in order), or by bab_code
      return SEED_FASLS.filter(f => f.bab_id === babId);
    } catch {
      return SEED_FASLS.filter(f => f.bab_id === babId);
    }
  },

  getAllFasls: async (): Promise<BudgetFasl[]> => {
    try {
      const data: BudgetFasl[] = await apiClient.get('/budget/fasls');
      if (Array.isArray(data) && data.length > 0) return data;
      return SEED_FASLS;
    } catch {
      return SEED_FASLS;
    }
  },

  search: async (q: string): Promise<{ babs: BudgetBab[]; fasls: BudgetFasl[] }> => {
    try {
      return await apiClient.get(`/budget/search?q=${encodeURIComponent(q)}`);
    } catch {
      const ql = q.toLowerCase();
      return {
        babs: SEED_BABS.filter(b => b.bab_code.includes(q) || b.name_ps.includes(q) || b.name_fa.includes(q)),
        fasls: SEED_FASLS.filter(f => f.fasl_code.includes(q) || f.name_ps.includes(ql) || f.name_fa.includes(ql)),
      };
    }
  },

  import: (babs: Omit<BudgetBab, 'id'>[], fasls: any[]) =>
    apiClient.post('/budget/import', { babs, fasls }),

  createBab: async (data: { bab_code: string; name_ps: string; name_fa: string; description?: string }): Promise<BudgetBab> => {
    return await apiClient.post('/budget/babs', data);
  },

  createFasl: async (data: { bab_id: number; fasl_code: string; name_ps: string; name_fa: string; description?: string }): Promise<BudgetFasl> => {
    return await apiClient.post('/budget/fasls', data);
  },

  updateBab: async (id: number, data: { bab_code?: string; name_ps?: string; name_fa?: string; description?: string }): Promise<BudgetBab> => {
    return await apiClient.put(`/budget/babs/${id}`, data);
  },

  updateFasl: async (id: number, data: { fasl_code?: string; name_ps?: string; name_fa?: string; description?: string }): Promise<BudgetFasl> => {
    return await apiClient.put(`/budget/fasls/${id}`, data);
  },

  deleteBab: async (id: number): Promise<void> => {
    await apiClient.delete(`/budget/babs/${id}`);
  },

  deleteFasl: async (id: number): Promise<void> => {
    await apiClient.delete(`/budget/fasls/${id}`);
  },
};
