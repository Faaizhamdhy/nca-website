import { config } from 'dotenv';
config({ path: '.env.local' });

const req = { headers: {} };
const res = {
  status: (code) => ({
    json: (data) => console.log(`[Response ${code}]`, data)
  })
};

console.log('Mengeksekusi sinkronisasi secara lokal...');
import('./api/sync-members.js').then(({ default: handler }) => {
  handler(req, res)
    .then(() => console.log('Eksekusi selesai.'))
    .catch((err) => console.error('Gagal:', err));
});
