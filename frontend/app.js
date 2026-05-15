// Script Principal para Interatividade da Interface

// ==========================================
// Helper Global: Envia JWT em toda requisição
// ==========================================
async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('fcs_auth');
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    
    try {
        const response = await fetch(url, { ...options, headers });
        
        if (response.status === 401) {
            // Token expirado ou inválido
            localStorage.removeItem('fcs_auth');
            window.location.href = 'login.html';
            throw new Error('Sessão expirada. Redirecionando...');
        }
        
        return response;
    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
}

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
                        await setupPageScripts(page);
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

// --- SISTEMA DE LIXEIRA (Excluir e Restaurar) ---
window.deleteRecord = async function(type, id) {
    if(!confirm("Tem certeza que deseja mover este registro para a lixeira?")) return;
    
    await apiFetch(`/api/data/${type}/${id}`, { method: 'DELETE' });
    
    if(type === 'vehicles') renderVehicleTable();
    if(type === 'fuels') renderFuelTable();
    if(type === 'maintenances') renderMaintenanceTable();
    
    alert("Registro movido para a lixeira.");
};

window.restoreRecord = async function(id) {
    const res = await apiFetch(`/api/restore/${id}`, { method: 'POST' });
    if(res.ok) {
        renderTrashTable();
        if(document.getElementById('vehicleLogBody')) renderVehicleTable();
        if(document.getElementById('fuelLogBody')) renderFuelTable();
        if(document.getElementById('maintenanceLogBody')) renderMaintenanceTable();
        alert("Registro restaurado com sucesso!");
    }
};

window.editRecord = async function(type, id) {
    let data = await apiFetch(`/api/data/${type}`).then(r => r.json());
    let item = data.find(i => String(i.id) === String(id));
    if(!item) return;

    if (type === 'vehicles') {
        const newPlate = prompt("Editar Placa do Veículo:", item.plate);
        if(newPlate === null) return;
        const newModel = prompt("Editar Modelo:", item.model);
        if(newModel === null) return;
        
        await apiFetch(`/api/data/vehicles/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ plate: newPlate, model: newModel })
        });
        renderVehicleTable();
    } 
    else if (type === 'fuels') {
        const newCost = prompt("Editar Custo Total (R$):", item.cost);
        if(newCost === null) return;
        
        await apiFetch(`/api/data/fuels/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ cost: parseFloat(newCost.replace(',', '.')).toFixed(2) })
        });
        renderFuelTable();
    }
    else if (type === 'maintenances') {
        const newService = prompt("Editar Serviço Realizado:", item.service);
        if(newService === null) return;
        const newCost = prompt("Editar Custo (R$):", item.cost);
        if(newCost === null) return;
        
        await apiFetch(`/api/data/maintenances/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ service: newService, cost: parseFloat(newCost.replace(',', '.')).toFixed(2) })
        });
        renderMaintenanceTable();
    }
};

window.renderTrashTable = async function() {
    const logBody = document.getElementById('trashLogBody');
    if (!logBody) return;
    
    try {
        let trash = await apiFetch('/api/data/trash').then(r => r.json());
        
        if (!trash || trash.length === 0) {
            logBody.innerHTML = '<tr><td colspan="3" style="padding: 15px; text-align: center; color: var(--text-muted);">Sua lixeira está vazia.</td></tr>';
        } else {
            logBody.innerHTML = '';
            trash.forEach(t => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--border-color)';
                
                let typeName = "";
                let details = "";
                
                if(t.original_type === 'vehicles') {
                    typeName = "Veículo";
                    details = `${t.data.brand} ${t.data.model} (${t.data.plate})`;
                } else if (t.original_type === 'fuels') {
                    typeName = "Abastecimento";
                    details = `${t.data.vehicle} | R$ ${t.data.cost}`;
                } else if (t.original_type === 'maintenances') {
                    typeName = "Manutenção";
                    details = `${t.data.service} | R$ ${t.data.cost}`;
                } else {
                    typeName = "Outro";
                    details = t.data.title || t.data.name || t.id;
                }

                tr.innerHTML = `
                    <td style="padding: 12px; font-weight: 500; color: var(--text-main);">${typeName}</td>
                    <td style="padding: 12px; color: var(--text-muted);">${details}</td>
                    <td style="padding: 12px;">
                        <button class="btn-primary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="restoreRecord('${t.id}')"><i class="fa-solid fa-trash-arrow-up"></i> Restaurar</button>
                    </td>
                `;
                logBody.appendChild(tr);
            });
        }
    } catch(e) {}
};

// Monitor para atualizar a lixeira quando ela for aberta (via click no modal do index)
const originalOpenProfileModal = window.openProfileModal || function(){};
window.openProfileModal = function(id) {
    if(id === 'trashModal') renderTrashTable();
    // A logica original do index.html (abrir modal e fechar dropdown) já roda no onclik ou chamando localmente, 
    // mas se precisarmos de um gancho puro pra garantir:
    const el = document.getElementById(id);
    if(el) el.classList.add('active');
    const menu = document.getElementById('profileMenu');
    if(menu) menu.classList.remove('open');
};


// Função para renderizar Tabela de Veículos
async function renderVehicleTable() {
    const logBody = document.getElementById('vehicleLogBody');
    if (!logBody) return;
    
    try {
        let vehicles = await apiFetch('/api/data/vehicles').then(r => r.json());
        
        if (!vehicles || vehicles.length === 0) {
            logBody.innerHTML = '<tr><td colspan="5" style="padding: 15px; text-align: center; color: var(--text-muted);">Nenhum veículo cadastrado na frota.</td></tr>';
        } else {
            logBody.innerHTML = '';
            vehicles.forEach(v => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--border-color)';
                tr.innerHTML = `
                    <td style="padding: 12px; color: var(--text-muted);">#${v.id.toString().padStart(4, '0')}</td>
                    <td style="padding: 12px; font-weight: bold; color: var(--text-main);">${v.plate}</td>
                    <td style="padding: 12px;">${v.brand} ${v.model}</td>
                    <td style="padding: 12px; color: var(--text-muted);">${v.capacity ? v.capacity + 'L' : '-'}</td>
                    <td style="padding: 12px;"><span style="background: rgba(59,130,246,0.1); color: var(--primary-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem;">${v.fuel_type || 'Flex'}</span></td>
                    <td style="padding: 12px;"><span style="color: var(--success);"><i class="fa-solid fa-check"></i> Ativo</span></td>
                    <td style="padding: 12px; display: flex; gap: 10px;">
                        <button class="btn-icon" style="color: var(--primary-color);" onclick="editRecord('vehicles', '${v.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon" style="color: var(--danger);" onclick="deleteRecord('vehicles', '${v.id}')" title="Mover para Lixeira"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                logBody.appendChild(tr);
            });
        }
    } catch(e) {
        logBody.innerHTML = '<tr><td colspan="5" style="padding: 15px; text-align: center; color: var(--danger);">Erro ao carregar dados do servidor.</td></tr>';
    }
}

