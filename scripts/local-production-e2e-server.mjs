import { spawn } from 'node:child_process';

const port = process.env.LOCAL_PRODUCTION_E2E_PORT ?? '3004';
const e2eEnvironment = {
  ...process.env,
  AUTH_TRUST_HOST: 'true',
  NEXTAUTH_URL: `http://localhost:${port}`,
  E2E_HTTP_LOCAL: 'true',
  E2E_TEST_CODE: '424242',
};
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args) {
  return spawn(command, args, {
    env: e2eEnvironment,
    shell: process.platform === 'win32',
    stdio: 'inherit',
    windowsHide: true,
  });
}

const build = run(npmCommand, ['run', 'build']);
const stop = () => {
  if (!build.killed) build.kill();
  server?.kill();
};
let server;
process.once('SIGINT', stop);
process.once('SIGTERM', stop);

build.once('exit', (code, signal) => {
  if (code !== 0 || signal) {
    process.exitCode = code ?? 1;
    return;
  }

  server = run(npmCommand, ['run', 'start', '--', '-p', port]);
  server.once('exit', (serverCode, serverSignal) => {
    if (!serverSignal) process.exitCode = serverCode ?? 1;
  });
});
