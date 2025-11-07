/**
 * 🌐 HYPERLIQUID API SERVICE
 * ==========================
 * 
 * Service principal pour effectuer des appels vers l'API Hyperliquid.
 * Gère les requêtes, erreurs, et formatage des réponses.
 * 
 * 🔧 Fonctionnalités :
 * - Exécution sécurisée des requêtes
 * - Gestion d'erreurs détaillée
 * - Remplacement automatique des paramètres
 * - Validation des réponses
 * - Logging pour debugging
 */

import { replaceParametersInObject } from '../utils/parameterUtils.js';

/**
 * 📊 Classe principale du service API
 */
export class HyperliquidApiService {
  constructor() {
    this.baseUrl = 'https://api.hyperliquid.xyz';
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  /**
   * 🚀 Exécute une requête vers l'API Hyperliquid
   * 
   * @param {Object} endpoint - Configuration de l'endpoint
   * @param {Object} parameters - Paramètres à injecter dans la requête
   * @returns {Promise<Object>} Réponse de l'API
   */
  async executeRequest(endpoint, parameters = {}) {
    console.log('🚀 [API] Exécution de la requête:', {
      endpoint: endpoint.name,
      method: endpoint.method,
      url: endpoint.url,
      parameters
    });

    try {
      // ✨ 1. Préparation de la requête
      const requestConfig = this._prepareRequest(endpoint, parameters);
      
      // 🌐 2. Exécution de la requête
      const response = await this._performRequest(requestConfig);
      
      // ✅ 3. Traitement de la réponse
      const processedResponse = await this._processResponse(response);
      
      console.log('✅ [API] Requête réussie:', {
        status: response.status,
        dataSize: JSON.stringify(processedResponse).length
      });

      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        data: processedResponse,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ [API] Erreur lors de la requête:', error);
      
      return {
        success: false,
        error: {
          message: error.message,
          type: this._classifyError(error),
          details: this._extractErrorDetails(error)
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 🛠️ Prépare la configuration de la requête
   * Remplace les paramètres et configure les headers
   */
  _prepareRequest(endpoint, parameters) {
    // Remplacer les paramètres dans le body si nécessaire
    let requestBody = endpoint.body;
    if (endpoint.params && endpoint.params.length > 0) {
      requestBody = replaceParametersInObject(endpoint.body, parameters);
    }

    // Configuration de la requête
    const config = {
      method: endpoint.method,
      headers: {
        ...this.defaultHeaders,
        ...endpoint.headers
      },
      url: endpoint.url
    };

    // Ajouter le body pour les requêtes POST
    if (endpoint.method === 'POST' && requestBody) {
      config.body = JSON.stringify(requestBody);
    }

    console.log('🔧 [API] Configuration de la requête:', config);
    return config;
  }

  /**
   * 🌐 Effectue la requête HTTP
   */
  async _performRequest(config) {
    const startTime = performance.now();
    
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.body
    });

    const endTime = performance.now();
    console.log(`⏱️ [API] Durée de la requête: ${Math.round(endTime - startTime)}ms`);

    return response;
  }

  /**
   * 📋 Traite la réponse de l'API
   */
  async _processResponse(response) {
    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Déterminer le type de contenu
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  }

  /**
   * 🏷️ Classifie le type d'erreur pour un meilleur feedback
   */
  _classifyError(error) {
    if (error.message.includes('fetch')) {
      return 'network';
    } else if (error.message.includes('HTTP 4')) {
      return 'client';
    } else if (error.message.includes('HTTP 5')) {
      return 'server';
    } else if (error.message.includes('JSON')) {
      return 'parsing';
    } else {
      return 'unknown';
    }
  }

  /**
   * 📝 Extrait les détails de l'erreur pour debugging
   */
  _extractErrorDetails(error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ? error.stack.split('\n').slice(0, 3) : null
    };
  }
}

/**
 * 🎯 Instance singleton du service API
 * Utiliser cette instance dans toute l'application
 */
export const hyperliquidApi = new HyperliquidApiService();

/**
 * 🛠️ HELPER FUNCTIONS - Fonctions utilitaires
 */

/**
 * Teste si l'API Hyperliquid est accessible
 */
export async function testApiConnection() {
  console.log('🧪 [API] Test de connexion à l\'API Hyperliquid...');
  
  try {
    const testEndpoint = {
      name: 'Test de connexion',
      method: 'POST',
      url: 'https://api.hyperliquid.xyz/info',
      headers: { 'Content-Type': 'application/json' },
      body: { type: 'meta' },
      params: []
    };

    const result = await hyperliquidApi.executeRequest(testEndpoint);
    
    if (result.success) {
      console.log('✅ [API] Connexion réussie !');
      return true;
    } else {
      console.log('❌ [API] Échec de la connexion:', result.error);
      return false;
    }
  } catch (error) {
    console.log('💥 [API] Erreur lors du test:', error);
    return false;
  }
}