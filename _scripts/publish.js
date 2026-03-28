#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const type = process.argv[2];

if (!type || !['find-it', 'crossword'].includes(type)) {
  console.error('Usage: node _scripts/publish.js <find-it|crossword>');
  process.exit(1);
}

// ── Queue ──────────────────────────────────────────────────────────────────
const queuePath = path.join(ROOT, '_data', 'queue.json');
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));

const idx = queue.findIndex(p => p.type === type);
if (idx === -1) {
  console.log(`No ${type} puzzle in queue. Nothing to publish.`);
  process.exit(0);
}
const puzzle = queue[idx];

// ── Date ───────────────────────────────────────────────────────────────────
const now = new Date();
const dateStr = now.toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles'
});

// ── Thumbnails ─────────────────────────────────────────────────────────────
function findItThumb() {
  // 4-row solve pattern: rows of mixed tiles, last row all-green
  const G = '#538d4e', Y = '#c47f17', A = '#6c6c6c';
  const rows = [
    [A, Y, A, A, A],
    [A, G, A, Y, A],
    [A, G, G, A, Y],
    [G, G, G, G, G],
  ];
  let rects = '';
  rows.forEach((row, r) => {
    row.forEach((fill, c) => {
      rects += `<rect x="${c * 9}" y="${r * 9}" width="8" height="8" fill="${fill}"/>`;
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="35" viewBox="0 0 44 35">${rects}</svg>`;
}

function crosswordThumb() {
  const BLK = '#1e3a5f', WHT = '#f0f4f8';
  const grid = [
    [WHT, WHT, WHT, BLK, WHT],
    [WHT, BLK, WHT, WHT, WHT],
    [WHT, WHT, WHT, WHT, WHT],
    [WHT, WHT, BLK, WHT, WHT],
    [WHT, WHT, WHT, WHT, BLK],
  ];
  let rects = '';
  grid.forEach((row, r) => {
    row.forEach((fill, c) => {
      rects += `<rect x="${c * 9}" y="${r * 9}" width="8" height="8" fill="${fill}" stroke="#cbd5e1" stroke-width="0.5"/>`;
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">${rects}</svg>`;
}

const thumb     = type === 'find-it' ? findItThumb() : crosswordThumb();
const typeLabel = type === 'find-it' ? 'Find It!' : 'Crossword';

// ── Card HTML ──────────────────────────────────────────────────────────────
const card =
`      <a href="${puzzle.file}" class="group rounded-xl overflow-hidden bg-white border border-stone-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
        <div class="bg-[#1e3a5f] py-8 flex items-center justify-center">
          ${thumb}
        </div>
        <div class="p-5 flex flex-col gap-1">
          <span class="text-xs font-semibold uppercase tracking-wide text-[#9b2226]">${typeLabel}</span>
          <h3 class="font-serif text-lg font-bold text-stone-900 group-hover:text-[#9b2226] transition-colors">${puzzle.name}</h3>
          <p class="text-stone-400 text-xs">${dateStr}</p>
        </div>
      </a>`;

// ── Inject into puzzles.html ───────────────────────────────────────────────
const htmlPath = path.join(ROOT, 'puzzles.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const START = '<!-- PUZZLE_CARDS_START -->';
const END   = '<!-- PUZZLE_CARDS_END -->';
const si = html.indexOf(START);
const ei = html.indexOf(END);
if (si === -1 || ei === -1) {
  console.error('PUZZLE_CARDS_START/END markers not found in puzzles.html');
  process.exit(1);
}

const existing = html.slice(si + START.length, ei).trim();
const newCards  = existing ? `\n${card}\n${existing}\n      ` : `\n${card}\n      `;
html = html.slice(0, si + START.length) + newCards + html.slice(ei);

// Remove the "no puzzles yet" placeholder after first publish
html = html.replace(/[ \t]*<!-- NO_PUZZLES_START -->[\s\S]*?<!-- NO_PUZZLES_END -->\n?/, '');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`Published: ${puzzle.name} (${dateStr})`);

// ── Update queue ───────────────────────────────────────────────────────────
queue.splice(idx, 1);
fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2) + '\n', 'utf8');
console.log(`Queue: ${queue.length} puzzle(s) remaining`);
