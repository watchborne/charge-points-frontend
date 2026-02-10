# 🎨 Frontend Simple - HTTP Only

Dashboard Next.js minimaliste qui récupère les bornes via **HTTP GET uniquement**.

## 🎯 Fonctionnalités

- ✅ Récupération des bornes via `GET http://localhost:3000/api/charge-points`
- ✅ **Auto-refresh toutes les 5 secondes**
- ✅ Affichage des statistiques (total, en ligne, disponibles, en charge, pannes)
- ✅ Cartes de bornes avec statuts colorés
- ✅ Bouton de rafraîchissement manuel
- ✅ **Pas de WebSocket, pas de HTTPS, pas de certificats SSL !**

## 🚀 Installation

```bash
npm install
```

## ▶️ Démarrage

```bash
npm run dev
```

Le dashboard sera accessible sur **http://localhost:3001**

## ⚙️ Configuration

Le fichier `.env.local` contient l'URL du backend :

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Important :** On utilise **HTTP** et pas HTTPS pour éviter les problèmes de certificats SSL.

## 🔧 Modification du Backend pour HTTP

Pour que ça marche, ton backend doit aussi écouter en **HTTP** sur le port 3000.

Modifie `backend/src/server.js` pour utiliser HTTP au lieu de HTTPS :

```javascript
import http from 'http';
import { createApiServer } from './api/server.js';

// Créer le serveur Fastify SANS HTTPS
const fastify = await createApiServer(); // Retire les httpsOptions

// Démarrer en HTTP
await fastify.listen({ port: 3000, host: '0.0.0.0' });

const httpServer = fastify.server;

// Le reste du code OCPP reste pareil
```

Ou utilise les 2 ports :
- **Port 3000 HTTP** : Pour l'API REST (dashboard)
- **Port 3001 HTTPS** : Pour OCPP (bornes)

## 📊 Comment ça marche

### 1. Chargement initial

Au montage du composant, on fetch les bornes :

```typescript
const data = await api.getChargePoints();
// GET http://localhost:3000/api/charge-points
```

### 2. Auto-refresh

Un `setInterval` rafraîchit les données toutes les 5 secondes :

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    loadChargePoints();
  }, 5000);

  return () => clearInterval(interval);
}, []);
```

### 3. Affichage

Les bornes sont affichées dans une grille responsive avec :
- Badge de statut coloré
- Informations métadonnées (vendor, model, firmware)
- Temps depuis le dernier heartbeat

## 🎨 Composants

```
app/
├── page.tsx              # Page principale avec stats et grille
├── layout.tsx            # Layout global
└── globals.css           # Styles Tailwind

components/
├── ChargePointCard.tsx   # Card d'une borne
└── StatusBadge.tsx       # Badge de statut coloré

lib/
├── api.ts                # Client API HTTP
└── utils.ts              # Utilitaires

types/
└── index.ts              # Types TypeScript
```

## 🧪 Test

1. **Lance le backend en HTTP** (modifié pour HTTP)
2. **Lance le frontend** : `npm run dev`
3. **Ouvre** http://localhost:3001
4. **Vérifie** que les bornes se chargent

Si tu vois "Impossible de charger les bornes" → Le backend ne répond pas sur http://localhost:3000

## 🔍 Debug

### Erreur : "Failed to fetch"

```bash
# Vérifier que le backend répond
curl http://localhost:3000/api/charge-points

# Devrait retourner un array JSON
```

### Pas de bornes affichées

Lance le simulateur pour créer des bornes de test :

```bash
cd simulator
npm run simulate
```

### CORS Error

Si tu vois une erreur CORS dans la console, ajoute CORS au backend :

```javascript
import cors from '@fastify/cors';

await fastify.register(cors, {
  origin: 'http://localhost:3001'
});
```

## ✨ Fonctionnalités

- ✅ **Simple** : Juste du HTTP GET, pas de WebSocket
- ✅ **Rapide** : Auto-refresh toutes les 5s
- ✅ **Responsive** : S'adapte mobile/desktop
- ✅ **Stats en temps réel** : Calculées côté client
- ✅ **Pas de SSL** : Fonctionne sur tous les navigateurs sans warning

## 📈 Améliorations Futures

- [ ] Pagination si beaucoup de bornes
- [ ] Filtres par statut
- [ ] Recherche par ID
- [ ] Tri par colonne
- [ ] Export CSV

---

**C'est tout !** Un frontend ultra-simple qui fait juste des requêtes HTTP GET. Pas de WebSocket, pas de SSL, juste du polling toutes les 5 secondes. 🚀
