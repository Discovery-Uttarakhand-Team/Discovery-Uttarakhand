

async function runTest() {
  const sessionId = 'perf_test_' + Date.now();
  const turns = [
    'Hello',
    'What can I do in Bhimtal?',
    'What is the weather in Badrinath?',
    'How are the roads?',
    'Suggest a verified stay.',
    'Can you make it cheaper?'
  ];

  console.log('Starting Latency Baseline Tests...\n');

  for (let i = 0; i < turns.length; i++) {
    const message = turns[i];
    console.log(`========================================`);
    console.log(`TURN ${i + 1}: ${message}`);
    console.log(`========================================`);
    
    const startReq = Date.now();
    try {
      const res = await fetch('http://localhost:5000/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId })
      });
      const data = await res.json();
      const endReq = Date.now();
      const totalTimeMs = endReq - startReq;
      
      console.log(`Client-side Latency: ${totalTimeMs}ms`);
      const r = data.response;
      if (r) {
        console.log(`Provider: ${r.meta?.provider || 'none'}`);
        console.log(`Tools Used: ${JSON.stringify(r.toolsUsed)}`);
      } else {
        console.log('Error/No Response:', data);
      }
    } catch (err) {
      console.log('Fetch error:', err.message);
    }
    console.log('\n');
  }
}

runTest().catch(console.error);
