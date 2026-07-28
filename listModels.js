require('dotenv').config();
const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY;

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    parsed.models.forEach(model => {
      if (model.supportedGenerationMethods.includes('generateContent')) {
        console.log(model.name);
      }
    });
  });
}).on('error', (err) => {
  console.error('Error:', err);
});