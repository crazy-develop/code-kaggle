const https = require('https');

const token = process.env.NOTION_TOKEN || 'YOUR_NOTION_TOKEN_HERE';

const options = {
  hostname: 'api.notion.com',
  port: 443,
  path: '/v1/search',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(JSON.stringify({
  filter: {
    property: 'object',
    value: 'database'
  }
}));

req.end();
