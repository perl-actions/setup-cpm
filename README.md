# setup-cpm

GitHub action to setup cpm for later module installation. Uses the single file
version of cpm.

# Usage
```yaml
- uses: perl-actions/setup-cpm@v1
  with:
    # The version of cpm to install. Defaults to the latest version. Can be
    # specified as a tag, branch, or commit in the `cpm` repo. It can also be
    # specified as a version range following modified semver rules. It will
    # accept semver rule specifiers but also interpret perl numeric style
    # versions.
    # Defaults to `*`, which will be the latest release.
    version: ''

    # A GitHub token to query tags and commits. Does not need any configured
    # permissions.
    # Default: ${{ github.token }}
    token: ''

- run: cpm install
```
