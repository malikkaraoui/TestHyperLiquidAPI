/**
 * ============================================================================
 * SERVICE DE MAPPING DES ASSETS HYPERLIQUID
 * ============================================================================
 * 
 * Ce service gère la correspondance entre les Asset IDs numériques d'Hyperliquid
 * et leurs noms lisibles (BTC, ETH, SOL, etc.).
 * 
 * CONTEXTE HYPERLIQUID :
 * ----------------------
 * L'API Hyperliquid utilise des IDs numériques basés sur l'index dans l'array "universe".
 * Exemple : Si "BTC" est à l'index 0, son Asset ID sera "0"
 *           Si "ETH" est à l'index 1, son Asset ID sera "1"
 * 
 * PROBLÈME RÉSOLU :
 * -----------------
 * Les réponses API comme allMids retournent des données avec des IDs numériques :
 * { "0": "65432.1", "27": "185.2" } ❌ difficile à lire
 * 
 * Ce service transforme automatiquement en :
 * { "BTC": "65432.1", "SOL": "185.2" } ✅ facile à comprendre
 * 
 * FONCTIONNALITÉS :
 * -----------------
 * 1. Chargement automatique de la métadonnée depuis l'endpoint /info meta
 * 2. Mapping bidirectionnel : ID → Nom ET Nom → ID
 * 3. Cache en mémoire pour performance optimale
 * 4. Transformation automatique des réponses allMids
 * 5. Singleton pattern pour une seule instance globale
 * 
 * UTILISATION :
 * -------------
 * import assetMapping from './services/assetMappingService';
 * 
 * // Initialisation (à faire au démarrage de l'app)
 * await assetMapping.initialize();
 * 
 * // Récupérer un nom d'asset
 * const name = assetMapping.getAssetName('0'); // "BTC"
 * 
 * // Récupérer un ID d'asset
 * const id = assetMapping.getAssetId('BTC'); // "0"
 * 
 * // Transformer une réponse allMids
 * const readable = assetMapping.transformAllMidsResponse(apiResponse);
 */

import hyperliquidApi from '../api/hyperliquidService.js';

/**
 * Classe principale du service de mapping des assets
 * Pattern : Singleton (une seule instance pour toute l'application)
 */
class AssetMappingService {
  /**
   * Constructeur privé (Singleton)
   * Initialise les structures de données pour le mapping
   */
  constructor() {
    /**
     * Map bidirectionnelle : Asset ID (string) → Nom de l'asset (string)
     * Exemple : { "0": "BTC", "1": "ETH", "27": "SOL" }
     * @type {Map<string, string>}
     */
    this.idToNameMap = new Map();

    /**
     * Map bidirectionnelle inverse : Nom de l'asset → Asset ID
     * Exemple : { "BTC": "0", "ETH": "1", "SOL": "27" }
     * @type {Map<string, string>}
     */
    this.nameToIdMap = new Map();

    /**
     * Indicateur de chargement : true si les données sont chargées depuis l'API
     * @type {boolean}
     */
    this.isLoaded = false;

    /**
     * Données brutes de métadonnée depuis l'API Hyperliquid
     * Contient l'array "universe" avec toutes les informations des assets
     * @type {Object|null}
     */
    this.metadata = null;

    /**
     * Timestamp du dernier chargement (en millisecondes)
     * Utile pour implémenter un rafraîchissement périodique
     * @type {number|null}
     */
    this.lastLoadTime = null;
  }

