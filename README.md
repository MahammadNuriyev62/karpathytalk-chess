# ♟ KarpathyTalk Chess

A community chess board playable inside a [KarpathyTalk](https://karpathytalk.com) post — no JavaScript, no HTML, no iframes. Pure GFM markdown.

## How it works

Each cell of the chess board is a linked SVG image inside a GFM markdown table:

```
[![](https://server/c/gameId/e2)](https://server/k/gameId/e2)
```

- **Cell images** are dynamically rendered SVGs showing the current piece, highlights, and move indicators
- **Clicking a cell** navigates to the server, which processes the selection or move, then **redirects back** to the post
- **On page reload**, images re-fetch with `no-cache` headers, showing the updated board

The entire game runs server-side. The post is static markdown — the "interactivity" comes from dynamic images + redirect-on-click.

## Play

1. Go to **https://karpathytalk-chess-production.up.railway.app**
2. Enter your KarpathyTalk post URL
3. Copy the generated markdown into your post
4. Anyone who visits can make the next move!

## Run locally

```bash
npm install
node server.js
```

Server starts on `http://localhost:3000`.

## Deploy

Runs on any Node.js host. Deployed on [Railway](https://railway.app) — no request limits, no cold starts.

```bash
railway up
```

## Tech

- **Node.js** — zero dependencies beyond `chess.js`
- **chess.js** — game logic, move validation, checkmate/draw detection
- **SVG** — board and pieces rendered as vector graphics (cburnett-style piece paths)
- **In-memory storage** — game state stored in a `Map` with 30-day TTL
