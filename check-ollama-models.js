const http = require('http');

http.get('http://localhost:11434/api/tags', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Modèles disponibles sur Ollama:');
      if (response.models && response.models.length > 0) {
        response.models.forEach(model => {
          console.log(`- ${model.name} (${model.size} bytes)`);
        });
      } else {
        console.log('Aucun modèle trouvé');
      }
    } catch (error) {
      console.log('Erreur de parsing:', error.message);
    }
  });
}).on('error', (error) => {
  console.log('Erreur de connexion:', error.message);
});
