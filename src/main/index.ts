import './lib/util/defaultEnvVars';
import './lib/util/UlixeeLogger';
import '@ulixee/commons/lib/SourceMapSupport';
import UlixeeConfig from '@ulixee/commons/config';
import { app } from 'electron';
import { loadEnv } from '@ulixee/commons/lib/envUtils';
import { Menubar } from './lib/Menubar';
import { version } from '../../package.json';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
process.env.DEVTOOLS_PORT ??= '8315';
loadEnv(UlixeeConfig.global.directoryPath);

app.commandLine.appendSwitch('remote-debugging-port', process.env.DEVTOOLS_PORT);

const menubar = new Menubar({
  width: 300,
  height: 300,
  tooltip: 'Ulixee',
});

menubar.on('ready', () => {
  // eslint-disable-next-line no-console
  console.log('RUNNING ULIXEE DESKTOP', version);
});

const root = __dirname;

export { root, version };
