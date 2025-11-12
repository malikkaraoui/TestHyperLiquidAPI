/**
 * ============================================================================
 * SIMPLE API PLAYGROUND - Interface de test des endpoints Hyperliquid
 * ============================================================================
 * 
 * Ce composant fournit une interface utilisateur pour tester facilement
 * les différents endpoints de l'API Hyperliquid configurés dans le projet.
 * 
 * FONCTIONNALITÉS :
 * -----------------
 * 1. Sélection d'endpoints depuis la configuration centralisée
 * 2. Exécution des requêtes API avec gestion d'erreurs
 * 3. Affichage enrichi des réponses avec transformation des Asset IDs
 * 4. Support des paramètres dynamiques pour les endpoints
 * 5. Interface responsive avec Tailwind CSS
 * 
 * INTÉGRATION :
 * -------------
 * - Utilise HYPERLIQUID_ENDPOINTS depuis /src/config/endpoints.js
 * - Utilise hyperliquidApi depuis /src/api/hyperliquidService.js
 * - Utilise ResponseDisplay depuis /src/components/ResponseDisplay.jsx
 */

import React, { useState } from 'react';
import { HYPERLIQUID_ENDPOINTS } from './config/endpoints.js';
import hyperliquidApi from './api/hyperliquidService.js';
import ResponseDisplay from './components/ResponseDisplay.jsx';

/**
 * ============================================================================
 * COMPOSANT PRINCIPAL : SIMPLE API PLAYGROUND
 * ============================================================================
 * 
 * Interface utilisateur pour tester les endpoints Hyperliquid
 */
function SimpleApiPlayground() {
  /**
   * État : Endpoint actuellement sélectionné
   * Initialisé avec le premier endpoint de la configuration
   */
  const [selectedEndpoint, setSelectedEndpoint] = useState(HYPERLIQUID_ENDPOINTS[0]);
  
  /**
   * État : Réponse de l'API après exécution
   */
  const [response, setResponse] = useState(null);
  
  /**
   * État : Indicateur de chargement pendant l'exécution
   */
  const [loading, setLoading] = useState(false);
  
  /**
   * État : Status de la dernière requête (idle, pending, success, error)
   */
  const [status, setStatus] = useState('idle');
  
  /**
   * État : Paramètres pour les endpoints qui en requièrent
   * Format: { paramName: paramValue }
   * Exemple pour l2Book: { coin: "BTC" }
   */
  const [parameters, setParameters] = useState({});

  /**
   * ========================================================================
   * FONCTION : EXÉCUTION D'UNE REQUÊTE API
   * ========================================================================
   * 
   * Utilise le service hyperliquidApi pour exécuter la requête
   * et gère l'affichage des résultats/erreurs
   */
  async function executeRequest() {
    setLoading(true);
    setStatus('pending');
    setResponse(null);

    try {
      // Appel au service API centralisé
      // Le service gère automatiquement :
      // - Le remplacement des paramètres dans le body
      // - La validation des paramètres requis
      // - Les timeouts et erreurs réseau
      const data = await hyperliquidApi.executeRequest(
        selectedEndpoint.id,
        parameters
      );
      
      setStatus('success');
      setResponse(data);
    } catch (error) {
      setStatus('error');
      
      // Formatage de l'erreur pour affichage
      setResponse({
        error: true,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * ========================================================================
   * FONCTION : MISE À JOUR D'UN PARAMÈTRE
   * ========================================================================
   * 
   * @param {string} paramName - Nom du paramètre
   * @param {string} value - Nouvelle valeur
   */
  function updateParameter(paramName, value) {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  }

  /**
   * ========================================================================
   * FONCTION : CHANGEMENT D'ENDPOINT
   * ========================================================================
   * 
   * Réinitialise les paramètres quand on change d'endpoint
   */
  function handleEndpointChange(endpointId) {
    const endpoint = HYPERLIQUID_ENDPOINTS.find(ep => ep.id === endpointId);
    setSelectedEndpoint(endpoint);
    setParameters({});
    setResponse(null);
    setStatus('idle');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ========== HEADER ========== */}
        <header className="text-center">
          <h1 className="text-3xl font-bold text-emerald-400 mb-2">
            🚀 API Playground Hyperliquid
          </h1>
          <p className="text-gray-400">
            Testez les 5 endpoints Hyperliquid configurés
          </p>
        </header>

        {/* ========== SÉLECTION D'ENDPOINT ========== */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📍 Sélectionner un endpoint</h2>
          <div className="grid gap-4">
            <select 
              value={selectedEndpoint.id}
              onChange={(e) => handleEndpointChange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 
                         text-white focus:outline-none focus:border-emerald-500
                         cursor-pointer hover:bg-gray-650 transition-colors"
            >
              {HYPERLIQUID_ENDPOINTS.map(endpoint => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.name}
                </option>
              ))}
            </select>
            
            {/* Description de l'endpoint sélectionné */}
            <div className="bg-gray-700 rounded p-3">
              <p className="text-sm text-gray-300">
                📝 {selectedEndpoint.description}
              </p>
              {selectedEndpoint.notes && (
                <p className="text-xs text-gray-400 mt-2">
                  💡 {selectedEndpoint.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ========== PARAMÈTRES (si l'endpoint en requiert) ========== */}
        {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">⚙️ Paramètres</h2>
            <div className="grid gap-4">
              {selectedEndpoint.parameters.map(param => (
                <div key={param.name} className="grid gap-2">
                  <label className="text-sm font-medium text-gray-300">
                    {param.name}
                    {param.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={param.example || `Entrez ${param.name}...`}
                    value={parameters[param.name] || ''}
                    onChange={(e) => updateParameter(param.name, e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 
                               text-white focus:outline-none focus:border-emerald-500
                               placeholder-gray-500"
                  />
                  {param.description && (
                    <p className="text-xs text-gray-400">
                      {param.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== DÉTAILS DE LA REQUÊTE ========== */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📤 Requête</h2>
          <div className="space-y-3">
            <div>
              <span className="text-emerald-400 font-mono font-bold">
                {selectedEndpoint.method}
              </span>
              <span className="ml-2 text-gray-300">
                {selectedEndpoint.url}
              </span>
            </div>
            
            {/* Affichage du body de la requête */}
            {selectedEndpoint.body && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Body:</p>
                <pre className="bg-gray-900 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(selectedEndpoint.body, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* ========== BOUTON D'EXÉCUTION ========== */}
        <div className="text-center">
          <button
            onClick={executeRequest}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 
                       disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg 
                       font-semibold transition-all duration-200
                       hover:scale-105 active:scale-95"
          >
            {loading ? '⏳ Exécution en cours...' : `🚀 Exécuter ${selectedEndpoint.method}`}
          </button>
          
          {/* Indicateur de status */}
          {status !== 'idle' && (
            <div className={`mt-3 text-sm font-medium ${
              status === 'success' ? 'text-emerald-400' :
              status === 'error' ? 'text-red-400' :
              'text-yellow-400'
            }`}>
              {status === 'success' && '✅ Requête réussie'}
              {status === 'error' && '❌ Erreur lors de la requête'}
              {status === 'pending' && '⏳ Requête en cours...'}
            </div>
          )}
        </div>

        {/* ========== AFFICHAGE DE LA RÉPONSE ========== */}
        {response && (
          <ResponseDisplay 
            response={response} 
            endpointId={selectedEndpoint.id}
          />
        )}
      </div>
    </div>
  );
}

export default SimpleApiPlayground;