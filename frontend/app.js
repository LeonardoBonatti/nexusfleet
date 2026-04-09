// Script Principal para Interatividade da Interface

document.addEventListener('DOMContentLoaded', () => {

    // 1. Dark Mode / Light Mode Toggle Persistent
    const themeToggleBtn = document.getElementById('themeToggle');
    const body = document.body;

    // Verificar preferência salva
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }

    // Toggle ao clicar
    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        
        let isDark = body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Trocar ícone
        themeToggleBtn.innerHTML = isDark 
            ? '<i class="fa-solid fa-sun"></i>' 
            : '<i class="fa-solid fa-moon"></i>';
    });

    // 2. Sidebar Toggle (Minimizar)
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');

    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('minimized');
    });
});

// 3. Search Filter para o Menu da Sidebar
function filterMenu() {
    let input = document.getElementById('menuSearch');
    let filter = input.value.toLowerCase();
    
    // Pega todos os li do nav
    let li = document.querySelectorAll('#sidebar-nav ul li');

    li.forEach(item => {
        // Tenta achar o <a> e o texto dentro dele
        let a = item.querySelector('a');
        if (a) {
            let textValue = a.textContent || a.innerText;
            if (textValue.toLowerCase().indexOf(filter) > -1) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        }
    });
}

// 4. Sidebar Router (Navegação Dinâmica)
document.addEventListener('DOMContentLoaded', () => {
    const menuLinks = document.querySelectorAll('#sidebar-nav ul li a');
    const pageContainer = document.querySelector('.page-container');

    menuLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault(); // Impede de subir a página pelo href="#"
            
            // Remove a classe 'active' de todos
            document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
            // Adiciona classe 'active' no pai (li) do link clicado
            link.parentElement.classList.add('active');

            const page = link.getAttribute('data-page');
            
            if (page) {
                try {
                    // Busca dinamicamente o trecho HTML da pasta pages
                    const response = await fetch(`/pages/${page}.html`);
                    if (response.ok) {
                        const html = await response.text();
                        pageContainer.innerHTML = html;
                        // Opcional: Chama a função que adiciona lógica específica daquela página recém-carregada
                        setupPageScripts(page);
                    } else {
                        pageContainer.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-state-icon"><i class="fa-solid fa-person-digging"></i></div>
                                <h2>Página em Construção</h2>
                                <p>A tela <b>${page}</b> ainda não possui design finalizado no momento, mas toda a estrutura já suporta a renderização.</p>
                            </div>
                        `;
                    }
                } catch (err) {
                    console.error("Erro ao carregar página", err);
                }
            } else {
                pageContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fa-solid fa-rocket"></i></div>
                        <h2>Módulo Premium em Breve</h2>
                        <p>Esta funcionalidade avançada faz parte das próximas atualizações planejadas no roadmap do sistema. Fique de olho!</p>
                    </div>
                `;
            }
        });
    });
});

// Expõe roteador de interface
window.navigateTo = function(pageName) {
    const link = document.querySelector(`a[data-page="${pageName}"]`);
    if (link) link.click(); // Simula o clique exato na sidebar e cuida do Active
};

// 5. Lógica Dinâmica das Telas Injetadas (Simula o Banco de Dados no Navegador)

// Função para renderizar Tabela de Veículos
function renderVehicleTable() {
    const logBody = document.getElementById('vehicleLogBody');
    if (!logBody) return;
    let vehicles = JSON.parse(localStorage.getItem('fcs_vehicles')) || [];
    
    if (vehicles.length === 0) {
        logBody.innerHTML = '<tr><td colspan="4" style="padding: 15px; text-align: center; color: var(--text-muted);">Nenhum veículo cadastrado na frota.</td></tr>';
    } else {
        logBody.innerHTML = '';
        vehicles.slice().reverse().forEach(v => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.innerHTML = `
                <td style="padding: 12px; color: var(--text-muted);">#${v.id.toString().slice(-4)}</td>
                <td style="padding: 12px; font-weight: bold; color: var(--text-main);">${v.plate}</td>
                <td style="padding: 12px;">${v.brand} ${v.model}</td>
                <td style="padding: 12px;"><span style="color: var(--success);"><i class="fa-solid fa-check"></i> Ativo</span></td>
            `;
            logBody.appendChild(tr);
        });
    }
}

// Função para renderizar Tabela de Abastecimentos
function renderFuelTable() {
    const logBody = document.getElementById('fuelLogBody');
    if (!logBody) return;
    let fuels = JSON.parse(localStorage.getItem('fcs_fuels')) || [];
    
    if (fuels.length === 0) {
        logBody.innerHTML = '<tr><td colspan="4" style="padding: 15px; text-align: center; color: var(--text-muted);">Nenhum abastecimento registrado ainda.</td></tr>';
    } else {
        logBody.innerHTML = '';
        fuels.slice().reverse().forEach(f => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.innerHTML = `
                <td style="padding: 12px; color: var(--text-muted);">${f.date}</td>
                <td style="padding: 12px; font-weight: 500;">${f.vehicle}</td>
                <td style="padding: 12px; color: var(--primary-color); font-weight: bold;">R$ ${parseFloat(f.cost).toFixed(2).replace('.', ',')}</td>
                <td style="padding: 12px;"><span style="color: var(--success);"><i class="fa-solid fa-check-double"></i> Confirmado</span></td>
            `;
            logBody.appendChild(tr);
        });
    }
}

// Função para renderizar Tabela de Manutenções
function renderMaintenanceTable() {
    const logBody = document.getElementById('maintenanceLogBody');
    if (!logBody) return;
    let manuts = JSON.parse(localStorage.getItem('fcs_maintenances')) || [];
    
    if (manuts.length === 0) {
        logBody.innerHTML = '<tr><td colspan="4" style="padding: 15px; text-align: center; color: var(--text-muted);">Nenhuma manutenção registrada ainda.</td></tr>';
    } else {
        logBody.innerHTML = '';
        // Inverte para os mais novos primeiro
        manuts.slice().reverse().forEach(m => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.innerHTML = `
                <td style="padding: 12px; color: var(--text-muted);">${m.date}</td>
                <td style="padding: 12px; font-weight: 500;">${m.vehicle}</td>
                <td style="padding: 12px; color: var(--text-main);">${m.service}</td>
                <td style="padding: 12px; font-weight: bold; color: var(--danger);">R$ ${parseFloat(m.cost).toFixed(2).replace('.', ',')}</td>
            `;
            logBody.appendChild(tr);
        });
    }
}

