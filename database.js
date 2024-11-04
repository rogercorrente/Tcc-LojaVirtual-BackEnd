// database.js
const sqlite3 = require('sqlite3').verbose();

// Conecta ao banco de dados
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite');
    }
});

// Cria a tabela de produtos, se não existir
db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        descricao TEXT,
        categoria TEXT,
        condicao TEXT,
        valor REAL,
        tamanho TEXT,
        marca TEXT,
        cor TEXT,
        imagem TEXT
    )
`);

// Cria a tabela de usuários, se não existir
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        email TEXT UNIQUE,
        endereco TEXT,
        senha TEXT
    )
`);

module.exports = db;
