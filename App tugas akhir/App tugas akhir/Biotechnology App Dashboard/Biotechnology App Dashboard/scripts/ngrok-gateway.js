const http = require('node:http');

const GATEWAY_PORT = Number(process.env.GATEWAY_PORT || 8088);

const ROUTES = [
  {
    prefix: '/biotech-api',
    targetHost: '127.0.0.1',
    targetPort: 80,
    stripPrefix: false,
  },
  {
    prefix: '/homography-service',
    targetHost: '127.0.0.1',
    targetPort: 8000,
    stripPrefix: true,
  },
  {
    prefix: '/yolo-service',
    targetHost: '127.0.0.1',
    targetPort: 9000,
    stripPrefix: true,
  },
];

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning, bypass-tunnel-reminder');
}

function withCorsHeaders(headers) {
  return {
    ...headers,
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization, ngrok-skip-browser-warning, bypass-tunnel-reminder',
  };
}

function pickRoute(pathname) {
  for (const route of ROUTES) {
    if (pathname === route.prefix || pathname.startsWith(`${route.prefix}/`)) {
      return route;
    }
  }
  return null;
}

function rewritePath(reqUrl, route) {
  const parsed = new URL(reqUrl, 'http://localhost');
  const fullPath = `${parsed.pathname}${parsed.search}`;
  if (!route.stripPrefix) return fullPath;

  const strippedPath = parsed.pathname.slice(route.prefix.length) || '/';
  return `${strippedPath}${parsed.search}`;
}

function proxyRequest(req, res, route) {
  const upstreamPath = rewritePath(req.url || '/', route);
  const headers = { ...req.headers };
  headers.host = `${route.targetHost}:${route.targetPort}`;
  headers['x-forwarded-host'] = req.headers.host || '';
  headers['x-forwarded-proto'] = 'http';

  const upstream = http.request(
    {
      hostname: route.targetHost,
      port: route.targetPort,
      path: upstreamPath,
      method: req.method,
      headers,
    },
    (upstreamRes) => {
      const responseHeaders = withCorsHeaders({ ...upstreamRes.headers });
      delete responseHeaders['content-length'];

      res.writeHead(upstreamRes.statusCode || 502, responseHeaders);
      upstreamRes.pipe(res);
    },
  );

  upstream.on('error', (error) => {
    res.statusCode = 502;
    applyCors(res);
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        ok: false,
        error: `Gateway failed to reach ${route.targetHost}:${route.targetPort}`,
        detail: error.message,
      }),
    );
  });

  req.pipe(upstream);
}

const server = http.createServer((req, res) => {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsed = new URL(req.url || '/', 'http://localhost');
  const route = pickRoute(parsed.pathname);

  if (!route) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        ok: false,
        error: 'Route not found',
        availablePrefixes: ROUTES.map((item) => item.prefix),
      }),
    );
    return;
  }

  proxyRequest(req, res, route);
});

server.listen(GATEWAY_PORT, '0.0.0.0', () => {
  console.log(`[ngrok-gateway] Listening on http://0.0.0.0:${GATEWAY_PORT}`);
  for (const route of ROUTES) {
    const mode = route.stripPrefix ? 'strip-prefix' : 'pass-through';
    console.log(
      `[ngrok-gateway] ${route.prefix} -> http://${route.targetHost}:${route.targetPort} (${mode})`,
    );
  }
});
