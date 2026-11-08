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

  // ── Estado de guardado (para el indicador "Guardando… / ✓ Guardado / ⚠️ No guardado") ──
  let _pend = 0, _fallidos = [], _oyentes = [];
  function _avisar(estado, info) { _oyentes.forEach(f => { try { f(estado, info); } catch (e) {} }); }
  function _estado() { return _fallidos.length ? 'error' : (_pend ? 'guardando' : 'ok'); }

  // ── Helper fetch ───────────────────────────────────────────
  // Las escrituras (POST/DELETE) se cuentan para el indicador; si fallan se guardan para
  // reintentarlas solas (cada 20 s y al volver la conexión) o con el botón Reintentar.
  async function req(method, table, body, params) {
    if (method === 'GET') return _req(method, table, body, params);
    _pend++; _avisar('guardando');
    try {
      const r = await _req(method, table, body, params);
      _pend--; _avisar(_estado());
      return r;
    } catch (e) {
      _pend--;
      _fallidos.push({ method, table, body, params, error: String(e && e.message || e) });
      _avisar('error', e);
      throw e;
    }
  }
  async function reintentar() {
    const cola = _fallidos.splice(0);
    // si hay varias escrituras del mismo registro, basta con la última
    const ult = {};
    cola.forEach(j => { const k = j.method + j.table + (j.params || '') + (Array.isArray(j.body) ? j.body.map(x => x.id || x.key).join(',') : (j.body && (j.body.id || j.body.key)) || ''); ult[k] = j; });
    for (const j of Object.values(ult)) {
      try { await req(j.method, j.table, j.body, j.params); } catch (e) { /* vuelve a la cola dentro de req */ }
    }
    _avisar(_estado());
  }
  setInterval(() => { if (_fallidos.length && navigator.onLine !== false) reintentar(); }, 20000);
  window.addEventListener('online', () => { if (_fallidos.length) reintentar(); });
  window.addEventListener('beforeunload', e => { if (_pend || _fallidos.length) { e.preventDefault(); e.returnValue = ''; } });

  // ── Lo último guardado/leído de cada reserva y bici ────────
  // Para enviar SOLO lo que ha cambiado (antes se enviaban todas y un equipo podía pisar
  // los cambios de otro) y para saber si hay cambios locales sin guardar.
  const _snap = { reservas: {}, bicis: {} };
  function snapshot(table, arr) { _snap[table] = {}; (arr || []).forEach(x => { if (x && x.id != null) _snap[table][String(x.id)] = JSON.stringify(x); }); }
  function _marca(table, x, json) { if (x && x.id != null) _snap[table][String(x.id)] = json || JSON.stringify(x); }
  function sinGuardar(table, x) { return !!(x && x.id != null && _snap[table][String(x.id)] !== JSON.stringify(x)); }
  async function saveChanged(table, arr) {
    const cambiados = (arr || []).filter(x => x && x.id != null && _snap[table][String(x.id)] !== JSON.stringify(x));
    if (!cambiados.length) return [];
    const jsons = cambiados.map(x => JSON.stringify(x));
    const now = new Date().toISOString();
    const body = cambiados.map(x => ({ id: x.id, data: x, updated_at: now }));
    const r = await req('POST', table, body);
    cambiados.forEach((x, i) => _marca(table, x, jsons[i]));
    return r;
  }
  // Cambios hechos en otros equipos desde 'desde' (ISO). Devuelve filas {id|key, data, updated_at}
  async function cambiosDesde(table, desde) {
    const pk = table === 'config' ? 'key' : 'id';
    return (await _req('GET', table, null, 'select=' + pk + ',data,updated_at&updated_at=gt.' + encodeURIComponent(desde) + '&order=updated_at')) || [];
  }

  async function _req(method, table, body, params) {
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

  // ── UPSERT genérico: guarda {id/key, data} en la tabla ─────────
  async function upsert(table, id, data) {
    // config uses 'key' as primary key, all other tables use 'id'
    var row = (table === 'config')
      ? { key: id, data: data, updated_at: new Date().toISOString() }
      : { id: id, data: data, updated_at: new Date().toISOString() };
    return req('POST', table, row);
  }

  // ── GET genérico: lee todos los registros de una tabla ──────
  async function getAll(table) {
    const rows = await req('GET', table, null, 'select=id,data&order=id');
    return rows || [];
  }

  // ── GET un registro por id/key ──────────────────────────────
  async function getOne(table, id) {
    try {
      var pkCol = (table === 'config') ? 'key' : 'id';
      var rows = await req('GET', table, null, 'select=data&' + pkCol + '=eq.' + encodeURIComponent(id));
      return (rows && rows[0]) ? rows[0].data : null;
    } catch(e) {
      return null;
    }
  }

  // ── DELETE un registro por id/key ───────────────────────────
  async function del(table, id) {
    var pkCol = (table === 'config') ? 'key' : 'id';
    return req('DELETE', table, null, pkCol + '=eq.' + encodeURIComponent(id));
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
      const j = JSON.stringify(bici);
      const r = await upsert('bicis', bici.id, bici);
      _marca('bicis', bici, j);
      return r;
    },
    async saveBicis(arr) {
      return saveChanged('bicis', arr); // solo las que han cambiado
    },
    async _saveBicisTodas(arr) {
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
      const j = JSON.stringify(res);
      const r = await upsert('reservas', res.id, res);
      _marca('reservas', res, j);
      return r;
    },
    async saveReservas(arr) {
      return saveChanged('reservas', arr); // solo las que han cambiado
    },
    async _saveReservasTodas(arr) {
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

    // ── SINCRONIZACIÓN ENTRE EQUIPOS / ESTADO DE GUARDADO ──────
    snapshot, sinGuardar, cambiosDesde, reintentar, marcar: _marca,
    onEstado(f) { _oyentes.push(f); f(_estado()); },
    estado() { return { estado: _estado(), pendientes: _pend, fallidos: _fallidos.slice() }; },

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
