const crypto = require('crypto');
function generateToken(apikey, expSeconds) {
    const [id, secret] = apikey.split('.');
    const timestamp = Math.floor(Date.now() / 1000);
    const exp = timestamp + expSeconds;
    const header = { alg: 'HS256', sign_type: 'SIGN' };
    const payload = { api_key: id, exp: exp, timestamp: timestamp };
    const base64UrlEncode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const headerEncoded = base64UrlEncode(header);
    const payloadEncoded = base64UrlEncode(payload);
    const signature = crypto.createHmac('sha256', secret).update(`${headerEncoded}.${payloadEncoded}`).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

async function run() {
  try {
    const token = generateToken("85252ff41cea4a8c9b5ef047d7393413.JqyRy5pW-Bxil2rTsN8R8WPv", 3600);
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [{role: 'user', content: 'hello'}]
      })
    });
    console.log("Zhipu JWT:", await response.json());
  } catch(e) { console.log(e); }
}
run();
