const { notarize } = require('@electron/notarize');
const binary = require('binary-info');
const { Arch } = require('electron-builder');
const { fdir } = require('fdir');
const { execSync } = require('node:child_process');
const { unlinkSync } = require('node:fs');
const Path = require('path');

module.exports = {
  appId: 'dev.ulixee.desktop',
  productName: 'Ulixee',
  directories: {
    buildResources: 'build-resources',
  },
  files: [
    'package.json',
    '!packages/**',
    '!dist',
    'main/**',
    'ui/**',
    'resources/*',
    '!.vscode',
    '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
    '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
    '!**/node_modules/*.d.ts',
    '!**/node_modules/.bin',
  ],
  // asar: false,
  asarUnpack: ['resources/**', 'ui/**', '**/*.node', '**/connect'],
  npmRebuild: true,
  nativeRebuilder: 'parallel',
  mac: {
    defaultArch: 'arm64',
    category: 'public.app-category.developer-tools',
    target: {
      target: 'default',
      arch: ['x64', 'arm64'],
    },
    hardenedRuntime: true,
    gatekeeperAssess: false,
    extendInfo: {
      LSUIElement: 1,
    },
    entitlements: 'build-resources/entitlements.mac.plist',
    entitlementsInherit: 'build-resources/entitlements.mac.plist',
    notarize: false, // do this manually
  },
  win: {
    target: 'NSIS',
  },
  linux: {
    category: 'Development',
    target: 'AppImage',
  },
  publish: {
    provider: 'github',
    releaseType: 'release',
  },
  fileAssociations: [
    {
      ext: 'argon',
      name: 'ARGON',
      description: 'Argon Cash',
      icon: 'arg',
      rank: 'Owner',
    },
  ],
  async beforePack(context) {
    const path = require.resolve('@ulixee/unblocked-agent-mitm-socket/install.js');
    console.log('Running install script', path);
    execSync(`node install.js`, {
      cwd: Path.dirname(path),
      stdio: 'inherit',
      env: {
        ...process.env,
        npm_config_target_arch: Arch[context.arch],
        npm_config_target_platform: context.electronPlatformName,
        npm_config_cpu: Arch[context.arch],
        npm_config_os: context.electronPlatformName,
      },
    });
  },
  async afterPack(context) {
    console.log('Removing incompatible binaries', context.appOutDir);
    const dirs = new fdir()
      .withFullPaths()
      .filter(path => binary.isIncompatible(path, context.electronPlatformName, Arch[context.arch]))
      .crawl(context.appOutDir)
      .sync();
    for (const file of dirs) {
      try {
        unlinkSync(file);
        console.log('Deleted incompatible binary', file.split(Path.sep).slice(-2).join(Path.sep));
      } catch (e) {
        console.error('Unable to delete file', file, e);
      }
    }
  },
  async afterSign(context) {
    const { electronPlatformName, appOutDir } = context;

    if (
      electronPlatformName !== 'darwin' ||
      process.env.SKIP_NOTARIZE ||
      process.env.CSC_IDENTITY_AUTO_DISCOVERY === 'false'
    ) {
      return;
    }

    const appName = context.packager.appInfo.productFilename;

    return await notarize({
      tool: 'notarytool',
      appPath: `${appOutDir}/${appName}.app`,
      appleApiKey: '~/.private_keys/AuthKey_27VRA75WCS.p8',
      appleApiKeyId: '27VRA75WCS',
      appleApiIssuer: 'a89474ed-637f-4cf0-8429-da45ef388882',
      // teamId: 'DY8K483XWV',
    });
  },
};
