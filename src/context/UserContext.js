import { createContext, useContext, useState } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({ fullName: '', email: '' });

  const updateUser = (fields) =>
    setUser((prev) => ({ ...prev, ...fields }));

  // Prénom = premier mot du nom complet
  const firstName = user.fullName.trim().split(' ')[0] || '';

  // Initiale pour l'avatar
  const initial = firstName.charAt(0).toUpperCase() || '?';

  return (
    <UserContext.Provider value={{ user, updateUser, firstName, initial }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
