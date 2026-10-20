# Vision deployment

- Site: https://jimmy1020119.github.io/vision/
- Theme repository: Jimmy1020119/vision
- Canonical articles: Jimmy1020119/Jimmy1020119.github.io, main branch
- Original blog is read only. This workflow never pushes to it.

The Pages workflow checks out both repositories, imports the canonical Markdown
and article assets, then builds and validates the `/vision/` site. It runs on
theme pushes, manual dispatch, and hourly at minute 23 UTC. Scheduled runs can be
delayed by GitHub; a manual run publishes source-post updates sooner.

`content/en/` contains the English views prepared for the current canonical post
versions. Each is tied to its source file's SHA-256. When an upstream post changes,
its latest original text is used instead of publishing an outdated translation.
New source posts appear automatically. Category aliases are normalized only in
the Vision build. Thumbnail metadata is per-site and does not change the source.

Build locally with Ruby/Bundler:

```sh
git clone --depth 1 https://github.com/Jimmy1020119/Jimmy1020119.github.io.git _content-source
bundle install
bundle exec ruby tools/sync_content.rb _content-source
JEKYLL_ENV=production bundle exec jekyll build --destination _site/vision
python3 tools/verify_site.py _site/vision
bundle exec htmlproofer _site --disable-external
```

Deployments only run after the build and path/HTML checks pass. To roll back a
theme change, revert its commit in this repository and rerun the workflow. The
canonical blog's independent deployment and content remain unchanged.
