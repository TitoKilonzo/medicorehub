const url = 'https://medicorehub-titokilonzo.aws-ap-northeast-1.turso.io/v1/execute';
const token = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAzMDU2OTQsImlkIjoiMDE5ZTgyNjktMTIwMS03Zjc1LWI2ZjMtOWE2ODViNmFkYjFiIiwicmlkIjoiNDFjNzc0YWEtZTM5Zi00NmM2LWE0OTEtZDYxZmY3YTM0YTk1In0.Duyj9osYecIUugCWW2HDs8-FgqJzRYk2gGQD4SFpWALfg3RsBlJQBDYhvO9Mhcr6ULiybFuTt83P2Vn0T-aCBw';

async function test() {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            type: "execute",
            stmt: {
              sql: "SELECT name FROM sqlite_master WHERE type='table';"
            }
          }
        ]
      })
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
