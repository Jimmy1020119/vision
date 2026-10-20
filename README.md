# Vision to Intelligence

Live site: https://jimmy1020119.github.io/vision/

This repository owns the Vision design and deployment. Write and update posts in
[the original blog](https://github.com/Jimmy1020119/Jimmy1020119.github.io).
GitHub Actions imports its Markdown and article assets on each deployment and
checks for updates hourly. The original blog and its deployment stay independent.
See [DEPLOYMENT.md](DEPLOYMENT.md) for synchronization, local builds, and rollback.

The site uses a custom dark Jekyll theme: an articulated robot on the homepage,
and a matching reading layout for Markdown articles, archives, categories, tags,
and About. Existing `/posts/:title/` URLs are preserved.

## Writing

In the original blog repository, create `_posts/YYYY-MM-DD-your-title.md`:

```markdown
---
title: "Your article title"
date: 2026-10-20
categories: [Paper Notes]
tags: [Diffusion]
description: "A short introduction."
thumbnail: /assets/img/posts/your-cover.webp
---

## Your first section

Write Markdown here. Use $x_t$ for inline math and $$x^2$$ for display math.
```

Choose **Projects**, **Paper Notes**, or **Startup**. The shared menu definitions
live in `_data/writing_categories.yml`. Article layouts, lists, math rendering,
and the table of contents are automatic. Published Google Slides can be embedded
directly in articles.
The Blog page at `/blog/` shows the `thumbnail` or `image` from each post's front
matter. Existing presentation posts use locally saved images of their first
slides. Posts without an image receive a title cover. Contact details are collected
at `/contact/`; the shared navigation is Blog / LinkedIn / Contact.

## Local build and deployment

Follow the commands in [DEPLOYMENT.md](DEPLOYMENT.md) to check out the content,
import it, and serve the site. `_posts/` is generated and intentionally ignored
in this repository. GitHub Actions validates the generated `/vision/` routes and
HTML before deploying GitHub Pages.

Custom templates live in `_layouts/`; `assets/css/landing.css` styles the homepage
and `assets/css/reading.css` styles the reading pages. Math assets are self-hosted
under `assets/vendor/katex/`, including their license. Fonts and icons are local.

## Upstream starter

This repository originally used Chirpy Starter; its attribution follows.

# Chirpy Starter

[![Gem Version](https://img.shields.io/gem/v/jekyll-theme-chirpy)][gem]&nbsp;
[![GitHub license](https://img.shields.io/github/license/cotes2020/chirpy-starter.svg?color=blue)][mit]

A minimal, ready-to-use template for creating a blog with the [**Chirpy**][chirpy] Jekyll theme. Get up and running in minutes with all critical files pre-configured.

## Why This Starter Exists

When installing Chirpy through [RubyGems.org][gem], Jekyll can only read a subset of theme files (`_data`, `_layouts`, `_includes`, `_sass`, `assets`) and limited `_config.yml` options from the gem. As a result, users cannot enjoy the full out-of-the-box experience that Chirpy offers.

To unlock all features, the following files must be present in your Jekyll site:

```shell
.
├── _config.yml
├── _plugins
├── _tabs
└── index.html
```

This starter bundles those files from the latest **Chirpy** release along with a [CD][CD] workflow, so you can start writing immediately.

## Usage

Check out the [theme's docs](https://github.com/cotes2020/jekyll-theme-chirpy/wiki).

## Contributing

This repository is automatically updated with new releases from the theme repository. If you encounter any issues or want to contribute to its improvement, please visit the [theme repository][chirpy] to provide feedback.

## License

This work is published under [MIT][mit] License.

[gem]: https://rubygems.org/gems/jekyll-theme-chirpy
[chirpy]: https://github.com/cotes2020/jekyll-theme-chirpy/
[CD]: https://en.wikipedia.org/wiki/Continuous_deployment
[mit]: https://github.com/cotes2020/chirpy-starter/blob/master/LICENSE