function setupPageScripts(pageName) {
    if (pageName === 'veiculos') {
        renderVehicleTable();
    }

    if (pageName === 'historico') {
        const tbody = document.getElementById('historicoGeralBody');
        if (tbody) {
            let fuels = JSON.parse(localStorage.getItem('fcs_fuels')) || [];
            let manuts = JSON.parse(localStorage.getItem('fcs_maintenances')) || [];
            
            let all = [];
            fuels.forEach(f => all.push({ date: f.date, type: '<span style="color:var(--primary-color)"><i class="fa-solid fa-gas-pump"></i> Abastecimento</span>', vehicle: f.vehicle, desc: 'Lançamento de Encerrantes', cost: f.cost, rawDate: f.id }));
            manuts.forEach(m => all.push({ date: m.date, type: '<span style="color:var(--warning)"><i class="fa-solid fa-wrench"></i> Manutenção</span>', vehicle: m.vehicle, desc: m.service, cost: m.cost, rawDate: m.id }));
            
            all.sort((a,b) => b.rawDate - a.rawDate);
            
            if (all.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 15px; color: var(--text-muted);">A linha do tempo da frota está limpa. Dê o primeiro passe!</td></tr>';
            } else {
                tbody.innerHTML = all.map(i => `
                    <tr style="border-bottom: 1px solid var(--border-color);">
                        <td style="padding:15px; color:var(--text-muted);">${i.date}</td>
                        <td style="padding:15px; font-weight:500;">${i.vehicle}</td>
                        <td style="padding:15px;">${i.type}</td>
                        <td style="padding:15px; color:var(--text-main);">${i.desc}</td>
                        <td style="padding:15px; color:var(--text-main); font-weight:bold;">R$ ${parseFloat(i.cost).toFixed(2).replace('.',',')}</td>
                    </tr>
                `).join('');
            }
        }
    }

    if (pageName === 'financeiro') {
        const tbody = document.getElementById('financeiroLogBody');
        if (tbody) {
            let fuels = JSON.parse(localStorage.getItem('fcs_fuels')) || [];
            let manuts = JSON.parse(localStorage.getItem('fcs_maintenances')) || [];
            
            let all = [];
            fuels.forEach(f => all.push({ date: f.date, type: '<span style="color:var(--primary-color)"><i class="fa-solid fa-gas-pump"></i> Abastecimento</span>', vehicle: f.vehicle, cost: f.cost, rawDate: f.id }));
            manuts.forEach(m => all.push({ date: m.date, type: '<span style="color:var(--warning)"><i class="fa-solid fa-wrench"></i> Manutenção</span>', vehicle: m.vehicle, cost: m.cost, rawDate: m.id }));
            
            all.sort((a,b) => b.rawDate - a.rawDate); // Ordena decrescente (mais recentes)
            
            if (all.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 15px; color: var(--text-muted);">Nenhum gasto financeiro registrado.</td></tr>';
            } else {
                tbody.innerHTML = all.map(i => `
                    <tr style="border-bottom: 1px solid var(--border-color);">
                        <td style="padding:15px; color:var(--text-muted);">${i.date}</td>
                        <td style="padding:15px;">${i.type}</td>
                        <td style="padding:15px; font-weight:500;">${i.vehicle}</td>
                        <td style="padding:15px; color:var(--danger); font-weight:bold;">R$ ${parseFloat(i.cost).toFixed(2).replace('.',',')}</td>
                    </tr>
                `).join('');
            }
        }
    }

    if (pageName === 'comparador') {
        const tbody = document.getElementById('eficienciaLogBody');
        if (tbody) {
            let vehicles = JSON.parse(localStorage.getItem('fcs_vehicles')) || [];
            if (vehicles.length === 0) {
                 tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 15px;">Nenhum veículo disponível para análise térmica.</td></tr>';
            } else {
                 tbody.innerHTML = vehicles.map(v => {
                     let rand = 8 + (v.id % 7); // Finge q o KM/l está entre 8 e 15 p/ demonstração
                     let status = rand > 11 ? '<span style="color:var(--success)"><i class="fa-solid fa-arrow-trend-up"></i> Excelente</span>' : '<span style="color:var(--danger)"><i class="fa-solid fa-arrow-trend-down"></i> Gasto Elevado</span>';
                     return `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding:15px; font-weight:500;">${v.plate}</td>
                            <td style="padding:15px;">${v.brand} ${v.model}</td>
                            <td style="padding:15px; color:var(--primary-color); font-weight:bold;">${rand.toFixed(1)} km/L</td>
                            <td style="padding:15px;">${status}</td>
                        </tr>
                     `;
                 }).join('');
            }
        }
    }

    if (pageName === 'diagnostico') {
        const div = document.getElementById('alertasContent');
        if (div) {
             let vehicles = JSON.parse(localStorage.getItem('fcs_vehicles')) || [];
             if (vehicles.length === 0) {
                 div.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-muted);">Nenhum problema detectado (A frota ativa está vazia).</p>';
             } else {
                 let numIssues = vehicles.length > 2 ? 2 : 1; // faking data
                 document.getElementById('dashAlertsCount') ? document.getElementById('dashAlertsCount').textContent = numIssues + ' Veículos' : null;

                 let issues = vehicles.slice(0, 2).map((v, idx) => `
                     <div style="background: rgba(245, 158, 11, 0.05); border-left: 4px solid var(--warning); padding: 15px; margin-bottom: 15px; border-radius: 4px;">
                        <h4 style="color: var(--text-main); margin-bottom: 5px;"><i class="fa-solid fa-triangle-exclamation" style="color: var(--warning);"></i> ${v.brand} ${v.model} (${v.plate})</h4>
                        <p style="color: var(--text-muted); font-size: 0.95rem; margin-top:5px;">${idx === 0 
                            ? 'O módulo registrou que a eficiência despencou nas últimas 3 semanas. Possível problema em bicos injetores.' 
                            : 'Análise preventiva baseada na odometria requer inspeção urgente das correias do motor.'}</p>
                     </div>
                 `).join('');
                 div.innerHTML = issues;
             }
        }
    }

    if (pageName === 'abastecimento' || pageName === 'manutencao') {
        const selectElement = document.querySelector('select[name="vehicle_id"]');
        
        // Carrega da memória para popular dropdown
        if (selectElement) {
            let savedVehicles = JSON.parse(localStorage.getItem('fcs_vehicles')) || [];
            selectElement.innerHTML = '<option value="">Selecione o veículo...</option>';

            if (savedVehicles.length === 0) {
                selectElement.innerHTML += '<option disabled>Nenhum veículo cadastrado. Vá em "Veículos".</option>';
            } else {
                savedVehicles.forEach(v => {
                    const option = document.createElement('option');
                    option.value = v.id;
                    option.textContent = `${v.brand} ${v.model} (Placa: ${v.plate})`;
                    selectElement.appendChild(option);
                });
            }
        }
        
        if (pageName === 'manutencao') renderMaintenanceTable();
        if (pageName === 'abastecimento') renderFuelTable();
    }

    if (pageName === 'mapa_postos') {
        const mapContainer = document.getElementById('fleetMap');
        if (mapContainer) {
            // Inicializa mapa centrado na Região Metropolitana de Campinas e Americana
            const map = L.map('fleetMap').setView([-22.8, -47.15], 11); // Zoom ajustado pra pegar Americana a Campinas
            
            // Verifica o tema escuro
            const isDark = document.body.classList.contains('dark-mode');
            const tileUrl = isDark 
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

            L.tileLayer(tileUrl, {
                attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            // Permite capturar as cordenadas com 1 clique para auto-completar formulário
            map.on('click', function(e) {
                const latInput = document.getElementById('formLat');
                const lngInput = document.getElementById('formLng');
                if(latInput && lngInput) {
                    latInput.value = e.latlng.lat.toFixed(6);
                    lngInput.value = e.latlng.lng.toFixed(6);
                }
            });

            // Postos Fixos Iniciais (Região Interior SP)
            const defaultStations = [
                // Americana
                { lat: -22.7380, lng: -47.3300, name: 'Posto Ipiranga (Centro - Americana)', price: 'R$ 5,39' },
                { lat: -22.7500, lng: -47.3400, name: 'Posto Shell (Av. Cillos - Americana)', price: 'R$ 5,45' },
                // Santa Bárbara D'Oeste
                { lat: -22.7580, lng: -47.4100, name: 'Auto Posto Graal (Rodovia - SBO)', price: 'R$ 5,79' },
                { lat: -22.7700, lng: -47.3950, name: 'Posto Petrobras (Centro - SBO)', price: 'R$ 5,55' },
                // Nova Odessa
                { lat: -22.7750, lng: -47.2900, name: 'Posto BR (Nova Odessa)', price: 'R$ 5,49' },
                // Sumaré
                { lat: -22.8200, lng: -47.2600, name: 'Posto Sumaré (Rod. Anhanguera)', price: 'R$ 5,35' },
                // Hortolândia
                { lat: -22.8600, lng: -47.2200, name: 'Shell (Hortolândia Centro)', price: 'R$ 5,48' },
                // Paulínia
                { lat: -22.7600, lng: -47.1500, name: 'Shell Premium (Av. Principal - Paulínia)', price: 'R$ 5,70' },
                // Campinas
                { lat: -22.8800, lng: -47.0600, name: 'Petrobras (Lagoa do Taquaral - Campinas)', price: 'R$ 5,65' },
                { lat: -22.8250, lng: -47.0750, name: 'Ipiranga (Barão Geraldo)', price: 'R$ 5,59' },
                { lat: -22.9050, lng: -47.0600, name: 'Auto Posto Centro (Campinas)', price: 'R$ 5,44' },
                // Piracicaba (Mais pra esquerda no mapa)
                { lat: -22.7300, lng: -47.6500, name: 'Petrobras (Margens do Rio Piracicaba)', price: 'R$ 5,40' },
                // Limeira
                { lat: -22.5600, lng: -47.4000, name: 'Ipiranga (Limeira Shopping)', price: 'R$ 5,30' }
            ];

            // Puxa Postos Adicionais criados pelo Usuário do BD local
            const savedUserStations = JSON.parse(localStorage.getItem('fcs_stations')) || [];
            
            // Une todos para renderizar
            const allStations = [...defaultStations, ...savedUserStations];

            // Renderiza Pinos
            allStations.forEach(st => {
                let isUserAdded = !st.price.includes('R$') ? `R$ ${st.price}` : st.price; // normaliza preço
                
                L.marker([st.lat, st.lng]).addTo(map)
                    .bindPopup(`<div style="text-align:center;"><b>${st.name}</b><br>Preço Atual: <span style="color: #dc2626; font-weight: bold; font-size: 1.1rem;">${isUserAdded}</span></div>`);
            });

            setTimeout(() => { map.invalidateSize(); }, 300);
        }
    }

    if (pageName === 'previsao') {
        let fuels = JSON.parse(localStorage.getItem('fcs_fuels')) || [];
        let manuts = JSON.parse(localStorage.getItem('fcs_maintenances')) || [];
        
        let total = 0;
        fuels.forEach(f => total += Number(f.cost));
        manuts.forEach(m => total += Number(m.cost));
        
        // Base pra calculo real: usa 100% dos dados da frota hoje para escalar tendencia. Caso vazio, chuta 2500 como base demonstrativa da regressao
        let base = total > 0 ? total : 2500; 

        let elMensal = document.getElementById('prevMensal');
        let elTrimestral = document.getElementById('prevTrimestral');
        if(elMensal) elMensal.textContent = `R$ ${(base * 1.052).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits:2})}`;
        if(elTrimestral) elTrimestral.textContent = `R$ ${(base * 3.2).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits:2})}`;

        const ctxF = document.getElementById('forecastChart');
        if (ctxF) {
            new Chart(ctxF, {
                type: 'line',
                data: {
                    labels: ['Há 2 Meses (Real)', 'Mês Passado (Real)', 'Mês Atual (Em Fechamento)', 'Mês que vem (Prev)', 'Daqui 2 Meses (Prev)', 'Daqui 3 Meses (Prev)'],
                    datasets: [{
                        label: 'Desembolso Consolidado da Frota (R$)',
                        data: [base * 0.85, base * 0.95, base, base * 1.05, base * 1.12, base * 1.20],
                        borderColor: '#f59e0b', // Laranja do alerta previsional
                        backgroundColor: 'rgba(245, 158, 11, 0.2)', // Soft fill
                        borderWidth: 3,
                        pointBackgroundColor: ['#3b82f6', '#3b82f6', '#3b82f6', '#f59e0b', '#dc2626', '#dc2626'],
                        pointRadius: [4, 4, 6, 5, 5, 6], // Ponto atual e finais em destaque
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: document.body.classList.contains('dark-mode') ? '#9ca3af' : '#4b5563', font: {family: 'Inter', size: 14} } } },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { color: document.body.classList.contains('dark-mode') ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                            ticks: { color: document.body.classList.contains('dark-mode') ? '#9ca3af' : '#4b5563', callback: function(value) { return 'R$ ' + value; } }
                        },
                        x: { 
                            grid: { display: false },
                            ticks: { color: document.body.classList.contains('dark-mode') ? '#9ca3af' : '#4b5563', font: {family: 'Inter'} }
                        }
                    }
                }
            });
        }
    }

    if (pageName === 'saude') {
        const container = document.getElementById('healthReportsContainer');
        if (container) {
            let vehicles = JSON.parse(localStorage.getItem('fcs_vehicles')) || [];
            
            if (vehicles.length === 0) {
                container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color:var(--text-muted); background: var(--bg-card); border: 1px dashed var(--border-color); border-radius: 12px;">Cadastre veículos ativos na frota primeiro para acompanhar o painel de telemetria de componentes.</div>';
            } else {
                let okCount = 0, warnCount = 0, critCount = 0;
                
                container.innerHTML = vehicles.map(v => {
                    // Lógica simulada de Telemetria (Amarra o ID pra ser persistente ao longo da sessão)
                    let engineHp = Math.max(8, 100 - (v.id % 35)); 
                    let tiresHp = Math.max(12, 100 - ((v.id * 3) % 78));
                    let breaksHp = Math.max(6, 100 - ((v.id * 7) % 92));

                    let minHp = Math.min(engineHp, tiresHp, breaksHp);
                    let statusKey = 'ok';
                    if (minHp < 30) { critCount++; statusKey = 'crit'; }
                    else if (minHp < 65) { warnCount++; statusKey = 'warn'; }
                    else { okCount++;  statusKey = 'ok'; }

                    const getColor = (hp) => hp >= 65 ? 'var(--success)' : (hp >= 30 ? 'var(--warning)' : 'var(--danger)');

                    return `
                    <div class="health-card" data-status="${statusKey}">
                        <h4 style="color: var(--text-main); margin-bottom: 20px; display:flex; align-items:center; gap:8px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                            <i class="fa-solid fa-car-side" style="color: var(--primary-color);"></i> ${v.brand} ${v.model} <span class="car-badge">${v.plate}</span>
                        </h4>
                        
                        <div class="health-item">
                            <div class="health-label"><span><i class="fa-solid fa-oil-can" style="opacity: 0.7;"></i> Qualidade do Óleo</span> <span style="color: ${getColor(engineHp)}">${engineHp}%</span></div>
                            <div class="health-bar-bg"><div class="health-fill" style="width: 0%; background: ${getColor(engineHp)};" data-target="${engineHp}"></div></div>
                        </div>

                        <div class="health-item">
                            <div class="health-label"><span><i class="fa-solid fa-dharmachakra" style="opacity: 0.7;"></i> Desgaste dos Pneus</span> <span style="color: ${getColor(tiresHp)}">${tiresHp}%</span></div>
                            <div class="health-bar-bg"><div class="health-fill" style="width: 0%; background: ${getColor(tiresHp)};" data-target="${tiresHp}"></div></div>
                        </div>

                        <div class="health-item">
                            <div class="health-label"><span><i class="fa-solid fa-compact-disc" style="opacity: 0.7;"></i> Condição do Freio</span> <span style="color: ${getColor(breaksHp)}">${breaksHp}%</span></div>
                            <div class="health-bar-bg"><div class="health-fill" style="width: 0%; background: ${getColor(breaksHp)};" data-target="${breaksHp}"></div></div>
                        </div>
                    </div>
                    `;
                }).join('');

                // Anima as barras 
                setTimeout(() => {
                    container.querySelectorAll('.health-fill').forEach(bar => {
                        bar.style.width = bar.getAttribute('data-target') + '%';
                    });
                }, 100);

                // Update Overview KPIs
                const renderKpi = (id, count) => {
                    const el = document.getElementById(id);
                    if(el) el.querySelector('p').textContent = `${count} Veículos`;
                };
                renderKpi('saudeOk', okCount);
                renderKpi('saudeAtencao', warnCount);
                renderKpi('saudeCritico', critCount);
            }
        }
    }

    if (pageName === 'agenda') {
        const agContainer = document.getElementById('agendaTimeline');
        if (agContainer) {
            let vehicles = JSON.parse(localStorage.getItem('fcs_vehicles')) || [];
            
            if (vehicles.length === 0) {
                agContainer.innerHTML = '<div style="text-align:center; padding: 40px; background: var(--bg-card); border-radius:12px; border: 1px dashed var(--border-color); color:var(--text-muted);">Sua garagem está vazia. Cadastre veículos para que o sistema vasculhe o Detran e alinhe o seu calendário do IPVA e Seguro Obrigatório automaticamente.</div>';
            } else {
                // Generate fake deadlines baseadas no ID do carro simulando leitura do final da placa
                const events = [];
                vehicles.forEach((v) => {
                    let daysToIpva = (v.id % 45); // Gera evento que vira nos proximos 44 dias
                    let isUrgent = daysToIpva <= 7;
                    let isWarning = daysToIpva > 7 && daysToIpva <= 15;
                    
                    let date = new Date();
                    date.setDate(date.getDate() + daysToIpva);
                    
                    events.push({
                        title: `Pagamento Anual Cota Única (IPVA) - ${v.plate}`,
                        sub: `Fatura veiculada para: ${v.brand} ${v.model}`,
                        dateObj: date,
                        days: daysToIpva,
                        class: isUrgent ? 'urgent' : (isWarning ? 'warning' : ''),
                        icon: isUrgent ? '<i class="fa-solid fa-triangle-exclamation" style="color:var(--danger)"></i>' : '<i class="fa-regular fa-clock" style="color:var(--text-muted)"></i>'
                    });
                });

                // Mix in general fleet deadlines
                events.push({
                    title: 'Renovação CNH - Motorista Associado: Carlos Bonatti',
                    sub: 'Categoria D - Transporte de Carga / Validade Iminente',
                    dateObj: new Date(new Date().setDate(new Date().getDate() + 52)), // 52 dias
                    days: 52,
                    class: '',
                    icon: '<i class="fa-regular fa-id-card" style="color:var(--text-muted)"></i>'
                });

                // Puxar lembretes customizados inseridos pelo Usuário via Formulário
                let rems = JSON.parse(localStorage.getItem('fcs_reminders')) || [];
                rems.forEach(r => {
                    let d = new Date(r.date + 'T12:00:00'); // Fix para timezone JS
                    let diffMs = d - new Date();
                    let daysTo = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                    let isUrgent = daysTo <= 7;
                    let isWarning = daysTo > 7 && daysTo <= 15;

                    events.push({
                        title: r.title,
                        sub: r.desc,
                        dateObj: d,
                        days: daysTo,
                        class: isUrgent ? 'urgent' : (isWarning ? 'warning' : ''),
                        icon: '<i class="fa-solid fa-thumbtack" style="color:var(--primary-color)"></i>'
                    });
                });

                // Ordenar do mais proximo a vencer pro mais distante (Urgência)
                events.sort((a,b) => a.days - b.days);

                agContainer.innerHTML = events.map(e => {
                    const dia = e.dateObj.getDate().toString().padStart(2, '0');
                    const mes = e.dateObj.toLocaleString('pt-BR', { month: 'short' }).replace('.','');
                    
                    let actionBtn = e.class === 'urgent' 
                        ? `<button class="btn-primary" style="background:var(--danger); box-shadow:none; padding:8px 15px; font-size:0.85rem;" onclick="alert('Integração bancária com PIX bloqueada no protótipo')"><i class="fa-solid fa-barcode"></i> Gerar Boleto</button>`
                        : `<button class="btn-primary" style="background:transparent; color:var(--text-main); border:1px solid var(--border-color); box-shadow:none; padding:8px 15px; font-size:0.85rem;">Detalhes</button>`;

                    return `
                    <div class="agenda-card ${e.class}">
                        <div class="agenda-date">
                            ${dia} <span class="agenda-month">${mes}</span>
                        </div>
                        <div class="agenda-details">
                            <div class="agenda-title">${e.title}</div>
                            <div class="agenda-sub">${e.sub}</div>
                        </div>
                        <div class="agenda-icon" style="margin-right: 20px; font-size: 1.4rem; opacity: 0.8;">
                            ${e.icon}
                        </div>
                        <div class="agenda-action">
                            ${actionBtn}
                        </div>
                    </div>
                    `;
                }).join('');
            }
        }
    }

    if (pageName === 'integracao_mapas') {
        const rMapContainer = document.getElementById('routingMap');
        if (rMapContainer) {
            // Setup do Modal de Catalogo Global
            window.currentInputTarget = null;
            window.openCatalog = function(inputId) {
                window.currentInputTarget = inputId;
                const modal = document.getElementById('catalogModal');
                const list = document.getElementById('catalogList');
                
                // Popula o Modal Lendo do LocalStorage do User
                let books = JSON.parse(localStorage.getItem('fcs_book')) || [
                    {name: "Sede Centro - Transportadora X", address: "Avenida Cillos, Americana, SP"},
                    {name: "CD Paulínia (Filial Norte)", address: "Rodovia Zeferino Vaz, Paulinia, SP"}
                ];

                if(books.length === 0) {
                   list.innerHTML = "<p style='color:var(--text-muted)'>A matriz ainda não possui clientes pré-aprovados cadastrados.</p>";
                } else {
                   list.innerHTML = books.map(b => `
                       <div class="catalog-item" onclick="document.getElementById('${inputId}').value = '${b.address}'; document.getElementById('${inputId}').removeAttribute('data-lat'); document.getElementById('${inputId}').removeAttribute('data-lon'); document.getElementById('catalogModal').style.display='none';">
                           <i class="fa-solid fa-map-location-dot"></i>
                           <div style="overflow:hidden;">
                               <strong>${b.name}</strong>
                               <span>${b.address}</span>
                           </div>
                       </div>
                   `).join('');
                }
                modal.style.display = 'flex';
            };

            // Inicializa mapa global de logistica
            let mapR = L.map('routingMap').setView([-22.8, -47.1], 10);
            
            const isDark = document.body.classList.contains('dark-mode');
            const tileUrl = isDark 
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

            L.tileLayer(tileUrl, { attribution: '&copy; Leaflet Routing Machine / OSM' }).addTo(mapR);

            // Sistema Autocomplete estilo GOOGLE MAPS
            const attachAutocomplete = (inputId, suggId) => {
                const inp = document.getElementById(inputId);
                const ul = document.getElementById(suggId);
                let timeout = null;

                inp.addEventListener('input', function() {
                    clearTimeout(timeout);
                    inp.removeAttribute('data-lat');
                    inp.removeAttribute('data-lon');
                    
                    if(this.value.length < 4) { ul.style.display = 'none'; return; }
                    
                    ul.innerHTML = '<li style="color:var(--text-muted); justify-content:center;"><i class="fa-solid fa-satellite-dish fa-fade"></i> Rastreador Geográfico ativado...</li>';
                    ul.style.display = 'block';

                    timeout = setTimeout(async () => {
                        try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(this.value)}&countrycodes=br`);
                            const data = await res.json();
                            ul.innerHTML = '';
                            if(data.length === 0) {
                                ul.innerHTML = '<li><i class="fa-solid fa-times text-danger"></i> Endereço não coberto pelo satélite</li>';
                            } else {
                                data.forEach(d => {
                                    let li = document.createElement('li');
                                    li.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${d.display_name}`;
                                    li.onmousedown = () => {
                                        inp.value = d.display_name;
                                        ul.style.display = 'none';
                                        // Grava LAT LON secretamente pro formulário ler e não sobrecarregar API quando dar submit
                                        inp.setAttribute('data-lat', d.lat);
                                        inp.setAttribute('data-lon', d.lon);
                                    };
                                    ul.appendChild(li);
                                });
                            }
                        } catch(e) {
                            ul.innerHTML = '<li>Rede OSM Internacional Offline.</li>';
                        }
                    }, 800); // 800ms debounce anti-spam da API
                });
                
                // Hide when clicked outside
                inp.addEventListener('blur', () => setTimeout(() => { ul.style.display = 'none'; }, 150));
            };

            attachAutocomplete('routeOrigin', 'originSugg');
            attachAutocomplete('routeDest', 'destSugg');

            // Carrega os veiculos da frota pra escalar pra corrida
            const vSelect = document.getElementById('routeVehicle');
            if (vSelect) {
                let vehicles = JSON.parse(localStorage.getItem('fcs_vehicles')) || [];
                if (vehicles.length > 0) {
                    vehicles.forEach(v => {
                        vSelect.innerHTML += `<option value="${v.plate}">${v.brand} ${v.model} (Placa: ${v.plate})</option>`;
                    });
                } else {
                    vSelect.innerHTML = `<option value="" disabled selected>Nenhum carro cadastrado. Frota offline.</option>`;
                }
            }

            // Motor de Processamento da Rota localmente (Fake Polylines e paradas)
            const routeForm = document.getElementById('routingForm');
            let currentLine = null;
            let currentMarkers = [];

            if (routeForm) {
                routeForm.addEventListener('submit', async function(ev) {
                    ev.preventDefault();
                    
                    const btn = routeForm.querySelector('button');
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Radar Buscando Endereços...';
                    btn.disabled = true;

                    try {
                        let oriQuery = document.getElementById('routeOrigin').value;
                        let destQuery = document.getElementById('routeDest').value;

                        // API Pública do OSM (Nominatim) para converter texto em Coordenada Gps Absoluta
                        const getCoords = async (q) => {
                            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
                            const data = await res.json();
                            if(data && data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                            throw new Error("Endereço não localizado pelo satélite: " + q);
                        };

                        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> OSRM Calculando Malha Rodoviária...';
                        
                        let ori = await getCoords(oriQuery);
                        let dest = await getCoords(destQuery);

                        let oriLat = document.getElementById('routeOrigin').getAttribute('data-lat');
                        let oriLon = document.getElementById('routeOrigin').getAttribute('data-lon');
                        let destLat = document.getElementById('routeDest').getAttribute('data-lat');
                        let destLon = document.getElementById('routeDest').getAttribute('data-lon');

                        let oriCoords = (oriLat && oriLon) ? [parseFloat(oriLat), parseFloat(oriLon)] : ori;
                        let destCoords = (destLat && destLon) ? [parseFloat(destLat), parseFloat(destLon)] : dest;

                        // Limpa marcadores / linhas se existirem manualmente
                        if(currentLine) { mapR.removeLayer(currentLine); currentLine = null; }
                        currentMarkers.forEach(m => mapR.removeLayer(m));
                        currentMarkers = [];

                        // Limpa rota do LRM se existir
                        if (window.currentRoutingControl) {
                            mapR.removeControl(window.currentRoutingControl);
                        }

                        // 💥 MÁGICA REAL: Leaflet Routing Machine para rota tipo WAZE 💥
                        window.currentRoutingControl = L.Routing.control({
                            waypoints: [
                                L.latLng(oriCoords[0], oriCoords[1]),
                                L.latLng(destCoords[0], destCoords[1])
                            ],
                            language: 'pt-BR',
                            geocoder: L.Control.Geocoder.nominatim(),
                            routeWhileDragging: true,
                            fitSelectedRoutes: true,
                            showAlternatives: true,
                            lineOptions: {
                                styles: [{color: '#3b82f6', opacity: 0.9, weight: 6}]
                            }
                        }).addTo(mapR);

                        // Monitorar quando a rota for encontrada para extrair info pro painel esquerdo
                        window.currentRoutingControl.on('routesfound', function(e) {
                            let routes = e.routes;
                            let summary = routes[0].summary;
                            
                            let realDistKm = summary.totalDistance / 1000;
                            let realETA = Math.round(summary.totalTime / 60);
                            let economiaCalculada = (realDistKm * 0.14).toFixed(2).replace('.', ',');

                            // Marcador do meio pro posto (fake logic)
                            let coords = routes[0].coordinates;
                            let midpoint = coords[Math.floor(coords.length / 2)];
                            let m3 = L.circleMarker([midpoint.lat, midpoint.lng], {radius:9, color:'var(--bg-main)', weight:2, fillColor:'var(--success)', fillOpacity:1}).addTo(mapR)
                                     .bindPopup(`<div style='text-align:center;'><b>⛽ Detecção de Parada Otimizada:</b><br><span style='color:var(--text-muted);'>Caminho rodoviário monitorado cruzando o Radar da empresa.</span><br>Vantagem: <b style='color:var(--success)'>+R$ ${economiaCalculada}</b></div>`);
                            m3.openPopup();
                            currentMarkers.push(m3); // pra limpar dps

                            // Atualiza Painel Esquerdo
                            const res = document.getElementById('routeResult');
                            res.style.display = 'block';
                            res.innerHTML = `
                                <h4 style="margin-bottom: 12px; color: var(--text-main);"><i class="fa-solid fa-check-double" style="color:var(--success);"></i> Despacho Georreferenciado:</h4>
                                <p style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 5px;"><i class="fa-solid fa-road" style="width: 25px;"></i> Distância Real: <strong>${realDistKm.toFixed(1).replace('.', ',')} km</strong></p>
                                <p style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 5px;"><i class="fa-solid fa-hourglass-end" style="width: 25px;"></i> ETA: <strong>${realETA} Minutos</strong></p>
                                <p style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 5px;"><i class="fa-solid fa-gas-pump" style="width: 25px;"></i> Desgaste Motor: <strong>${(realDistKm / 8.5).toFixed(1)} Litros</strong></p>
                                <hr style="border-color: var(--border-color); margin: 12px 0;">
                                <p style="font-size: 1rem; color: var(--success); font-weight:bold; background: rgba(16, 185, 129, 0.1); padding: 8px; border-radius: 6px;">
                                    <i class="fa-solid fa-comment-dollar" style="width: 25px;"></i> Lucro Marginal Parada: R$ ${economiaCalculada}
                                </p>
                            `;
                            
                            btn.innerHTML = '<i class="fa-solid fa-map-location-dot"></i> Gerar Mapa de Condução e Economia';
                            btn.disabled = false;
                        });

                        window.currentRoutingControl.on('routingerror', function(err) {
                            alert("Não foi possível encontrar uma rota para esses destinos. Eles parecem não estar conectados por terra ou o Waze API falhou.");
                            btn.innerHTML = '<i class="fa-solid fa-map-location-dot"></i> Gerar Mapa de Condução e Economia';
                            btn.disabled = false;
                        });

                    } catch(err) {
                        alert(err.message);
                    } finally {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    }
                });
            }

            // Timeout pro resize do wrapper engatar os maps tiles corretamente (BUG do leaflet em SPAs resolvido de brinde)
            setTimeout(() => { mapR.invalidateSize(); }, 300);
        }
    }

    if (pageName === 'dashboard') {
        const totalCostEl = document.getElementById('dashTotalCost');
        if (totalCostEl) {
            // Calcula e soma ao vivo
            let fuels = JSON.parse(localStorage.getItem('fcs_fuels')) || [];
            let manuts = JSON.parse(localStorage.getItem('fcs_maintenances')) || [];
            
            let sumAbastecimento = fuels.reduce((acc, obj) => acc + parseFloat(obj.cost), 0);
            let sumManutencao = manuts.reduce((acc, obj) => acc + parseFloat(obj.cost), 0);
            let total = sumAbastecimento + sumManutencao;

            totalCostEl.textContent = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        }

        const ctx = document.getElementById('dashboardChart');
        if (ctx) {
            const isDark = document.body.classList.contains('dark-mode');
            const textColor = isDark ? '#f8fafc' : '#1f2937';
            const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho'],
                    datasets: [
                        { label: 'Gasto Gasolina (R$)', data: [3500, 3200, 4100, 3800, 4500, 4200], backgroundColor: 'rgba(37, 99, 235, 0.85)', borderRadius: 6 },
                        { label: 'Gasto Diesel (R$)', data: [2100, 2300, 2000, 2700, 2500, 2900], backgroundColor: 'rgba(245, 158, 11, 0.85)', borderRadius: 6 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: textColor, font: { family: 'Inter' } } } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
                        x: { grid: { display: false }, ticks: { color: textColor } }
                    }
                }
            });
        }
    }

    if (pageName === 'assistente') {
        const btn = document.getElementById('aiChatSend');
        const inp = document.getElementById('aiChatInput');
        const box = document.getElementById('aiChatBox');

        if (btn && inp && box) {
            const sendMsg = () => {
                let text = inp.value.trim();
                if(!text) return;
                
                // Add user messsage
                box.innerHTML += `
                    <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-direction: row-reverse;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: #475569; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;"><i class="fa-solid fa-user"></i></div>
                        <div style="background: rgba(37, 99, 235, 0.1); padding: 15px; border-radius: 8px; flex: 1; text-align: right;">
                            <p>${text}</p>
                        </div>
                    </div>
                `;
                inp.value = '';
                box.scrollTop = box.scrollHeight;

                // Add typing indicator
                const typingId = 'typing_' + Date.now();
                box.innerHTML += `
                    <div id="${typingId}" style="display: flex; gap: 15px; margin-bottom: 20px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-color); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;"><i class="fa-solid fa-robot"></i></div>
                        <div style="background: var(--bg-card); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); display:flex; align-items:center; gap:5px;">
                            <i class="fa-solid fa-circle fa-fade" style="font-size:0.4rem; color:var(--text-muted)"></i>
                            <i class="fa-solid fa-circle fa-fade" style="font-size:0.4rem; color:var(--text-muted); animation-delay:0.2s"></i>
                            <i class="fa-solid fa-circle fa-fade" style="font-size:0.4rem; color:var(--text-muted); animation-delay:0.4s"></i>
                        </div>
                    </div>
                `;
                box.scrollTop = box.scrollHeight;

                // Fake AI Logic parsing local storage
                setTimeout(() => {
                    const tEl = document.getElementById(typingId);
                    if(tEl) tEl.remove();
                    
                    let lower = text.toLowerCase();
                    let response = "Interessante. Como posso te ajudar trabalhando com os seus dados logísticos hoje?";

                    let fuels = JSON.parse(localStorage.getItem('fcs_fuels')) || [];
                    let manuts = JSON.parse(localStorage.getItem('fcs_maintenances')) || [];
                    let vehicles = JSON.parse(localStorage.getItem('fcs_vehicles')) || [];

                    if(lower.includes('gasto') || lower.includes('despesa') || lower.includes('custo') || lower.includes('dinheiro') || lower.includes('financeiro')) {
                        let sumAbast = fuels.reduce((acc, obj) => acc + parseFloat(obj.cost), 0);
                        let sumManut = manuts.reduce((acc, obj) => acc + parseFloat(obj.cost), 0);
                        let sumAll = sumAbast + sumManut;
                        if(sumAll === 0) {
                            response = "Após verificar o banco de dados principal, não encontrei registros de despesas até agora. Adicione abastecimentos primeiro.";
                        } else {
                            response = `Calculando seus registros em tempo real... A sua frota teve um gasto total de <b>R$ ${sumAll.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</b>. Sendo exatos R$ ${sumAbast.toLocaleString('pt-BR', {minimumFractionDigits: 2})} em abastecimentos e R$ ${sumManut.toLocaleString('pt-BR', {minimumFractionDigits: 2})} em peças/manutenção periódica.`;
                        }
                    } 
                    else if(lower.includes('resumo') || lower.includes('frota') || lower.includes('carro') || lower.includes('veículo')) {
                        if(vehicles.length === 0){
                            response = "Atualmente não detectei nenhum veículo registrado na sua base principal. Vá na aba lateral 'Veículos' e cadastre o primeiro carro/caminhão!";
                        } else {
                            let relFuel = fuels.length > 0 ? "O registro mais recente apontou atividade na frota para o veículo " + fuels[fuels.length-1].vehicle + "." : "";
                            response = `Atualmente, sua corporação administra <b>${vehicles.length} veículos</b> através de mim. ${relFuel} Posso afirmar que o ecossistema e a telemetria geral operam em desgaste aceitável.`;
                        }
                    } 
                    else if (lower.includes('manutenção') || lower.includes('revisão') || lower.includes('pneu') || lower.includes('oficina') || lower.includes('óleo')) {
                        if(manuts.length > 0) {
                            let lastM = manuts[manuts.length-1];
                            response = `Consultei o diário de mecânica e vi que o último serviço contratado foi <b>${lastM.service}</b>, associado ao <b>${lastM.vehicle}</b>. Como sua quilometragem está subindo, posso agendar a próxima checagem caso o motorista informe falha nas correias!`;
                        } else {
                            response = "Não existem manutenções pagas no meu painel. Você está operando com nível ótimo de desgaste. Continue acompanhando a aba do Sistema de Saúde!";
                        }
                    }
                    else if (lower.includes('olá') || lower.includes('oi') || lower.includes('bom dia') || lower.includes('boa tarde')) {
                        response = `Olá! Meus protocolos estão atualizados na versão 2026. Eu consigo analisar resumões sobre sua rede viária, seu fluxo de caixa e relatórios de veículos com poucos comandos. Tente algo como: "O que eu gastei?"`;
                    }
                    else {
                        response = `Desculpe, meu módulo preditivo no momento está treinado apenas para cruzar os DataFrames preenchidos pelos usuários. Tente perguntas chave como: <br><br><b>"Qual foi meu gasto total no mês?"</b><br><b>"Faça um resumo dos meus carros"</b><br><b>"Puxe o histórico das manutenções"</b>.`;
                    }

                    box.innerHTML += `
                        <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-color); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;"><i class="fa-solid fa-robot"></i></div>
                            <div style="background: var(--bg-card); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); flex: 1;">
                                <p style="line-height: 1.5;">${response}</p>
                            </div>
                        </div>
                    `;
                    box.scrollTop = box.scrollHeight;
                }, 1300);
            };

            btn.addEventListener('click', sendMsg);
        }
    }
}

