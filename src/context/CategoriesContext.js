import { createContext, useContext, useState } from 'react';
import { DEFAULT_CATEGORIES } from '../constants/categories';

const CategoriesContext = createContext(null);

export const CategoriesProvider = ({ children }) => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const addCategory = (cat) => {
    setCategories((prev) => [...prev, { ...cat, id: Date.now() }]);
  };

  const updateCategory = (id, updates) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  };

  return (
    <CategoriesContext.Provider value={{ categories, addCategory, updateCategory }}>
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => useContext(CategoriesContext);
