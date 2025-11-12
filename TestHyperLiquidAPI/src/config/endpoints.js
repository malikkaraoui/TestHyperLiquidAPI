/**
 * 🚀 HYPERLIQUID API ENDPOINTS CONFIGURATION
 * ==========================================
 * 
 * Ce fichier contient la configuration de tous les endpoints
 * disponibles sur l'API publique d'Hyperliquid.
 * 
 * Documentation officielle : https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api
 * 
 * 📋 Types d'endpoints disponibles :
 * - 📊 Données de marché publiques (pas d'auth requise)
 * - 🔐 Données utilisateur (adresse requise)
 * - 📈 Données historiques
 */

// 🌐 URL de base de l'API Hyperliquid
export const HYPERLIQUID_API_BASE = 'https://api.hyperliquid.xyz';

/**
 * 📊 ENDPOINTS PUBLICS - Aucune authentification requise
 * Ces endpoints peuvent être appelés librement sans compte
 */
export const PUBLIC_ENDPOINTS = [
  {
    id: 'allMids',
    name: '💰 All Mids (Prix en temps réel)',
    description: 'Récupère tous les prix de marché actuels pour toutes les paires',
    method: 'POST',
    url: `${HYPERLIQUID_API_BASE}/info`,
    headers: { 'Content-Type': 'application/json' },
    body: { type: 'allMids' },
    params: [], // Aucun paramètre requis
    category: 'market-data',
    difficulty: 'beginner', // facile à tester
    expectedResponse: 'Objet avec les prix mid pour chaque paire'
  },

  {
    id: 'meta',
    name: '📋 Meta (Métadonnées des assets)',
    description: 'Informations sur tous les assets disponibles sur la plateforme',
    method: 'POST',
    url: `${HYPERLIQUID_API_BASE}/info`,
    headers: { 'Content-Type': 'application/json' },
    body: { type: 'meta' },
    params: [],
    category: 'market-data',
    difficulty: 'beginner',
    expectedResponse: 'Liste des assets avec leurs métadonnées'
  },

  {
    id: 'l2Book',
    name: '📚 L2 Book (Livre d\'ordres)',
    description: 'Carnet d\'ordres niveau 2 pour un asset spécifique',
    method: 'POST',
    url: `${HYPERLIQUID_API_BASE}/info`,
    headers: { 'Content-Type': 'application/json' },
    body: { 
      type: 'l2Book',
      coin: '{{coin}}'
    },
    params: [
      {
        name: 'coin',
        label: 'Asset (ex: BTC)',
        type: 'string',
        required: true,
        placeholder: 'BTC',
        examples: ['BTC', 'ETH', 'SOL', 'ARB'],
        description: 'Symbole de l\'asset à interroger'
      }
    ],
    category: 'market-data',
    difficulty: 'intermediate',
    expectedResponse: 'Bids et asks du carnet d\'ordres'
  }
];

/**
 * 🔐 ENDPOINTS AVEC PARAMÈTRES - Adresse utilisateur requise
 * Ces endpoints nécessitent une adresse Ethereum valide
 */
export const USER_ENDPOINTS = [
  {
    id: 'userState',
    name: '👤 User State (État utilisateur)',
    description: 'État complet du compte d\'un utilisateur (positions, balances, etc.)',
    method: 'POST',
    url: `${HYPERLIQUID_API_BASE}/info`,
    headers: { 'Content-Type': 'application/json' },
    body: { 
      type: 'clearinghouseState',
      user: '{{user_address}}'
    },
    params: [
      {
        name: 'user_address',
        label: 'Adresse utilisateur',
        type: 'string',
        required: true,
        placeholder: '0x...',
        examples: [
          '0x000000000000000000000000000000000000dead', // Adresse de test
          '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'  // Exemple public
        ],
        description: 'Adresse Ethereum de l\'utilisateur à interroger',
        validation: '^0x[a-fA-F0-9]{40}$' // Regex pour valider format adresse
      }
    ],
    category: 'user-data',
    difficulty: 'advanced',
    expectedResponse: 'Positions, balances, et état du compte'
  }
];

