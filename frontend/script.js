/* ================= ESTRUTURA OO FRONTEND NEXUSFLEET (PRÊMIUM) ================= */

class ComponenteUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }
}

class NexusApp {
    #api = "";
    #mapa;
    #markers = [];

    constructor() {
        console.log("NexusApp inicializada");
    }

    async init() {
        this.initMap();
        await this.atualizarTudo();
    }

    initMap() {
        if (!document.getElementById("map")) return;
        
        // Inicializa o mapa centralizado no Brasil/São Paulo
        this.#mapa = L.map('map').setView([-23.5505, -46.6333], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.#mapa);

        this.carregarMapaDados();
    }

    async carregarMapaDados() {
        // Limpa markers antigos
        this.#markers.forEach(m => this.#mapa.removeLayer(m));
        this.#markers = [];

        // 1. Carregar Postos
        const resPostos = await fetch(`${this.#api}/postos`);
        const postos = await resPostos.json();
        postos.forEach(p => {
            const marker = L.marker([p.lat, p.lng], {
                icon: L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="background-color:#f59e0b; padding:5px; border-radius:50%; border:2px solid white;"><i class="bi bi-fuel-pump-fill text-white"></i></div>`,
                    iconSize: [30, 42],
                    iconAnchor: [15, 42]
                })
            }).addTo(this.#mapa)
            .bindPopup(`
                <b>${p.nome}</b><br>
                <div class="small mt-1">
                    Gasolina Comum: R$ ${(p.preco_gasolina || 0).toFixed(2)}<br>
                    Gasolina Aditivada: R$ ${(p.preco_gasolina_adit || 0).toFixed(2)}<br>
                    Álcool Comum: R$ ${(p.preco_alcool || 0).toFixed(2)}<br>
                    Álcool Aditivada: R$ ${(p.preco_alcool_adit || 0).toFixed(2)}<br>
                    Diesel S10: R$ ${(p.preco_diesel_s10 || 0).toFixed(2)}<br>
                    Diesel Comum: R$ ${(p.preco_diesel_comum || 0).toFixed(2)}
                </div>
                <div class="mt-2 d-flex gap-1">
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" class="btn btn-primary btn-sm text-white" style="font-size: 10px;">Google Maps</a>
                    <a href="https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes" target="_blank" class="btn btn-info btn-sm text-white" style="font-size: 10px;">Waze</a>
                </div>
            `);
            this.#markers.push(marker);
        });

        // 2. Carregar Clientes
        const resClientes = await fetch(`${this.#api}/clientes`);
        const clientes = await resClientes.json();
        clientes.forEach(c => {
            const isBase = c.nome.includes("Base");
            const color = isBase ? "#1e293b" : "#10b981";
            const icon = isBase ? "bi-building-fill" : "bi-person-fill";

            const marker = L.marker([c.lat, c.lng], {
                icon: L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="background-color:${color}; padding:5px; border-radius:50%; border:2px solid white;"><i class="bi ${icon} text-white"></i></div>`,
                    iconSize: [30, 42],
                    iconAnchor: [15, 42]
                })
            }).addTo(this.#mapa)
            .bindPopup(`<b>${c.nome}</b>${isBase ? '<br>Sede NexusFleet' : `<br>Volume: R$ ${c.volume_vendas.toLocaleString()}`}`);
            this.#markers.push(marker);
        });

        // 3. Simular localização de Veículos (baseado nos trajetos recentes)
        const resTrajetos = await fetch(`${this.#api}/trajetos`);
        const trajetos = await resTrajetos.json();
        const veiculosUnicos = [...new Set(trajetos.map(t => t.carro_id))];
        
        veiculosUnicos.forEach((vid, index) => {
            // Offset aleatório para simular dispersão
            const lat = -23.5505 + (Math.random() - 0.5) * 0.1;
            const lng = -46.6333 + (Math.random() - 0.5) * 0.1;
            
            const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="background-color:#6366f1; padding:5px; border-radius:50%; border:2px solid white;"><i class="bi bi-truck text-white"></i></div>`,
                    iconSize: [30, 42],
                    iconAnchor: [15, 42]
                })
            }).addTo(this.#mapa)
            .bindPopup(`<b>Veículo ID: ${vid}</b><br>Em trânsito`);
            this.#markers.push(marker);
        });
    }

    async atualizarTudo() {
        await Promise.all([
            this.carregarEstatisticas(),
            this.carregarFinanceiro(),
            this.carregarAgenda(),
            this.carregarHistorico(),
            this.carregarDiagnostico(),
            this.carregarVeiculos()
        ]);
    }

    async carregarEstatisticas() {
        const res = await fetch(`${this.#api}/estatisticas`);
        const e = await res.json();
        
        if (document.getElementById("totalGasto")) {
            document.getElementById("totalGasto").innerText = `R$ ${(e.totalGasto || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
            document.getElementById("totalKm").innerText = `${(e.totalKm || 0).toLocaleString()} km`;
            document.getElementById("media").innerText = `${e.consumoMedio || 0} KM/L`;
            
            // Lógica de Comparador Separada (Simulação baseada no consumo médio)
            const mediaAlc = e.consumoMedio * 0.7; // Exemplo de proporção
            const mediaGas = e.consumoMedio;

            if (document.getElementById("labelAlc")) {
                document.getElementById("labelAlc").innerText = `Média: ${mediaAlc.toFixed(2)} KM/L`;
                document.getElementById("labelGas").innerText = `Média: ${mediaGas.toFixed(2)} KM/L`;
                document.getElementById("progressAlc").style.width = `${Math.min(100, mediaAlc * 10)}%`;
                document.getElementById("progressGas").style.width = `${Math.min(100, mediaGas * 10)}%`;
            }

            document.getElementById("previsaoGastos").innerText = `R$ ${(e.totalGasto * 1.1 || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        }
    }

    async carregarFinanceiro() {
        const res = await fetch(`${this.#api}/financeiro`);
        const dados = await res.json();
        
        const ctx = document.getElementById('graficoFinanceiro');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: dados.map(d => d.tipo),
                datasets: [{
                    data: dados.map(d => d.total),
                    backgroundColor: ['#6366f1', '#10b981', '#f59e0b']
                }]
            },
            options: { cutout: '70%' }
        });
    }

    async carregarAgenda() {
        const res = await fetch(`${this.#api}/agenda`);
        const agenda = await res.json();
        const container = document.getElementById("listaAgenda");
        if (!container) return;

        container.innerHTML = agenda.map(item => `
            <div class="list-group-item px-0 border-0 mb-2">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1 fw-bold">${item.tarefa}</h6>
                    <small class="text-primary">${item.data}</small>
                </div>
                <p class="mb-1 small text-muted">${item.carro}</p>
                <span class="badge ${item.status === 'pendente' ? 'bg-light text-warning' : 'bg-success'} rounded-pill">
                    ${item.status}
                </span>
            </div>
        `).join('');
    }

    async carregarHistorico() {
        const res = await fetch(`${this.#api}/abastecimentos`);
        const dados = await res.json();
        const container = document.getElementById("tabelaGeral");
        if (!container) return;

        container.innerHTML = dados.slice(0, 10).map(item => `
            <tr>
                <td><div class="fw-bold">${item.carro || "Veículo"}</div></td>
                <td>${item.data}</td>
                <td>Abastecimento</td>
                <td>R$ ${item.valor_total.toFixed(2)}</td>
                <td>${item.horimetro || 0} h</td>
                <td>
                    <button class="btn btn-light btn-sm" onclick="app.excluirRegistro(${item.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    async carregarDiagnostico() {
        const resCarros = await fetch(`${this.#api}/carros`);
        const carros = await resCarros.json();
        const container = document.getElementById("containerDiagnostico");
        if (!container) return;

        container.innerHTML = "";
        
        // Carrega diagnóstico para os 3 primeiros carros para exemplo
        for (let i = 0; i < Math.min(3, carros.length); i++) {
            const c = carros[i];
            const resD = await fetch(`${this.#api}/diagnostico/${c.id}`);
            const diag = await resD.json();

            container.innerHTML += `
                <div class="col-md-4">
                    <div class="p-3 border rounded">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="fw-bold">${c.nome}</span>
                            <span class="badge ${diag.status === 'Saudável' ? 'bg-success' : 'bg-warning'}">${diag.status}</span>
                        </div>
                        <div class="small text-muted mb-2">KM Atual: ${diag.km_atual} km</div>
                        ${diag.alerta ? `<div class="alert alert-danger p-2 small mb-0"><i class="bi bi-exclamation-octagon me-1"></i> ${diag.alerta}</div>` : `<div class="text-success small"><i class="bi bi-check-circle me-1"></i> Sistemas Operacionais</div>`}
                    </div>
                </div>
            `;
        }
    }

    async excluirRegistro(id) {
        if (!confirm("Excluir este registro?")) return;
        await fetch(`${this.#api}/abastecimentos/${id}`, { method: "DELETE" });
        this.atualizarTudo();
    }

    async carregarVeiculos() {
        const res = await fetch(`${this.#api}/carros`);
        const carros = await res.json();
        
        // 1. Preencher Selects em Modais
        const selects = document.querySelectorAll(".select-veiculos");
        selects.forEach(sel => {
            sel.innerHTML = carros.map(c => `<option value="${c.id}">${c.nome} (${c.placa})</option>`).join('');
        });

        // 2. Preencher Cards de Veículos
        const container = document.getElementById("listaVeiculosCards");
        if (container) {
            container.innerHTML = carros.map(c => `
                <div class="col-md-4">
                    <div class="p-3 border rounded-4 bg-light shadow-sm">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="fw-bold m-0">${c.nome}</h6>
                                <span class="badge bg-dark mt-1">${c.placa}</span>
                            </div>
                            <i class="bi bi-truck fs-4 text-primary"></i>
                        </div>
                        <div class="mt-3 small text-muted">
                            <div>Ano: ${c.ano_fabricacao}</div>
                            <div>Tanque: ${c.capacidade_tanque}L</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    async salvarVeiculo() {
        const data = {
            nome: document.getElementById("v_nome").value,
            placa: document.getElementById("v_placa").value,
            ano_fabricacao: document.getElementById("v_ano").value,
            capacidade_tanque: document.getElementById("v_tanque").value
        };
        const res = await fetch(`${this.#api}/carros`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        alert(await res.text());
        bootstrap.Modal.getInstance(document.getElementById('modalVeiculo')).hide();
        this.atualizarTudo();
    }

    async salvarAbastecimento() {
        const data = {
            carro_id: document.getElementById("a_carro").value,
            data: document.getElementById("a_data").value,
            horimetro: document.getElementById("a_horimetro").value,
            km_inicial: document.getElementById("a_km_in").value,
            km_final: document.getElementById("a_km_fi").value,
            litros: document.getElementById("a_litros").value,
            valor_litro: document.getElementById("a_preco").value,
            combustivel: document.getElementById("a_tipo").value
        };
        const res = await fetch(`${this.#api}/abastecimentos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        const msg = await res.text();
        alert(msg);
        if (msg.includes("sucesso")) {
            bootstrap.Modal.getInstance(document.getElementById('modalAbastecimento')).hide();
            this.atualizarTudo();
        }
    }

    async salvarManutencao() {
        const data = {
            carro_id: document.getElementById("m_carro").value,
            data: document.getElementById("m_data").value,
            descricao: document.getElementById("m_desc").value,
            valor: document.getElementById("m_valor").value,
            horimetro: document.getElementById("m_horimetro").value
        };
        const res = await fetch(`${this.#api}/manutencoes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        alert(await res.text());
        bootstrap.Modal.getInstance(document.getElementById('modalManutencao')).hide();
        this.atualizarTudo();
    }

    async enviarChat() {
        const input = document.getElementById("chatInput");
        const msg = input.value;
        if (!msg) return;

        const win = document.getElementById("chatWindow");
        win.innerHTML += `<div><strong>Você:</strong> ${msg}</div>`;
        input.value = "";

        const res = await fetch(`${this.#api}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        win.innerHTML += `<div class="text-primary"><strong>Nexus:</strong> ${data.response}</div>`;
        win.scrollTop = win.scrollHeight;
    }

    logout() {
        fetch(`${this.#api}/logout`).then(() => window.location = "login.html");
    }
}

// Inicialização
const app = new NexusApp();
window.app = app;

// --- COMPATIBILIDADE (PONTE HTML) ---

async function login() {
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    
    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
    });
    const msg = await res.text();
    if (msg.includes("Login")) window.location = "dashboard.html";
    else alert(msg);
}

async function cadastrar() {
    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    
    const res = await fetch("/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha })
    });
    const msg = await res.text();
    alert(msg);
    if (msg.includes("sucesso")) window.location = "login.html";
}

window.onload = () => {
    // Só inicializa o dashboard se estiver no dashboard.html (tem o elemento map)
    if (document.getElementById("map")) {
        app.init();
    }
};
