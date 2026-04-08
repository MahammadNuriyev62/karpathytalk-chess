/**
 * SVG rendering for chess board cells, status bar, and buttons.
 * Uses proper SVG path-based chess pieces for crisp rendering at any size.
 */

const CELL = 60;
const LIGHT = '#f0d9b5';
const DARK = '#b58863';
const SEL_COLOR = '#bbcb2b';
const LAST_COLOR = '#cdd16a';
const CHECK_COLOR = '#e86464';

// ---------------------------------------------------------------------------
// SVG piece paths — designed for a 45x45 viewBox, centered in cell
// Based on standard chess piece silhouettes (cburnett style, simplified)
// ---------------------------------------------------------------------------
const PIECE_PATHS = {
  // King
  K: `<g transform="translate(7.5,7.5) scale(1)">
    <path d="M22.5 11.63V6M20 8h5" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
      fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7"
      fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0"
      stroke="{stroke}" stroke-width="1" fill="none"/>
  </g>`,

  // Queen
  Q: `<g transform="translate(7.5,7.5) scale(1)">
    <circle cx="6" cy="12" r="2.75" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>
    <circle cx="14" cy="9" r="2.75" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>
    <circle cx="22.5" cy="8" r="2.75" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>
    <circle cx="31" cy="9" r="2.75" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>
    <circle cx="39" cy="12" r="2.75" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>
    <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-3.5-7-3 7-3.5-7L14 25 6.5 13.5 9 26z"
      fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"
      fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12.5 30c5.5-3 14.5-3 20 0M12 33.5c6-3 15-3 21 0"
      fill="none" stroke="{stroke}" stroke-width="1"/>
  </g>`,

  // Rook
  R: `<g transform="translate(7.5,7.5) scale(1)">
    <path d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z"
      fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 29.5v-13h17v13H14z"
      fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 16.5L11 14h23l-3 2.5H14z"
      fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M11 14V9h4v2h5V9h5v2h5V9h4v5H11z"
      fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 36v-4h21v4H12zM14 29.5v-13h17v13H14z"
      stroke="{stroke}" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`,

  // Bishop
  B: `<g transform="translate(7.5,7.5) scale(1)">
    <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z"
      fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"
      fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"
      fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M17.5 26h10M15 30h15"
      fill="none" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`,

  // Knight
  N: `<g transform="translate(7.5,7.5) scale(1)">
    <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"
      fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"
      fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="25" r="1" fill="{stroke}"/>
    <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" fill="{stroke}" stroke="{stroke}"/>
  </g>`,

  // Pawn
  P: `<g transform="translate(7.5,7.5) scale(1)">
    <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39h23.5C34.5 31.58 30.09 27.09 27.09 26.03 28.56 24.84 29.5 23.03 29.5 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
      fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round"/>
  </g>`,
};

/**
 * Render piece SVG with the right colors.
 */
function renderPiece(piece) {
  const isWhite = piece === piece.toUpperCase();
  const type = piece.toUpperCase();
  const template = PIECE_PATHS[type];
  if (!template) return '';

  const fill = isWhite ? '#fff' : '#333';
  const stroke = isWhite ? '#222' : '#222';

  let svg = template
    .replace(/\{fill\}/g, fill)
    .replace(/\{stroke\}/g, stroke);

  // For black pieces, add extra inner detail lines in lighter color
  if (!isWhite) {
    svg = template
      .replace(/\{fill\}/g, '#333')
      .replace(/\{stroke\}/g, '#111');
  }

  return svg;
}

/**
 * Render a single board square as SVG.
 */
export function cellSvg({
  piece = null,
  isLight = true,
  isSelected = false,
  isValidMove = false,
  isLastMove = false,
  isCheck = false,
  isCapture = false,
}) {
  let bg = isLight ? LIGHT : DARK;
  if (isSelected) bg = SEL_COLOR;
  else if (isLastMove) bg = LAST_COLOR;
  if (isCheck) bg = CHECK_COLOR;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL}" height="${CELL}" viewBox="0 0 ${CELL} ${CELL}">`;
  svg += `<rect width="${CELL}" height="${CELL}" fill="${bg}"/>`;

  // Valid move indicator
  if (isValidMove) {
    if (isCapture) {
      svg += `<circle cx="${CELL / 2}" cy="${CELL / 2}" r="${CELL / 2 - 3}" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="3.5"/>`;
    } else {
      svg += `<circle cx="${CELL / 2}" cy="${CELL / 2}" r="${CELL / 6}" fill="rgba(0,0,0,0.25)"/>`;
    }
  }

  // Draw piece
  if (piece) {
    svg += renderPiece(piece);
  }

  svg += '</svg>';
  return svg;
}

