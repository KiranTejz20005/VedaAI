const fetch = require('node-fetch'); // or global fetch if Node 18+

async function run() {
  try {
    const res = await globalThis.fetch('http://localhost:3001/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'dummy_token_to_fail_google_api', role: 'STUDENT', isSignUp: false })
    });
    console.log(res.status, await res.text());
  } catch (err) {
    console.error(err);
  }
}
run();
