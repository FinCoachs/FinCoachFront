import { createContext, useContext, useState } from 'react';
import { DARK_COLORS, LIGHT_COLORS } from '../constants/theme';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{
      isDark,
      toggleTheme,
      colors: isDark ? DARK_COLORS : LIGHT_COLORS,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
