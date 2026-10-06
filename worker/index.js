// Cloudflare Worker entrypoint with Static Assets and API endpoints

const memoryStore = new Map();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API endpoints
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (url.pathname === '/api/backup') {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const { backupId, encryptedData, iv, version } = body;
          if (!backupId || !encryptedData || !iv) {
            return new Response(JSON.stringify({ error: 'Missing required backup fields' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }

          const updatedAt = new Date().toISOString();
          const payload = JSON.stringify({ encryptedData, iv, version: version || 1, updatedAt });

          if (env && env.GULLAK_KV) {
            await env.GULLAK_KV.put(backupId, payload);
          } else {
            memoryStore.set(backupId, payload);
          }

          return new Response(JSON.stringify({ success: true, updatedAt }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      }
    }

    if (url.pathname.startsWith('/api/backup/')) {
      const backupId = url.pathname.replace('/api/backup/', '').trim();
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      }

      let record = null;
      if (env && env.GULLAK_KV) {
        record = await env.GULLAK_KV.get(backupId);
      } else {
        record = memoryStore.get(backupId) || null;
      }

      if (!record) {
        return new Response(JSON.stringify({ error: 'Backup not found for this recovery key.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      return new Response(record, {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Serve static assets from binding ASSETS if present
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  }
};
