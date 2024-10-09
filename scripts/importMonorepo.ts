import * as Fs from 'node:fs';
import { existsSync } from 'node:fs';
import * as Path from 'node:path';
import { resolve } from 'node:path';

const dest = Path.join(__dirname, '..', 'packages');
const pathToPlatform = resolve(__dirname, '../../platform');
const pathToHero = resolve(__dirname, '../../hero');
const pathToMainchain = resolve(__dirname, '../../mainchain');

const dirsNotToInclude = new Set([
  'node_modules',
  'packages',
  'playground',
  'end-to-end',
  'website',
  'chrome-extension',
  'databroker',
  'databroker-admin',
  'docs',
  'localchain/npm',
  'localchain/apple',
  'localchain/android',
  'double-agent',
  'browser-emulator-builder',
  'browser-profiler',
  'double-agent-stacks',
  'testing',
  'desktop/chrome-extension',
  'examples',
  'test',
  'tools',
  'ui',
  'tsconfig.json',
  '.rs',
  '.go',
  '.toml',
  '.sh',
  '.sql',
  'CHANGELOG.md',
  'yarn.lock',
  '.config.js',
  'package.build.json',
  'package.dist.json',
  '.config.js.map',
  '.config.d.ts',
  '__test__',
]);

function copyDir(baseDir: string, outPath?: string): void {
  if (!Fs.existsSync(baseDir)) return;

  const packageJson = Fs.existsSync(`${baseDir}/package.json`)
    ? JSON.parse(Fs.readFileSync(`${baseDir}/package.json`, 'utf8'))
    : { private: false, name: '' };

  for (const dirOrFile of Fs.readdirSync(baseDir)) {
    const dirPath = `${baseDir}/${dirOrFile}`;
    if (
      (dirOrFile.startsWith('.') && !dirOrFile.startsWith('.env')) ||
      dirsNotToInclude.has(dirOrFile) ||
      [...dirsNotToInclude].some(x => dirPath.endsWith(x))
    )
      continue;

    const packageName = packageJson.name?.replace('@ulixee', '').replace('@argonprotocol', '');

    const packageDir = packageName ? `${dest}/${packageName}` : outPath;
    if (Fs.statSync(dirPath).isDirectory()) {
      copyDir(dirPath, `${packageDir}/${dirOrFile}`);
    } else if (
      !packageJson.private ||
      !packageJson.workspaces ||
      packageJson.workspaces?.length === 0
    ) {
      if (!Fs.existsSync(packageDir)) Fs.mkdirSync(packageDir, { recursive: true });
      if (dirOrFile === 'package.json') {
        const finalPackageJson = {
          ...packageJson,
          devDependencies: {},
        };
        Fs.writeFileSync(`${packageDir}/${dirOrFile}`, JSON.stringify(finalPackageJson, null, 2));
        continue;
      }
      Fs.copyFileSync(dirPath, `${packageDir}/${dirOrFile}`);
    }
  }
}

if (!existsSync(pathToPlatform)) {
  throw new Error(`The platform directory does not exist: ${pathToPlatform}`);
}

const buildDir = process.argv[2] ?? 'build';
console.log('Importing Platform into Desktop, buildDir=', buildDir);
if (!existsSync(Path.join(pathToPlatform, buildDir))) {
  throw new Error(`The build directory does not exist: ${buildDir}`);
}
const baseBuild = Path.join(pathToPlatform, buildDir);
copyDir(baseBuild);

if (existsSync(pathToMainchain)) {
  console.log('Importing Mainchain into Desktop, buildDir=', buildDir);
  const platformPackageJson = JSON.parse(Fs.readFileSync(`${pathToPlatform}/package.json`, 'utf8'));
  const platformWorkspaces = Array.isArray(platformPackageJson.workspaces)
    ? platformPackageJson.workspaces
    : platformPackageJson.workspaces.packages;
  console.log('platformWorkspaces=', platformWorkspaces);
  if (platformWorkspaces?.length) {
    if (platformWorkspaces.some(x => x.includes('localchain'))) {
      console.log('Importing Localchain into Desktop, buildDir=', buildDir);
      copyDir(`${pathToMainchain}/localchain`);
    }
  }
}

if (existsSync(Path.join(pathToHero, buildDir))) {
  console.log('Importing Hero into Desktop, buildDir=', buildDir);
  copyDir(Path.join(pathToHero, buildDir));
  copyDir(`${pathToHero}/browser-emulator-builder/data`, `${dest}/default-browser-emulator/data`);
  Fs.writeFileSync(
    `${dest}/default-browser-emulator/paths.json`,
    JSON.stringify({
      'emulator-data': './data',
    }),
  );
  Fs.writeFileSync(
    `${dest}/real-user-agents/paths.json`,
    JSON.stringify({
      data: './data',
    }),
  );
}

const chromeVersions = resolve(__dirname, '../../chrome-versions');
if (existsSync(chromeVersions)) {
  copyDir(Path.join(chromeVersions, 'packages', 'chrome-app'), `${dest}/chrome-app`);
}

// eslint-disable-next-line no-console
console.log(`Copied files to ${dest}`);
