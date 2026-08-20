const https = require('https');

async function testFetch() {
  const SODA_SECOP2_URL = 'https://www.datos.gov.co/resource/p6dx-8zbt.json';
  const nowIso = new Date().toISOString().slice(0, 19) + '.000';
  
  const sodaParams = new URLSearchParams();
  sodaParams.set('$limit', '35');
  sodaParams.set('$order', 'fecha_de_publicacion_del DESC');
  
  const whereClauses = [
    `fecha_de_recepcion_de > '${nowIso}'`,
    "fase in ('Presentación de oferta', 'Fase de ofertas', 'Presentación de observaciones')",
    "estado_del_procedimiento in ('Publicado', 'En proceso', 'Presentación de ofertas', 'Abierto')",
    "fecha_de_publicacion_del is not null"
  ];
  sodaParams.set('$where', whereClauses.join(' AND '));

  const url = `${SODA_SECOP2_URL}?${sodaParams.toString()}`;
  console.log('Fetching:', url);

  https.get(url, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log('Status code:', res.statusCode);
      try {
        const rawData = JSON.parse(data);
        console.log('Raw data count:', Array.isArray(rawData) ? rawData.length : 'Not array: ' + data.slice(0, 100));

        // Test parseRawSodaSecop2 logic
        const now = new Date();
        const parsed = [];
        const seenIds = new Set();

        for (let idx = 0; idx < rawData.length; idx++) {
          const item = rawData[idx];
          const rawClose = item.fecha_de_recepcion_de || item.fecha_de_apertura_de_respuesta;
          if (!rawClose) {
            console.log(`[Item ${idx}] Skipped: no rawClose`);
            continue;
          }

          const closeD = new Date(rawClose);
          if (isNaN(closeD.getTime()) || closeD <= now) {
            console.log(`[Item ${idx}] Skipped: closeD (${rawClose}) <= now (${now.toISOString()})`);
            continue;
          }

          const pubDate = item.fecha_de_publicacion_del || item.fecha_de_ultima_publicaci;
          if (!pubDate) {
            console.log(`[Item ${idx}] Skipped: no pubDate`);
            continue;
          }

          const secopId = String(item.id_del_proceso || item.referencia_del_proceso || `CO1.REQ.${idx}`).trim();
          const processNum = String(item.referencia_del_proceso || secopId).trim();

          const uniqueKey = `${processNum}__${secopId}`;
          if (seenIds.has(uniqueKey) || seenIds.has(processNum)) {
            console.log(`[Item ${idx}] Skipped: duplicate key ${uniqueKey}`);
            continue;
          }
          seenIds.add(uniqueKey);
          seenIds.add(processNum);

          parsed.push({
            id: secopId,
            process_number: processNum,
            title: item.nombre_del_procedimiento
          });
        }

        console.log('Parsed count:', parsed.length);
      } catch (e) {
        console.error('Error parsing:', e, data.slice(0, 200));
      }
    });
  });
}

testFetch();
