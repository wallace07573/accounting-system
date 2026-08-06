const https = require('https');

const options = {
  hostname: process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', ''),
  path: '/rest/v1/',
  headers: {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(Object.keys(json.definitions.documents.properties));
    } catch(e) { console.error(e); }
  });
});
