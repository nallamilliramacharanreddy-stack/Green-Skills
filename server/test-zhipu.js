async function run() {
  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer 85252ff41cea4a8c9b5ef047d7393413.JqyRy5pW-Bxil2rTsN8R8WPv`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [{role: 'user', content: 'hello'}]
      })
    });
    console.log("Zhipu:", await response.json());
  } catch(e) {}
}
run();
