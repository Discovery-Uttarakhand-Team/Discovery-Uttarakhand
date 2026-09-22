const dns = require('dns');

const srvHost = '_mongodb._tcp.cluster0.v89ek0d.mongodb.net';
const txtHost = 'cluster0.v89ek0d.mongodb.net';

async function run() {
  try {
    const srv = await dns.promises.resolveSrv(srvHost);
    console.log('SRV resolution: SUCCESS', srv.length > 0 ? 'Found records' : 'No records');
  } catch (err) {
    console.log('SRV resolution: FAILED -', err.message);
  }

  try {
    const txt = await dns.promises.resolveTxt(txtHost);
    console.log('TXT resolution: SUCCESS', txt.length > 0 ? 'Found records' : 'No records');
  } catch (err) {
    console.log('TXT resolution: FAILED -', err.message);
  }
}

run();
