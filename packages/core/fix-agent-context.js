const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/tools/builtin-tools.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Remplacer toutes les occurrences de AgentContext par any
content = content.replace(/context: AgentContext/g, 'context: any');

fs.writeFileSync(filePath, content);
console.log('AgentContext remplacé par any dans builtin-tools.ts');
