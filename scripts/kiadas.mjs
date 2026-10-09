// A weboldal kiadása: lefordítja az oldalt, és a dist mappát tiszta gh-pages ágként feltölti.
// Használat: npm run kiadas   (a bot címe: VITE_API_URL környezeti változó vagy .env.production)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = 'https://github.com/TompaTamas/ICON-LSPD.git';
const AUTHOR = ['-c', 'user.name=TompaTamas', '-c', 'user.email=132494543+TompaTamas@users.noreply.github.com', '-c', 'core.autocrlf=false'];
const dist = path.resolve('dist');
const run = (cmd, args, cwd = process.cwd(), shell = false) => execFileSync(cmd, args, { cwd, stdio: 'inherit', shell });

// Az npx Windowson .cmd fájl, ezért azt parancsértelmezőn át indítjuk; a git-et közvetlenül (így a szóközös üzenet egyben marad).
run('npx vite build', [], process.cwd(), true);
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
fs.rmSync(path.join(dist, '.git'), { recursive: true, force: true });

const git = (...args) => run('git', args, dist);
git('init', '-q');
git('checkout', '-q', '-b', 'gh-pages');
git(...AUTHOR, 'add', '-A');
git(...AUTHOR, 'commit', '-q', '-m', 'Weboldal kiadása');
git('push', '-q', '-f', REPO, 'gh-pages');
fs.rmSync(path.join(dist, '.git'), { recursive: true, force: true });

console.log('\nKész: https://tompatamas.github.io/ICON-LSPD/ (1-2 perc, mire a GitHub frissíti)');
