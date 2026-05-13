import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Octokit } from 'octokit';
import { getVersionRef } from './get-version-ref.mjs';
import {
  fakeCartonSnapshot,
  batchFile,
  cpmScript,
} from './extra-files.mjs';

export const getPerlVersion = async () => {
  let stdout = '';
  await exec.exec('perl', ['-e', 'print 0+$]'], {
    listeners: {
      stdout: (data) => {
        stdout += data.toString();
      },
    },
    silent: true,
  });
  const version = parseFloat(stdout);
  if (Number.isNaN(version)) {
    throw new Error(`Unable to parse version number "${stdout}"`);
  }
  return version;
};

export const run = async () => {
  const versionInput = core.getInput('version');
  const tokenInput = core.getInput('token');

  const owner = 'skaji';
  const repo = 'cpm';

  const octoConfig = {};
  if (typeof tokenInput === 'string') {
    const trimmed = tokenInput.trim();
    if (trimmed.length) {
      octoConfig.auth = trimmed;
    }
  }
  const octokit = new Octokit(octoConfig);

  let wantVersion = versionInput.trim();

  if (wantVersion == 'compat') {
    if (getPerlVersion() < 5.024) {
      wantVersion = '0.998003';
    }
    else {
      wantVersion = '*';
    }
  }

  const versionRef = await getVersionRef({
    octokit,
    owner,
    repo,
    version: wantVersion,
  });

  if (versionRef === undefined) {
    throw new Error(`Unable to resolve version or range: ${versionRef}`);
  }

  if (wantVersion === versionRef) {
    core.info(`Using version ${versionRef}`);
  }
  else {
    core.info(`Resolving '${versionInput}' to ${versionRef}`);
  }

  const name = `${owner}-${repo}`;

  let cpmDir = tc.find(name, versionRef);
  if (!cpmDir) {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${versionRef}/cpm`;
    const cpmDownload = await tc.downloadTool(url);

    await using tempDir = await fs.mkdtempDisposable('setup-cpm-');

    const scriptDir = path.join(tempDir.path, 'script');
    await fs.mkdir(scriptDir);

    await fs.copyFile(cpmDownload, path.join(scriptDir, 'cpm'));

    const libDir = path.join(tempDir.path, 'lib');
    await fs.mkdir(libDir);

    const cartonSnapshotPath = path.join(libDir, 'CartonSnapshotTiny.pm');
    await fs.writeFile(cartonSnapshotPath, fakeCartonSnapshot);

    const cpmPath = path.join(tempDir.path, 'cpm');
    await fs.writeFile(cpmPath, cpmScript);
    await fs.chmod(cpmPath, 0o755);

    const batchPath = path.join(tempDir.path, 'cpm.bat');
    await fs.writeFile(batchPath, batchFile);

    cpmDir = await tc.cacheDir(tempDir.path, name, versionRef);
  }

  core.addPath(cpmDir);
};

export default async () => {
  try {
    await run();
  }
  catch (error) {
    core.setFailed(error.message);
  }
};