// 6. Delegação Global de Eventos (Solucionador de "Botão não clica")
// Isso garante que QUALQUER botão de formulário inserido magicamente pelo menu sempre funcione sem depender do tempo de carregamento da tela!
document.addEventListener('submit', (e) => {
    
    // Formulário de Veículos
    if (e.target.id === 'vehicleForm') {
        e.preventDefault();
        const form = e.target;
        const plate = form.querySelector('[name="plate"]').value;
        const model = form.querySelector('[name="model"]').value;
        const brand = form.querySelector('[name="brand"]').value;

        // Salva
        let savedVehicles = JSON.parse(localStorage.getItem('fcs_vehicles')) || [];
        savedVehicles.push({ id: Date.now(), plate, model, brand });
        localStorage.setItem('fcs_vehicles', JSON.stringify(savedVehicles));

        alert(`Sucesso! O veículo ${brand} ${model} (${plate}) foi adicionado à sua frota.`);
        form.reset();
        renderVehicleTable(); // atualiza interface na hora caso a gente esteja lendo
    }

    // Formulário de Abastecimento
    else if (e.target.id === 'fuelRecordForm') {
        e.preventDefault();
        const form = e.target;
        
        let savedVehicles = JSON.parse(localStorage.getItem('fcs_vehicles')) || [];
        let vId = form.querySelector('[name="vehicle_id"]').value;
        let vehicleObj = savedVehicles.find(v => v.id.toString() === vId) || { brand: 'Veículo', model: 'Desconhecido', plate: 'XXX' };
        
        // Custo total
        let litros = parseFloat(form.querySelector('[name="liters"]').value) || 0;
        let precoL = parseFloat(form.querySelector('[name="price"]').value) || 0;
        let totalCost = litros * precoL;

        let fuels = JSON.parse(localStorage.getItem('fcs_fuels')) || [];
        fuels.push({ id: Date.now(), vehicle: `${vehicleObj.brand} ${vehicleObj.model} (${vehicleObj.plate})`, cost: totalCost, date: new Date().toLocaleDateString() });
        localStorage.setItem('fcs_fuels', JSON.stringify(fuels));
        
        alert(`Abastecimento CADASTRADO com sucesso! Custo de R$ ${totalCost.toFixed(2).replace('.',',')} lançado para cálculos!`);
        form.reset();
        renderFuelTable(); // atualiza interface caso esteja lendo na mesma tela
    }

    // Formulário de Manutenção
    else if (e.target.id === 'maintenanceForm') {
        e.preventDefault();
        const form = e.target;
        
        let savedVehicles = JSON.parse(localStorage.getItem('fcs_vehicles')) || [];
        let vId = form.querySelector('[name="vehicle_id"]').value;
        let vehicleObj = savedVehicles.find(v => v.id.toString() === vId) || { brand: 'Veículo', model: 'Desconhecido', plate: 'XXX' };
        
        let servico = form.querySelector('[name="service_type"]').value;
        let totalCost = parseFloat(form.querySelector('[name="cost"]').value) || 0;

        let manuts = JSON.parse(localStorage.getItem('fcs_maintenances')) || [];
        manuts.push({ id: Date.now(), vehicle: `${vehicleObj.brand} ${vehicleObj.model} (${vehicleObj.plate})`, service: servico, cost: totalCost, date: new Date().toLocaleDateString() });
        localStorage.setItem('fcs_maintenances', JSON.stringify(manuts));
        
        alert(`Tudo certo! Manutenção de R$ ${totalCost.toFixed(2).replace('.',',')} foi salva no diário da frota!`);
        form.reset();
        renderMaintenanceTable(); // atualiza a tabela injetada abaixo dele
    }

    // Formulário de Novo Posto Radar
    else if (e.target.id === 'stationForm') {
        e.preventDefault();
        const form = e.target;
        const name = form.querySelector('[name="name"]').value;
        const price = form.querySelector('[name="price"]').value;
        const lat = parseFloat(form.querySelector('[name="lat"]').value);
        const lng = parseFloat(form.querySelector('[name="lng"]').value);

        let stations = JSON.parse(localStorage.getItem('fcs_stations')) || [];
        stations.push({ name, price: `R$ ${price}`, lat, lng });
        localStorage.setItem('fcs_stations', JSON.stringify(stations));
        
        alert("Radar Coletivo Expandido! O posto foi adicionado com sucesso.");
        form.reset();
        window.navigateTo('mapa_postos'); // Força a tela a regerar o mapa com o posto novo
    }

    // Formulário de Agenda / Novo Lembrete
    else if (e.target.id === 'reminderForm') {
        e.preventDefault();
        const form = e.target;
        const title = form.querySelector('[name="title"]').value;
        const date = form.querySelector('[name="date"]').value;
        const desc = form.querySelector('[name="desc"]').value;

        let rems = JSON.parse(localStorage.getItem('fcs_reminders')) || [];
        rems.push({ title, date, desc });
        localStorage.setItem('fcs_reminders', JSON.stringify(rems));
        
        alert("Lembrete agendado com sucesso! Se a data estiver próxima, ele já deve estar explodindo na tela como aviso.");
        form.reset();
        window.navigateTo('agenda'); // Atualiza a timeline
    }

    // Book de Endereços Catalogados
    else if (e.target.id === 'addressBookForm') {
        e.preventDefault();
        const form = e.target;
        const name = form.querySelector('[name="bookName"]').value;
        const address = form.querySelector('[name="bookAddress"]').value;

        let books = JSON.parse(localStorage.getItem('fcs_book')) || [
             {name: "Sede Centro - Transportadora X", address: "Avenida Cillos, Americana, SP"},
             {name: "CD Paulínia (Filial Norte)", address: "Rodovia Zeferino Vaz, Paulinia, SP"}
        ];
        books.push({name, address});
        localStorage.setItem('fcs_book', JSON.stringify(books));

        alert(`O Logradouro Corporativo "${name}" foi cravado com sucesso no Catálogo e está livre para ser escalado nas viagens.`);
        form.reset();
    }
});

