const http = require('http');

http.get('http://localhost:3001/api/agents', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.success && response.data) {
        console.log('IDs des agents:');
        response.data.forEach(agent => {
          console.log(`${agent.name}: ${agent.id}`);
        });
      } else {
        console.log('Erreur:', response);
      }
    } catch (error) {
      console.log('Erreur de parsing:', error.message);
    }
  });
}).on('error', (error) => {
  console.log('Erreur de connexion:', error.message);
});
