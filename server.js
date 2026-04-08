/**
 * KarpathyTalk Chess — standalone Node.js server for Railway.
 *
 * A community chess board inside a GFM markdown post.
 * Each cell is a linked SVG image. Clicking navigates here,
 * the move is processed, and the user is redirected back.
 */

import { createServer } from 'node:http';
import { Chess } from 'chess.js';
import { cellSvg, boardSvg, statusSvg, newGameBtnSvg } from './src/svg.js';

// ---------------------------------------------------------------------------
// Game storage (in-memory)
// ---------------------------------------------------------------------------
const games = new Map();
const GAME_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

function cleanupGames() {
  const now = Date.now();
  for (const [id, game] of games) {
    if (now - game.created > GAME_TTL) games.delete(id);
  }
}
setInterval(cleanupGames, 60 * 60 * 1000); // hourly

function getGame(id) { return games.get(id) || null; }

function saveGame(id, game) {
  game.created = game.created || Date.now();
  games.set(id, game);
}

function randomId() {
  return Math.random().toString(36).slice(2, 7); // 5 chars
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isLightSquare(sq) {
  const file = sq.charCodeAt(0) - 97;
  const rank = parseInt(sq[1]) - 1;
  return (file + rank) % 2 === 1;
}

function getCellInfo(game, squareName) {
  const chess = new Chess(game.fen);
  const piece = chess.get(squareName);
  const selected = game.selected;
  const lastMove = game.lastMove;

  const validTargets = new Set();
  if (selected) {
    for (const m of chess.moves({ square: selected, verbose: true })) {
      validTargets.add(m.to);
    }
  }

  let isCheck = false;
  if (piece && piece.type === 'k' && piece.color === chess.turn() && chess.isCheck()) {
    isCheck = true;
  }

  return {
    piece: piece ? (piece.color === 'w' ? piece.type.toUpperCase() : piece.type) : null,
    isLight: isLightSquare(squareName),
    isSelected: selected === squareName,
    isValidMove: validTargets.has(squareName),
    isLastMove: lastMove && (lastMove.from === squareName || lastMove.to === squareName),
    isCheck,
    isCapture: validTargets.has(squareName) && piece !== null,
  };
}

function getStatusMessage(game) {
  const chess = new Chess(game.fen);
  if (chess.isCheckmate()) {
    const winner = chess.turn() === 'w' ? 'Black' : 'White';
    return { msg: `Checkmate — ${winner} wins!`, color: '#2ecc71' };
  }
  if (chess.isStalemate()) return { msg: 'Stalemate — Draw!', color: '#f39c12' };
  if (chess.isInsufficientMaterial()) return { msg: 'Draw — Insufficient material', color: '#f39c12' };
  if (chess.isDraw()) return { msg: 'Draw!', color: '#f39c12' };

  const turn = chess.turn() === 'w' ? 'White' : 'Black';
  if (chess.isCheck()) {
    return { msg: `${turn} is in CHECK — ${turn}'s move`, color: '#e74c3c' };
  }
  const moveNum = chess.moveNumber();
  return { msg: `Move ${moveNum} — ${turn} to play`, color: '#ecf0f1' };
}

function generateMarkdown(gameId, serverUrl) {
  const s = serverUrl.replace(/\/$/, '');
  const lines = [];

  lines.push(`## ♟ Community Chess\n`);
  lines.push(`![s](${s}/s/${gameId})\n`);

  const cols = 'abcdefgh'.split('');
  lines.push('||' + cols.map(c => `**${c}**`).join('|') + '|');
  lines.push('|:-:|' + ':-:|'.repeat(8));

  for (let rank = 8; rank >= 1; rank--) {
    let row = `|**${rank}**|`;
    for (const file of cols) {
      const sq = file + rank;
      row += `[![](${s}/c/${gameId}/${sq})](${s}/k/${gameId}/${sq})|`;
    }
    lines.push(row);
  }

  lines.push('');
  lines.push(`[![](${s}/btn/new)](${s}/reset/${gameId})`);
  lines.push('');
  lines.push('*Click a piece, then click where to move it.*');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Request handling
// ---------------------------------------------------------------------------
function svgResponse(res, svg, cache = false) {
  res.writeHead(200, {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': cache
      ? 'public, max-age=31536000, immutable'
      : 'no-cache, no-store, must-revalidate, max-age=0',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(svg);
}

function redirectResponse(res, url) {
  res.writeHead(302, { Location: url });
  res.end();
}

function htmlResponse(res, html) {
  res.writeHead(200, { 'Content-Type': 'text/html;charset=UTF-8' });
  res.end(html);
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const params = new URLSearchParams(body);
      resolve(Object.fromEntries(params));
    });
  });
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------
function handleCell(res, gameId, square) {
  const game = getGame(gameId);
  if (!game) {
    return svgResponse(res, cellSvg({ piece: null, isLight: isLightSquare(square) }));
  }
  return svgResponse(res, cellSvg(getCellInfo(game, square)));
}

function handleClick(res, gameId, square) {
  const game = getGame(gameId);
  if (!game) { res.writeHead(404); res.end('Game not found'); return; }

  const returnUrl = game.returnUrl;
  const chess = new Chess(game.fen);

  if (chess.isGameOver()) {
    return redirectResponse(res, returnUrl);
  }

  const selected = game.selected;
  const piece = chess.get(square);
  const currentTurn = chess.turn();

  if (selected) {
    let moveResult = null;
    try {
      moveResult = chess.move({ from: selected, to: square, promotion: 'q' });
    } catch (e) { /* invalid move */ }

    if (moveResult) {
      game.fen = chess.fen();
      game.lastMove = { from: selected, to: square };
      game.selected = null;
    } else {
      if (piece && piece.color === currentTurn) {
        game.selected = square;
      } else {
        game.selected = null;
      }
    }
  } else {
    if (piece && piece.color === currentTurn) {
      game.selected = square;
    }
  }

  saveGame(gameId, game);
  return redirectResponse(res, returnUrl);
}

function handleStatus(res, gameId) {
  const game = getGame(gameId);
  if (!game) {
    return svgResponse(res, statusSvg('Game not found', '#e74c3c'));
  }
  const { msg, color } = getStatusMessage(game);
  return svgResponse(res, statusSvg(msg, color));
}

function handleReset(res, gameId) {
  const game = getGame(gameId);
  if (!game) { res.writeHead(404); res.end('Game not found'); return; }

  const chess = new Chess(game.fen);
  if (!chess.isGameOver()) {
    return redirectResponse(res, game.returnUrl);
  }

  game.fen = new Chess().fen();
  game.selected = null;
  game.lastMove = null;
  saveGame(gameId, game);
  return redirectResponse(res, game.returnUrl);
}

async function handleCreate(req, res) {
  const body = await parseBody(req);
  const returnUrl = (body.return_url || '').trim();
  if (!returnUrl) return handleIndex(res, null);

  const gameId = randomId();
  const game = {
    fen: new Chess().fen(),
    selected: null,
    returnUrl,
    lastMove: null,
    created: Date.now(),
  };
  saveGame(gameId, game);

  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const serverUrl = `${proto}://${host}`;
  const markdown = generateMarkdown(gameId, serverUrl);
  return handleIndex(res, markdown);
}

function handleIndex(res, markdown) {
  const mdBlock = markdown
    ? `<div class="output">
        <label>Copy this into your KarpathyTalk post:</label>
        <textarea readonly onclick="this.select()">${markdown.replace(/</g, '&lt;')}</textarea>
        <p class="note">Paste this as the body of your post. The board is live — anyone who visits can play!</p>
      </div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>KarpathyTalk Chess</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #1a1a2e; color: #eee;
         display: flex; justify-content: center; padding: 2rem; min-height: 100vh; }
  .container { max-width: 640px; width: 100%; }
  h1 { font-size: 2rem; margin-bottom: 0.5rem; }
  .subtitle { color: #888; margin-bottom: 2rem; }
  label { display: block; margin-bottom: 0.3rem; font-weight: 600; }
  input[type=text] { width: 100%; padding: 0.6rem; border-radius: 6px;
         border: 1px solid #444; background: #16213e; color: #eee; font-size: 1rem;
         margin-bottom: 1rem; }
  button { padding: 0.7rem 1.5rem; border: none; border-radius: 6px;
           background: #27ae60; color: #fff; font-size: 1rem; font-weight: 600;
           cursor: pointer; }
  button:hover { background: #2ecc71; }
  .output { margin-top: 1.5rem; }
  textarea { width: 100%; height: 400px; font-family: monospace; font-size: 0.85rem;
             padding: 1rem; border-radius: 6px; background: #0f3460; color: #e8e8e8;
             border: 1px solid #444; resize: vertical; }
  .note { color: #888; font-size: 0.85rem; margin-top: 0.5rem; }
  .how { margin-top: 2rem; padding: 1.5rem; background: #16213e; border-radius: 8px; }
  .how h2 { font-size: 1.2rem; margin-bottom: 0.5rem; }
  .how ol { padding-left: 1.2rem; }
  .how li { margin-bottom: 0.4rem; color: #ccc; }
</style>
</head>
<body>
<div class="container">
  <h1>♟ KarpathyTalk Chess</h1>
  <p class="subtitle">A community chess board inside a markdown post. Anyone can make the next move!</p>
  <form method="post" action="/create">
    <label for="url">Your KarpathyTalk post URL</label>
    <input type="text" id="url" name="return_url"
           placeholder="https://karpathytalk.com/post/your-post-slug" required>
    <button type="submit">Generate Markdown</button>
  </form>
  ${mdBlock}
  <div class="how">
    <h2>How it works</h2>
    <ol>
      <li>Create a post on KarpathyTalk (can be empty initially).</li>
      <li>Copy the post URL and paste it above.</li>
      <li>Click <strong>Generate Markdown</strong> to get the game board.</li>
      <li>Edit your post and paste the markdown.</li>
      <li>Anyone who visits can play! It's a shared board — take turns.</li>
    </ol>
  </div>
</div>
</body>
</html>`;

  return htmlResponse(res, html);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const CELL_RE = /^\/c\/([a-z0-9]+)\/([a-h][1-8])(?:\.svg)?$/;
const CLICK_RE = /^\/k\/([a-z0-9]+)\/([a-h][1-8])$/;
const STATUS_RE = /^\/s\/([a-z0-9]+)(?:\.svg)?$/;
const BOARD_RE = /^\/b\/([a-z0-9]+)(?:\.svg)?$/;
const RESET_RE = /^\/reset\/([a-z0-9]+)$/;
const BTN_RE = /^\/btn\/new(?:\.svg)?$/;

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  let match;

  try {
    if (req.method === 'GET' && (match = path.match(CELL_RE))) {
      return handleCell(res, match[1], match[2]);
    }
    if (req.method === 'GET' && (match = path.match(CLICK_RE))) {
      return handleClick(res, match[1], match[2]);
    }
    if (req.method === 'GET' && (match = path.match(STATUS_RE))) {
      return handleStatus(res, match[1]);
    }
    if (req.method === 'GET' && (match = path.match(BOARD_RE))) {
      const game = getGame(match[1]);
      if (!game) {
        return svgResponse(res, boardSvg((sq) => ({ piece: null, isLight: isLightSquare(sq) })));
      }
      return svgResponse(res, boardSvg((sq) => getCellInfo(game, sq)));
    }
    if (req.method === 'GET' && BTN_RE.test(path)) {
      return svgResponse(res, newGameBtnSvg(), true);
    }
    if (req.method === 'GET' && (match = path.match(RESET_RE))) {
      return handleReset(res, match[1]);
    }
    if (req.method === 'POST' && path === '/create') {
      return handleCreate(req, res);
    }
    if (req.method === 'GET' && path === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', games: games.size }));
    }
    if (req.method === 'GET' && (path === '/' || path === '')) {
      return handleIndex(res, null);
    }
    res.writeHead(404);
    res.end('Not found');
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end('Internal error');
  }
});

const PORT = parseInt(process.env.PORT || '3000');
server.listen(PORT, () => {
  console.log(`Chess server running on port ${PORT}`);
});
