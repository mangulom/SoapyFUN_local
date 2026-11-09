const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const processes = [
  spawn(process.execPath, [path.join(root, 'scripts', 'start-api.js')], { cwd: root, stdio: 'inherit' }),
  spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'start:web'], {
    cwd: root,
    stdio: 'inherit'
  })
];

function stop() {
  processes.forEach((child) => child.kill());
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
processes.forEach((child) => child.on('exit', (code) => {
  if (code && code !== 0) {
    stop();
    process.exit(code);
  }
}));
