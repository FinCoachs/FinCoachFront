import { PermissionsAndroid, Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// EXPÉDITEURS PAR OPÉRATEUR  (correspondance sur m.address)
// ─────────────────────────────────────────────────────────────────────────────

const OPERATORS = {
  // ── Mobile Money ────────────────────────────────────────────────────────────
  mtn: [
    'MTN', 'MoMo', 'MOMO', 'MTNMoMo', 'MTNMOMO', 'MTNMoney', 'MTN-MoMo',
  ],
  moov: [
    'Moov', 'MOOV', 'MoovMoney', 'MOOVMONEY', 'Flooz', 'FLOOZ', 'Moov Money',
  ],
  celtiis: [
    'Celtiis', 'CELTIIS', 'CeltiisC', 'Celtiis Cash', 'Glo', 'GLO',
  ],

  // ── Banques présentes au Bénin ───────────────────────────────────────────────
  // ECOBANK Bénin
  ecobank: ['ECOBANK', 'Ecobank', 'ECOBNK'],
  // BOA (Bank of Africa)
  boa: ['BOA', 'BOABENIN', 'BOA-BENIN', 'BOADSL', 'BOABN'],
  // UBA (United Bank for Africa) — SMS en anglais
  uba: ['UBA', 'UBABenin', 'UBA-BENIN', 'UBABN'],
  // NSIA Banque
  nsia: ['NSIA', 'NSIABANQUE', 'NSIA-BNQ'],
  // Orabank Bénin
  orabank: ['ORABANK', 'Orabank', 'ORBNK'],
  // Atlantic Bank Bénin (ABB)
  atlantic: ['ATLANTIC', 'ABB', 'ATLBANK', 'ATL-BANK', 'ATL BANK'],
  // BSIC (Banque Sahélo-Saharienne pour l'Investissement et le Commerce)
  bsic: ['BSIC', 'BSICBenin', 'BSIC-BJ'],
  // Coris Bank International
  coris: ['CORIS', 'CorisBank', 'CORISBANK', 'CORIS-BK'],
  // GTBank / Guaranty Trust Bank
  gtbank: ['GTBANK', 'GTBank', 'GTB', 'GT-BANK'],
  // Access Bank (anciennement Diamond Bank)
  access: ['ACCESS', 'AccessBank', 'ACCESSBNK', 'DIAMOND', 'DIAMONDBNK'],
  // BHBF (Banque de l'Habitat du Bénin)
  bhbf: ['BHBF', 'BHBFBenin'],
  // BRS (Banque Régionale de Solidarité)
  brs: ['BRS', 'BRSBenin'],
  // BGD (Banque de Gestion et de Développement)
  bgd: ['BGD', 'BGDBenin'],
  // CBI (Continental Business International Bank)
  cbi: ['CBI', 'CBIBenin'],
  // Banque Atlantique (Groupe NSIA / Atlantique)
  batl: ['BATL', 'BANQUEATLANTIQUE', 'BAtlantique'],
};

// Ensemble des opérateurs bancaires (pour router vers les bons patterns)
const BANK_OPS = new Set([
  'ecobank', 'boa', 'uba', 'nsia', 'orabank', 'atlantic',
  'bsic', 'coris', 'gtbank', 'access', 'bhbf', 'brs', 'bgd', 'cbi', 'batl',
]);

const detectOperator = (address) => {
  const addr = (address || '').toUpperCase();
  for (const [op, senders] of Object.entries(OPERATORS)) {
    if (senders.some(s => addr.includes(s.toUpperCase()))) return op;
  }
  return null;
};

// Label affiché dans l'application
const OPERATOR_LABEL = {
  mtn:      'MTN MoMo',
  moov:     'Moov Money',
  celtiis:  'Celtiis Cash',
  ecobank:  'Ecobank',
  boa:      'BOA Bénin',
  uba:      'UBA',
  nsia:     'NSIA Banque',
  orabank:  'Orabank',
  atlantic: 'Atlantic Bank',
  bsic:     'BSIC',
  coris:    'Coris Bank',
  gtbank:   'GTBank',
  access:   'Access Bank',
  bhbf:     'BHBF',
  brs:      'BRS',
  bgd:      'BGD',
  cbi:      'CBI',
  batl:     'Banque Atlantique',
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRE MONTANT
// Les banques béninoises utilisent : 5 000 / 5,000 / 5000 / 5 000,00
// ─────────────────────────────────────────────────────────────────────────────

const parseAmount = (str) => {
  if (!str) return 0;
  // Supprimer espaces et virgules (séparateurs de milliers), garder chiffres
  const cleaned = str.replace(/[\s,]/g, '');
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? 0 : n;
};

// Groupe currency commun au Bénin :
//   FCFA | F CFA | F.CFA | XOF | CFA (seul, en fin de token)
// Capturé SANS le montant (le montant est capturé dans le groupe précédent)
const CFA = '(?:F(?:\\.?|\\s+)CFA|FCFA|XOF|CFA(?!\\w))';

// Montant en FCFA : chiffres séparés par espaces ou virgules
const AMT = '([\\d][\\d\\s,]*)';

// Helper : construire une RegExp depuis un gabarit string
const re = (tpl, flags = 'i') => new RegExp(tpl.replace(/AMT/g, AMT).replace(/CFA/g, CFA), flags);

const tryPatterns = (body, patterns) => {
  for (const pattern of patterns) {
    const m = body.match(pattern);
    if (m) {
      const amount = parseAmount(m[1]);
      if (amount > 0) return amount;
    }
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// PATTERNS MOBILE MONEY  (MTN / Moov / Celtiis)
// ─────────────────────────────────────────────────────────────────────────────

const MOMO_CREDIT_PATTERNS = [
  re('vous\\s+avez\\s+re[çc]u\\s+AMT\\s*CFA'),
  re('(?:d[ée]p[ôo]t|cr[ée]dit[ée]?|cr[ée]dit)\\s+(?:de\\s+)?AMT\\s*CFA'),
  re('AMT\\s*CFA\\s+(?:re[çc]u|cr[ée]dit[ée]?|d[ée]pos[ée])'),
  re('votre\\s+compte\\s+(?:\\S+\\s+)?a\\s+(?:[ée]t[ée]\\s+)?cr[ée]dit[ée]?\\s+de\\s+AMT'),
  re('received\\s+AMT\\s*CFA'),
  re('credit\\s+(?:of\\s+)?AMT\\s*CFA'),
  re('dépôt\\s+effectué\\s+AMT\\s*CFA'),
];

const MOMO_DEBIT_PATTERNS = [
  re('(?:transfert|envoi|paiement|retrait)\\s+de\\s+AMT\\s*CFA'),
  re('vous\\s+avez\\s+(?:envoy[ée]|transf[ée]r[ée]|pay[ée]|retir[ée])\\s+AMT\\s*CFA'),
  re('AMT\\s*CFA\\s+(?:envoy[ée]|transf[ée]r[ée]|pay[ée]|retir[ée]|d[ée]bit[ée])'),
  re('montant\\s*:\\s*AMT\\s*CFA'),
  re('sent\\s+AMT\\s*CFA'),
  re('payment\\s+(?:of\\s+)?AMT\\s*CFA'),
  re('withdrawal\\s+(?:of\\s+)?AMT\\s*CFA'),
  re('frais\\s+de\\s+transaction\\s*:\\s*AMT\\s*CFA'),
];

// ─────────────────────────────────────────────────────────────────────────────
// PATTERNS BANCAIRES  (toutes banques Bénin)
// Formats observés : Alerte Ecobank / BOA Bénin / UBA Alert / NSIA Banque…
// ─────────────────────────────────────────────────────────────────────────────

const BANK_CREDIT_PATTERNS = [
  // "Votre compte XXXXXXXX a été crédité de 25 000 F CFA"
  re('votre\\s+compte\\s+[\\w*]+\\s+(?:a\\s+[ée]t[ée]\\s+|est\\s+)?cr[ée]dit[ée]?\\s+(?:de\\s+)?AMT\\s*CFA'),
  // "crédité de 25 000 FCFA" (sans "votre compte")
  re('cr[ée]dit[ée]?\\s+(?:de\\s+)?AMT\\s*CFA'),
  // "Crédit de 25 000 FCFA" (substantif)
  re('cr[ée]dit\\s+(?:de\\s+)?AMT\\s*CFA'),
  // "Virement reçu / entrant : 25 000 FCFA"
  re('virement\\s+(?:re[çc]u|entrant|de|crédit)[^\\d]*AMT\\s*CFA'),
  // "25 000 F CFA crédité / reçu / versé sur"
  re('AMT\\s*CFA\\s+(?:cr[ée]dit[ée]?|re[çc]u|vers[ée])'),
  // "Montant crédité : 25 000"
  re('montant\\s+cr[ée]dit[ée]?\\s*[:\\-]?\\s*AMT\\s*CFA'),
  // Alerte préfixée : "Alerte … crédité de 25 000"
  re('alert[e]?.*?cr[ée]dit[ée]?\\s+(?:de\\s+)?AMT\\s*CFA'),
  // UBA (anglais) : "credited with 20,000 XOF" / "credit of 20,000"
  re('credited\\s+with\\s+AMT\\s*CFA'),
  re('credit\\s+(?:of\\s+)?AMT\\s*CFA'),
  // "received / incoming AMT XOF"
  re('(?:received|incoming)\\s+AMT\\s*CFA'),
  // Salaire / remboursement / subvention
  re('(?:salaire|remboursement|subvention)\\s+(?:de\\s+)?AMT\\s*CFA'),
];

const BANK_DEBIT_PATTERNS = [
  // "Votre compte XXXXXXXX a été débité de 5 000 F CFA"
  re('votre\\s+compte\\s+[\\w*]+\\s+(?:a\\s+[ée]t[ée]\\s+|est\\s+)?d[ée]bit[ée]?\\s+(?:de\\s+)?AMT\\s*CFA'),
  // "débité de 5 000 FCFA" (sans "votre compte")
  re('d[ée]bit[ée]?\\s+(?:de\\s+)?AMT\\s*CFA'),
  // "Débit de 5 000 FCFA" (substantif)
  re('d[ée]bit\\s+(?:de\\s+)?AMT\\s*CFA'),
  // "5 000 F CFA débité / prélevé / retiré"
  re('AMT\\s*CFA\\s+(?:d[ée]bit[ée]?|pr[ée]lev[ée]?|retir[ée])'),
  // "Retrait GAB / ATM / DAB de 5 000 FCFA"
  re('retrait\\s+(?:(?:GAB|ATM|DAB|espèces?)\\s+)?(?:de\\s+)?AMT\\s*CFA'),
  // "Achat / Paiement (par carte / CB ****1234) de 5 000 FCFA"
  re('(?:achat|paiement)\\b.{0,35}?AMT\\s*CFA'),
  // "Montant débité : 5 000"
  re('montant\\s+d[ée]bit[ée]?\\s*[:\\-]?\\s*AMT\\s*CFA'),
  // Alerte préfixée : "Alerte … débité de 5 000"
  re('alert[e]?.*?d[ée]bit[ée]?\\s+(?:de\\s+)?AMT\\s*CFA'),
  // UBA (anglais) : "debited with 5,000 XOF" / "debit of 5,000"
  re('debited\\s+with\\s+AMT\\s*CFA'),
  re('debit\\s+(?:of\\s+)?AMT\\s*CFA'),
  // "withdrawal of 5,000"
  re('withdrawal\\s+(?:of\\s+)?AMT\\s*CFA'),
  // "Frais de transaction : 250 FCFA" / "Commission : 500 FCFA"
  re('(?:frais|commission|p[eé]nalit[eé]).{0,25}?AMT\\s*CFA'),
];

// ─────────────────────────────────────────────────────────────────────────────
// PATTERNS COMMUNS
// ─────────────────────────────────────────────────────────────────────────────

// Solde / balance (MoMo + banques)
const BALANCE_RE = re(
  '(?:nouveau\\s+)?solde\\s*' +
  '(?:(?:MoMo|Moov|Celtiis|Mobile Money|disponible|actuel|courant|apr[eè]s\\s+op[ée]ration)\\s*)?' +
  '[:\\-]?\\s*AMT\\s*CFA'
);

// Référence transaction
const REF_RE = /(?:r[eé]f(?:[eé]rence)?\.?|ref\.|ID|Trans(?:action)?\.?\s*ID|R[ée]f\.?\s*No\.?)\s*[:\s]\s*([A-Z0-9\-]{4,25})/i;

// Contrepartie (qui a envoyé / reçu)
// Lookbehind évite de matcher le "a" final de FCFA
const CPART_RE = /(?<![a-zA-Z])(?:de|from|[àa]|vers|to|chez|au|par)\s+(\+?[\d]{8,15}|[A-ZÀÂÉÈÊÎÔÙÛÇ][a-zA-ZÀ-ÿ\s&'.\-]{2,35}?)(?=\s*[.,]|\s+(?:votre|nouveau|solde|fin|ref|réf|via|le\s+\d|\d{2}[\/\-])|$)/i;

// Motif de l'opération (banques) : "Motif: RETRAIT GAB" / "Objet: SALAIRE"
const MOTIF_RE = /(?:motif|objet|nature|libell[ée])\s*[:\-]\s*([A-ZÀÂÉÈÊÎÔÙÛÇ][A-ZÀ-ÿa-z\s\-\/]{2,50}?)(?=\.|,|$|\s+(?:[Nn]ouveau|[Ss]olde|[Rr][ée]f|N°|\d))/i;

// Numéro de carte masqué : ****1234 ou **34 ou 1234 (dans contexte carte)
const CARD_NUM_RE = /\*{2,4}(\d{4})\b/;

// Numéro de compte partiel (banques)
const ACCOUNT_NUM_RE = /(?:compte|a\/c|account)\s*[Nn]?[°o.]?\s*([X\d*]{4,20})/i;

// ─────────────────────────────────────────────────────────────────────────────
// SOUS-TYPE : qualifier plus précisément l'opération
// ─────────────────────────────────────────────────────────────────────────────

const detectBankSubtype = (body, motif) => {
  const txt = `${body} ${motif || ''}`.toUpperCase();
  if (/RETRAIT|GAB|ATM|DAB|WITHDRAWAL|ESPECE/.test(txt))  return 'Retrait';
  if (/SALAIRE|PAIE|SALARY/.test(txt))                     return 'Salaire';
  if (/VIREMENT\s+RE[CÇ]U|INCOMING|CREDIT\s+TRANS/.test(txt)) return 'Virement reçu';
  if (/VIREMENT/.test(txt))                                return 'Virement';
  if (/PAIEMENT|ACHAT|PAYMENT|PURCHASE|MARCHAND/.test(txt)) return 'Paiement';
  if (/REMBOURSEMENT|REFUND/.test(txt))                    return 'Remboursement';
  if (/FRAIS|FEE|COMMISSION/.test(txt))                    return 'Frais';
  return null;
};

const detectMomoSubtype = (body) => {
  const txt = body.toUpperCase();
  if (/RETRAIT|WITHDRAWAL/.test(txt)) return 'Retrait';
  if (/PAIEMENT|PAYMENT|ACHAT/.test(txt)) return 'Paiement';
  return 'Transfert';
};

// ─────────────────────────────────────────────────────────────────────────────
// PARSEUR PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export const parseMomoSms = (sms, operator) => {
  const body = (sms.body || '').replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
  const op   = operator || detectOperator(sms.address);
  if (!op) return null;

  const isBank = BANK_OPS.has(op);
  const label  = OPERATOR_LABEL[op] || op.toUpperCase();

  // Champs communs
  const balanceMatch = body.match(BALANCE_RE);
  const balance = balanceMatch ? parseAmount(balanceMatch[1]) : null;
  const ref     = body.match(REF_RE)?.[1] ?? null;
  const cp      = (() => { const m = body.match(CPART_RE); return m ? m[1].trim() : null; })();
  const motif   = (() => { const m = body.match(MOTIF_RE); return m ? m[1].trim() : null; })();
  const cardNum = isBank ? (body.match(CARD_NUM_RE)?.[1] ?? null) : null;
  const cardSuffix = cardNum ? ` ****${cardNum}` : '';

  const creditPatterns = isBank ? BANK_CREDIT_PATTERNS  : MOMO_CREDIT_PATTERNS;
  const debitPatterns  = isBank ? BANK_DEBIT_PATTERNS   : MOMO_DEBIT_PATTERNS;

  // ── Essai CRÉDIT ──────────────────────────────────────────────────────────
  let amount = tryPatterns(body, creditPatterns);
  if (amount) {
    let name;
    if (isBank) {
      const subtype = detectBankSubtype(body, motif);
      const detail  = motif || subtype || 'Réception';
      name = cp
        ? `${label}${cardSuffix} – ${cp}`
        : `${label}${cardSuffix} – ${detail}`;
    } else {
      name = cp ? `${label} – ${cp}` : `${label} – Réception`;
    }
    return {
      type: 'entrée', montant: amount, name,
      categorie: isBank ? 'Virement' : 'Autres',
      source: label,
      date:   new Date(Number(sms.date)),
      smsRef: ref, balance, operator: op, rawSms: body,
    };
  }

  // ── Essai DÉBIT ───────────────────────────────────────────────────────────
  amount = tryPatterns(body, debitPatterns);
  if (amount) {
    let name;
    if (isBank) {
      const subtype = detectBankSubtype(body, motif);
      const detail  = motif || subtype || 'Paiement';
      name = cp
        ? `${label}${cardSuffix} – ${cp}`
        : `${label}${cardSuffix} – ${detail}`;
    } else {
      const subtype = detectMomoSubtype(body);
      name = cp ? `${label} – ${cp}` : `${label} – ${subtype}`;
    }
    return {
      type: 'dépense', montant: amount, name,
      categorie: isBank
        ? (/retrait|withdrawal|GAB|ATM|DAB/i.test(body) ? 'Retrait' : 'Paiement')
        : 'Autres',
      source: label,
      date:   new Date(Number(sms.date)),
      smsRef: ref, balance, operator: op, rawSms: body,
    };
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION
// ─────────────────────────────────────────────────────────────────────────────

export const requestSmsPermission = async () => {
  if (Platform.OS !== 'android') return false;
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title:          'Accès aux SMS financiers',
        message:        'FinCoach veut lire vos SMS pour importer automatiquement vos transactions MTN MoMo, Moov Money, Celtiis Cash et vos banques (Ecobank, BOA, UBA, NSIA, Orabank…).',
        buttonPositive: 'Autoriser',
        buttonNegative: 'Refuser',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch { return false; }
};

// ─────────────────────────────────────────────────────────────────────────────
// LECTURE ET PARSING DES SMS
// ─────────────────────────────────────────────────────────────────────────────

export const readMobileMoneyTransactions = () =>
  new Promise((resolve, reject) => {
    try {
      const SmsAndroid = require('react-native-get-sms-android');
      const allSenders = Object.values(OPERATORS).flat();
      const minDate    = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 derniers jours

      SmsAndroid.list(
        JSON.stringify({ box: 'inbox', maxCount: 300, indexFrom: 0, minDate }),
        (err) => reject(new Error(err)),
        (_count, smsList) => {
          const messages = JSON.parse(smsList);

          const relevant = messages.filter((m) =>
            allSenders.some((s) =>
              (m.address || '').toUpperCase().includes(s.toUpperCase()),
            ),
          );

          const parsed = relevant
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

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
export const readMomoTransactions = readMobileMoneyTransactions; // rétrocompat
export { detectOperator };
