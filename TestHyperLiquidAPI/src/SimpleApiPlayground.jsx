import React, { useState } from 'react';

const ENDPOINTS = [
  {
    id: "test",
    label: "Test Endpoint",
    method: "GET",
    url: "https://api.github.com/zen",
    notes: "Simple test endpoint"
  },
  {
    id: "hyperliquid-mids",
    label: "Hyperliquid → allMids",
    method: "POST", 
    url: "https://api.hyperliquid.xyz/info",
    bodyTemplate: { type: "allMids" },
    notes: "Get all mid prices"
  }
];

function SimpleApiPlayground() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(ENDPOINTS[0]);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');

  async function executeRequest() {
    setLoading(true);
    setStatus('pending');
    setResponse(null);

    try {
      const options = {
        method: selectedEndpoint.method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (selectedEndpoint.method === 'POST' && selectedEndpoint.bodyTemplate) {
        options.body = JSON.stringify(selectedEndpoint.bodyTemplate);
      }

      const res = await fetch(selectedEndpoint.url, options);
      const data = await res.text();
      
      setStatus(`HTTP ${res.status}`);
      setResponse(data);
    } catch (error) {
      setStatus('error');
      setResponse(JSON.stringify({ error: error.message }, null, 2));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-3xl font-bold text-emerald-400 mb-2">
            🚀 API Playground
          </h1>
          <p className="text-gray-400">Test Hyperliquid & other APIs</p>
        </header>

        {/* Endpoint Selection */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Select Endpoint</h2>
          <div className="grid gap-4">
            <select 
              value={selectedEndpoint.id}
              onChange={(e) => setSelectedEndpoint(ENDPOINTS.find(ep => ep.id === e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              {ENDPOINTS.map(endpoint => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.label}
                </option>
              ))}
            </select>
            <p className="text-gray-400 text-sm">{selectedEndpoint.notes}</p>
          </div>
        </div>

        {/* Request Details */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Request</h2>
          <div className="space-y-3">
            <div>
              <span className="text-emerald-400 font-mono">{selectedEndpoint.method}</span>
              <span className="ml-2 text-gray-300">{selectedEndpoint.url}</span>
            </div>
            {selectedEndpoint.bodyTemplate && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Body:</p>
                <pre className="bg-gray-900 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(selectedEndpoint.bodyTemplate, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Execute Button */}
        <div className="text-center">
          <button
            onClick={executeRequest}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Executing...' : `Execute ${selectedEndpoint.method} Request`}
          </button>
          {status !== 'idle' && (
            <div className="mt-2 text-sm text-gray-400">
              Status: {status}
            </div>
          )}
        </div>

        {/* Response */}
        {response && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Response</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto max-h-96 whitespace-pre-wrap">
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default SimpleApiPlayground;