/**
 * 📈 ENDPOINTS HISTORIQUES - Données temporelles
 * Pour récupérer l'historique des prix et trades
 */
export const HISTORICAL_ENDPOINTS = [
  {
    id: 'candleSnapshot',
    name: '🕯️ Candlestick Data',
    description: 'Données de chandeliers japonais pour analyse technique',
    method: 'POST',
    url: `${HYPERLIQUID_API_BASE}/info`,
    headers: { 'Content-Type': 'application/json' },
    body: {
      type: 'candleSnapshot',
      req: {
        coin: '{{coin}}',
        interval: '{{interval}}',
        startTime: '{{start_time}}',
        endTime: '{{end_time}}'
      }
    },
    params: [
      {
        name: 'coin',
        label: 'Asset',
        type: 'string', 
        required: true,
        placeholder: 'BTC',
        examples: ['BTC', 'ETH', 'SOL'],
        description: 'Asset à analyser'
      },
      {
        name: 'interval',
        label: 'Intervalle',
        type: 'select',
        required: true,
        options: ['1m', '5m', '15m', '1h', '4h', '1d'],
        default: '1h',
        description: 'Période de chaque chandelier'
      },
      {
        name: 'start_time',
        label: 'Début (timestamp ms)',
        type: 'number',
        required: true,
        placeholder: String(Date.now() - 24 * 60 * 60 * 1000), // 24h ago
        description: 'Timestamp de début en millisecondes'
      },
      {
        name: 'end_time',
        label: 'Fin (timestamp ms)', 
        type: 'number',
        required: true,
        placeholder: String(Date.now()),
        description: 'Timestamp de fin en millisecondes'
      }
    ],
    category: 'historical',
    difficulty: 'advanced',
    expectedResponse: 'Tableau de données OHLCV'
  }
];

/**
 * 🎯 COLLECTION COMPLÈTE DES ENDPOINTS
 * Combine tous les endpoints pour usage dans l'interface
 */
export const ALL_ENDPOINTS = [
  ...PUBLIC_ENDPOINTS,
  ...USER_ENDPOINTS, 
  ...HISTORICAL_ENDPOINTS
];

/**
 * 🎯 ALIAS POUR COMPATIBILITÉ
 * HYPERLIQUID_ENDPOINTS = tous les endpoints disponibles
 */
export const HYPERLIQUID_ENDPOINTS = ALL_ENDPOINTS;

/**
 * 🏷️ CATÉGORIES D'ENDPOINTS
 * Pour organiser l'interface utilisateur
 */
export const ENDPOINT_CATEGORIES = {
  'market-data': {
    label: '📊 Données de Marché',
    description: 'Prix, carnets d\'ordres, métadonnées',
    color: 'green'
  },
  'user-data': {
    label: '👤 Données Utilisateur',
    description: 'Positions, balances (adresse requise)',
    color: 'blue'
  },
  'historical': {
    label: '📈 Données Historiques',
    description: 'Chandeliers, historique des prix',
    color: 'purple'
  }
};

/**
 * 🛠️ HELPERS POUR LES ENDPOINTS
 */

// Récupère les endpoints par catégorie
export const getEndpointsByCategory = (category) => {
  return ALL_ENDPOINTS.filter(endpoint => endpoint.category === category);
};

// Récupère un endpoint par son ID
export const getEndpointById = (id) => {
  return ALL_ENDPOINTS.find(endpoint => endpoint.id === id);
};

// Filtre les endpoints par niveau de difficulté
export const getEndpointsByDifficulty = (difficulty) => {
  return ALL_ENDPOINTS.filter(endpoint => endpoint.difficulty === difficulty);
};

// Récupère les endpoints recommandés pour débuter
export const getBeginnerEndpoints = () => {
  return getEndpointsByDifficulty('beginner');
};