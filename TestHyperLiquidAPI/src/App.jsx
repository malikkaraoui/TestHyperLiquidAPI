import { useState } from 'react'
import './App.css'

function App() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('allMids');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  const endpoints = [
    { id: 'allMids', name: 'All Mids - Prix du marché', body: { type: 'allMids' } },
    { id: 'meta', name: 'Meta - Métadonnées', body: { type: 'meta' } },
    { id: 'metaPerp', name: 'Afficher PERP - Liste PERP disponibles', body: { type: 'meta' } },
    { id: 'metaSpot', name: 'Afficher SPOT - Liste SPOT disponibles', body: { type: 'metaAndAssetCtxs' } },
    { id: 'l2Book', name: 'L2 Book - Carnet d\'ordres', body: { type: 'l2Book', coin: 'BTC' } },
  ];

  async function sendRequest() {
    setLoading(true);
    setResponse(null);

    try {
      const endpoint = endpoints.find(e => e.id === selectedEndpoint);
      
      const res = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(endpoint.body)
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  }

  // =====================================================================
  // Récupère la liste des marchés PERP ou SPOT via metaAndAssetCtxs
  // Robustesse: tente plusieurs structures possibles et fallback en brut
  // =====================================================================
  async function fetchAndListMarkets(kind) {
    setListLoading(true);
    setResponse(null);
    try {
      const res = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'metaAndAssetCtxs' })
      });
      const data = await res.json();

      // Extraction univers + contextes (plusieurs formes possibles)
      const universe = data?.universe || data?.meta?.universe || [];
      const ctxs = data?.assetCtxs || data?.ctxs || [];

      let results = [];
      if (Array.isArray(universe) && Array.isArray(ctxs) && universe.length === ctxs.length) {
        results = universe.map((asset, idx) => ({ asset, ctx: ctxs[idx] }))
          .filter(({ ctx }) => {
            // Détection de type PERP/SPOT selon différents schémas rencontrés
            const isPerp = ctx?.isPerp === true || ctx?.perp !== undefined || ctx?.type === 'perp' || ctx?.pf?.type === 'perp';
            const isSpot = ctx?.isSpot === true || ctx?.spot !== undefined || ctx?.type === 'spot' || ctx?.pf?.type === 'spot';
            return kind === 'perp' ? isPerp : isSpot;
          })
          .map(({ asset }) => asset?.name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
      }

      // Si parsing réussi, retourner liste compacte, sinon brut
      if (results.length > 0) {
        setResponse({
          kind,
          count: results.length,
          markets: results
        });
      } else {
        setResponse({ note: 'Structure inattendue, affichage brut', data });
      }
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setListLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <h1 className="text-3xl font-bold text-center mb-8">Hyperliquid API</h1>

        {/* Sélection de requête */}
        <div className="bg-gray-800 rounded-lg p-6">
          <label className="block text-sm font-medium mb-3">Sélectionner une requête</label>
          <select 
            value={selectedEndpoint}
            onChange={(e) => setSelectedEndpoint(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
          >
            {endpoints.map(ep => (
              <option key={ep.id} value={ep.id}>{ep.name}</option>
            ))}
          </select>

          {/* Boutons rapides PERP / SPOT */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => fetchAndListMarkets('perp')}
              disabled={listLoading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded"
            >
              {listLoading ? 'Chargement PERP...' : 'Afficher PERP (liste dispo)'}
            </button>
            <button
              onClick={() => fetchAndListMarkets('spot')}
              disabled={listLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded"
            >
              {listLoading ? 'Chargement SPOT...' : 'Afficher SPOT (liste dispo)'}
            </button>
          </div>
        </div>

        {/* Bouton Envoyer */}
        <button
          onClick={sendRequest}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 
                     text-white px-6 py-3 rounded-lg font-semibold"
        >
          {loading ? 'Envoi en cours...' : 'Envoyer'}
        </button>

        {/* Zone de réponse JSON */}
        {response && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3">Réponse JSON</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto max-h-96 text-green-400">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;