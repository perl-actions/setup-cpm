import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Octokit } from 'octokit';
import { getVersionRef } from './get-version-ref.mjs';

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

  const wantVersion = versionInput.trim();

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
    cpmDir = await tc.cacheFile(cpmDownload, 'cpm', name, versionRef);
    await fs.chmod(path.join(cpmDir, 'cpm'), 0o755);
    const batchFile = `
        @setlocal EnableExtensions
        @set "ERRORLEVEL="
        @perl "%~dp0cpm" %* || goto :error
        :error
        @"%COMSPEC%" /d/c "@exit %ERRORLEVEL%"
    `.replace(/^\s*/gm, '');
    await fs.writeFile(path.join(cpmDir, 'cpm.bat'), batchFile);
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
