import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * COOKIE — API Playground (front‑only)
 * -------------------------------------------------------------
 * Objectif :
 * - Paramétrer des appels API (REST/WS) via un simple JSON de config
 * - Lancer la requête depuis l'UI et afficher la réponse (pretty JSON)
 * - Zéro dépendance externe (fetch/WebSocket natifs)
 * - Pensé pour Hyperliquid (REST /info + WS) mais ouvert à 0x / 1inch
 *
 * Utilisation (vite/CRA/Next) :
 *   1) Place ce fichier dans src/ (ou app/ si Next) — nom : ApiPlayground.jsx
 *   2) Importe-le dans ta page : <ApiPlayground />
 *   3) Lance et teste. Pas de backend requis.
 */

// ------------------------------
//  CONFIG — Exemple d'endpoints
// ------------------------------
const ENDPOINTS = [
  // --- Hyperliquid REST ---
  {
    id: "hl-allMids",
    label: "Hyperliquid /info → allMids (POST)",
    method: "POST",
    url: "https://api.hyperliquid.xyz/info",
    headers: { "content-type": "application/json" },
    // Pas de paramètres requis
    params: [],
    bodyTemplate: { type: "allMids" },
    notes: "Retourne les mid-prices pour toutes les paires.",
  },
  {
    id: "hl-userFills",
    label: "Hyperliquid /info → userFills (POST)",
    method: "POST",
    url: "https://api.hyperliquid.xyz/info",
    headers: { "content-type": "application/json" },
    params: [
      {
        name: "user",
        label: "User Address (0x…)",
        type: "string",
        required: true,
        placeholder: "0xabc…",
      },
      {
        name: "aggregateByTime",
        label: "Aggregate by time",
        type: "boolean",
        default: true,
      },
    ],
    bodyTemplate: { type: "userFills", user: "{{user}}", aggregateByTime: "{{aggregateByTime}}" },
    notes: "Historique des fills d'un utilisateur (si dispo)",
  },
  // --- Hyperliquid WS ---
  {
    id: "hl-ws-trades",
    label: "Hyperliquid WS → subscribe trades",
    method: "WS",
    url: "wss://api.hyperliquid.xyz/ws",
    params: [
      { name: "coin", label: "Coin", type: "select", options: ["BTC", "ETH", "SOL", "ARB"], default: "BTC" },
    ],
    initMessageTemplate: {
      method: "subscribe",
      subscription: { type: "trades", coin: "{{coin}}" },
    },
    notes: "Stream temps réel des trades pour une paire.",
  },
  // --- 0x Price (Base) ---
  {
    id: "0x-price-base",
    label: "0x Price (Base) — GET",
    method: "GET",
    url: "https://base.api.0x.org/swap/v1/price",
    headers: {},
    params: [
      { name: "buyToken", label: "buyToken", type: "string", default: "USDC" },
      { name: "sellToken", label: "sellToken", type: "string", default: "WETH" },
      { name: "sellAmount", label: "sellAmount (wei)", type: "string", default: "1000000000000000" },
    ],
    queryTemplate: { buyToken: "{{buyToken}}", sellToken: "{{sellToken}}", sellAmount: "{{sellAmount}}" },
    notes: "Quote indicative pour un swap sur Base via 0x.",
  },
  // --- 1inch v6 (Arbitrum) — note: clé API requise côté 1inch ---
  {
    id: "1inch-quote-arb",
    label: "1inch v6 Quote (Arbitrum) — GET (clé requise)",
    method: "GET",
    url: "https://api.1inch.dev/swap/v6.0/42161/quote",
    headers: { Authorization: "Bearer {{oneInchApiKey}}" },
    params: [
      { name: "oneInchApiKey", label: "1inch API Key", type: "string", secret: true, placeholder: "sk_…" },
      { name: "src", label: "src token (addr)", type: "string", default: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1" }, // WETH
      { name: "dst", label: "dst token (addr)", type: "string", default: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8" }, // USDC.e
      { name: "amount", label: "amount (wei)", type: "string", default: "1000000000000000" },
    ],
    queryTemplate: { src: "{{src}}", dst: "{{dst}}", amount: "{{amount}}" },
    notes: "Exemple pédagogique. Sans clé valide → 401. Évite d'exposer ta clé en prod.",
  },
];

// ------------------------------
//  Helpers (templating & fetch)
// ------------------------------
function deepReplace(value, map) {
  if (value == null) return value;
  if (typeof value === "string") {
    return value.replace(/{{(.*?)}}/g, (_, k) => {
      const key = k.trim();
      const v = map[key];
      return v === undefined || v === null ? "" : String(v);
    });
  }
  if (Array.isArray(value)) return value.map((v) => deepReplace(v, map));
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = deepReplace(v, map);
    return out;
  }
  return value;
}

function toQueryString(obj) {
  const p = new URLSearchParams();
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    p.set(k, String(v));
  });
  return p.toString();
}

