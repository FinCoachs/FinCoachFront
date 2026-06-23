import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const normalizeFromApi = (tx) => ({
  id:           tx.id,
  name:         tx.description || '',
  montant:      tx.montant,
  type:         tx.type === 'depense' ? 'dépense' : 'entrée',
  categorie:    tx.categorie?.libelle ?? '',
  categorie_id: tx.categorie?.id     ?? null,
  source:       tx.compte?.libelle   ?? '',
  compte_id:    tx.compte?.id        ?? null,
  date:         new Date(tx.date),
});

const TransactionsContext = createContext(null);

export const TransactionsProvider = ({ children }) => {
  const [transactions,     setTransactions]     = useState([]);
  const [importedRefs,     setImportedRefs]     = useState(new Set());
  const [operatorBalances, setOperatorBalances] = useState({ mtn: null, moov: null, celtiis: null });

  const load = useCallback(async () => {
    try {
      const res = await api.get('/transactions/', { params: { limit: 50 } });
      if (res.data.success) {
        setTransactions(res.data.data.map(normalizeFromApi));
      }
    } catch (_) {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const addTransaction = async ({ montant, date, description, type, categorie_id, compte_id }) => {
    const res = await api.post('/transactions/', {
      montant,
      date: date instanceof Date ? date.toISOString() : date,
      description: description || null,
      type,
      categorie_id,
      compte_id,
    });
    if (res.data.success) {
      setTransactions(prev => [normalizeFromApi(res.data.data), ...prev]);
    }
    return res.data;
  };

  const deleteTransaction = async (id) => {
    await api.delete(`/transactions/${id}`);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Marque une référence SMS comme importée (utilisé après sauvegarde backend)
  const markSmsRefImported = (ref) => {
    if (!ref) return;
    setImportedRefs(prev => new Set([...prev, ref]));
  };

  // Import SMS local (fallback sans backend)
  const importSmsTransactions = (list) => {
    const newRefs = new Set(importedRefs);
    const toAdd   = [];

    list.forEach((tx, i) => {
      const ref = tx.smsRef ?? `sms_${tx.date?.getTime?.() ?? i}_${i}`;
      if (!newRefs.has(ref)) {
        newRefs.add(ref);
        toAdd.push({ ...tx, id: `sms_${Date.now()}_${i}`, smsRef: ref });
      }
    });

    if (toAdd.length > 0) {
      setImportedRefs(newRefs);
      setTransactions(prev =>
        [...toAdd, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)),
      );

      const latestByOp = {};
      toAdd.forEach((tx) => {
        if (tx.balance != null && tx.operator) {
          const existing = latestByOp[tx.operator];
          if (!existing || new Date(tx.date) > new Date(existing.date)) {
            latestByOp[tx.operator] = tx;
          }
        }
      });

      if (Object.keys(latestByOp).length > 0) {
        setOperatorBalances(prev => {
          const next = { ...prev };
          Object.entries(latestByOp).forEach(([op, tx]) => { next[op] = tx.balance; });
          return next;
        });
      }
    }

    return toAdd.length;
  };

  const isRefImported = (ref) => importedRefs.has(ref);

  return (
    <TransactionsContext.Provider value={{
      transactions,
      addTransaction,
      deleteTransaction,
      importSmsTransactions,
      markSmsRefImported,
      isRefImported,
      operatorBalances,
      reload: load,
    }}>
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => useContext(TransactionsContext);