/**
 * Render the full 8x8 board as a single SVG.
 * @param {function} getCellInfo - (squareName) => cell info object
 */
export function boardSvg(getCellInfo) {
  const size = CELL * 8;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

  const files = 'abcdefgh';
  for (let ri = 0; ri < 8; ri++) {
    const rank = 8 - ri;
    for (let fi = 0; fi < 8; fi++) {
      const sq = files[fi] + rank;
      const info = getCellInfo(sq);

      // Background
      let bg = info.isLight ? LIGHT : DARK;
      if (info.isSelected) bg = SEL_COLOR;
      else if (info.isLastMove) bg = LAST_COLOR;
      if (info.isCheck) bg = CHECK_COLOR;

      const x = fi * CELL;
      const y = ri * CELL;

      svg += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="${bg}"/>`;

      // Valid move indicator
      if (info.isValidMove) {
        if (info.isCapture) {
          svg += `<circle cx="${x + CELL / 2}" cy="${y + CELL / 2}" r="${CELL / 2 - 3}" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="3.5"/>`;
        } else {
          svg += `<circle cx="${x + CELL / 2}" cy="${y + CELL / 2}" r="${CELL / 6}" fill="rgba(0,0,0,0.25)"/>`;
        }
      }

      // Piece
      if (info.piece) {
        svg += `<g transform="translate(${x},${y})">${renderPiece(info.piece)}</g>`;
      }
    }
  }

  // Coordinate labels
  for (let fi = 0; fi < 8; fi++) {
    const isLight = (fi + 0) % 2 === 1; // bottom row parity
    const color = isLight ? DARK : LIGHT;
    svg += `<text x="${fi * CELL + CELL - 3}" y="${size - 3}" font-size="11" font-family="system-ui,sans-serif" font-weight="700" text-anchor="end" fill="${color}">${files[fi]}</text>`;
  }
  for (let ri = 0; ri < 8; ri++) {
    const rank = 8 - ri;
    const isLight = (0 + rank - 1) % 2 === 1; // left column parity
    const color = isLight ? DARK : LIGHT;
    svg += `<text x="3" y="${ri * CELL + 13}" font-size="11" font-family="system-ui,sans-serif" font-weight="700" fill="${color}">${rank}</text>`;
  }

  svg += '</svg>';
  return svg;
}

/**
 * Transparent click target — 60x60 fully transparent SVG.
 * All 64 table cells use the same URL, so the browser caches it once.
 */
export function clickTargetSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL}" height="${CELL}" viewBox="0 0 ${CELL} ${CELL}"><rect width="${CELL}" height="${CELL}" fill="transparent"/></svg>`;
}

/**
 * Render a status bar SVG.
 */
export function statusSvg(message, color = '#ecf0f1') {
  const w = CELL * 8;
  const h = 36;
  const escaped = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<rect width="${w}" height="${h}" rx="4" fill="#302e2b"/>` +
    `<text x="${w / 2}" y="${h / 2 + 6}" font-size="15" font-family="system-ui,sans-serif" ` +
    `font-weight="600" text-anchor="middle" fill="${color}">${escaped}</text>` +
    `</svg>`
  );
}

/**
 * Render a "New Game" button SVG.
 */
export function newGameBtnSvg() {
  const w = 140, h = 36;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<rect width="${w}" height="${h}" rx="6" fill="#81b64c"/>` +
    `<text x="${w / 2}" y="${h / 2 + 6}" font-size="14" font-family="system-ui,sans-serif" ` +
    `font-weight="700" text-anchor="middle" fill="#fff">↻ New Game</text>` +
    `</svg>`
  );
}
