import { createContext, useContext, useState } from 'react';

// ── Données initiales ─────────────────────────

const TODAY     = new Date();
const YESTERDAY = new Date(TODAY);
YESTERDAY.setDate(TODAY.getDate() - 1);

const INITIAL_TRANSACTIONS = [
  { id: 1, name: 'Erevan Supermarché', montant: 12500, type: 'dépense',  categorie: 'Alimentation', source: 'MTN MoMo', date: TODAY     },
  { id: 2, name: 'Yango Ride',          montant: 6000,  type: 'dépense',  categorie: 'Transport',    source: 'BOA',      date: TODAY     },
  { id: 3, name: 'Salaire Mensuel',     montant: 450000, type: 'entrée',  categorie: 'Salaire',      source: 'BOA',      date: YESTERDAY },
  { id: 4, name: "L'Avenue Restaurant", montant: 25000,  type: 'dépense', categorie: 'Loisirs',      source: 'MTN MoMo', date: YESTERDAY },
];

// ── Context ───────────────────────────────────

const TransactionsContext = createContext(null);

export const TransactionsProvider = ({ children }) => {
  const [transactions,    setTransactions]    = useState(INITIAL_TRANSACTIONS);
  const [importedRefs,    setImportedRefs]    = useState(new Set());
  // Dernier solde connu par opérateur, mis à jour lors de l'import SMS
  const [operatorBalances, setOperatorBalances] = useState({ mtn: null, moov: null, celtiis: null });

  const addTransaction = (tx) => {
    setTransactions((prev) => [{ ...tx, id: Date.now() }, ...prev]);
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
      setTransactions((prev) =>
        [...toAdd, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)),
      );

      // Mettre à jour les soldes opérateurs avec le SMS le plus récent par opérateur
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
        setOperatorBalances((prev) => {
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
    }}>
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => useContext(TransactionsContext);