function pretty(obj) {
  try {
    if (typeof obj === "string") {
      const maybe = JSON.parse(obj);
      return JSON.stringify(maybe, null, 2);
    }
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function useLocalState(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { 
      localStorage.setItem(key, JSON.stringify(val)); 
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, [key, val]);
  return [val, setVal];
}

// ------------------------------
//  UI Components (mini design system)
// ------------------------------
const Label = ({ children }) => (
  <label className="block text-sm text-gray-300 mb-1">{children}</label>
);
const Input = (props) => (
  <input
    {...props}
    className={(props.className || "") + " w-full rounded-xl bg-gray-900/60 border border-gray-700 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"}
  />
);
const Select = ({ options = [], ...props }) => (
  <select
    {...props}
    className={(props.className || "") + " w-full rounded-xl bg-gray-900/60 border border-gray-700 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"}
  >
    {options.map((o) => (
      <option key={String(o.value ?? o)} value={String(o.value ?? o)}>
        {String(o.label ?? o)}
      </option>
    ))}
  </select>
);
const Button = ({ children, ...props }) => (
  <button
    {...props}
    className={(props.className || "") + " rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 font-medium shadow-md disabled:opacity-60"}
  >
    {children}
  </button>
);
const Card = ({ title, children, right }) => (
  <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-gray-100 font-semibold">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

// ------------------------------
//  Main component
// ------------------------------
export default function ApiPlayground() {
  const [currentId, setCurrentId] = useLocalState("cookie.playground.endpoint", ENDPOINTS[0].id);
  const endpoint = useMemo(() => ENDPOINTS.find((e) => e.id === currentId) || ENDPOINTS[0], [currentId]);

  // Paramètres dynamiques
  const initialParams = useMemo(() => {
    const o = {};
    (endpoint.params || []).forEach((p) => {
      if (p.default !== undefined) o[p.name] = p.default;
      else if (p.type === "boolean") o[p.name] = false;
      else o[p.name] = "";
    });
    return o;
  }, [endpoint]);
  const [params, setParams] = useLocalState(`cookie.playground.params.${endpoint.id}`, initialParams);

  useEffect(() => {
    // reset params when endpoint changes
    setParams(initialParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint.id]);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  const [response, setResponse] = useState(null);
  const [durationMs, setDurationMs] = useState(0);

  // WebSocket state
  const wsRef = useRef(null);
  const [wsMessages, setWsMessages] = useState([]);
  const [wsOpen, setWsOpen] = useState(false);

  // Build request preview
  const requestPreview = useMemo(() => {
    const headers = deepReplace(endpoint.headers || {}, params);
    const body = deepReplace(endpoint.bodyTemplate || {}, params);
    const query = deepReplace(endpoint.queryTemplate || {}, params);
    let url = endpoint.url;
    if (endpoint.method === "GET" && query && Object.keys(query).length > 0) {
      const qs = toQueryString(query);
      url += (url.includes("?") ? "&" : "?") + qs;
    }
    const initMsg = deepReplace(endpoint.initMessageTemplate || {}, params);
    return { url, headers, body, query, initMsg };
  }, [endpoint, params]);

  async function runREST() {
    setLoading(true); setStatus("pending"); setResponse(null); const t0 = performance.now();
    try {
      const opts = { method: endpoint.method, headers: requestPreview.headers };
      if (endpoint.method === "POST") {
        opts.body = JSON.stringify(requestPreview.body ?? {});
      }
      const res = await fetch(requestPreview.url, opts);
      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json() : await res.text();
      setStatus(`HTTP ${res.status}`);
      setResponse(data);
    } catch (e) {
      setStatus("error");
      setResponse({ error: e?.message || String(e) });
    } finally {
      setDurationMs(Math.round(performance.now() - t0));
      setLoading(false);
    }
  }

  function openWS() {
    if (wsRef.current) {
      try { 
        wsRef.current.close(); 
      } catch (error) {
        console.warn('Failed to close WebSocket:', error);
      }
    }
    setWsMessages([]);
    setWsOpen(false);
    const ws = new WebSocket(endpoint.url);
    wsRef.current = ws;
    ws.onopen = () => {
      setWsOpen(true);
      const msg = JSON.stringify(requestPreview.initMsg || {});
      if (msg !== "{}") ws.send(msg);
    };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setWsMessages((prev) => [data, ...prev].slice(0, 200));
      } catch {
        setWsMessages((prev) => [ev.data, ...prev].slice(0, 200));
      }
    };
    ws.onerror = () => setWsOpen(false);
    ws.onclose = () => setWsOpen(false);
  }

  function closeWS() {
    if (wsRef.current) {
      try { 
        wsRef.current.close(); 
      } catch (error) {
        console.warn('Failed to close WebSocket:', error);
      }
      wsRef.current = null;
    }
  }

  const isWS = endpoint.method === "WS";

  return (
    <div className="min-h-screen bg-black text-gray-200 p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-emerald-400">COOKIE · API Playground</h1>
        <div className="text-xs text-gray-400">front‑only • fetch/WebSocket • dark + emerald</div>
      </header>

      {/* Endpoint selector */}
      <Card title="Endpoint">
        <div className="grid md:grid-cols-2 gap-4 items-end">
          <div>
            <Label>Choisir</Label>
            <Select
              value={currentId}
              onChange={(e) => setCurrentId(e.target.value)}
              options={ENDPOINTS.map((e) => ({ value: e.id, label: e.label }))}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <div className="text-sm text-gray-400">{endpoint.notes || "—"}</div>
          </div>
        </div>
      </Card>

      {/* Params */}
      <Card title="Paramètres">
        <div className="grid md:grid-cols-3 gap-4">
          {(endpoint.params || []).map((p) => (
            <div key={p.name}>
              <Label>
                {p.label || p.name}
                {p.required ? <span className="text-rose-400"> *</span> : null}
              </Label>
              {p.type === "select" ? (
                <Select
                  value={params[p.name] ?? ""}
                  onChange={(e) => setParams({ ...params, [p.name]: e.target.value })}
                  options={(p.options || []).map((o) => ({ value: o, label: o }))}
                />
              ) : p.type === "boolean" ? (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!params[p.name]}
                    onChange={(e) => setParams({ ...params, [p.name]: e.target.checked })}
                  />
                  <span className="text-sm text-gray-300">{String(params[p.name])}</span>
                </div>
              ) : (
                <Input
                  type={p.secret ? "password" : "text"}
                  value={params[p.name] ?? ""}
                  onChange={(e) => setParams({ ...params, [p.name]: e.target.value })}
                  placeholder={p.placeholder}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Request preview */}
      <Card title="Aperçu de la requête">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">URL</div>
            <pre className="bg-gray-950/70 border border-gray-800 rounded-xl p-3 overflow-auto text-xs whitespace-pre-wrap break-all">
              {requestPreview.url}
            </pre>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Headers</div>
            <pre className="bg-gray-950/70 border border-gray-800 rounded-xl p-3 overflow-auto text-xs">{pretty(requestPreview.headers)}</pre>
          </div>
        </div>
        {endpoint.method === "POST" && (
          <div className="mt-4">
            <div className="text-xs text-gray-400 mb-1">Body</div>
            <pre className="bg-gray-950/70 border border-gray-800 rounded-xl p-3 overflow-auto text-xs">{pretty(requestPreview.body)}</pre>
          </div>
        )}
        {endpoint.method === "WS" && (
          <div className="mt-4">
            <div className="text-xs text-gray-400 mb-1">Message d'init (WS)</div>
            <pre className="bg-gray-950/70 border border-gray-800 rounded-xl p-3 overflow-auto text-xs">{pretty(requestPreview.initMsg)}</pre>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {!isWS ? (
          <Button onClick={runREST} disabled={loading}>
            {loading ? "En cours…" : `${endpoint.method} → Exécuter`}
          </Button>
        ) : (
          <>
            {!wsOpen ? (
              <Button onClick={openWS}>WS → Connecter & Souscrire</Button>
            ) : (
              <Button onClick={closeWS} className="bg-rose-600 hover:bg-rose-500">WS → Fermer</Button>
            )}
          </>
        )}
        <div className="text-sm text-gray-400">{status !== "idle" ? `${status} · ${durationMs} ms` : "—"}</div>
      </div>

      {/* Response */}
      {!isWS ? (
        <Card title="Réponse">
          <pre className="bg-gray-950/70 border border-gray-800 rounded-xl p-3 overflow-auto text-xs min-h-[160px]">
            {response ? pretty(response) : "—"}
          </pre>
        </Card>
      ) : (
        <Card
          title={`Messages WebSocket ${wsOpen ? "(connecté)" : "(déconnecté)"}`}
          right={<span className="text-xs text-gray-400">dernier en haut</span>}
        >
          <div className="space-y-2 max-h-[420px] overflow-auto">
            {wsMessages.length === 0 && (
              <div className="text-sm text-gray-500">— En attente de messages —</div>
            )}
            {wsMessages.map((m, i) => (
              <pre key={i} className="bg-gray-950/70 border border-gray-800 rounded-xl p-3 overflow-auto text-xs">
                {pretty(m)}
              </pre>
            ))}
          </div>
        </Card>
      )}

      {/* Footer tips */}
      <div className="text-xs text-gray-500 leading-relaxed">
        <p className="mb-1">⚠️ CORS : certains endpoints refusent les appels front (réponse bloquée par le navigateur). Pour dev local, tu peux utiliser un proxy de dev (vite devServer proxy) ou passer par un widget (ex: LI.FI) jusqu'à ce qu'on ajoute un mini-backend.</p>
        <p className="mb-1">🔐 Clés API : n'expose jamais une clé sensible dans un repo public. Pour 1inch v6, mets la clé seulement en local et enlève-la avant commit.</p>
        <p>🧪 Ajoute tes propres endpoints en dupliquant les objets du tableau ENDPOINTS (GET/POST/WS). Les placeholders {`{{param}}`} seront remplacés par les champs ci-dessus.</p>
      </div>
    </div>
  );
}