  /**
   * ============================================================================
   * INITIALISATION DU SERVICE
   * ============================================================================
   * 
   * Charge les métadonnées depuis l'endpoint Hyperliquid /info meta
   * et construit les maps bidirectionnelles ID ↔ Nom
   * 
   * PROCESSUS :
   * 1. Appel API vers endpoint "meta"
   * 2. Extraction de l'array "universe" (liste de tous les assets)
   * 3. Pour chaque asset, création du mapping index → nom
   * 4. Stockage des maps pour accès rapide
   * 
   * @returns {Promise<void>}
   * @throws {Error} Si l'appel API échoue ou si la structure de données est invalide
   */
  async initialize() {
    try {
      console.log('🔄 [AssetMapping] Initialisation du service de mapping...');
      
      // Appel à l'endpoint meta pour récupérer les métadonnées
      // L'endpoint "meta" est défini dans /src/config/endpoints.js
      const response = await hyperliquidApi.executeRequest('meta');
      
      // Validation de la réponse : vérifier que "universe" existe
      if (!response || !response.universe || !Array.isArray(response.universe)) {
        throw new Error('Format de réponse invalide : "universe" array manquant');
      }

      // Stockage des métadonnées complètes
      this.metadata = response;
      
      // Construction des maps bidirectionnelles
      await this.loadMetadata(response);
      
      // Marquage comme chargé avec horodatage
      this.isLoaded = true;
      this.lastLoadTime = Date.now();
      
      console.log(`✅ [AssetMapping] Service initialisé avec ${this.idToNameMap.size} assets`);
      console.log(`📊 [AssetMapping] Exemples de mapping:`, this.getExampleMappings());
      
    } catch (error) {
      console.error('❌ [AssetMapping] Erreur lors de l\'initialisation:', error);
      throw error;
    }
  }

  /**
   * ============================================================================
   * CONSTRUCTION DES MAPS DE MAPPING
   * ============================================================================
   * 
   * Parse les métadonnées Hyperliquid et construit les maps ID ↔ Nom
   * 
   * STRUCTURE ATTENDUE :
   * {
   *   "universe": [
   *     { "name": "BTC", ... },  // index 0 → Asset ID "0"
   *     { "name": "ETH", ... },  // index 1 → Asset ID "1"
   *     { "name": "SOL", ... },  // index 27 → Asset ID "27"
   *     ...
   *   ]
   * }
   * 
   * @param {Object} metaResponse - Réponse de l'endpoint /info meta
   * @returns {Promise<void>}
   */
  async loadMetadata(metaResponse) {
    // Réinitialisation des maps avant rechargement
    this.idToNameMap.clear();
    this.nameToIdMap.clear();

    // Parcours de l'array universe
    // L'INDEX dans cet array EST l'Asset ID utilisé par l'API
    metaResponse.universe.forEach((asset, index) => {
      // Conversion de l'index numérique en string (format utilisé par l'API)
      const assetId = String(index);
      
      // Extraction du nom de l'asset (ex: "BTC", "ETH", "SOL")
      const assetName = asset.name;

      // Stockage bidirectionnel pour accès rapide O(1)
      this.idToNameMap.set(assetId, assetName);
      this.nameToIdMap.set(assetName, assetId);
    });

    console.log(`📋 [AssetMapping] Chargé ${this.idToNameMap.size} assets dans le mapping`);
  }

  /**
   * ============================================================================
   * RÉCUPÉRATION DU NOM D'UN ASSET PAR SON ID
   * ============================================================================
   * 
   * Convertit un Asset ID numérique en nom lisible
   * 
   * @param {string|number} assetId - L'ID de l'asset (ex: "0", "27", 0, 27)
   * @returns {string|null} Le nom de l'asset (ex: "BTC", "SOL") ou null si non trouvé
   * 
   * @example
   * getAssetName('0')  → "BTC"
   * getAssetName('27') → "SOL"
   * getAssetName(999)  → null (ID inexistant)
   */
  getAssetName(assetId) {
    // Vérification du chargement
    if (!this.isLoaded) {
      console.warn('⚠️ [AssetMapping] Service non initialisé. Appelez initialize() d\'abord.');
      return null;
    }

    // Normalisation de l'ID en string
    const id = String(assetId);
    
    // Recherche dans la map
    return this.idToNameMap.get(id) || null;
  }

  /**
   * ============================================================================
   * RÉCUPÉRATION DE L'ID D'UN ASSET PAR SON NOM
   * ============================================================================
   * 
   * Convertit un nom d'asset en son ID numérique
   * Utile pour construire des requêtes API avec des noms plutôt que des IDs
   * 
   * @param {string} assetName - Le nom de l'asset (ex: "BTC", "ETH")
   * @returns {string|null} L'ID de l'asset (ex: "0", "1") ou null si non trouvé
   * 
   * @example
   * getAssetId('BTC') → "0"
   * getAssetId('SOL') → "27"
   * getAssetId('XYZ') → null (asset inexistant)
   */
  getAssetId(assetName) {
    // Vérification du chargement
    if (!this.isLoaded) {
      console.warn('⚠️ [AssetMapping] Service non initialisé. Appelez initialize() d\'abord.');
      return null;
    }

    // Normalisation du nom en uppercase (au cas où)
    const name = assetName.toUpperCase();
    
    // Recherche dans la map inverse
    return this.nameToIdMap.get(name) || null;
  }

