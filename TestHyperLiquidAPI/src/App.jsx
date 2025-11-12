/**
 * ============================================================================
 * COMPOSANT APP - Point d'entrée principal de l'application
 * ============================================================================
 * 
 * Ce composant gère :
 * 1. L'initialisation du service de mapping des assets Hyperliquid
 * 2. Le chargement et affichage du playground API
 * 3. Les tests de structure au démarrage (en développement)
 * 
 * INITIALISATION AU DÉMARRAGE :
 * -----------------------------
 * - Appel au service AssetMappingService pour charger les métadonnées
 * - Tests de validation de la structure du projet
 * 
 * ARCHITECTURE :
 * --------------
 * App (ce fichier)
 *   └─ SimpleApiPlayground (interface utilisateur)
 *       ├─ config/endpoints.js (configuration des endpoints)
 *       ├─ api/hyperliquidService.js (service API)
 *       ├─ services/assetMappingService.js (mapping Asset ID ↔ Nom)
 *       └─ components/ResponseDisplay.jsx (affichage enrichi)
 */

import React, { useState } from 'react'
import './App.css'
import SimpleApiPlayground from './SimpleApiPlayground'
import { runQuickTest } from './utils/quickTest'
import assetMapping from './services/assetMappingService'

function App() {
  console.log('🎯 [App] Composant en cours de rendu');

  /**
   * État de chargement de l'initialisation
   * Permet d'afficher un loader pendant le chargement des métadonnées
   */
  const [isInitializing, setIsInitializing] = useState(true);

  /**
   * État d'erreur d'initialisation
   * Stocke les erreurs éventuelles lors du chargement
   */
  const [initError, setInitError] = useState(null);

  /**
   * ========================================================================
   * EFFECT : INITIALISATION AU DÉMARRAGE
   * ========================================================================
   * 
   * Exécuté une seule fois au montage du composant
   * 
   * PROCESSUS :
   * 1. Initialisation du service AssetMappingService
   * 2. Exécution des tests de structure (en développement)
   * 3. Gestion des erreurs et logging
   */
  React.useEffect(() => {
    async function initializeApp() {
      try {
        console.log('🔄 [App] Initialisation de l\'application...');
        
        // ====================================================================
        // ÉTAPE 1 : Initialisation du service de mapping des assets
        // ====================================================================
        // Charge les métadonnées depuis l'endpoint Hyperliquid /info meta
        // Crée les maps bidirectionnelles Asset ID ↔ Nom
        console.log('📊 [App] Chargement des métadonnées Hyperliquid...');
        await assetMapping.initialize();
        console.log('✅ [App] Service de mapping initialisé avec succès');
        
        // ====================================================================
        // ÉTAPE 2 : Tests de structure (développement uniquement)
        // ====================================================================
        // Valide que tous les fichiers et exports sont corrects
        console.log('🧪 [App] Lancement des tests de structure...');
        await runQuickTest();
        console.log('✅ [App] Tests de structure réussis');
        
        // ====================================================================
        // FIN D'INITIALISATION
        // ====================================================================
        setIsInitializing(false);
        console.log('🎉 [App] Application initialisée avec succès!');
        
      } catch (error) {
        // Gestion des erreurs d'initialisation
        console.error('❌ [App] Erreur lors de l\'initialisation:', error);
        setInitError(error.message);
        setIsInitializing(false);
      }
    }

    // Lancement de l'initialisation
    initializeApp();
  }, []); // [] = exécution une seule fois au montage

  /**
   * ========================================================================
   * AFFICHAGE PENDANT L'INITIALISATION
   * ========================================================================
   * 
   * Affiche un loader avec animation pendant le chargement des métadonnées
   */
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Initialisation...
          </h2>
          <p className="text-gray-400">
            Chargement des métadonnées Hyperliquid
          </p>
        </div>
      </div>
    );
  }

  /**
   * ========================================================================
   * AFFICHAGE EN CAS D'ERREUR D'INITIALISATION
   * ========================================================================
   * 
   * Affiche un message d'erreur si l'initialisation échoue
   */
  if (initError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">
              Erreur d'initialisation
            </h2>
            <p className="text-gray-300 mb-4">
              {initError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg
                         font-semibold transition-colors"
            >
              🔄 Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ========================================================================
   * AFFICHAGE NORMAL DE L'APPLICATION
   * ========================================================================
   * 
   * Une fois l'initialisation réussie, affiche le playground
   */
  return <SimpleApiPlayground />;
}

export default App;