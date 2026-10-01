# 1. Cloudflare Pages Hosting and Edge Architecture

Context: Rinconada Stereo was originally scoped for GitHub Pages, but needs robust edge caching, HTTP/3, Brotli compression, and custom security/redirect headers (`_headers`, `_redirects`) close to Colombian telecommunications networks, as well as a staging incubation environment prior to taking over `rinconadastereo.com`.

Decision: Deploy the site statically to Cloudflare Pages using Wrangler, serving assets directly from Cloudflare's global edge without build steps or server runtimes.

Why: Cloudflare Pages provides immediate sub-100ms TTFB across mobile networks in Colombia, handles zero-downtime DNS transitions for `rinconadastereo.com`, and cleanly separates static web delivery from external audio streaming and DNS mail routing.