// Função para renderizar Tabela de Abastecimentos
async function renderFuelTable() {
    const logBody = document.getElementById('fuelLogBody');
    if (!logBody) return;
    
    try {
        let fuels = await apiFetch('/api/data/fuels').then(r => r.json());
        
        if (!fuels || fuels.length === 0) {
            logBody.innerHTML = '<tr><td colspan="5" style="padding: 15px; text-align: center; color: var(--text-muted);">Nenhum abastecimento registrado ainda.</td></tr>';
        } else {
            logBody.innerHTML = '';
            fuels.forEach(f => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--border-color)';
                tr.innerHTML = `
                    <td style="padding: 12px; color: var(--text-muted);">${f.date}</td>
                    <td style="padding: 12px; font-weight: 500;">${f.vehicle}</td>
                    <td style="padding: 12px;"><span style="background: rgba(59,130,246,0.1); color: var(--primary-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem;">${f.fuel_type || '-'}</span></td>
                    <td style="padding: 12px; color: var(--text-muted);">${f.liters ? parseFloat(f.liters).toFixed(1) + 'L' : '-'}</td>
                    <td style="padding: 12px; color: var(--text-muted);">${f.horimeter > 0 ? parseFloat(f.horimeter).toFixed(1) + 'h' : '-'}</td>
                    <td style="padding: 12px; color: var(--primary-color); font-weight: bold;">R$ ${parseFloat(f.cost).toFixed(2).replace('.', ',')}</td>
                    <td style="padding: 12px; display: flex; gap: 10px;">
                        <button class="btn-icon" style="color: var(--primary-color);" onclick="editRecord('fuels', '${f.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon" style="color: var(--danger);" onclick="deleteRecord('fuels', '${f.id}')" title="Mover para Lixeira"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                logBody.appendChild(tr);
            });
        }
    } catch(e) {}
}

// Função para renderizar Tabela de Manutenções
async function renderMaintenanceTable() {
    const logBody = document.getElementById('maintenanceLogBody');
    if (!logBody) return;
    
    try {
        let manuts = await apiFetch('/api/data/maintenances').then(r => r.json());
        
        if (!manuts || manuts.length === 0) {
            logBody.innerHTML = '<tr><td colspan="5" style="padding: 15px; text-align: center; color: var(--text-muted);">Nenhuma manutenção registrada ainda.</td></tr>';
        } else {
            logBody.innerHTML = '';
            manuts.forEach(m => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--border-color)';
                tr.innerHTML = `
                    <td style="padding: 12px; color: var(--text-muted);">${m.date}</td>
                    <td style="padding: 12px; font-weight: 500;">${m.vehicle}</td>
                    <td style="padding: 12px; color: var(--text-main);">${m.service}</td>
                    <td style="padding: 12px; color: var(--text-muted);">${m.horimeter > 0 ? parseFloat(m.horimeter).toFixed(1) + 'h' : '-'}</td>
                    <td style="padding: 12px; font-weight: bold; color: var(--danger);">R$ ${parseFloat(m.cost).toFixed(2).replace('.', ',')}</td>
                    <td style="padding: 12px; display: flex; gap: 10px;">
                        <button class="btn-icon" style="color: var(--primary-color);" onclick="editRecord('maintenances', '${m.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon" style="color: var(--danger);" onclick="deleteRecord('maintenances', '${m.id}')" title="Mover para Lixeira"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                logBody.appendChild(tr);
            });
        }
    } catch(e) {}
}

