import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_CATEGORIES, COLOR_OPTIONS } from '../constants/categories';
import api from '../services/api';

const assignColor = (index) => COLOR_OPTIONS[index % COLOR_OPTIONS.length];

const CategoriesContext = createContext(null);

export const CategoriesProvider = ({ children }) => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/budgets/categories');
      if (res.data.success) {
        setCategories(res.data.data.map((c, i) => ({ ...c, color: assignColor(i) })));
      }
    } catch (e) {
      if (e.response?.status === 404) {
        setCategories([]);
      }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCategory = async (cat) => {
    try {
      const res = await api.post('/budgets/', {
        libelle: cat.libelle,
        plafond: cat.plafond || undefined,
      });
      if (res.data.success) {
        setCategories(prev => {
          const color = assignColor(prev.length);
          return [...prev, { ...res.data.data, color }];
        });
      }
    } catch (_) {
      setCategories(prev => {
        const color = assignColor(prev.length);
        return [...prev, { ...cat, id: `local_${Date.now()}`, color }];
      });
    }
  };

  const updateCategory = async (id, updates) => {
    try {
      await api.put(`/budgets/${id}`, updates);
    } catch (_) {}
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCategory = async (id) => {
    try {
      await api.delete(`/budgets/${id}`);
    } catch (_) {}
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  return (
    <CategoriesContext.Provider value={{ categories, addCategory, updateCategory, deleteCategory, reload: load }}>
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => useContext(CategoriesContext);
