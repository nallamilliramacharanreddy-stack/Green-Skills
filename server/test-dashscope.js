async function run() {
  try {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer 85252ff41cea4a8c9b5ef047d7393413.JqyRy5pW-Bxil2rTsN8R8WPv`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [{role: 'user', content: 'hello'}]
      })
    });
    console.log("DashScope:", await response.json());
  } catch(e) {}
}
run();
