/**
 * ============================================================================
 * COMPOSANT D'AFFICHAGE DES RÉPONSES API
 * ============================================================================
 * 
 * Ce fichier contient plusieurs composants React pour afficher de manière
 * élégante et lisible les réponses de l'API Hyperliquid.
 * 
 * COMPOSANTS INCLUS :
 * -------------------
 * 1. ResponseDisplay : Composant principal d'affichage avec collapse/expand
 * 2. JsonViewer : Visualiseur JSON avec indentation et coloration
 * 3. AllMidsResponseSummary : Affichage spécial pour les réponses allMids
 * 
 * PROBLÈME RÉSOLU :
 * -----------------
 * Les réponses API brutes sont difficiles à lire :
 * - IDs numériques illisibles ("0", "27" au lieu de "BTC", "SOL")
 * - JSON non formaté
 * - Pas de résumé visuel
 * 
 * Ce composant transforme automatiquement les réponses avec :
 * - Noms d'assets lisibles
 * - Formatage JSON coloré
 * - Résumé avec nombre d'assets
 * - Mode collapse/expand pour gérer de grandes réponses
 * 
 * UTILISATION :
 * -------------
 * <ResponseDisplay 
 *   response={apiResponse} 
 *   endpointId="allMids"
 * />
 */

import { useState } from 'react';
import assetMapping from '../services/assetMappingService.js';

/**
 * ============================================================================
 * COMPOSANT PRINCIPAL : RESPONSE DISPLAY
 * ============================================================================
 * 
 * Affiche une réponse API avec options de collapse/expand et transformation
 * automatique des IDs en noms d'assets
 * 
 * @param {Object} props
 * @param {Object} props.response - La réponse API à afficher
 * @param {string} props.endpointId - L'ID de l'endpoint appelé (ex: "allMids")
 * 
 * @example
 * <ResponseDisplay 
 *   response={{ "0": "65432.1", "1": "3456.7" }}
 *   endpointId="allMids"
 * />
 */
