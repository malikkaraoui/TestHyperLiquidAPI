import { useState } from 'react'
import './App.css'

function App() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('allMids');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const endpoints = [
    { id: 'allMids', name: 'All Mids - Prix du marché', body: { type: 'allMids' } },
    { id: 'meta', name: 'Meta - Métadonnées', body: { type: 'meta' } },
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