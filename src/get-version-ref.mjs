import { perlToSemver } from './perl-to-semver.mjs';
import * as semver from 'semver';

export const getVersionRef = async ({ octokit, owner, repo, version: want }) => {
  if (want !== '' && !want.match(/[\s~<>=|*^]/)) {
    try {
      await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `tags/${want}`,
      });
      // exact tags we can assume are immutable and use the given name
      return want;
    }
    catch (e) {
      if (!e.response || e.response.status !== 404) {
        throw e;
      }
    }

    try {
      const ref = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: want,
      });

      // branches will change, so use the sha
      return ref.data.sha;
    }
    catch (e) {
      if (!e.response || e.response.status !== 404) {
        throw e;
      }
    }
  }

  const range = perlToSemver(want);
  if (!semver.validRange(range)) {
    throw new Error(`Invalid version range: "${want}"`);
  }

  const tagIter = octokit.paginate.iterator(octokit.rest.repos.listTags, {
    owner,
    repo,
    per_page: 100,
  });

  const tagMap = {};

  for await (const { data: tags } of tagIter) {
    for (const { name: tag } of tags) {
      const tagSemver = perlToSemver(tag.replace(/^v/, ''));
      if (!semver.valid(tagSemver)) {
        continue;
      }
      tagMap[tagSemver] = tag;
    }
  }

  const matchingVersion = semver.maxSatisfying(Object.keys(tagMap), range);
  if (matchingVersion) {
    return tagMap[matchingVersion];
  }

  return undefined;
};
