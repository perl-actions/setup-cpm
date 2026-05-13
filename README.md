# setup-cpm

GitHub action to setup cpm for later module installation. Uses the single file
version of cpm, including support for cpanfile.snapshot.

# Usage
```yaml
- uses: perl-actions/setup-cpm@v1
  with:
    # The version of cpm to install. Defaults to the latest version. Can be
    # specified as a tag, branch, or commit in the `cpm` repo. It can also be
    # specified as a version range following modified semver rules. It will
    # accept semver rule specifiers but also interpret perl numeric style
    # versions.
    # A special value, `compat` can be used. This will use an older release
    # (0.998003) if the detected perl version is to old to support modern
    # releases. For newer perl versions, it will install the latest version.
    # Defaults to `compat`.
    version: ''

    # A GitHub token to query tags and commits. Does not need any configured
    # permissions.
    # Default: ${{ github.token }}
    token: ''

- run: cpm install
```