async function setupPageScripts(pageName) {
    if (pageName === 'dashboard' || !pageName) {
        let fuels = await apiFetch('/api/data/fuels').then(r => r.json()).catch(() => []);
        let manuts = await apiFetch('/api/data/maintenances').then(r => r.json()).catch(() => []);
        let vehicles = await apiFetch('/api/data/vehicles').then(r => r.json()).catch(() => []);

        let reminders = [];
        try { reminders = JSON.parse(localStorage.getItem('fcs_reminders')) || []; } catch(e){}

        // 1. Custo Total Geral (somente dados reais)
        let totalCost = 0;
        fuels.forEach(f => totalCost += parseFloat(f.cost || 0));
        manuts.forEach(m => totalCost += parseFloat(m.cost || 0));
        const costEl = document.getElementById('dashTotalCost');
        if (costEl) costEl.textContent = totalCost > 0
            ? 'R$ ' + totalCost.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})
            : 'R$ 0,00';

        // 2. Alertas
        const alertsEl = document.getElementById('dashAlertsCount');
        if (alertsEl) alertsEl.textContent = reminders.length > 0 ? reminders.length + ' Lembretes Ativos' : 'Nenhum Alerta';

        // 3. Eficiência Média (km/L) — real se tiver hodômetro, senão 0
        const kpiCards = document.querySelectorAll('.dashboard-widgets .kpi-card');
        if (kpiCards.length >= 2) {
            const effEl = kpiCards[1].querySelector('p');
            let totalLiters = fuels.reduce((a, f) => a + parseFloat(f.liters || 0), 0);
            if (effEl) effEl.textContent = totalLiters > 0 ? (totalLiters / fuels.length).toFixed(1) + ' km/L (médio)' : '0.0 km/L';
        }

        // 4. Gráfico por tipo de combustível separado (dados reais)
        const ctx = document.getElementById('dashboardChart');
        if (ctx) {
            if (window.myDashChart) window.myDashChart.destroy();
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const curYear = new Date().getFullYear();
            let gasData = Array(12).fill(0);
            let alcData = Array(12).fill(0);
            let dieselData = Array(12).fill(0);

            fuels.forEach(f => {
                // Parse date in pt-BR format (DD/MM/YYYY) or ISO
                let month = -1;
                if (f.date && f.date.includes('/')) {
                    const parts = f.date.split('/');
                    month = parseInt(parts[1]) - 1;
                } else if (f.date && f.date.includes('-')) {
                    month = parseInt(f.date.split('-')[1]) - 1;
                }
                if (month < 0 || month > 11) return;
                const cost = parseFloat(f.cost || 0);
                const ft = (f.fuel_type || '').toLowerCase();
                if (ft.includes('álcool') || ft.includes('alcool') || ft.includes('etanol')) alcData[month] += cost;
                else if (ft.includes('diesel')) dieselData[month] += cost;
                else gasData[month] += cost;
            });

            window.myDashChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [
                        { label: 'Gasolina (R$)', data: gasData, backgroundColor: 'rgba(37,99,235,0.85)', borderRadius: 4 },
                        { label: 'Álcool/Etanol (R$)', data: alcData, backgroundColor: 'rgba(16,185,129,0.85)', borderRadius: 4 },
                        { label: 'Diesel (R$)', data: dieselData, backgroundColor: 'rgba(245,158,11,0.85)', borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: document.body.classList.contains('dark-mode') ? '#9ca3af' : '#4b5563', font: {family: 'Inter'} } } },
                    scales: {
                        y: { beginAtZero: true, ticks: { color: document.body.classList.contains('dark-mode') ? '#9ca3af' : '#4b5563', callback: val => 'R$ ' + val }, grid: { color: document.body.classList.contains('dark-mode') ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } },
                        x: { ticks: { color: document.body.classList.contains('dark-mode') ? '#9ca3af' : '#4b5563' }, grid: { display: false } }
                    }
                }
            });
        }
    }
        
        const costEl = document.getElementById('dashTotalCost');
        if (costEl) costEl.textContent = 'R$ ' + totalCost.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        
        // 2. Alertas
        const alertsEl = document.getElementById('dashAlertsCount');
        if (alertsEl) alertsEl.textContent = reminders.length > 0 ? reminders.length + ' Lembretes Ativos' : 'Nenhum Alerta';

        // 3. Eficiência Média Dinâmica (Simulada baseada em litros reais)
        let totalLiters = 0;
        fuels.forEach(f => totalLiters += parseFloat(f.liters || 0));
        let eff = totalLiters > 0 ? ((totalLiters * 11.5) / totalLiters).toFixed(1) : '0.0';
        
        // Atualiza o texto do parágrafo do 2º KPI Card
        const kpiCards = document.querySelectorAll('.dashboard-widgets .kpi-card');
        if (kpiCards.length >= 2) {
            const effEl = kpiCards[1].querySelector('p');
            if (effEl) effEl.textContent = eff + ' km/L';
        }

        // 4. Gráfico de Consumo (Gasolina vs Etanol/Diesel) por Mês
        const ctx = document.getElementById('dashboardChart');
        if (ctx) {
            if (window.myDashChart) window.myDashChart.destroy();
            
            let gas = [0, 0, 0, 0, 0, 0]; // Jan a Jun
            let alc = [0, 0, 0, 0, 0, 0];
            
            fuels.forEach(f => {
                let dateParts = f.date.split('-'); // ex: 2026-04-03
                if (dateParts.length === 3) {
                    let month = parseInt(dateParts[1]) - 1; // 0=Jan, 3=Abr, 4=Mai
                    if (month >= 0 && month <= 5) {
                        let cost = parseFloat(f.cost);
                        // Metade pra cada ou base na placa
                        if (f.vehicle.includes('Corolla') || f.vehicle.includes('Civic')) gas[month] += cost;
                        else alc[month] += cost;
                    }
                }
            });

            window.myDashChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho'],
                    datasets: [
                        { label: 'Gasto Gasolina (R$)', data: gas, backgroundColor: '#3b82f6', borderRadius: 4 },
                        { label: 'Gasto Etanol/Diesel (R$)', data: alc, backgroundColor: '#f59e0b', borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: document.body.classList.contains('dark-mode') ? '#9ca3af' : '#4b5563', font: {family: 'Inter'} } }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            ticks: { color: document.body.classList.contains('dark-mode') ? '#9ca3af' : '#4b5563', callback: val => 'R$ ' + val }, 
                            grid: { color: document.body.classList.contains('dark-mode') ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } 
                        },
                        x: { 
                            ticks: { color: document.body.classList.contains('dark-mode') ? '#9ca3af' : '#4b5563' }, 
                            grid: { display: false } 
                        }
                    }
                }
            });
        }
    }

    if (pageName === 'veiculos') {
        renderVehicleTable();
    }

    if (pageName === 'historico') {
        const tbody = document.getElementById('historicoGeralBody');
        if (tbody) {
            let fuels = await apiFetch('/api/data/fuels').then(r => r.json()).catch(() => []);
            let manuts = await apiFetch('/api/data/maintenances').then(r => r.json()).catch(() => []);
            
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
            let fuels = await apiFetch('/api/data/fuels').then(r => r.json()).catch(() => []);
            let manuts = await apiFetch('/api/data/maintenances').then(r => r.json()).catch(() => []);
            
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
        // Carrega veículos da API (não do localStorage) para popular dropdowns
        const selectIds = pageName === 'abastecimento'
            ? ['fuelVehicleSelect']
            : ['maintVehicleSelect'];

        try {
            let vehicles = await apiFetch('/api/data/vehicles').then(r => r.json());
            selectIds.forEach(selId => {
                const sel = document.getElementById(selId);
                if (!sel) return;
                sel.innerHTML = '<option value="">Selecione o veículo...</option>';
                if (!vehicles || vehicles.length === 0) {
                    sel.innerHTML += '<option disabled>Nenhum veículo cadastrado. Vá em "Veículos".</option>';
                } else {
                    vehicles.forEach(v => {
                        const opt = document.createElement('option');
                        opt.value = v.id;
                        opt.dataset.capacity = v.capacity || 0;
                        opt.textContent = `${v.brand} ${v.model} (Placa: ${v.plate})`;
                        sel.appendChild(opt);
                    });
                }
            });
        } catch(e) { console.error('Erro ao carregar veículos:', e); }

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

            allStations.forEach(st => {
                const lat = st.lat;
                const lng = st.lng;

                // Monta linhas de preco por tipo de combustivel
                let priceLines = '';
                if (st.prices) {
                    if (st.prices.alcool) priceLines += `<div style="display:flex;justify-content:space-between;gap:20px;"><span style="color:var(--text-muted);">🟢 Álcool Comum</span><b style="color:#22c55e;">R$ ${parseFloat(st.prices.alcool).toFixed(2).replace('.',',')}/L</b></div>`;
                    if (st.prices.gas) priceLines += `<div style="display:flex;justify-content:space-between;gap:20px;"><span style="color:var(--text-muted);">🔵 Gasolina Comum</span><b style="color:#3b82f6;">R$ ${parseFloat(st.prices.gas).toFixed(2).replace('.',',')}/L</b></div>`;
                    if (st.prices.gas_ad) priceLines += `<div style="display:flex;justify-content:space-between;gap:20px;"><span style="color:var(--text-muted);">🟣 Gasolina Aditivada</span><b style="color:#8b5cf6;">R$ ${parseFloat(st.prices.gas_ad).toFixed(2).replace('.',',')}/L</b></div>`;
                    if (st.prices.diesel) priceLines += `<div style="display:flex;justify-content:space-between;gap:20px;"><span style="color:var(--text-muted);">🟡 Diesel S10</span><b style="color:#f59e0b;">R$ ${parseFloat(st.prices.diesel).toFixed(2).replace('.',',')}/L</b></div>`;
                    if (st.prices.gnv) priceLines += `<div style="display:flex;justify-content:space-between;gap:20px;"><span style="color:var(--text-muted);">🔴 GNV</span><b style="color:#ef4444;">R$ ${parseFloat(st.prices.gnv).toFixed(2).replace('.',',')}/m³</b></div>`;
                } else if (st.price) {
                    priceLines = `<div style="color:#3b82f6; font-weight:bold;">${st.price}</div>`;
                }

                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
                const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

                L.marker([lat, lng], {
                    icon: L.divIcon({
                        className: 'custom-icon',
                        html: `<i class="fa-solid fa-gas-pump" style="color: #dc2626; font-size: 20px;"></i>`,
                        iconSize: [20, 20]
                    })
                }).addTo(map)
                    .bindPopup(`
                        <div style="min-width:220px;">
                            <b style="font-size:1rem;">${st.name}</b>
                            <hr style="margin:8px 0; border-color:#e5e7eb;">
                            ${priceLines || '<span style="color:#6b7280;">Preços não informados</span>'}
                            <hr style="margin:8px 0; border-color:#e5e7eb;">
                            <div style="display:flex;gap:8px;margin-top:4px;">
                                <a href="${googleMapsUrl}" target="_blank" style="flex:1;text-align:center;background:#4285f4;color:white;padding:6px 4px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600;"><i class="fa-brands fa-google"></i> Google Maps</a>
                                <a href="${wazeUrl}" target="_blank" style="flex:1;text-align:center;background:#00b5d6;color:white;padding:6px 4px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:600;">🗺 Waze</a>
                            </div>
                        </div>
                    `);
            });

            // Adiciona Base e Clientes (NexusFleet Integration)
            const book = JSON.parse(localStorage.getItem('fcs_book')) || [];
            book.forEach(item => {
                const isBase = item.name.includes("Base");
                const icon = isBase ? "fa-building-shield" : "fa-user-tie";
                const color = isBase ? "#3b82f6" : "#10b981";

                L.marker([item.lat, item.lon], {
                    icon: L.divIcon({
                        className: 'custom-icon',
                        html: `<i class="fa-solid ${icon}" style="color: ${color}; font-size: 24px;"></i>`,
                        iconSize: [24, 24]
                    })
                }).addTo(map)
                .bindPopup(`<b>${item.name}</b><br>${item.address}`);
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

                // Fake AI Logic parsing backend data
                setTimeout(async () => {
                    const tEl = document.getElementById(typingId);
                    if(tEl) tEl.remove();
                    
                    let lower = text.toLowerCase();
                    let response = "Olá! Sou o assistente da NexusFleet. Tente perguntas como:\n\n<b>\"Qual o gasto total da frota?\"</b>\n<b>\"Qual a última manutenção do [placa]?\"</b>\n<b>\"Quantos litros o [placa] já abasteceu?\"</b>\n<b>\"Quais compromissos tenho essa semana?\"</b>";

                    let fuels = await apiFetch('/api/data/fuels').then(r => r.json()).catch(() => []);
                    let manuts = await apiFetch('/api/data/maintenances').then(r => r.json()).catch(() => []);
                    let vehicles = await apiFetch('/api/data/vehicles').then(r => r.json()).catch(() => []);

                    // Helpers
                    const fmt = v => parseFloat(v || 0).toLocaleString('pt-BR', {minimumFractionDigits:2});
                    const findVehicleByHint = (hint) => vehicles.find(v =>
                        hint.includes(v.plate.toLowerCase()) ||
                        hint.includes(v.model.toLowerCase()) ||
                        hint.includes(v.brand.toLowerCase())
                    );

                    if (lower.includes('olá') || lower.includes('oi') || lower.includes('bom dia') || lower.includes('boa tarde') || lower.includes('boa noite')) {
                        response = `Olá! Sou o <b>Assistente Inteligente NexusFleet</b> 🤖<br><br>Posso responder perguntas como:<br>• <i>"Qual o gasto total da frota?"</i><br>• <i>"Quanto o [placa] já gastou?"</i><br>• <i>"Qual a última manutenção do [placa]?"</i><br>• <i>"Quantos litros o [placa] já abasteceu?"</i><br>• <i>"Qual o horimétro do [placa]?"</i><br>• <i>"Quando o [placa] foi cadastrado?"</i><br>• <i>"Quais compromissos tenho essa semana?"</i><br>• <i>"Quantos veículos estou gerenciando?"</i>`;
                    }
                    else if (lower.includes('gasto') || lower.includes('despesa') || lower.includes('custo') || lower.includes('financeiro') || lower.includes('total')) {
                        // Verifica se é pergunta sobre veículo específico
                        const vMatch = findVehicleByHint(lower);
                        if (vMatch) {
                            const vFuels = fuels.filter(f => String(f.vehicle_id) === String(vMatch.id));
                            const vManuts = manuts.filter(m => String(m.vehicle_id) === String(vMatch.id));
                            const sumF = vFuels.reduce((a,f) => a + parseFloat(f.cost||0), 0);
                            const sumM = vManuts.reduce((a,m) => a + parseFloat(m.cost||0), 0);
                            response = `💰 <b>${vMatch.brand} ${vMatch.model} (${vMatch.plate})</b><br>Abastecimentos: <b>R$ ${fmt(sumF)}</b><br>Manutenções: <b>R$ ${fmt(sumM)}</b><br>Total geral: <b style="color:var(--primary-color);">R$ ${fmt(sumF+sumM)}</b>`;
                        } else {
                            const sumF = fuels.reduce((a,f) => a + parseFloat(f.cost||0), 0);
                            const sumM = manuts.reduce((a,m) => a + parseFloat(m.cost||0), 0);
                            const total = sumF + sumM;
                            if (total === 0) response = "Não há registros de despesas ainda. Cadastre um abastecimento ou manutenção!";
                            else response = `💰 Gasto total da frota: <b style="color:var(--primary-color);">R$ ${fmt(total)}</b><br>Sendo <b>R$ ${fmt(sumF)}</b> em abastecimentos e <b>R$ ${fmt(sumM)}</b> em manutenções.`;
                        }
                    }
                    else if (lower.includes('litros') || lower.includes('abastec') || lower.includes('combust')) {
                        const vMatch = findVehicleByHint(lower);
                        if (vMatch) {
                            const vFuels = fuels.filter(f => String(f.vehicle_id) === String(vMatch.id));
                            const totalL = vFuels.reduce((a,f) => a + parseFloat(f.liters||0), 0);
                            const totalC = vFuels.reduce((a,f) => a + parseFloat(f.cost||0), 0);
                            const types = [...new Set(vFuels.map(f => f.fuel_type).filter(Boolean))].join(', ');
                            response = `⛽ <b>${vMatch.brand} ${vMatch.model} (${vMatch.plate})</b><br>Total abastecido: <b>${totalL.toFixed(1)}L</b><br>Gasto em combustível: <b>R$ ${fmt(totalC)}</b><br>Tipos utilizados: <b>${types || 'não informado'}</b>`;
                        } else {
                            const totalL = fuels.reduce((a,f) => a + parseFloat(f.liters||0), 0);
                            response = `⛽ A frota consumiu <b>${totalL.toFixed(1)} litros</b> no total registrado. Especifique uma placa ou modelo para detalhes por veículo.`;
                        }
                    }
                    else if (lower.includes('manuten') || lower.includes('revis') || lower.includes('oficina') || lower.includes('óleo') || lower.includes('pneu')) {
                        const vMatch = findVehicleByHint(lower);
                        if (vMatch) {
                            const vManuts = manuts.filter(m => String(m.vehicle_id) === String(vMatch.id));
                            if (vManuts.length === 0) response = `Não há manutenções registradas para <b>${vMatch.plate}</b> ainda.`;
                            else {
                                const last = vManuts[0];
                                response = `🔧 Última manutenção do <b>${vMatch.plate}</b>:<br>Serviço: <b>${last.service}</b><br>Data: <b>${last.date}</b><br>Custo: <b>R$ ${fmt(last.cost)}</b>${last.horimeter > 0 ? '<br>Horímetro: <b>' + parseFloat(last.horimeter).toFixed(1) + 'h</b>' : ''}`;
                            }
                        } else {
                            if (manuts.length === 0) response = "Nenhuma manutenção registrada ainda.";
                            else { const last = manuts[0]; response = `🔧 Última manutenção da frota: <b>${last.service}</b> em <b>${last.vehicle}</b> — ${last.date} — R$ ${fmt(last.cost)}`; }
                        }
                    }
                    else if (lower.includes('horímetro') || lower.includes('horimetro') || lower.includes('horas')) {
                        const vMatch = findVehicleByHint(lower);
                        if (vMatch) {
                            const allH = [
                                ...fuels.filter(f => String(f.vehicle_id) === String(vMatch.id)).map(f => parseFloat(f.horimeter||0)),
                                ...manuts.filter(m => String(m.vehicle_id) === String(vMatch.id)).map(m => parseFloat(m.horimeter||0))
                            ].filter(h => h > 0);
                            const maxH = allH.length > 0 ? Math.max(...allH) : 0;
                            response = maxH > 0
                                ? `⏱ O último horímetro registrado do <b>${vMatch.plate}</b> é <b>${maxH.toFixed(1)}h</b>.`
                                : `Não há horímetro registrado para <b>${vMatch.plate}</b> ainda.`;
                        } else {
                            response = "Especifique a placa ou modelo do veículo para consultar o horímetro. Ex: <i>\"Qual o horímetro do ABC1D23?\"</i>";
                        }
                    }
                    else if (lower.includes('quando foi cadastrado') || lower.includes('data de cadastro') || lower.includes('adicionado')) {
                        const vMatch = findVehicleByHint(lower);
                        if (vMatch) {
                            const date = vMatch.created_at ? new Date(vMatch.created_at).toLocaleDateString('pt-BR') : 'data não disponível';
                            response = `📅 O veículo <b>${vMatch.brand} ${vMatch.model} (${vMatch.plate})</b> foi cadastrado na frota em <b>${date}</b>.`;
                        } else {
                            response = "Especifique a placa ou modelo do veículo para consultar a data de cadastro.";
                        }
                    }
                    else if (lower.includes('veículo') || lower.includes('veiculo') || lower.includes('frota') || lower.includes('carro') || lower.includes('caminh')) {
                        if (vehicles.length === 0) response = "Nenhum veículo cadastrado ainda. Vá na aba <b>Veículos</b> e adicione o primeiro!";
                        else {
                            const list = vehicles.map(v => `• <b>${v.plate}</b> — ${v.brand} ${v.model} (${v.fuel_type || 'Flex'})`).join('<br>');
                            response = `🚗 Sua frota tem <b>${vehicles.length} veículo(s)</b>:<br>${list}`;
                        }
                    }
                    else if (lower.includes('agenda') || lower.includes('compromisso') || lower.includes('semana') || lower.includes('lembrete') || lower.includes('ipva') || lower.includes('cnh')) {
                        let rems = [];
                        try { rems = JSON.parse(localStorage.getItem('fcs_reminders')) || []; } catch(e) {}
                        const now = new Date();
                        const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
                        const thisWeek = rems.filter(r => { const d = new Date(r.date + 'T12:00:00'); return d >= now && d <= weekEnd; });
                        if (rems.length === 0) response = "📅 Não há lembretes registrados na agenda. Adicione compromissos na aba <b>Agenda Inteligente</b>.";
                        else if (thisWeek.length === 0) response = `📅 Você tem <b>${rems.length} lembrete(s)</b> na agenda, mas nenhum para esta semana.`;
                        else {
                            const list = thisWeek.map(r => `• <b>${r.title}</b> — ${new Date(r.date+'T12:00:00').toLocaleDateString('pt-BR')}`).join('<br>');
                            response = `📅 <b>${thisWeek.length} compromisso(s) esta semana:</b><br>${list}`;
                        }
                    }
                    else {
                        response = `Desculpe, não entendi sua pergunta. Posso ajudar com:<br><br>• <i>"Qual o gasto total da frota?"</i><br>• <i>"Quanto o [placa] já gastou?"</i><br>• <i>"Qual a última manutenção do [placa]?"</i><br>• <i>"Quantos litros o [placa] abasteceu?"</i><br>• <i>"Qual o horímetro do [placa]?"</i><br>• <i>"Quando o [placa] foi cadastrado?"</i><br>• <i>"Quais compromissos tenho essa semana?"</i>`;
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
// 6. Delegação Global de Eventos
document.addEventListener('submit', async (e) => {
    
    // Formulário de Veículos
    if (e.target.id === 'vehicleForm') {
        e.preventDefault();
        const form = e.target;
        const plate = form.querySelector('[name="plate"]').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const model = form.querySelector('[name="model"]').value;
        const brand = form.querySelector('[name="brand"]').value;
        const year = form.querySelector('[name="year"]').value;
        const fuel_type = form.querySelector('[name="fuel_type"]').value;
        const capacity = parseFloat(form.querySelector('[name="capacity"]').value) || 0;

        // Validação Mercosul/Antigo no frontend
        const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(plate);
        const antigo = /^[A-Z]{3}[0-9]{4}$/.test(plate);
        if (!mercosul && !antigo) {
            alert('Placa inválida! Use o padrão Mercosul (ABC1D23) ou antigo (ABC1234).');
            return;
        }

        const res = await apiFetch('/api/data/vehicles', {
            method: 'POST',
            body: JSON.stringify({ plate, model, brand, year, fuel_type, capacity })
        });

        if (res.ok) {
            alert(`✅ Veículo ${brand} ${model} (${plate}) adicionado à frota!`);
            form.reset();
            document.getElementById('plateHint').style.color = 'var(--text-muted)';
            document.getElementById('plateHint').textContent = 'Formato: 3 letras + 1 número + 1 letra + 2 números (Mercosul) ou 3 letras + 4 números (Antigo)';
            renderVehicleTable();
        } else {
            const err = await res.json();
            alert('Erro: ' + (err.error || 'Falha ao salvar.'));
        }
    }

    // Formulário de Abastecimento
    else if (e.target.id === 'fuelRecordForm') {
        e.preventDefault();
        const form = e.target;

        let vehicles = await apiFetch('/api/data/vehicles').then(r => r.json()).catch(() => []);
        let vId = form.querySelector('[name="vehicle_id"]').value;
        if (!vId) { alert('Selecione um veículo.'); return; }
        let vehicleObj = vehicles.find(v => String(v.id) === String(vId)) || { brand: 'Veículo', model: 'Desconhecido', plate: 'XXX', capacity: 0 };

        const liters = parseFloat(form.querySelector('[name="liters"]').value) || 0;
        const pricePerLiter = parseFloat(form.querySelector('[name="price_per_liter"]').value) || 0;
        const totalCost = parseFloat(form.querySelector('[name="cost"]').value) || (liters * pricePerLiter);
        const fuelType = form.querySelector('[name="fuel_type"]').value;
        const odometer = parseFloat(form.querySelector('[name="odometer"]').value) || 0;
        const horimeter = parseFloat(form.querySelector('[name="horimeter"]').value) || 0;

        // Validação de capacidade no frontend também
        if (vehicleObj.capacity > 0 && liters > vehicleObj.capacity) {
            alert(`Erro: Volume (${liters}L) excede a capacidade do tanque (${vehicleObj.capacity}L).`);
            return;
        }
        // Validação de horímetro no frontend
        if (horimeter > 0 && window._lastHorimeter > 0 && horimeter < window._lastHorimeter) {
            alert(`Erro: Horímetro (${horimeter}h) não pode ser menor que o último registrado (${window._lastHorimeter}h).`);
            return;
        }

        const res = await apiFetch('/api/data/fuels', {
            method: 'POST',
            body: JSON.stringify({
                vehicle_id: vId,
                vehicle: `${vehicleObj.brand} ${vehicleObj.model} (${vehicleObj.plate})`,
                fuel_type: fuelType,
                liters: liters,
                price_per_liter: pricePerLiter,
                cost: totalCost,
                odometer: odometer,
                horimeter: horimeter,
                date: new Date().toLocaleDateString('pt-BR')
            })
        });

        if (res.ok) {
            alert(`✅ Abastecimento registrado! ${fuelType} — ${liters}L — R$ ${totalCost.toFixed(2).replace('.',',')}`);
            form.reset();
            window._selectedVehicleCapacity = 0;
            window._lastHorimeter = 0;
            renderFuelTable();
        } else {
            const err = await res.json();
            alert('Erro: ' + (err.error || 'Falha ao salvar.'));
        }
    }

    // Formulário de Manutenção
    else if (e.target.id === 'maintenanceForm') {
        e.preventDefault();
        const form = e.target;

        let vehicles = await apiFetch('/api/data/vehicles').then(r => r.json()).catch(() => []);
        let vId = form.querySelector('[name="vehicle_id"]').value;
        if (!vId) { alert('Selecione um veículo.'); return; }
        let vehicleObj = vehicles.find(v => String(v.id) === String(vId)) || { brand: 'Veículo', model: 'Desconhecido', plate: 'XXX' };

        let serviceTipo = form.querySelector('[name="service_type"]').value;
        let serviceDetalhe = form.querySelector('[name="service_detail"]') ? form.querySelector('[name="service_detail"]').value : '';
        let servico = serviceDetalhe ? `${serviceTipo}: ${serviceDetalhe}` : serviceTipo;
        let totalCost = parseFloat(form.querySelector('[name="cost"]').value) || 0;
        let horimeter = parseFloat(form.querySelector('[name="horimeter"]').value) || 0;

        if (horimeter > 0 && window._maintLastHorimeter > 0 && horimeter < window._maintLastHorimeter) {
            alert(`Erro: Horímetro (${horimeter}h) não pode ser menor que o último registrado (${window._maintLastHorimeter}h).`);
            return;
        }

        const res = await apiFetch('/api/data/maintenances', {
            method: 'POST',
            body: JSON.stringify({
                vehicle_id: vId,
                vehicle: `${vehicleObj.brand} ${vehicleObj.model} (${vehicleObj.plate})`,
                service: servico,
                cost: totalCost,
                horimeter: horimeter,
                date: new Date().toLocaleDateString('pt-BR')
            })
        });

        if (res.ok) {
            alert(`✅ Manutenção registrada! "${servico}" — R$ ${totalCost.toFixed(2).replace('.',',')}`);
            form.reset();
            window._maintLastHorimeter = 0;
            renderMaintenanceTable();
        } else {
            const err = await res.json();
            alert('Erro: ' + (err.error || 'Falha ao salvar.'));
        }
    }

    // Formulário de Novo Posto Radar
    else if (e.target.id === 'stationForm') {
        e.preventDefault();
        const form = e.target;
        const name = form.querySelector('[name="name"]').value;
        const lat = parseFloat(form.querySelector('[name="lat"]').value);
        const lng = parseFloat(form.querySelector('[name="lng"]').value);
        const prices = {
            alcool: form.querySelector('[name="price_alcool"]').value || null,
            gas: form.querySelector('[name="price_gas"]').value || null,
            gas_ad: form.querySelector('[name="price_gas_ad"]').value || null,
            diesel: form.querySelector('[name="price_diesel"]').value || null,
            gnv: form.querySelector('[name="price_gnv"]').value || null
        };
        // Remove nulls
        Object.keys(prices).forEach(k => { if (!prices[k]) delete prices[k]; });

        let stations = JSON.parse(localStorage.getItem('fcs_stations')) || [];
        stations.push({ name, prices, lat, lng });
        localStorage.setItem('fcs_stations', JSON.stringify(stations));
        alert('✅ Posto adicionado com sucesso ao Radar Coletivo!');
        form.reset();
        window.navigateTo('mapa_postos');
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
