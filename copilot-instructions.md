# GitHub Copilot — Instructions du dépôt

**Emplacement recommandé :** `.github/copilot-instructions.md` (à la racine du repo).  
**But :** guider Copilot pour développer une intégration *front‑end* Hyperliquid (Vite + React, JavaScript), sans serveur ni Python.

---

## 1) Contexte du projet
- Nom : **COOKIE** — agrégateur de stratégies financières côté client.
- Stack : **Vite + React (JavaScript/JSX)**, pas de back‑end pour l’instant.
- Cible : **Hyperliquid** (testnet par défaut) pour : **Lecture** (Info API), **Temps réel** (WebSocket), **Actions signées** (Exchange).
- UI : thème sombre avec accent **#10B981** (vert émeraude).

**Objectif immédiat :** fournir des composants React minimaux et sûrs pour lire des données, s’abonner aux flux, et envoyer un ordre en testnet en signant via un wallet navigateur (MetaMask/WalletConnect).

---

## 2) Contraintes & règles *à respecter*
- **Aucun code côté serveur**. **Aucune clé privée** dans le code ; signature **uniquement** via le wallet du navigateur.
- **Par défaut : TESTNET**. Prévoir un commutateur `IS_TESTNET` pour basculer vers le mainnet.
- **Endpoints** :
  - Info : `https://api.hyperliquid-testnet.xyz/info` (ou `https://api.hyperliquid.xyz/info` en mainnet)
  - WebSocket : `wss://api.hyperliquid-testnet.xyz/ws` (ou `wss://api.hyperliquid.xyz/ws`)
- **Exchange** : utiliser un client qui **sait signer** via le wallet (ex. SDK TS communautaire `@nktkas/hyperliquid`). **Jamais** de secret exposé.
- **Gestion d’erreurs & limites** : journaliser proprement les rejeux de **nonce**, erreurs de **permissions**, **solde** insuffisant, et respecter les **rate‑limits**. Réessayer de façon progressive et informative côté UI.
- **Qualité code** : ES Modules, `async/await`, fetch natif, hooks React (pas de classes), commentaires pédagogiques, petits composants.

---

## 3) Structure & fichiers attendus
Créer/tenir à jour :

```
src/
  lib/
    hlEndpoints.js       // IS_TESTNET + URLs INFO_URL / WS_URL
    infoClient.js        // fetch POST générique vers /info
    exchangeClient.js    // client Exchange (signature wallet navigateur)
  components/
    InfoPanel.jsx        // Lecture (meta + l2Book ETH)
    LiveTicker.jsx       // WebSocket (trades ETH ou l2Book/candles)
    TradeButton.jsx      // Actions signées (ordre limite testnet)
  app.css                // thème sombre + accent #10B981
  App.jsx                // assemble les 3 portes d’entrée
```

---

## 4) Modèles que Copilot doit réutiliser

### 4.1 Endpoints (Testnet/Mainnet)
```js
// src/lib/hlEndpoints.js
export const IS_TESTNET = true; // passe à false pour le mainnet

export const INFO_URL = IS_TESTNET
  ? 'https://api.hyperliquid-testnet.xyz/info'
  : 'https://api.hyperliquid.xyz/info';

export const WS_URL = IS_TESTNET
  ? 'wss://api.hyperliquid-testnet.xyz/ws'
  : 'wss://api.hyperliquid.xyz/ws';
```

### 4.2 Lecture (Info API)
```js
// src/lib/infoClient.js
import { INFO_URL } from './hlEndpoints';

export async function infoQuery(payload) {
  const res = await fetch(INFO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur Info API');
  return res.json();
}

export const META_PAYLOAD   = { type: 'meta' };
export const L2_ETH_PAYLOAD = { type: 'l2Book', coin: 'ETH' };
```

```jsx
// src/components/InfoPanel.jsx
import { useEffect, useState } from 'react';
import { infoQuery, META_PAYLOAD, L2_ETH_PAYLOAD } from '../lib/infoClient';

export default function InfoPanel() {
  const [meta, setMeta] = useState(null);
  const [l2, setL2]     = useState(null);
  const [error, setError]= useState(null);

  useEffect(() => {
    (async () => {
      try {
        setMeta(await infoQuery(META_PAYLOAD));
        setL2(await infoQuery(L2_ETH_PAYLOAD));
      } catch (e) { setError(e.message); }
    })();
  }, []);

  if (error) return <div>Erreur: {error}</div>;
  return (
    <div className="panel">
      <h2>Lecture — Info API</h2>
      <pre>{meta ? JSON.stringify(meta, null, 2) : 'Chargement...'}</pre>
      <pre>{l2   ? JSON.stringify(l2,   null, 2) : 'Chargement...'}</pre>
    </div>
  );
}
```

### 4.3 Temps réel (WebSocket)
```jsx
// src/components/LiveTicker.jsx
import { useEffect, useRef, useState } from 'react';
import { WS_URL } from '../lib/hlEndpoints';

export default function LiveTicker() {
  const [events, setEvents] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({
        method: 'subscribe',
        subscription: { type: 'trades', coin: 'ETH' }
      }));
    };
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        setEvents(prev => [msg, ...prev].slice(0, 10));
      } catch (e) { console.warn('WS parse error', e); }
    };
    return () => ws.close();
  }, []);

  return (
    <div className="panel">
      <h2>Temps réel — Trades ETH</h2>
      <ul>{events.map((e, i) => <li key={i}><pre>{JSON.stringify(e, null, 2)}</pre></li>)}</ul>
    </div>
  );
}
```

