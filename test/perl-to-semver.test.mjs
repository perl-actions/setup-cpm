import { describe, it } from 'mocha';
import { expect } from 'chai';

import { perlToSemver } from '../src/perl-to-semver.mjs';

describe('Perl Version to semver', function () {
  it('converts version', async function () {
    const outver = perlToSemver('1.5005');
    expect(outver).to.be.equal('1.500.500');
  });
});
