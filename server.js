// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./database'); // Importa o banco de dados

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('uploads')); // Pasta onde as imagens serão servidas

// Configuração do multer para armazenamento de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // Pasta para salvar as imagens
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nomeia o arquivo com timestamp
    }
});

const upload = multer({ storage });

// ---- Rotas de Upload de Imagens ----

// Endpoint para fazer upload de uma imagem
app.post('/upload', upload.single('image'), (req, res) => {
    const filePath = `http://localhost:3000/${req.file.filename}`;
    res.json({ url: filePath });
});

// ---- Rotas de Produtos ----

// Endpoint para adicionar um produto ao banco de dados
app.post('/produtos', (req, res) => {
    const { nome, descricao, categoria, condicao, valor, tamanho, marca, cor, imagem } = req.body;

    db.run(
        `INSERT INTO produtos (nome, descricao, categoria, condicao, valor, tamanho, marca, cor, imagem) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nome, descricao, categoria, condicao, valor, tamanho, marca, cor, imagem],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        }
    );
});

// Endpoint para obter todos os produtos do banco de dados
app.get('/produtos', (req, res) => {
    db.all(`SELECT * FROM produtos`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// ---- Rotas de Autenticação ----

// Endpoint para cadastro de usuários
app.post('/register', async (req, res) => {
    const { nome, email, endereco, senha } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(senha, 10); // Hash da senha
        db.run(
            `INSERT INTO users (nome, email, endereco, senha) VALUES (?, ?, ?, ?)`,
            [nome, email, endereco, hashedPassword],
            function (err) {
                if (err) {
                    return res.status(400).json({ error: 'Erro ao cadastrar usuário.' });
                }
                res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
    }
});

// Endpoint para login de usuários
app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuário.' });
        }
        if (!user || !(await bcrypt.compare(senha, user.senha))) {
            return res.status(400).json({ error: 'Credenciais inválidas.' });
        }
        res.json({ message: 'Login bem-sucedido!' });
    });
});

// Inicia o servidor
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
