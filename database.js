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
        nome TEXT NOT NULL,
        descricao TEXT,
        categoria TEXT,
        condicao TEXT,
        valor REAL NOT NULL,
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
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        endereco TEXT,
        senha TEXT NOT NULL,
        pontos INTEGER DEFAULT 0 NOT NULL,
        moedas INTEGER DEFAULT 0 NOT NULL
    )
`);

// Cria a tabela de carrinho, se não existir
db.run(`
    CREATE TABLE IF NOT EXISTS carrinho (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        quantidade INTEGER DEFAULT 1 NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
    )
`);

// Cria a tabela de pedidos, se não existir
db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        valor_total REAL NOT NULL,
        data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
`);

// Cria a tabela de itens do pedido, se não existir
db.run(`
    CREATE TABLE IF NOT EXISTS itens_pedido (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        quantidade INTEGER DEFAULT 1 NOT NULL,
        preco_unitario REAL NOT NULL,
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
    )
`);

module.exports = db;
