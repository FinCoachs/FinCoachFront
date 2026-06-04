import { createContext, useContext, useState } from 'react';

// ── Données initiales ─────────────────────────

const TODAY     = new Date();
const YESTERDAY = new Date(TODAY);
YESTERDAY.setDate(TODAY.getDate() - 1);

const INITIAL_TRANSACTIONS = [
  { id: 1, name: 'Erevan Supermarché', montant: 12500, type: 'dépense',  categorie: 'Alimentation', source: 'MoMo', date: TODAY     },
  { id: 2, name: 'Yango Ride',          montant: 6000,  type: 'dépense',  categorie: 'Transport',    source: 'BOA', date: TODAY     },
  { id: 3, name: 'Salaire Mensuel',     montant: 450000, type: 'entrée',  categorie: 'Salaire',      source: 'BOA', date: YESTERDAY },
  { id: 4, name: "L'Avenue Restaurant", montant: 25000,  type: 'dépense', categorie: 'Loisirs',      source: 'MoMo', date: YESTERDAY},
];

// ── Context ───────────────────────────────────

const TransactionsContext = createContext(null);

export const TransactionsProvider = ({ children }) => {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);

  const addTransaction = (tx) => {
    setTransactions((prev) => [{ ...tx, id: Date.now() }, ...prev]);
  };

  return (
    <TransactionsContext.Provider value={{ transactions, addTransaction }}>
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => useContext(TransactionsContext);