  /**
   * ============================================================================
   * RÉCUPÉRATION DES MÉTADONNÉES COMPLÈTES D'UN ASSET
   * ============================================================================
   * 
   * Retourne toutes les informations disponibles pour un asset donné
   * 
   * @param {string|number} assetId - L'ID de l'asset
   * @returns {Object|null} Les métadonnées complètes de l'asset ou null
   * 
   * @example
   * getAssetMetadata('0') → {
   *   name: "BTC",
   *   szDecimals: 5,
   *   maxLeverage: 50,
   *   ...
   * }
   */
  getAssetMetadata(assetId) {
    if (!this.isLoaded || !this.metadata) {
      console.warn('⚠️ [AssetMapping] Métadonnées non chargées');
      return null;
    }

    // Conversion de l'ID en index numérique
    const index = parseInt(assetId, 10);
    
    // Vérification de la validité de l'index
    if (isNaN(index) || index < 0 || index >= this.metadata.universe.length) {
      return null;
    }

    // Retour des métadonnées complètes
    return this.metadata.universe[index];
  }

  /**
   * ============================================================================
   * TRANSFORMATION DE LA RÉPONSE ALLMIDS
   * ============================================================================
   * 
   * Transforme une réponse allMids avec des IDs numériques en noms lisibles
   * 
   * AVANT :
   * {
   *   "0": "65432.1",
   *   "1": "3456.7",
   *   "27": "185.2"
   * }
   * 
   * APRÈS :
   * {
   *   "BTC": "65432.1",
   *   "ETH": "3456.7",
   *   "SOL": "185.2"
   * }
   * 
   * @param {Object} allMidsResponse - Réponse brute de l'endpoint allMids
   * @returns {Object} Objet transformé avec noms d'assets au lieu des IDs
   */
  transformAllMidsResponse(allMidsResponse) {
    // Vérification du chargement
    if (!this.isLoaded) {
      console.warn('⚠️ [AssetMapping] Service non initialisé. Retour de la réponse brute.');
      return allMidsResponse;
    }

    // Objet de résultat transformé
    const transformed = {};

    // Parcours de toutes les clés (Asset IDs) dans la réponse
    Object.keys(allMidsResponse).forEach(assetId => {
      // Récupération du nom de l'asset
      const assetName = this.getAssetName(assetId);
      
      // Si le nom est trouvé, utiliser le nom ; sinon conserver l'ID
      const key = assetName || `UNKNOWN_${assetId}`;
      
      // Copie de la valeur (prix mid)
      transformed[key] = allMidsResponse[assetId];
    });

    return transformed;
  }

  /**
   * ============================================================================
   * TRANSFORMATION AVEC MÉTADONNÉES ENRICHIES
   * ============================================================================
   * 
   * Transforme une réponse allMids en objets enrichis avec métadonnées
   * 
   * AVANT :
   * { "0": "65432.1" }
   * 
   * APRÈS :
   * {
   *   "BTC": {
   *     "price": "65432.1",
   *     "assetId": "0",
   *     "name": "BTC"
   *   }
   * }
   * 
   * @param {Object} allMidsResponse - Réponse brute de l'endpoint allMids
   * @returns {Object} Objet transformé avec métadonnées enrichies
   */
  transformAllMidsWithMetadata(allMidsResponse) {
    if (!this.isLoaded) {
      console.warn('⚠️ [AssetMapping] Service non initialisé.');
      return {};
    }

    const enriched = {};

    Object.keys(allMidsResponse).forEach(assetId => {
      const assetName = this.getAssetName(assetId);
      
      if (assetName) {
        enriched[assetName] = {
          price: allMidsResponse[assetId],
          assetId: assetId,
          name: assetName
        };
      }
    });

    return enriched;
  }

  /**
   * ============================================================================
   * LISTE DE TOUS LES ASSETS DISPONIBLES
   * ============================================================================
   * 
   * Retourne un array de tous les noms d'assets disponibles
   * Utile pour construire des dropdowns ou listes de sélection
   * 
   * @returns {string[]} Array des noms d'assets (ex: ["BTC", "ETH", "SOL", ...])
   */
  getAllAssetNames() {
    if (!this.isLoaded) {
      return [];
    }

    // Conversion de la Map en Array
    return Array.from(this.nameToIdMap.keys());
  }