export default function ResponseDisplay({ response, endpointId }) {
  /**
   * État de collapse/expand
   * true = tout replié, false = tout déplié
   */
  const [isCollapsed, setIsCollapsed] = useState(false);

  /**
   * Si pas de réponse, afficher un message par défaut
   */
  if (!response) {
    return (
      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-500 text-sm">Aucune réponse à afficher</p>
      </div>
    );
  }

  /**
   * Si l'endpoint est "allMids", utiliser le composant spécialisé
   * qui affiche un résumé avec transformation des IDs en noms
   */
  if (endpointId === 'allMids') {
    return (
      <AllMidsResponseSummary 
        response={response} 
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
    );
  }

  /**
   * Pour les autres endpoints, afficher le JSON brut avec formatage
   */
  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* En-tête avec bouton collapse/expand */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">
          📋 Réponse de l'API
        </h3>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 
                     bg-white border border-gray-300 rounded hover:bg-gray-50 
                     transition-colors duration-150"
        >
          {isCollapsed ? '📖 Déplier' : '📕 Replier'}
        </button>
      </div>

      {/* Contenu de la réponse (visible si non replié) */}
      {!isCollapsed && (
        <div className="p-4">
          <JsonViewer data={response} />
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * COMPOSANT : JSON VIEWER
 * ============================================================================
 * 
 * Affiche un objet JSON de manière formatée et lisible
 * avec indentation, coloration syntaxique basique
 * 
 * @param {Object} props
 * @param {any} props.data - Les données JSON à afficher
 * @param {number} props.indent - Niveau d'indentation (usage interne)
 * 
 * @example
 * <JsonViewer data={{ name: "BTC", price: "65432.1" }} />
 */
function JsonViewer({ data, indent = 0 }) {
  /**
   * Calcul de l'indentation en pixels
   * Chaque niveau = 20px de décalage
   */
  const indentStyle = { paddingLeft: `${indent * 20}px` };

  /**
   * Si les données sont null ou undefined
   */
  if (data === null || data === undefined) {
    return (
      <div style={indentStyle} className="text-gray-400 font-mono text-sm">
        null
      </div>
    );
  }

  /**
   * Si c'est une string, afficher en vert avec guillemets
   */
  if (typeof data === 'string') {
    return (
      <div style={indentStyle} className="text-green-600 font-mono text-sm">
        "{data}"
      </div>
    );
  }

  /**
   * Si c'est un nombre, afficher en bleu
   */
  if (typeof data === 'number') {
    return (
      <div style={indentStyle} className="text-blue-600 font-mono text-sm">
        {data}
      </div>
    );
  }

  /**
   * Si c'est un boolean, afficher en orange
   */
  if (typeof data === 'boolean') {
    return (
      <div style={indentStyle} className="text-orange-600 font-mono text-sm">
        {data.toString()}
      </div>
    );
  }

  /**
   * Si c'est un array, afficher avec crochets [ ]
   */
  if (Array.isArray(data)) {
    return (
      <div style={indentStyle} className="font-mono text-sm">
        <span className="text-gray-600">[</span>
        {data.length === 0 ? (
          <span className="text-gray-400"> vide </span>
        ) : (
          <div className="ml-4">
            {data.map((item, index) => (
              <div key={index} className="my-1">
                <JsonViewer data={item} indent={indent + 1} />
                {index < data.length - 1 && <span className="text-gray-400">,</span>}
              </div>
            ))}
          </div>
        )}
        <span className="text-gray-600">]</span>
      </div>
    );
  }

  /**
   * Si c'est un objet, afficher avec accolades { }
   */
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    
    return (
      <div style={indentStyle} className="font-mono text-sm">
        <span className="text-gray-600">{'{'}</span>
        {keys.length === 0 ? (
          <span className="text-gray-400"> vide </span>
        ) : (
          <div className="ml-4">
            {keys.map((key, index) => (
              <div key={key} className="my-1">
                {/* Clé de l'objet en violet */}
                <span className="text-purple-600">"{key}"</span>
                <span className="text-gray-600">: </span>
                
                {/* Valeur de l'objet (récursif) */}
                <span className="inline-block">
                  <JsonViewer data={data[key]} indent={0} />
                </span>
                
                {index < keys.length - 1 && <span className="text-gray-400">,</span>}
              </div>
            ))}
          </div>
        )}
        <span className="text-gray-600">{'}'}</span>
      </div>
    );
  }

  /**
   * Fallback pour types non gérés
   */
  return (
    <div style={indentStyle} className="text-gray-600 font-mono text-sm">
      {String(data)}
    </div>
  );
}

/**
 * ============================================================================
 * COMPOSANT SPÉCIALISÉ : ALL MIDS RESPONSE SUMMARY
 * ============================================================================
 * 
 * Affichage optimisé pour les réponses de l'endpoint allMids
 * avec transformation automatique des Asset IDs en noms
 * 
 * FONCTIONNALITÉS :
 * -----------------
 * 1. Résumé du nombre d'assets retournés
 * 2. Transformation des IDs numériques en noms (0 → BTC)
 * 3. Affichage en grille responsive
 * 4. Recherche rapide dans la liste
 * 5. Mode collapse/expand
 * 
 * @param {Object} props
 * @param {Object} props.response - Réponse brute de allMids
 * @param {boolean} props.isCollapsed - État de collapse
 * @param {Function} props.onToggleCollapse - Callback pour toggle
 * 
 * @example
 * <AllMidsResponseSummary 
 *   response={{ "0": "65432.1", "27": "185.2" }}
 *   isCollapsed={false}
 *   onToggleCollapse={() => {}}
 * />
 */
function AllMidsResponseSummary({ response, isCollapsed, onToggleCollapse }) {
  /**
   * État pour le filtre de recherche
   */
  const [searchFilter, setSearchFilter] = useState('');

  /**
   * Transformation de la réponse avec le service de mapping
   * Convertit { "0": "65432.1" } en { "BTC": "65432.1" }
   */
  const transformedResponse = assetMapping.isLoaded 
    ? assetMapping.transformAllMidsResponse(response)
    : response;

  /**
   * Conversion en array pour filtrage et tri
   * Format: [{ asset: "BTC", price: "65432.1" }, ...]
   */
  const assetEntries = Object.entries(transformedResponse).map(([asset, price]) => ({
    asset,
    price
  }));

  /**
   * Filtrage basé sur la recherche
   * Recherche insensible à la casse dans le nom de l'asset
   */
  const filteredEntries = searchFilter
    ? assetEntries.filter(entry => 
        entry.asset.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : assetEntries;

  /**
   * Tri alphabétique par nom d'asset
   */
  const sortedEntries = [...filteredEntries].sort((a, b) => 
    a.asset.localeCompare(b.asset)
  );

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* ========== EN-TÊTE AVEC STATISTIQUES ========== */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <span>Prix de marché (Mid Prices)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {assetEntries.length} assets disponibles
              {searchFilter && ` • ${filteredEntries.length} résultats filtrés`}
            </p>
          </div>

          <button
            onClick={onToggleCollapse}
            className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 
                       bg-white border border-gray-300 rounded hover:bg-gray-50 
                       transition-colors duration-150"
          >
            {isCollapsed ? '📖 Déplier' : '📕 Replier'}
          </button>
        </div>

        {/* ========== BARRE DE RECHERCHE ========== */}
        {!isCollapsed && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="🔍 Rechercher un asset (ex: BTC, ETH, SOL...)"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-400"
            />
          </div>
        )}
      </div>

      {/* ========== CONTENU (GRILLE D'ASSETS) ========== */}
      {!isCollapsed && (
        <div className="p-4">
          {sortedEntries.length === 0 ? (
            // Message si aucun résultat après filtrage
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">
                Aucun asset trouvé pour "{searchFilter}"
              </p>
            </div>
          ) : (
            // Grille responsive d'assets
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sortedEntries.map(({ asset, price }) => (
                <AssetPriceCard 
                  key={asset} 
                  asset={asset} 
                  price={price} 
                />
              ))}
            </div>
          )}

          {/* ========== AFFICHAGE JSON BRUT (OPTIONNEL) ========== */}
          <details className="mt-6 border-t border-gray-200 pt-4">
            <summary className="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-800">
              🔧 Afficher la réponse JSON brute
            </summary>
            <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 overflow-x-auto">
              <JsonViewer data={transformedResponse} />
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * COMPOSANT : ASSET PRICE CARD
 * ============================================================================
 * 
 * Carte individuelle pour afficher un asset et son prix
 * 
 * @param {Object} props
 * @param {string} props.asset - Nom de l'asset (ex: "BTC")
 * @param {string} props.price - Prix de l'asset (ex: "65432.1")
 * 
 * @example
 * <AssetPriceCard asset="BTC" price="65432.1" />
 */
function AssetPriceCard({ asset, price }) {
  /**
   * Détermination de l'emoji selon l'asset
   * Quelques assets populaires ont des emojis personnalisés
   */
  const getAssetEmoji = (assetName) => {
    const emojiMap = {
      'BTC': '₿',
      'ETH': 'Ξ',
      'SOL': '◎',
      'USDT': '💵',
      'USDC': '💵',
      'BNB': '🔶',
      'XRP': '🌊',
      'ADA': '🔷',
      'DOGE': '🐶',
      'MATIC': '🟣',
    };

    return emojiMap[assetName] || '📈';
  };

  /**
   * Formatage du prix avec séparateurs de milliers
   * 65432.1 → 65,432.1
   */
  const formattedPrice = parseFloat(price).toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 4
  });

  return (
    <div className="p-3 bg-gradient-to-br from-gray-50 to-white border border-gray-200 
                    rounded-lg hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        {/* Nom de l'asset avec emoji */}
        <div className="flex items-center gap-2">
          <span className="text-xl">{getAssetEmoji(asset)}</span>
          <span className="font-semibold text-gray-800 text-sm">
            {asset}
          </span>
        </div>
      </div>

      {/* Prix */}
      <div className="mt-2">
        <span className="text-lg font-bold text-blue-600">
          ${formattedPrice}
        </span>
      </div>
    </div>
  );
}