### 4.4 Actions signées (Exchange, testnet)
> Utiliser un client qui **sait signer via MetaMask**. Ne jamais exposer de secrets.

```js
// src/lib/exchangeClient.js
import * as hl from '@nktkas/hyperliquid';
import { IS_TESTNET } from './hlEndpoints';

let exchangeClient = null;
export async function getExchangeClient() {
  if (exchangeClient) return exchangeClient;
  const transport = new hl.HttpTransport({ isTestnet: IS_TESTNET });
  exchangeClient = new hl.ExchangeClient({ transport });
  await exchangeClient.ready(); // prépare signer & état interne (wallet web)
  return exchangeClient;
}

export async function placeLimitOrder({ assetIndex, sideBuy, price, size }) {
  const exch = await getExchangeClient();
  return exch.order({
    orders: [{
      a: assetIndex, b: sideBuy, p: String(price), s: String(size),
      r: false, t: { limit: { tif: 'Gtc' } }
    }],
    grouping: 'na'
  });
}
```

```jsx
// src/components/TradeButton.jsx
import { useState, useEffect } from 'react';
import { infoQuery, META_PAYLOAD } from '../lib/infoClient';
import { placeLimitOrder } from '../lib/exchangeClient';

export default function TradeButton() {
  const [assets, setAssets] = useState([]);
  const [msg, setMsg]       = useState('');

  useEffect(() => {
    (async () => {
      const meta = await infoQuery(META_PAYLOAD);
      const list = (meta.assets || meta).map((a, i) => ({
        name: a?.name || a?.coin || 'UNK', index: a?.index ?? i
      }));
      setAssets(list);
    })();
  }, []);

  async function buyBTC() {
    try {
      const btc = assets.find(a => a.name === 'BTC') || assets[0];
      if (!btc) return setMsg('Aucun actif disponible.');
      const res = await placeLimitOrder({ assetIndex: btc.index, sideBuy: true, price: 30000, size: 0.01 });
      setMsg('Ordre envoyé: ' + JSON.stringify(res));
    } catch (e) { setMsg('Erreur envoi ordre: ' + e.message); }
  }

  return (
    <div className="panel">
      <h2>Actions signées — Ordre limite (Testnet)</h2>
      <button onClick={buyBTC}>Acheter 0.01 BTC @ 30000</button>
      <p><small>{msg}</small></p>
    </div>
  );
}
```

---

## 5) Style, ergonomie & accessibilité
- Thème sombre, accent **#10B981**, boutons lisibles, `:hover` et focus visibles.
- `pre { white-space: pre-wrap; word-break: break-word; }` pour afficher les JSON correctement.
- Découper en petits composants avec **props** explicites.
- Ajouter des **toasts**/messages clairs en cas d’erreur (nonce, permissions, solde).

---

## 6) Sécurité & bonnes pratiques
- **Jamais** de private key ni de secret dans le repo. Signature **via wallet** uniquement.
- **API wallet autorisé** côté app Hyperliquid (More → API) avant toute action.
- **Testnet d’abord**. Ajouter un **switch** évident Testnet/Mainnet.
- Respecter **rate‑limits** et politiques WS (reconnexion progressive, pas de spam d’abonnements).
- Ne **réutilise pas** un agent/API wallet désinscrit. Logguer les erreurs de **nonce** et guider l’utilisateur.

---

## 7) Ce que Copilot doit faire *par défaut*
- Proposer d’abord des **exemples testnet** (lecture → WS → action signée).
- Produire du **JSX** clair, commenté, et **exécutable** tel quel dans Vite.
- Utiliser les fichiers et chemins ci‑dessus **sans changer la structure**.
- Générer des **messages d’erreur utiles** et non verbeux, avec actions suggérées.
- Quand la tâche implique l’Exchange, **rappeler la création/autorisation de l’API wallet**.

---

## 8) Commit/PR (guidelines)
- **Commit** : messages concis, en français, au présent, ex. : `feat(api): lecture meta + carnet L2 (ETH)`
- **PR description** : *Contexte* → *Changements* → *Tests* → *Risques/CORS* → *Screenshots* (si UI).

---

## 9) Tâches types (prompts réutilisables)
- *“Ajoute un composant `PositionsPanel.jsx` qui lit l’état utilisateur (testnet), l’affiche en tableau, et gère les erreurs.”*
- *“Implémente `CandleViewer.jsx` : abonnement WS `candle` pour `ETH`, conserve les 100 dernières bougies, affiche OHLC.”*
- *“Ajoute un bouton `CancelAll.jsx` pour annuler **tous** les ordres ouverts (testnet) avec confirmation UI.”*

---

## 10) À éviter
- TypeScript si non demandé, libs exotiques, styles inline lourds.
- Appels `fetch` directs pour l’**Exchange** (privilégier un client qui sait **signer via wallet**).
- Réponses non actionnables ou sans gestion d’erreur.

---

> **Rappel** : ce dépôt est *front‑end only*. Toute logique sensible (clés/secret) est interdite ici. L’apprentissage se fait en **Testnet**, puis bascule contrôlée vers le **Mainnet**.