  /**
   * ============================================================================
   * LISTE DE TOUS LES ASSET IDS
   * ============================================================================
   * 
   * Retourne un array de tous les IDs d'assets disponibles
   * 
   * @returns {string[]} Array des Asset IDs (ex: ["0", "1", "27", ...])
   */
  getAllAssetIds() {
    if (!this.isLoaded) {
      return [];
    }

    return Array.from(this.idToNameMap.keys());
  }

  /**
   * ============================================================================
   * NOMBRE TOTAL D'ASSETS
   * ============================================================================
   * 
   * Retourne le nombre total d'assets disponibles dans le système
   * 
   * @returns {number} Nombre d'assets
   */
  getAssetCount() {
    return this.idToNameMap.size;
  }

  /**
   * ============================================================================
   * VÉRIFICATION DE L'EXISTENCE D'UN ASSET PAR NOM
   * ============================================================================
   * 
   * @param {string} assetName - Nom de l'asset à vérifier
   * @returns {boolean} true si l'asset existe
   */
  hasAsset(assetName) {
    return this.nameToIdMap.has(assetName.toUpperCase());
  }

  /**
   * ============================================================================
   * VÉRIFICATION DE L'EXISTENCE D'UN ASSET PAR ID
   * ============================================================================
   * 
   * @param {string|number} assetId - ID de l'asset à vérifier
   * @returns {boolean} true si l'asset existe
   */
  hasAssetId(assetId) {
    return this.idToNameMap.has(String(assetId));
  }

  /**
   * ============================================================================
   * EXEMPLES DE MAPPING (pour debug et logs)
   * ============================================================================
   * 
   * Retourne un échantillon du mapping pour vérification
   * 
   * @returns {Object} Objet avec quelques exemples de mapping
   */
  getExampleMappings() {
    const examples = {};
    let count = 0;
    const maxExamples = 5;

    for (const [id, name] of this.idToNameMap) {
      if (count >= maxExamples) break;
      examples[id] = name;
      count++;
    }

    return examples;
  }

  /**
   * ============================================================================
   * RAFRAÎCHISSEMENT DES DONNÉES
   * ============================================================================
   * 
   * Recharge les métadonnées depuis l'API
   * Utile pour mettre à jour les données si de nouveaux assets sont ajoutés
   * 
   * @returns {Promise<void>}
   */
  async refresh() {
    console.log('🔄 [AssetMapping] Rafraîchissement des données...');
    this.isLoaded = false;
    await this.initialize();
  }

  /**
   * ============================================================================
   * DURÉE DEPUIS LE DERNIER CHARGEMENT
   * ============================================================================
   * 
   * Retourne le temps écoulé depuis le dernier chargement (en secondes)
   * 
   * @returns {number|null} Secondes depuis le dernier chargement, ou null
   */
  getSecondsSinceLastLoad() {
    if (!this.lastLoadTime) {
      return null;
    }

    return Math.floor((Date.now() - this.lastLoadTime) / 1000);
  }

  /**
   * ============================================================================
   * INFORMATION DE STATUS
   * ============================================================================
   * 
   * Retourne un objet avec toutes les informations de status du service
   * 
   * @returns {Object} Informations de status
   */
  getStatus() {
    return {
      isLoaded: this.isLoaded,
      assetCount: this.getAssetCount(),
      lastLoadTime: this.lastLoadTime,
      secondsSinceLastLoad: this.getSecondsSinceLastLoad(),
      exampleMappings: this.getExampleMappings()
    };
  }
}

/**
 * ============================================================================
 * EXPORT SINGLETON
 * ============================================================================
 * 
 * Création et export d'une instance unique du service
 * Pattern Singleton : garantit qu'il n'existe qu'une seule instance
 * dans toute l'application
 * 
 * UTILISATION :
 * import assetMapping from './services/assetMappingService';
 * 
 * // Pas besoin de faire "new AssetMappingService()"
 * // L'instance est déjà créée et partagée
 */
const assetMapping = new AssetMappingService();

export default assetMapping;
