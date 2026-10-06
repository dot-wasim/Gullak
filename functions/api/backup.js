// Cloudflare Pages / Workers API for Gullak Zero-Knowledge Backup Store

// In-memory fallback cache across edge requests
const edgeStore = new Map();

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { backupId, encryptedData, iv, version } = body;

    if (!backupId || typeof backupId !== 'string') {
      return new Response(JSON.stringify({ error: 'Valid backupId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (!encryptedData || !iv) {
      return new Response(JSON.stringify({ error: 'encryptedData and iv are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const updatedAt = new Date().toISOString();
    const record = JSON.stringify({
      encryptedData,
      iv,
      version: version || 1,
      updatedAt
    });

    // Store in Cloudflare KV if bound, else in edgeStore
    if (env && env.GULLAK_KV) {
      await env.GULLAK_KV.put(backupId, record);
    } else {
      edgeStore.set(backupId, record);
    }

    return new Response(JSON.stringify({ success: true, updatedAt }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
