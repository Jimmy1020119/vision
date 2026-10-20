"""Validate generated project-site routes and assets before Pages deployment."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import sys

root = Path(sys.argv[1]).resolve()
baseurl = '/vision'
errors = []
count = 0

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('href', 'src'):
            value = attrs.get(key, '')
            if not value or value.startswith(('#', 'mailto:', 'data:', 'javascript:')):
                continue
            url = urlsplit(value)
            if url.scheme or url.netloc:
                continue
            if url.path.startswith('/'):
                if not url.path.startswith(baseurl + '/') and url.path != baseurl:
                    errors.append(f'{self.path}: route escapes /vision: {value}')
                    continue
                target = root / unquote(url.path[len(baseurl):].lstrip('/'))
            else:
                target = self.path.parent / unquote(url.path)
            if target.is_dir():
                target = target / 'index.html'
            if not target.exists():
                errors.append(f'{self.path}: missing {value}')

for page in root.rglob('*.html'):
    # Canonical embedded HTML is source content and can contain its own URLs.
    if 'assets' in page.relative_to(root).parts:
        continue
    Page(page).feed(page.read_text(encoding='utf-8'))
    count += 1

for route in ['index.html', 'blog/index.html', 'contact/index.html', 'posts/fade-project/index.html']:
    if not (root / route).exists():
        errors.append(f'Missing key route: {route}')
if errors:
    print('\n'.join(errors))
    raise SystemExit(1)
print(f'Validated {count} HTML pages and their /vision/ internal routes/assets.')
