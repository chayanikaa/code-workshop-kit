import commandLineArgs from 'command-line-args';
import { createRequire } from 'module';
import path from 'path';
import {
  createFileControlMiddleware,
  createInsertAppShellMiddleware,
  createWorkshopImportReplaceMiddleware,
  noCacheMiddleware,
} from './middlewares/middlewares.js';

const require = createRequire(import.meta.url);
const { createConfig, readCommandLineArgs, commandLineOptions } = require('es-dev-server');
const startEdsServer = require('es-dev-server').startServer;

export const startServer = (opts = {}) => {
  // cwk defaults
  let cwkConfig = {
    cwkShell: false,
    rootFolder: '/',
    appIndex: './index.html',
    ...opts,
  };

  const cwkServerDefinitions = [
    ...commandLineOptions,
    {
      name: 'cwk-shell',
      type: Boolean,
      description: `If set, inject a cwk-app-shell component into your app index html file,
which gives you a bunch of visual tools for your workshop in the browser`,
    },
  ];

  // If cli was used, read flags, both for cwk and eds flags
  if (opts.argv) {
    cwkConfig = {
      ...cwkConfig,
      ...commandLineArgs(cwkServerDefinitions, { argv: opts.argv }),
      ...readCommandLineArgs(opts.argv),
    };
    cwkConfig.rootFolder = path.resolve('/', path.dirname(cwkConfig.appIndex));

    // TODO: reuse logic that eds readCommandLineUses to camelCase the cwk flags instead of syncing them here
    cwkConfig.appIndex = cwkConfig['app-index'];
    cwkConfig.cwkShell = cwkConfig['cwk-shell'];
  }

  // eds defaults & middlewares
  const edsConfig = {
    open: true,
    watch: false,
    moduleDirs: ['node_modules'],
    nodeResolve: true,
    logErrorsToBrowser: true,
    middlewares: [
      ...(cwkConfig.cwkShell ? [createInsertAppShellMiddleware(cwkConfig.appIndex)] : []),
      createWorkshopImportReplaceMiddleware(cwkConfig.rootFolder),
      noCacheMiddleware,
      createFileControlMiddleware('js', { admin: true }),
      createFileControlMiddleware('html', { admin: true }),
    ],
  };

  const config = createConfig({
    ...edsConfig,
    ...cwkConfig,
  });

  startEdsServer(config);

  ['exit', 'SIGINT'].forEach(event => {
    process.on(event, () => {
      process.exit(0);
    });
  });
};