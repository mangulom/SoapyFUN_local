const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const python = path.join(root, '.venv', 'Scripts', 'python.exe');

if (!fs.existsSync(python)) {
  console.error('No se encontró .venv\\Scripts\\python.exe. Consulta el README para crear el entorno con Python 3.11.8.');
  process.exit(1);
}

const version = execFileSync(python, ['--version'], { encoding: 'utf8' }).trim();
if (version !== 'Python 3.11.8') {
  console.error(`Se requiere Python 3.11.8 y el entorno usa: ${version}`);
  process.exit(1);
}

const api = spawn(python, [path.join(root, 'backend', 'run.py')], { cwd: root, stdio: 'inherit' });
api.on('exit', (code) => process.exit(code ?? 0));
