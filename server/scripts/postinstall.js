const { spawn } = require('child_process');
const path = require('path');

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: true,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function main() {
  try {
    const clientDir = path.resolve(__dirname, '..', '..', 'client');
    console.log('Running client install in', clientDir);
    await runCommand('npm', ['install'], clientDir);
    console.log('Building client');
    await runCommand('npm', ['run', 'build'], clientDir);
    console.log('Client build completed');
  } catch (err) {
    console.warn('Client postinstall helper failed (this is non-fatal):', err.message);
    console.warn('You can still run `cd client && npm install && npm run build` manually.');
    process.exit(0);
  }
}

main();
