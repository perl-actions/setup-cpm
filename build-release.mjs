#!/usr/bin/env node

import esbuild from 'esbuild';

const config = {
  entryPoints:  ['src/action.mjs'],
  format:       'esm',
  outdir:       'dist',
  outExtension: { '.js': '.mjs' },
  bundle:       true,
  platform:     'node',
  target:       ['node24'],
  minify:       true,
  banner:       {
    js: 'import { createRequire } from \'node:module\';\nconst require = createRequire(import.meta.url);',
  },
};

const ctx = await esbuild.context(config);
await ctx.rebuild();
ctx.dispose();
