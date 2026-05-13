import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';

import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'url';

import mockAction from './mock-action.mjs';

const allFiles = async (dir) => {
  const files = [];
  for await (const dirent of await fs.opendir(dir, { recursive: true })) {
    if (!dirent.isFile()) {
      continue;
    }
    files.push(
      path.relative(dir, path.join(dirent.parentPath, dirent.name)),
    );
  }
  files.sort();
  return files;
};

describe('GitHub action', function () {
  let testDir;
  let main;

  before(async function () {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    main = await mockAction(path.join(__dirname, '../action.yml'), '../src/main.mjs');

    testDir = await fs.mkdtempDisposable('setup-cpm-');

    const runnerTemp = path.join(testDir.path, 'runner-temp');
    await fs.mkdir(runnerTemp);
    process.env['RUNNER_TEMP'] = runnerTemp;

    const toolCache = path.join(testDir.path, 'tool-cache');
    await fs.mkdir(toolCache);
    process.env['RUNNER_TOOL_CACHE'] = toolCache;
  });

  after(async function () {
    await testDir.remove();
  });

  it('installs cpm', async function () {
    const { paths } = await main({
      version: 'v1.1.0',
    });
    expect(paths).to.have.lengthOf(1);

    const files = await allFiles(paths[0]);
    expect(files).to.be.deep.equal([
      'cpm',
      'cpm.bat',
      'lib/CartonSnapshotTiny.pm',
      'script/cpm',
    ]);
  });

  it('installs cpm (main)', async function () {
    const { paths } = await main({
      version: 'main',
    });
    expect(paths).to.have.lengthOf(1);

    const files = await allFiles(paths[0]);
    expect(files).to.be.deep.equal([
      'cpm',
      'cpm.bat',
      'lib/CartonSnapshotTiny.pm',
      'script/cpm',
    ]);
  });
});
