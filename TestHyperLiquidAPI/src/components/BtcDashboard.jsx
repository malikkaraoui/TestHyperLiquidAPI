/**
 * ============================================================================
 * DASHBOARD BTC/USDT - Affichage en temps réel du prix et infos du Bitcoin
 * ============================================================================
 * 
 * Ce composant affiche en temps réel :
 * - Le prix actuel du BTC/USDT
 * - Les métadonnées du token (leverage max, decimals, etc.)
 * - Le carnet d'ordres (order book)
 * - Des statistiques et informations détaillées
 * 
 * FONCTIONNALITÉS :
 * -----------------
 * 1. Rafraîchissement automatique toutes les 5 secondes
 * 2. Affichage du prix en temps réel avec animation
 * 3. Informations techniques du token (metadata)
 * 4. Order book avec bids et asks
 * 5. Design moderne et responsive
 * 
 * UTILISATION :
 * -------------
 * import BtcDashboard from './components/BtcDashboard';
 * <BtcDashboard />
 */

import { useState, useEffect } from 'react';
import { hyperliquidApi } from '../api/hyperliquidService.js';
import assetMapping from '../services/assetMappingService.js';

/**
 * ============================================================================
 * COMPOSANT PRINCIPAL : BTC DASHBOARD
 * ============================================================================
 */
