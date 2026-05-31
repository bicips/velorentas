// ═══════════════════════════════════════════════════════════
//  db.js — Capa de datos VeloRentas
//  Proveedor actual: Supabase
//  Para migrar a servidor propio: reemplaza solo este archivo.
//  El resto de la app (reservas.js, taller.js) nunca llama
//  a Supabase directamente — solo llama a las funciones de aquí.
// ═══════════════════════════════════════════════════════════

const DB = (function () {

  // ── Credenciales Supabase ──────────────────────────────────
  const URL  = 'https://mjivndazbqepfoyutuvo.supabase.co';
  const KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qaXZuZGF6YnFlcGZveXV0dXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTMzNzIsImV4cCI6MjA5NTc4OTM3Mn0.ommrd3XH4W-Lsyf6RyylFtfr7b9zueldMhdrkugeFFU';

  const HDR = {
    'Content-Type':  'application/json',
    'apikey':        KEY,
    'Authorization': 'Bearer ' + KEY,
    'Prefer':        'resolution=merge-duplicates'
  };

  // ── Helper fetch ───────────────────────────────────────────
  async function req(method, table, body, params) {
    let endpoint = URL + '/rest/v1/' + table;
    if (params) endpoint += '?' + params;
    const opts = { method, headers: { ...HDR } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(endpoint, opts);
    if (!res.ok) {
      const err = await res.text();
      throw new Error('DB [' + table + '] ' + res.status + ': ' + err);
    }
    const txt = await res.text();
    return txt ? JSON.parse(txt) : null;
  }

  // ── UPSERT genérico: guarda {id, data} en la tabla ─────────
  // Un solo registro por clave (id = nombre de la clave)
  async function upsert(table, id, data) {
    return req('POST', table, { id, data, updated_at: new Date().toISOString() });
  }

  // ── GET genérico: lee todos los registros de una tabla ──────
  async function getAll(table) {
    const rows = await req('GET', table, null, 'select=id,data&order=id');
    return rows || [];
  }

  // ── GET un registro por id ──────────────────────────────────
  async function getOne(table, id) {
    const rows = await req('GET', table, null, 'select=data&id=eq.' + encodeURIComponent(id));
    return (rows && rows[0]) ? rows[0].data : null;
  }

  // ── DELETE un registro por id ───────────────────────────────
  async function del(table, id) {
    return req('DELETE', table, null, 'id=eq.' + encodeURIComponent(id));
  }

  // ════════════════════════════════════════════════════════════
  //  API PÚBLICA — estas son las únicas funciones que usan
  //  reservas.js y taller.js
  // ════════════════════════════════════════════════════════════

  return {

    // ── BICIS ──────────────────────────────────────────────────
    async getBicis() {
      const rows = await getAll('bicis');
      return rows.map(r => r.data);
    },
    async saveBici(bici) {
      return upsert('bicis', bici.id, bici);
    },
    async saveBicis(arr) {
      // Upsert en bloque: array de {id, data}
      const body = arr.map(b => ({ id: b.id, data: b, updated_at: new Date().toISOString() }));
      return req('POST', 'bicis', body);
    },
    async deleteBici(id) {
      return del('bicis', id);
    },

    // ── RESERVAS ───────────────────────────────────────────────
    async getReservas() {
      const rows = await getAll('reservas');
      return rows.map(r => r.data);
    },
    async saveReserva(res) {
      return upsert('reservas', res.id, res);
    },
    async saveReservas(arr) {
      const body = arr.map(r => ({ id: r.id, data: r, updated_at: new Date().toISOString() }));
      return req('POST', 'reservas', body);
    },
    async deleteReserva(id) {
      return del('reservas', id);
    },

    // ── CONFIG (una fila por clave) ────────────────────────────
    async getConfig(key, fallback) {
      try {
        const val = await getOne('config', key);
        return val !== null ? val : fallback;
      } catch(e) {
        return fallback;
      }
    },
    async saveConfig(key, value) {
      return upsert('config', key, value);
    },

    // ── TEST DE CONEXIÓN ───────────────────────────────────────
    async ping() {
      try {
        await req('GET', 'bicis', null, 'select=id&limit=1');
        return true;
      } catch(e) {
        console.error('DB ping failed:', e);
        return false;
      }
    }
  };
})();
