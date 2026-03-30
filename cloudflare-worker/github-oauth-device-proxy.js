/**
 * Cloudflare Worker (free tier) - GitHub OAuth Device Flow proxy
 *
 * Why: GitHub's device flow endpoints don't allow browser CORS, so a tiny proxy is needed.
 *
 * Deploy:
 * - Create a Worker in Cloudflare Dashboard
 * - Paste this file
 * - Deploy and copy the Worker URL (proxyBaseUrl)
 *
 * Endpoints:
 * - POST /device/code
 * - POST /oauth/access_token
 *
 * Both accept `application/x-www-form-urlencoded` and return JSON with CORS headers.
 */

const DEVICE_CODE_ENDPOINT = 'https://github.com/login/device/code';
const TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token';

function withCors(res) {
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type,Accept');
  headers.set('Access-Control-Max-Age', '86400');
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Accept',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    if (request.method !== 'POST') {
      return withCors(new Response('Method Not Allowed', { status: 405 }));
    }

    let upstream;
    if (url.pathname === '/device/code') upstream = DEVICE_CODE_ENDPOINT;
    else if (url.pathname === '/oauth/access_token') upstream = TOKEN_ENDPOINT;
    else return withCors(new Response('Not Found', { status: 404 }));

    const body = await request.text();
    const res = await fetch(upstream, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    return withCors(res);
  }
};

