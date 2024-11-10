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
app.use(express.static('uploads'));

// Configuração do multer para armazenamento de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
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
    const { nome, descricao, categoria, condicao, valor, tamanho, marca, cor, imagem, email } = req.body;

    db.run(
        `INSERT INTO produtos (nome, descricao, categoria, condicao, valor, tamanho, marca, cor, imagem) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nome, descricao, categoria, condicao, valor, tamanho, marca, cor, imagem],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao adicionar produto: ' + err.message });
            }

            db.run(
                `UPDATE users SET pontos = pontos + 10, moedas = moedas + 10 WHERE email = ?`,
                [email],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Erro ao atualizar pontos e moedas: ' + err.message });
                    }
                    res.json({
                        id: this.lastID,
                        message: 'Produto adicionado com sucesso!',
                        pontosGanhados: 10,
                        moedasGanhas: 10
                    });
                }
            );
        }
    );
});

// Endpoint para obter todos os produtos do banco de dados
app.get('/produtos', (req, res) => {
    db.all(`SELECT * FROM produtos`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao obter produtos: ' + err.message });
        }
        res.json(rows);
    });
});

// ---- Rotas de Autenticação ----

// Endpoint para cadastro de usuários
app.post('/register', async (req, res) => {
    const { nome, email, endereco, senha } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(senha, 10);
        db.run(
            `INSERT INTO users (nome, email, endereco, senha, pontos, moedas) VALUES (?, ?, ?, ?, 0, 0)`,
            [nome, email, endereco, hashedPassword],
            function (err) {
                if (err) {
                    return res.status(400).json({ error: 'Erro ao cadastrar usuário: ' + err.message });
                }
                res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Erro ao cadastrar usuário: ' + error.message });
    }
});

// Endpoint para login de usuários
app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuário: ' + err.message });
        }
        if (!user || !(await bcrypt.compare(senha, user.senha))) {
            return res.status(400).json({ error: 'Credenciais inválidas.' });
        }
        
        // Retorna informações do usuário, incluindo pontos e moedas
        res.json({
            message: 'Login bem-sucedido!',
            nome: user.nome,
            email: user.email,
            pontos: user.pontos,
            moedas: user.moedas,
            id: user.id // Inclui o ID do usuário para uso posterior
        });
    });
});

// Rota para obter o ranking de usuários com base nos pontos, em ordem decrescente
app.get('/ranking', (req, res) => {
    db.all(`SELECT nome, pontos FROM users ORDER BY pontos DESC`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao obter ranking: ' + err.message });
        }
        res.json(rows);
    });
});

// Endpoint para adicionar um produto ao carrinho
app.post('/carrinho/adicionar', (req, res) => {
    const { user_id, produto_id, quantidade } = req.body;

    db.run(
        `INSERT INTO carrinho (user_id, produto_id, quantidade) VALUES (?, ?, ?)`,
        [user_id, produto_id, quantidade],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao adicionar produto ao carrinho: ' + err.message });
            }
            res.json({ message: 'Produto adicionado ao carrinho!' });
        }
    );
});

// Endpoint para obter itens do carrinho de um usuário
app.get('/carrinho/:user_id', (req, res) => {
    const userId = req.params.user_id;

    db.all(
        `SELECT produtos.*, carrinho.quantidade FROM carrinho
         JOIN produtos ON carrinho.produto_id = produtos.id
         WHERE carrinho.user_id = ?`,
        [userId],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao obter carrinho: ' + err.message });
            }
            res.json(rows);
        }
    );
});

// Endpoint para remover um item do carrinho
app.delete('/carrinho/remover', (req, res) => {
    const { user_id, produto_id } = req.body;

    db.run(
        `DELETE FROM carrinho WHERE user_id = ? AND produto_id = ?`,
        [user_id, produto_id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao remover produto do carrinho: ' + err.message });
            }
            res.json({ message: 'Produto removido do carrinho!' });
        }
    );
});

// Endpoint para obter dados do usuário pelo ID
app.get('/user/:id', (req, res) => {
    const userId = req.params.id;

    db.get(`SELECT nome, email, endereco, pontos, moedas FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar dados do usuário: ' + err.message });
        }
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.json(user);
    });
});



// Endpoint para finalizar o pedido
app.post('/finalizarPedido', (req, res) => {
    const { userId, valorFinal, itensPedido, moedasUsadas, pontosGanhos, saldoMoedasFinal } = req.body;

    console.log('Dados recebidos para finalizar o pedido:', req.body);

    // Começar uma transação
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Inserir o pedido
        db.run(
            `INSERT INTO pedidos (user_id, valor_total) VALUES (?, ?)`,
            [userId, valorFinal],
            function (err) {
                if (err) {
                    console.error('Erro ao registrar o pedido:', err.message);
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: 'Erro ao registrar o pedido: ' + err.message });
                }
                const pedidoId = this.lastID;
                console.log('Pedido registrado com ID:', pedidoId);

                // Inserir os itens do pedido
                const insertItemStmt = db.prepare(`
                    INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) 
                    VALUES (?, ?, ?, ?)
                `);

                itensPedido.forEach(item => {
                    console.log('Registrando item do pedido:', item);
                    insertItemStmt.run(
                        pedidoId, 
                        item.produto_id, 
                        item.quantidade, 
                        item.preco_unitario,
                        (err) => {
                            if (err) {
                                console.error('Erro ao registrar item do pedido:', err.message);
                                db.run("ROLLBACK");
                                return res.status(500).json({ error: 'Erro ao registrar item do pedido: ' + err.message });
                            }
                        }
                    );
                });

                insertItemStmt.finalize();

                // Atualizar os pontos e saldo de moedas do usuário
                db.run(
                    `UPDATE users SET 
                        pontos = COALESCE(pontos, 0) + ?, 
                        moedas = ? 
                     WHERE id = ?`,
                    [pontosGanhos, saldoMoedasFinal, userId],
                    (err) => {
                        if (err) {
                            console.error('Erro ao atualizar pontos e moedas do usuário:', err.message);
                            db.run("ROLLBACK");
                            return res.status(500).json({ error: 'Erro ao atualizar pontos e moedas: ' + err.message });
                        }

                        db.run("COMMIT");
                        console.log('Pedido finalizado com sucesso!');
                        res.json({ message: 'Pedido finalizado com sucesso!' });
                    }
                );
                
            }
        );
    });
});




// Fechar conexão com o banco de dados ao encerrar o servidor
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar a conexão com o banco de dados:', err.message);
        }
        console.log('Conexão com o banco de dados fechada.');
        process.exit(0);
    });
});

// Inicia o servidor
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
