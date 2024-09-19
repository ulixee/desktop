import * as Fs from 'node:fs';
import { existsSync } from 'node:fs';
import * as Path from 'node:path';
import { resolve } from 'node:path';

const dest = Path.join(__dirname, '..', 'packages');
const pathToPlatform = resolve(__dirname, '../../platform');
const pathToHero = resolve(__dirname, '../../hero');

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

    const packageName = packageJson.name?.replace('@ulixee', '');

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
          name: packageJson.name,
          version: packageJson.version,
          dependencies: packageJson.dependencies,
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
if (!existsSync(Path.join(pathToPlatform, buildDir))) {
  throw new Error(`The build directory does not exist: ${buildDir}`);
}
const baseBuild = Path.join(pathToPlatform, buildDir);
copyDir(baseBuild);
if (buildDir === 'build' && existsSync(Path.join(pathToHero, buildDir))) {
  copyDir(Path.join(pathToHero, buildDir));
  // copyDir(`${baseBuild}/../mainchain/localchain`);
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

// eslint-disable-next-line no-console
console.log('Copied files to dest');
