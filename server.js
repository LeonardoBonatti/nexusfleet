const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const session = require("express-session")
const path = require("path")

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("frontend"))

app.use(session({
    secret: "segredo",
    resave: false,
    saveUninitialized: true
}))

const dbPath = path.join(__dirname, "database.db");
const db = new sqlite3.Database(dbPath);

/* ================= MODELAGEM OO (CONCEITOS DA FACULDADE) ================= */

// [ABSTRAÇÃO] Classe base abstrata
class Entidade {
    #id; // [ENCAPSULAMENTO] Campo privado

    constructor(id) {
        if (this.constructor === Entidade) {
            throw new Error("Classe abstrata 'Entidade' não pode ser instanciada diretamente.");
        }
        this.#id = id;
    }

    // [GETTER] Atributo virtual/read-only
    get id() {
        return this.#id;
    }

    // [POLIMORFISMO] Método abstrato (contrato)
    validar() {
        throw new Error("Método 'validar()' deve ser implementado nas subclasses.");
    }
}

// [HERANÇA] Especialização de Entidade
class Usuario extends Entidade {
    #nome;
    #email;
    #senha;

    constructor(id, nome, email, senha) {
        super(id);
        this.#nome = nome;
        this.#email = email;
        this.#senha = senha;
    }

    // [GETTERS/SETTERS]
    get email() { return this.#email; }
    get nome() { return this.#nome; }
    
    set senha(novaSenha) {
        if (novaSenha.length < 4) throw new Error("Senha muito curta");
        this.#senha = novaSenha;
    }

    validar() {
        return this.#email && this.#senha;
    }

    toJSON() {
        return { id: this.id, nome: this.#nome, email: this.#email };
    }
}

class Veiculo extends Entidade {
    #nome;
    #placa;
    #anoFabricacao;
    #capacidadeTanque;

    constructor(id, nome, placa, anoFabricacao, capacidadeTanque) {
        super(id);
        this.#nome = nome;
        this.#placa = placa ? placa.toUpperCase().replace("-", "") : "";
        this.#anoFabricacao = Number(anoFabricacao);
        this.#capacidadeTanque = Number(capacidadeTanque);
    }

    get nome() { return this.#nome; }
    get placa() { return this.#placa; }
    get anoFabricacao() { return this.#anoFabricacao; }
    get capacidadeTanque() { return this.#capacidadeTanque; }

    validar() {
        const anoLimite = 2026;
        const regexPlaca = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/; // Padrão Mercosul (LLLNLNN)
        
        if (!this.#nome) return false;
        if (!regexPlaca.test(this.#placa)) return false;
        if (!this.#anoFabricacao || this.#anoFabricacao > anoLimite) return false;
        if (!this.#capacidadeTanque || this.#capacidadeTanque <= 0) return false;
        return true;
    }

    toJSON() {
        return { 
            id: this.id, 
            nome: this.#nome, 
            placa: this.#placa,
            ano_fabricacao: this.#anoFabricacao,
            capacidade_tanque: this.#capacidadeTanque 
        };
    }
}

class Abastecimento extends Entidade {
    #carroId;
    #data;
    #combustivel;
    #kmInicial;
    #kmFinal;
    #litros;
    #valorLitro;
    #horimetro;

    constructor(id, carroId, data, combustivel, kmInicial, kmFinal, litros, valorLitro, horimetro) {
        super(id);
        this.#carroId = carroId;
        this.#data = data;
        this.#combustivel = combustivel;
        this.#kmInicial = Number(kmInicial);
        this.#kmFinal = Number(kmFinal);
        this.#litros = Number(litros);
        this.#valorLitro = Number(valorLitro);
        this.#horimetro = Number(horimetro);
    }

    get valorTotal() {
        return (this.#litros * this.#valorLitro).toFixed(2);
    }

    validar() {
        if (this.#kmFinal <= this.#kmInicial) return false;
        if (this.#horimetro <= 0) return false;
        return true;
    }

    toJSON() {
        return {
            id: this.id,
            carro_id: this.#carroId,
            data: this.#data,
            combustivel: this.#combustivel,
            km_inicial: this.#kmInicial,
            km_final: this.#kmFinal,
            litros: this.#litros,
            valor_litro: this.#valorLitro,
            valor_total: Number(this.valorTotal),
            horimetro: this.#horimetro
        };
    }
}

class Manutencao extends Entidade {
    #carroId; #data; #descricao; #valor; #horimetro;

    constructor(id, carroId, data, descricao, valor, horimetro) {
        super(id);
        this.#carroId = carroId;
        this.#data = data;
        this.#descricao = descricao;
        this.#valor = Number(valor);
        this.#horimetro = Number(horimetro);
    }

    validar() { return !!(this.#carroId && this.#data && this.#descricao && this.#valor > 0 && this.#horimetro > 0); }

    toJSON() {
        return { id: this.id, carro_id: this.#carroId, data: this.#data, descricao: this.#descricao, valor: this.#valor, horimetro: this.#horimetro };
    }
}

class Trajeto extends Entidade {
    #carroId; #data; #origem; #destino; #kmDistancia;

    constructor(id, carroId, data, origem, destino, kmDistancia) {
        super(id);
        this.#carroId = carroId;
        this.#data = data;
        this.#origem = origem;
        this.#destino = destino;
        this.#kmDistancia = Number(kmDistancia);
    }

    validar() { return !!(this.#carroId && this.#data && this.#origem && this.#destino && this.#kmDistancia > 0); }

    toJSON() {
        return { id: this.id, carro_id: this.#carroId, data: this.#data, origem: this.#origem, destino: this.#destino, km_distancia: this.#kmDistancia };
    }
}

class Reparo extends Entidade {
    #carroId; #data; #peca; #valor; #horimetro;

    constructor(id, carroId, data, peca, valor, horimetro) {
        super(id);
        this.#carroId = carroId;
        this.#data = data;
        this.#peca = peca;
        this.#valor = Number(valor);
        this.#horimetro = Number(horimetro);
    }

    validar() { return !!(this.#carroId && this.#data && this.#peca && this.#valor > 0 && this.#horimetro > 0); }

    toJSON() {
        return { id: this.id, carro_id: this.#carroId, data: this.#data, peca: this.#peca, valor: this.#valor, horimetro: this.#horimetro };
    }
}

/* ================= DATABASE INIT ================= */

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, email TEXT UNIQUE, senha TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS carros (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, placa TEXT, ano_fabricacao INTEGER, capacidade_tanque REAL)`);
    db.run(`CREATE TABLE IF NOT EXISTS abastecimentos (id INTEGER PRIMARY KEY AUTOINCREMENT, carro_id INTEGER, data TEXT, combustivel TEXT, km_inicial REAL, km_final REAL, litros REAL, valor_litro REAL, valor_total REAL, horimetro REAL)`);
    db.run(`CREATE TABLE IF NOT EXISTS manutencoes (id INTEGER PRIMARY KEY AUTOINCREMENT, carro_id INTEGER, data TEXT, descricao TEXT, valor REAL, horimetro REAL)`);
    db.run(`CREATE TABLE IF NOT EXISTS trajetos (id INTEGER PRIMARY KEY AUTOINCREMENT, carro_id INTEGER, data TEXT, origem TEXT, destino TEXT, km_distancia REAL)`);
    db.run(`CREATE TABLE IF NOT EXISTS reparos (id INTEGER PRIMARY KEY AUTOINCREMENT, carro_id INTEGER, data TEXT, peca TEXT, valor REAL, horimetro REAL)`);
    db.run(`CREATE TABLE IF NOT EXISTS postos (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, lat REAL, lng REAL, preco_gasolina REAL, preco_alcool REAL, preco_alcool_adit REAL, preco_gasolina_adit REAL, preco_diesel_s10 REAL, preco_diesel_comum REAL)`);
    db.run(`CREATE TABLE IF NOT EXISTS clientes (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, lat REAL, lng REAL, volume_vendas REAL)`);
    db.run(`CREATE TABLE IF NOT EXISTS agenda (id INTEGER PRIMARY KEY AUTOINCREMENT, carro_id INTEGER, data TEXT, tarefa TEXT, status TEXT)`);
});

/* ================= ENDPOINTS (USANDO AS CLASSES) ================= */

app.post("/cadastro", (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const user = new Usuario(null, nome, email, senha);
        if (!user.validar()) return res.send("Dados inválidos");

        db.run(
            "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
            [nome, email, senha],
            function (err) {
                if (err) return res.send("Erro ao cadastrar: " + err.message);
                res.send("Usuário cadastrado com sucesso");
            }
        );
    } catch (e) {
        res.send(e.message);
    }
});

app.post("/login", (req, res) => {
    const { email, senha } = req.body;
    db.get("SELECT * FROM usuarios WHERE email=? AND senha=?", [email, senha], (err, row) => {
        if (err || !row) return res.send("Email ou senha inválidos");
        
        // [INSTANCIAÇÃO] Criando objeto a partir do banco
        const user = new Usuario(row.id, row.nome, row.email, row.senha);
        req.session.usuario = user.toJSON();
        res.send("Login realizado");
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => res.send("logout"));
});

app.post("/carros", (req, res) => {
    const { nome, placa, ano_fabricacao, capacidade_tanque } = req.body;
    const v = new Veiculo(null, nome, placa, ano_fabricacao, capacidade_tanque);
    
    if (!v.validar()) {
        return res.send("Dados inválidos! Verifique a placa (padrão Mercosul), ano (máx 2026) e capacidade.");
    }

    db.run("INSERT INTO carros (nome, placa, ano_fabricacao, capacidade_tanque) VALUES (?, ?, ?, ?)", [v.nome, v.placa, v.anoFabricacao, v.capacidadeTanque], (err) => {
        if (err) return res.send("Erro ao cadastrar veículo: " + err.message);
        res.send("Veículo cadastrado com sucesso");
    });
});

app.get("/carros", (req, res) => {
    db.all("SELECT * FROM carros", (err, rows) => {
        const veiculos = rows ? rows.map(r => new Veiculo(r.id, r.nome, r.placa, r.ano_fabricacao, r.capacidade_tanque).toJSON()) : [];
        res.json(veiculos);
    });
});

app.post("/abastecimentos", (req, res) => {
    const { carro_id, data, combustivel, km_inicial, km_final, litros, valor_litro, horimetro } = req.body;
    
    db.get("SELECT capacidade_tanque FROM carros WHERE id = ?", [carro_id], (err, carro) => {
        if (!carro) return res.send("Veículo não encontrado");

        if (Number(litros) > carro.capacidade_tanque) {
            return res.send(`Erro: O tanque deste veículo suporta no máximo ${carro.capacidade_tanque} litros.`);
        }

        // Validação de Horímetro (não pode ser menor que o último)
        db.get("SELECT MAX(horimetro) as last_h FROM abastecimentos WHERE carro_id = ?", [carro_id], (err, row) => {
            const lastH = row ? row.last_h : 0;
            if (Number(horimetro) < lastH) {
                return res.send(`Erro: O horímetro (${horimetro}) não pode ser menor que o último registrado (${lastH}).`);
            }

            const abs = new Abastecimento(null, carro_id, data, combustivel, km_inicial, km_final, litros, valor_litro, horimetro);
            if (!abs.validar()) return res.send("Dados inválidos. KM Final deve ser maior que o Inicial e Horímetro maior que 0.");

            db.run(
                `INSERT INTO abastecimentos (carro_id, data, combustivel, km_inicial, km_final, litros, valor_litro, valor_total, horimetro) VALUES (?,?,?,?,?,?,?,?,?)`,
                [carro_id, data, combustivel, km_inicial, km_final, litros, valor_litro, abs.valorTotal, horimetro],
                (err) => {
                    if (err) return res.send("Erro ao salvar abastecimento: " + err.message);
                    res.send("Abastecimento salvo com sucesso");
                }
            );
        });
    });
});

app.get("/abastecimentos", (req, res) => {
    db.all(
        `SELECT abastecimentos.*, carros.nome AS carro FROM abastecimentos LEFT JOIN carros ON carros.id = abastecimentos.carro_id ORDER BY data DESC`,
        (err, rows) => {
            if (err) return res.json([]);
            const list = rows.map(r => {
                const a = new Abastecimento(r.id, r.carro_id, r.data, r.combustivel, r.km_inicial, r.km_final, r.litros, r.valor_litro, r.horimetro);
                const data = a.toJSON();
                data.carro = r.carro;
                return data;
            });
            res.json(list);
        }
    );
});

app.delete("/abastecimentos/:id", (req, res) => {
    db.run("DELETE FROM abastecimentos WHERE id=?", [req.params.id], (err) => {
        res.send(err ? "Erro ao deletar" : "ok");
    });
});

app.get("/estatisticas", (req, res) => {
    db.all("SELECT * FROM abastecimentos", (err, rows) => {
        if (err) return res.json({});
        
        // [ABSTRAÇÃO/ENCAPSULAMENTO] Processando lógica via instâncias
        const abastecimentos = rows.map(r => new Abastecimento(r.id, r.carro_id, r.data, r.combustivel, r.km_inicial, r.km_final, r.litros, r.valor_litro));
        
        const totalGasto = abastecimentos.reduce((acc, a) => acc + Number(a.valorTotal), 0);
        const totalKm = abastecimentos.reduce((acc, a) => acc + (a.toJSON().km_final - a.toJSON().km_inicial), 0);
        const totalLitros = abastecimentos.reduce((acc, a) => acc + a.toJSON().litros, 0);

        res.json({
            totalGasto: Number(totalGasto.toFixed(2)),
            totalKm,
            totalLitros,
            consumoMedio: totalLitros > 0 ? (totalKm / totalLitros).toFixed(2) : 0
        });
    });
});

// --- MANUTENÇÕES ---
app.post("/manutencoes", (req, res) => {
    const { carro_id, data, descricao, valor, horimetro } = req.body;
    const m = new Manutencao(null, carro_id, data, descricao, valor, horimetro);
    if (!m.validar()) return res.send("Dados inválidos");
    db.run("INSERT INTO manutencoes (carro_id, data, descricao, valor, horimetro) VALUES (?,?,?,?,?)", [carro_id, data, descricao, valor, horimetro], (err) => res.send(err ? "Erro" : "Manutenção salva"));
});

app.get("/manutencoes", (req, res) => {
    db.all("SELECT m.*, c.nome AS carro FROM manutencoes m JOIN carros c ON c.id = m.carro_id ORDER BY data DESC", (err, rows) => {
        res.json(rows ? rows.map(r => { const obj = new Manutencao(r.id, r.carro_id, r.data, r.descricao, r.valor, r.horimetro).toJSON(); obj.carro = r.carro; return obj; }) : []);
    });
});

// --- TRAJETOS ---
app.post("/trajetos", (req, res) => {
    const { carro_id, data, origem, destino, km_distancia } = req.body;
    const t = new Trajeto(null, carro_id, data, origem, destino, km_distancia);
    if (!t.validar()) return res.send("Dados inválidos");
    db.run("INSERT INTO trajetos (carro_id, data, origem, destino, km_distancia) VALUES (?,?,?,?,?)", [carro_id, data, origem, destino, km_distancia], (err) => res.send(err ? "Erro" : "Trajeto salvo"));
});

app.get("/trajetos", (req, res) => {
    db.all("SELECT t.*, c.nome AS carro FROM trajetos t JOIN carros c ON c.id = t.carro_id ORDER BY data DESC", (err, rows) => {
        res.json(rows ? rows.map(r => { const obj = new Trajeto(r.id, r.carro_id, r.data, r.origem, r.destino, r.km_distancia).toJSON(); obj.carro = r.carro; return obj; }) : []);
    });
});

// --- REPAROS ---
app.post("/reparos", (req, res) => {
    const { carro_id, data, peca, valor, horimetro } = req.body;
    const r = new Reparo(null, carro_id, data, peca, valor, horimetro);
    if (!r.validar()) return res.send("Dados inválidos");
    db.run("INSERT INTO reparos (carro_id, data, peca, valor, horimetro) VALUES (?,?,?,?,?)", [carro_id, data, peca, valor, horimetro], (err) => res.send(err ? "Erro" : "Reparo salvo"));
});

app.get("/reparos", (req, res) => {
    db.all("SELECT r.*, c.nome AS carro FROM reparos r JOIN carros c ON c.id = r.carro_id ORDER BY data DESC", (err, rows) => {
        res.json(rows ? rows.map(row => { const obj = new Reparo(row.id, row.carro_id, row.data, row.peca, row.valor, row.horimetro).toJSON(); obj.carro = row.carro; return obj; }) : []);
    });
});

// --- NOVOS ENDPOINTS ---

app.get("/postos", (req, res) => {
    db.all("SELECT * FROM postos", (err, rows) => res.json(rows || []));
});

app.get("/clientes", (req, res) => {
    db.all("SELECT * FROM clientes", (err, rows) => res.json(rows || []));
});

app.get("/agenda", (req, res) => {
    db.all("SELECT a.*, c.nome AS carro FROM agenda a JOIN carros c ON c.id = a.carro_id ORDER BY data ASC", (err, rows) => res.json(rows || []));
});

app.get("/financeiro", (req, res) => {
    // Agregação de gastos totais (abastecimento + manutenção + reparos)
    const sql = `
        SELECT 'Abastecimento' as tipo, SUM(valor_total) as total FROM abastecimentos
        UNION ALL
        SELECT 'Manutenção' as tipo, SUM(valor) as total FROM manutencoes
        UNION ALL
        SELECT 'Reparo' as tipo, SUM(valor) as total FROM reparos
    `;
    db.all(sql, (err, rows) => {
        res.json(rows || []);
    });
});

app.get("/diagnostico/:carroId", (req, res) => {
    const carroId = req.params.carroId;
    // Lógica simples de diagnóstico: verificar último reparo e km
    db.get("SELECT MAX(km_final) as km_atual FROM abastecimentos WHERE carro_id = ?", [carroId], (err, row) => {
        const kmAtual = row ? row.km_atual : 0;
        db.all("SELECT * FROM reparos WHERE carro_id = ? ORDER BY data DESC LIMIT 1", [carroId], (err, reparos) => {
            const ultimoReparo = reparos && reparos.length > 0 ? reparos[0] : null;
            res.json({
                km_atual: kmAtual,
                ultimo_reparo: ultimoReparo,
                status: kmAtual > 50000 ? "Revisão Necessária" : "Saudável",
                alerta: kmAtual > 60000 ? "Troca de Correia Dentada Pendente" : null
            });
        });
    });
});


app.post("/chat", (req, res) => {
    const { message } = req.body;
    const msg = message.toLowerCase();

    // Lógica simples de assistente baseada em palavras-chave
    if (msg.includes("consumo")) {
        db.all("SELECT c.nome, AVG(a.km_final - a.km_inicial)/AVG(a.litros) as media FROM abastecimentos a JOIN carros c ON c.id = a.carro_id GROUP BY c.id", (err, rows) => {
            if (err || !rows || !rows.length) return res.json({ response: "Ainda não tenho dados de abastecimento para calcular médias." });
            let resp = "Aqui está a média de consumo da frota:\n";
            rows.forEach(r => resp += `- ${r.nome}: ${Number(r.media || 0).toFixed(2)} KM/L\n`);
            res.json({ response: resp });
        });
    } else if (msg.includes("gasto") || msg.includes("quanto")) {
        db.get(`
            SELECT 
                (SELECT SUM(valor_total) FROM abastecimentos) as abs,
                (SELECT SUM(valor) FROM manutencoes) as man,
                (SELECT SUM(valor) FROM reparos) as rep
        `, (err, row) => {
            const total = (row.abs || 0) + (row.man || 0) + (row.rep || 0);
            res.json({ response: `O gasto total registrado na frota é de R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}. (Abastecimentos: R$ ${row.abs || 0}, Manutenções/Reparos: R$ ${(row.man || 0) + (row.rep || 0)})` });
        });
    } else if (msg.includes("manutenção") || msg.includes("reparo")) {
        db.all("SELECT c.nome, MAX(m.data) as ultima FROM manutencoes m JOIN carros c ON c.id = m.carro_id GROUP BY c.id", (err, rows) => {
            if (err || !rows || !rows.length) return res.json({ response: "Nenhuma manutenção registrada até o momento." });
            let resp = "Últimas manutenções realizadas:\n";
            rows.forEach(r => resp += `- ${r.nome}: ${r.ultima}\n`);
            res.json({ response: resp });
        });
    } else if (msg.includes("agenda") || msg.includes("compromisso")) {
        db.all("SELECT * FROM agenda WHERE status = 'pendente' LIMIT 5", (err, rows) => {
            if (err || !rows || !rows.length) return res.json({ response: "Você não tem compromissos pendentes na agenda." });
            let resp = "Aqui estão seus próximos compromissos:\n";
            rows.forEach(r => resp += `- ${r.tarefa} (${r.data})\n`);
            res.json({ response: resp });
        });
    } else {
        res.json({ response: "Olá! Eu sou o assistente NexusFleet. Posso te ajudar com informações sobre consumo, gastos totais, últimas manutenções e agenda. O que deseja saber?" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Nexus Fleet rodando em http://localhost:${PORT}/login.html`);
});
