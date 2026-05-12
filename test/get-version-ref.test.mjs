import { describe, it, before } from 'mocha';
import { expect } from 'chai';

import { Octokit } from 'octokit';
import { getVersionRef } from '../src/get-version-ref.mjs';

describe('Get Version Ref', function () {
  let config;
  before(async function () {
    const octoConfig = {};
    const token = process.env['GITHUB_TOKEN'];
    if (token) {
      octoConfig.auth = token;
    }
    const octokit = new Octokit(octoConfig);
    config = {
      octokit,
      owner: 'skaji',
      repo:  'cpm',
    };
  });

  it('get tag (v1.1.0)', async function () {
    const versionRef = await getVersionRef({
      ...config,
      version: 'v1.1.0',
    });
    expect(versionRef).to.be.equal('v1.1.0');
  });

  it('get branch (main)', async function () {
    const versionRef = await getVersionRef({
      ...config,
      version: 'main',
    });
    expect(versionRef).lengthOf(40);
  });

  it('get tag (v0.999.0)', async function () {
    const versionRef = await getVersionRef({
      ...config,
      version: 'v0.999.0',
    });
    expect(versionRef).to.be.equal('v0.999.0');
  });

  it('get tag (0.998003)', async function () {
    const versionRef = await getVersionRef({
      ...config,
      version: '0.998003',
    });
    expect(versionRef).to.be.equal('0.998003');
  });

  it('get tag (0.996)', async function () {
    const versionRef = await getVersionRef({
      ...config,
      version: '0.996',
    });
    expect(versionRef).to.be.equal('0.996');
  });

  it('get tag (<1.0.0)', async function () {
    const versionRef = await getVersionRef({
      ...config,
      version: '<1.0.0',
    });
    expect(versionRef).to.be.equal('v0.999.0');
  });
});
