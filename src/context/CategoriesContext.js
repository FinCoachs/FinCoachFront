import { createContext, useContext, useState } from 'react';
import { DEFAULT_CATEGORIES } from '../constants/categories';

const CategoriesContext = createContext(null);

export const CategoriesProvider = ({ children }) => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const addCategory = (cat) => {
    setCategories((prev) => [{ ...cat, id: Date.now() }, ...prev]);
  };

  const updateCategory = (id, updates) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
    );
  };

  const deleteCategory = (id) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
  };

  return (
    <CategoriesContext.Provider value={{ categories, addCategory, updateCategory, deleteCategory }}>
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => useContext(CategoriesContext);
