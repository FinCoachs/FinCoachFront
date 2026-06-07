import { PermissionsAndroid, Platform } from 'react-native';

// ── Expéditeurs par opérateur ──────────────────────────────────────────────────
const OPERATORS = {
  mtn:     ['MTN', 'MoMo', 'MOMO', 'MTNMoMo', 'MTNMOMO', 'MTNMoney', 'MTN-MoMo'],
  moov:    ['Moov', 'MOOV', 'MoovMoney', 'MOOVMONEY', 'Flooz', 'FLOOZ', 'Moov Money'],
  celtiis: ['Celtiis', 'CELTIIS', 'CeltiisC', 'Glo', 'GLO', 'Celtiis Cash'],
};

const detectOperator = (address) => {
  const addr = (address || '').toUpperCase();
  for (const [op, senders] of Object.entries(OPERATORS)) {
    if (senders.some(s => addr.includes(s.toUpperCase()))) return op;
  }
  return null;
};

// ── Patterns communs (s'appliquent aux 3 opérateurs) ─────────────────────────

const CREDIT_PATTERNS = [
  /vous\s+avez\s+re[çc]u\s+(\d[\d\s]*)\s*(?:FCFA|XOF|F\.?CFA)/i,
  /(?:d[ée]p[ôo]t|crédité|crédit)\s+(?:de\s+)?(\d[\d\s]*)\s*(?:FCFA|XOF)/i,
  /(\d[\d\s]*)\s*(?:FCFA|XOF)\s+(?:re[çc]u|crédité|déposé)/i,
  /votre\s+compte\s+(?:\w+\s+)?a\s+(?:été\s+)?crédité\s+de\s+(\d[\d\s]*)/i,
  /received\s+(\d[\d\s]*)\s*(?:FCFA|XOF)/i,
  /credit\s+(?:of\s+)?(\d[\d\s]*)\s*(?:FCFA|XOF)/i,
];

const DEBIT_PATTERNS = [
  /(?:transfert|envoi|paiement|retrait)\s+de\s+(\d[\d\s]*)\s*(?:FCFA|XOF)/i,
  /vous\s+avez\s+(?:envoyé|transféré|payé|retiré)\s+(\d[\d\s]*)\s*(?:FCFA|XOF)/i,
  /(\d[\d\s]*)\s*(?:FCFA|XOF)\s+(?:envoyé|transféré|payé|retiré|débité)/i,
  /montant\s*:\s*(\d[\d\s]*)\s*(?:FCFA|XOF)/i,
  /sent\s+(\d[\d\s]*)\s*(?:FCFA|XOF)/i,
  /payment\s+(?:of\s+)?(\d[\d\s]*)\s*(?:FCFA|XOF)/i,
  /withdrawal\s+(?:of\s+)?(\d[\d\s]*)\s*(?:FCFA|XOF)/i,
];

// Solde après transaction
const BALANCE_RE = /(?:nouveau\s+)?solde\s*(?:(?:MoMo|Moov|Celtiis|Mobile Money)\s*)?(?:est|:)?\s*(\d[\d\s]*)\s*(?:FCFA|XOF|F\.?CFA)/i;

// Référence transaction
const REF_RE    = /(?:r[eé]f(?:[eé]rence)?|ref\.|ID|Trans(?:action)?\.?\s*ID)\s*[:\s]\s*([A-Z0-9\-]{5,20})/i;

// Contrepartie (expéditeur / destinataire)
const CPART_RE  = /(?:(?:de|from|à|a|vers|to|chez)\s+)(\+?[\d]{8,15}|[A-Z][a-zA-Zéèàùâêîôûäëïöü\s&]{2,30}?)(?=\s*[.,]|\s+(?:votre|nouveau|Fin|Ref|ID|Solde|Réf|\d)|$)/i;

// ── Utilitaires ───────────────────────────────────────────────────────────────

const parseAmount = (str) => {
  const n = parseInt((str || '').replace(/\s/g, ''), 10);
  return isNaN(n) ? 0 : n;
};

const tryPatterns = (body, patterns) => {
  for (const re of patterns) {
    const m = body.match(re);
    if (m) {
      const amount = parseAmount(m[1]);
      if (amount > 0) return amount;
    }
  }
  return null;
};

const extractCounterpart = (body) => {
  const m = body.match(CPART_RE);
  return m ? m[1].trim() : null;
};

// Nom affiché selon l'opérateur
const operatorLabel = { mtn: 'MTN MoMo', moov: 'Moov Money', celtiis: 'Celtiis Cash' };

// ── Parseur principal ─────────────────────────────────────────────────────────

export const parseMomoSms = (sms, operator) => {
  const body = (sms.body || '').replace(/\n/g, ' ');
  const op   = operator || detectOperator(sms.address);
  if (!op) return null;

  const label   = operatorLabel[op] || op.toUpperCase();
  const balance = (() => { const m = body.match(BALANCE_RE); return m ? parseAmount(m[1]) : null; })();
  const ref     = body.match(REF_RE)?.[1] ?? null;
  const cp      = extractCounterpart(body);

  // Essai crédit
  let amount = tryPatterns(body, CREDIT_PATTERNS);
  if (amount) {
    return {
      type: 'entrée', montant: amount,
      name: cp ? `${label} – ${cp}` : `${label} – Réception`,
      categorie: 'Autres', source: label,
      date: new Date(Number(sms.date)),
      smsRef: ref, balance, operator: op, rawSms: body,
    };
  }

  // Essai débit
  amount = tryPatterns(body, DEBIT_PATTERNS);
  if (amount) {
    const isRetrait  = /retrait|withdrawal/i.test(body);
    const isPaiement = /paiement|payment/i.test(body);
    return {
      type: 'dépense', montant: amount,
      name: cp
        ? `${label} – ${cp}`
        : isRetrait ? `${label} – Retrait` : isPaiement ? `${label} – Paiement` : `${label} – Transfert`,
      categorie: 'Autres', source: label,
      date: new Date(Number(sms.date)),
      smsRef: ref, balance, operator: op, rawSms: body,
    };
  }

  return null;
};

// ── Permission ────────────────────────────────────────────────────────────────

export const requestSmsPermission = async () => {
  if (Platform.OS !== 'android') return false;
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title:          'Accès aux SMS Mobile Money',
        message:        'FinCoach veut lire vos SMS pour importer automatiquement vos transactions MTN MoMo, Moov Money et Celtiis Cash.',
        buttonPositive: 'Autoriser',
        buttonNegative: 'Refuser',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch { return false; }
};

// ── Lecture et parsing des SMS des 3 opérateurs ───────────────────────────────

export const readMobileMoneyTransactions = () =>
  new Promise((resolve, reject) => {
    try {
      const SmsAndroid = require('react-native-get-sms-android').default;
      const allSenders = Object.values(OPERATORS).flat();

      SmsAndroid.list(
        JSON.stringify({ box: 'inbox', maxCount: 500, indexFrom: 0 }),
        (err) => reject(new Error(err)),
        (_count, smsList) => {
          const messages = JSON.parse(smsList);

          const momoMessages = messages.filter((m) =>
            allSenders.some((s) =>
              (m.address || '').toUpperCase().includes(s.toUpperCase()),
            ),
          );

          const parsed = momoMessages
            .map((m) => parseMomoSms(m, detectOperator(m.address)))
            .filter(Boolean)
            .sort((a, b) => b.date - a.date);

          resolve(parsed);
        },
      );
    } catch (e) {
      reject(e);
    }
  });

// ── Rétrocompatibilité (anciens imports) ──────────────────────────────────────
export const readMomoTransactions = readMobileMoneyTransactions;
