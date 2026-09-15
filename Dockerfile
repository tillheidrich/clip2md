FROM nginx:1.27-alpine

# Static single-page app — no build step.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html impressum.html datenschutz.html legal.css manifest.webmanifest sw.js icon.svg /usr/share/nginx/html/
COPY vendor/ /usr/share/nginx/html/vendor/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
