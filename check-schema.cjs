const fs = require('fs');

async function checkSchema() {
  try {
    const env = fs.readFileSync('.env', 'utf-8');
    const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
    
    if (urlMatch && keyMatch) {
      const url = urlMatch[1].trim();
      const key = keyMatch[1].trim();
      
      const response = await fetch(`${url}/rest/v1/?apikey=${key}`);
      const data = await response.json();
      
      if (data && data.definitions && data.definitions.consultas) {
        console.log("Colunas da tabela 'consultas':", Object.keys(data.definitions.consultas.properties).join(', '));
      } else {
        console.log("Tabela 'consultas' não encontrada ou sem propriedades expostas.");
      }
    } else {
      console.log("Variáveis do Supabase não encontradas no .env");
    }
  } catch (err) {
    console.error("Erro:", err.message);
  }
}

checkSchema();
