// Cloudflare Pages / Workers API for Gullak Restore Endpoint

const edgeStore = new Map();

export async function onRequestGet({ params, env }) {
  try {
    const { backupId } = params;

    if (!backupId) {
      return new Response(JSON.stringify({ error: 'backupId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    let rawRecord = null;
    if (env && env.GULLAK_KV) {
      rawRecord = await env.GULLAK_KV.get(backupId);
    } else {
      rawRecord = edgeStore.get(backupId) || null;
    }

    if (!rawRecord) {
      return new Response(JSON.stringify({ error: 'Backup not found for this recovery key.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(rawRecord, {
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