export default function BtcDashboard() {
  /**
   * États pour les données BTC
   */
  const [btcPrice, setBtcPrice] = useState(null);
  const [btcMetadata, setBtcMetadata] = useState(null);
  const [orderBook, setOrderBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  /**
   * ========================================================================
   * FONCTION : CHARGEMENT DES DONNÉES BTC
   * ========================================================================
   * 
   * Charge toutes les informations sur le BTC depuis l'API Hyperliquid
   */
  async function loadBtcData() {
    try {
      setError(null);

      // ====================================================================
      // 1. RÉCUPÉRATION DU PRIX BTC depuis allMids
      // ====================================================================
      const allMidsResponse = await hyperliquidApi.executeRequest('allMids');
      const btcId = assetMapping.getAssetId('BTC');
      
      if (allMidsResponse && btcId) {
        setBtcPrice(allMidsResponse[btcId]);
      }

      // ====================================================================
      // 2. RÉCUPÉRATION DES MÉTADONNÉES BTC
      // ====================================================================
      await hyperliquidApi.executeRequest('meta');
      const btcMetadataFromApi = assetMapping.getAssetMetadata(btcId);
      setBtcMetadata(btcMetadataFromApi);

      // ====================================================================
      // 3. RÉCUPÉRATION DE L'ORDER BOOK
      // ====================================================================
      try {
        const l2BookResponse = await hyperliquidApi.executeRequest('l2Book', {
          coin: 'BTC'
        });
        setOrderBook(l2BookResponse);
      } catch (err) {
        console.warn('⚠️ Order book non disponible:', err.message);
      }

      // Mise à jour du timestamp
      setLastUpdate(new Date());
      setLoading(false);

    } catch (err) {
      console.error('❌ Erreur lors du chargement des données BTC:', err);
      setError(err.message);
      setLoading(false);
    }
  }

  /**
   * ========================================================================
   * EFFECT : CHARGEMENT INITIAL ET RAFRAÎCHISSEMENT AUTO
   * ========================================================================
   * 
   * Charge les données au montage et configure un intervalle de 5 secondes
   */
  useEffect(() => {
    // Chargement initial
    loadBtcData();

    // Rafraîchissement automatique toutes les 5 secondes
    const interval = setInterval(() => {
      loadBtcData();
    }, 5000);

    // Nettoyage à la destruction du composant
    return () => clearInterval(interval);
  }, []);

  /**
   * ========================================================================
   * AFFICHAGE : ÉTAT DE CHARGEMENT
   * ========================================================================
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">₿</div>
          <p className="text-white text-xl">Chargement des données BTC...</p>
        </div>
      </div>
    );
  }

  /**
   * ========================================================================
   * AFFICHAGE : ÉTAT D'ERREUR
   * ========================================================================
   */
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">
              Erreur de chargement
            </h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={loadBtcData}
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
   * AFFICHAGE PRINCIPAL : DASHBOARD BTC
   * ========================================================================
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ========== HEADER AVEC PRIX PRINCIPAL ========== */}
        <header className="text-center">
          <div className="inline-block bg-gradient-to-r from-orange-500 to-yellow-500 text-transparent bg-clip-text">
            <h1 className="text-6xl font-bold mb-2">₿ Bitcoin</h1>
          </div>
          <div className="mt-4 bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
            <p className="text-gray-400 text-sm mb-2">Prix actuel BTC/USDT</p>
            <div className="text-6xl font-bold text-emerald-400 mb-2">
              ${btcPrice ? parseFloat(btcPrice).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }) : '---'}
            </div>
            {lastUpdate && (
              <p className="text-xs text-gray-500">
                Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
              </p>
            )}
          </div>
        </header>

        {/* ========== GRILLE D'INFORMATIONS ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* ========== MÉTADONNÉES DU TOKEN ========== */}
          {btcMetadata && (
            <>
              <InfoCard
                icon="📊"
                title="Leverage Maximum"
                value={`${btcMetadata.maxLeverage}x`}
                description="Effet de levier maximal disponible"
              />
              
              <InfoCard
                icon="🔢"
                title="Size Decimals"
                value={btcMetadata.szDecimals}
                description="Précision décimale pour la taille"
              />
              
              <InfoCard
                icon="🎯"
                title="Type d'asset"
                value={btcMetadata.name}
                description="Nom du token sur Hyperliquid"
              />
              
              {btcMetadata.onlyIsolated !== undefined && (
                <InfoCard
                  icon="🔒"
                  title="Mode de marge"
                  value={btcMetadata.onlyIsolated ? "Isolé uniquement" : "Cross et Isolé"}
                  description="Types de marge autorisés"
                />
              )}
            </>
          )}

          {/* ========== BOUTON DE RAFRAÎCHISSEMENT MANUEL ========== */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex items-center justify-center">
            <button
              onClick={loadBtcData}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg
                         font-semibold transition-all duration-200 hover:scale-105 active:scale-95
                         flex items-center gap-2"
            >
              🔄 Rafraîchir les données
            </button>
          </div>
        </div>

        {/* ========== ORDER BOOK (si disponible) ========== */}
        {orderBook && orderBook.levels && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                📖 Carnet d'ordres BTC
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Profondeur du marché en temps réel
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-700">
              {/* ASKS (Ventes) */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  📉 Asks (Ventes)
                </h3>
                <div className="space-y-2">
                  {orderBook.levels[1]?.slice(0, 10).map((ask, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-red-400 font-mono">${ask.px}</span>
                      <span className="text-gray-400">{ask.sz} BTC</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BIDS (Achats) */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                  📈 Bids (Achats)
                </h3>
                <div className="space-y-2">
                  {orderBook.levels[0]?.slice(0, 10).map((bid, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-emerald-400 font-mono">${bid.px}</span>
                      <span className="text-gray-400">{bid.sz} BTC</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== MÉTADONNÉES COMPLÈTES (COLLAPSIBLE) ========== */}
        {btcMetadata && (
          <details className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <summary className="p-6 cursor-pointer hover:bg-gray-750 transition-colors">
              <span className="text-xl font-semibold">🔍 Métadonnées complètes</span>
            </summary>
            <div className="p-6 border-t border-gray-700">
              <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(btcMetadata, null, 2)}
              </pre>
            </div>
          </details>
        )}

        {/* ========== FOOTER AVEC AUTO-REFRESH INFO ========== */}
        <footer className="text-center text-sm text-gray-500 py-4">
          <p>🔄 Rafraîchissement automatique toutes les 5 secondes</p>
          <p className="mt-1">Données fournies par Hyperliquid API</p>
        </footer>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * COMPOSANT : INFO CARD
 * ============================================================================
 * 
 * Carte d'information réutilisable pour afficher une métrique
 */
function InfoCard({ icon, title, value, description }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-emerald-500 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{icon}</span>
        <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
      </div>
      <div className="text-3xl font-bold text-emerald-400 mb-2">
        {value}
      </div>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
