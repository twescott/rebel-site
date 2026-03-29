#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT      = path.join(__dirname, '..');
const postsDir  = path.join(ROOT, 'posts');
const outputPath = path.join(ROOT, '_data', 'posts.json');

const files = fs.readdirSync(postsDir)
  .filter(f => f.endsWith('.md'))
  .sort()
  .reverse(); // newest first

const posts = files.map(filename => {
  const raw = fs.readFileSync(path.join(postsDir, filename), 'utf8');
  const fm  = parseFrontMatter(raw);
  return {
    slug:    filename.replace(/\.md$/, ''),
    title:   fm.title   || filename.replace(/\.md$/, ''),
    date:    fm.date    || '',
    author:  fm.author  || '',
    excerpt: fm.excerpt || '',
    image:   fm.image   || '',
  };
});

fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2) + '\n');
console.log(`posts.json: ${posts.length} post(s)`);

function parseFrontMatter(text) {
  const fm = {};
  const m  = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return fm;
  m[1].split(/\r?\n/).forEach(line => {
    const i = line.indexOf(': ');
    if (i < 1) return;
    const key = line.slice(0, i).trim();
    const val = line.slice(i + 2).trim().replace(/^"(.*)"$/, '$1');
    fm[key] = val;
  });
  return fm;
}
