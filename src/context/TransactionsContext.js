import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Convertit une transaction API en format interne utilisé par les écrans
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
      const res = await api.get('/transactions/', { params: { limit: 15 } });
      if (res.data.success) {
        setTransactions(res.data.data.map(normalizeFromApi));
      }
    } catch (_) {
      // non authentifié ou réseau — liste vide
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Ajoute une transaction localement (sera remplacé par appel API dans une prochaine itération)
  const addTransaction = (tx) => {
    setTransactions(prev => [{ ...tx, id: Date.now() }, ...prev]);
  };

  // Importe un lot de transactions SMS — déduplique par smsRef — extrait les soldes opérateurs
  const importSmsTransactions = (list) => {
    const newRefs = new Set(importedRefs);
    const toAdd   = [];

    list.forEach((tx, i) => {
      const ref = tx.smsRef ?? `sms_${tx.date?.getTime?.() ?? i}_${i}`;
      if (!newRefs.has(ref)) {
        newRefs.add(ref);
        toAdd.push({ ...tx, id: Date.now() + i, smsRef: ref });
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
      importSmsTransactions,
      isRefImported,
      operatorBalances,
      reload: load,
    }}>
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => useContext(TransactionsContext);