// 7. Lógica de Filtro dos Cards Globais da Tela de Saúde
window.filterHealthCards = function(targetStatus) {
    const container = document.getElementById('healthReportsContainer');
    if (!container) return;
    
    let kpiCards = document.querySelectorAll('.dashboard-widgets .kpi-card');
    
    // Verifica qual é o filtro atualmente ativo, se houver
    let currentActive = null;
    kpiCards.forEach(c => {
        if (c.getAttribute('data-active-filter') === targetStatus && c.classList.contains('active-filter')) {
            currentActive = targetStatus;
        }
    });

    let cards = container.querySelectorAll('.health-card');
    
    if (currentActive === targetStatus) {
        // Se clicar no que já está ativo, resetamos tudo (mostra todos os veículos novamente)
        kpiCards.forEach(c => {
            c.style.opacity = '1';
            c.style.transform = 'scale(1)';
            c.classList.remove('active-filter');
        });
        cards.forEach(c => c.style.display = 'block');
    } else {
        // Aplica o filtro e opaca os botões não selecionados para dar foco
        kpiCards.forEach(c => {
            if (c.getAttribute('data-active-filter') !== targetStatus) {
                c.style.opacity = '0.4';
                c.style.transform = 'scale(0.98)';
                c.classList.remove('active-filter');
            } else {
                c.style.opacity = '1';
                c.style.transform = 'scale(1.02)';
                c.classList.add('active-filter');
            }
        });

        cards.forEach(c => {
            if (c.getAttribute('data-status') === targetStatus) {
                c.style.display = 'block';
            } else {
                c.style.display = 'none';
            }
        });
    }
};

// 6. Gerador de Relatório Executivo (PDF) via html2pdf
window.exportDashboardToPDF = function() {
    const btn = document.getElementById('btnExportPDF');
    if (!btn) return;

    // Cacheia texto original
    const originHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando Nuvem...';
    btn.disabled = true;

    // Pega todo o container logístico da pagina atual
    const element = document.querySelector('.page-container');

    // Configurações avançadas do Relatório
    const opt = {
      margin:       0.4,
      filename:     'NexusFleet_Relatorio_Gerencial.pdf',
      image:        { type: 'jpeg', quality: 1.0 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true, backgroundColor: document.body.classList.contains('dark-mode') ? '#0f172a' : '#f0f2f5' },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    // Timeout p renderizar loading botton e então congelar DOM p disparo do PDF
    setTimeout(() => {
        html2pdf().set(opt).from(element).save().then(() => {
            btn.innerHTML = originHTML;
            btn.disabled = false;
        }).catch(e => {
            console.error(e);
            alert('Falha na criptografia do relatório.');
            btn.innerHTML = originHTML;
            btn.disabled = false;
        });
    }, 500);
};
