import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const CARD_COLORS = [
  { bg: '#1A3A6E', textColor: '#FFFFFF' },
  { bg: '#FFC300', textColor: '#000000' },
  { bg: '#2E7D32', textColor: '#FFFFFF' },
  { bg: '#7B1FA2', textColor: '#FFFFFF' },
  { bg: '#C62828', textColor: '#FFFFFF' },
  { bg: '#00838F', textColor: '#FFFFFF' },
];

const detectTypeLabel = (libelle) => {
  const l = libelle.toLowerCase();
  if (/momo|mtn|moov|wave|flooz/.test(l)) return 'Mobile Money';
  if (/espèce|espece|cash|liquid/.test(l))  return 'Espèces';
  return 'Banque';
};

const normalizeAccount = (acc, index) => {
  const { bg, textColor } = CARD_COLORS[index % CARD_COLORS.length];
  const abbr = acc.libelle.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
  return {
    id:        acc.id,
    name:      acc.libelle,
    balance:   acc.solde ?? 0,
    numero:    acc.numero,
    typeLabel: detectTypeLabel(acc.libelle),
    abbr,
    bg,
    textColor,
  };
};


const AccountContext = createContext(null);

export const AccountProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/comptes/');
      if (res.data.success) {
        setAccounts(res.data.data.map((a, i) => normalizeAccount(a, i)));
      }
    } catch (_) {
      // non authentifié ou réseau — liste vide
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addAccount = async ({ libelle, numero, solde_initial = 0 }) => {
    const res = await api.post('/comptes/', { libelle, numero, solde_initial });
    if (res.data.success) {
      const newAccount = normalizeAccount(res.data.data, accounts.length);
      setAccounts(prev => [...prev, normalizeAccount(res.data.data, prev.length)]);
      return newAccount;
    }
    return null;
  };

  const deleteAccount = async (id) => {
    await api.delete(`/comptes/${id}`);
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <AccountContext.Provider value={{ accounts, addAccount, deleteAccount, loading, totalBalance, reload: load }}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccounts = () => useContext(AccountContext);
