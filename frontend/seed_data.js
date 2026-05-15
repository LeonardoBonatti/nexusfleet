(function() {
    console.log("Iniciando semeadura de dados NexusFleet...");

    const startDate = new Date('2026-04-03');
    const endDate = new Date('2026-05-14');

    function randomDate(start, end) {
        const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return d.toISOString().split('T')[0];
    }

    function randomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // 1. Veículos
    const vehicles = [
        { id: Date.now() + 1, brand: "Toyota", model: "Corolla", plate: "NEX-1001", year: 2024, tank: 50 },
        { id: Date.now() + 2, brand: "Honda", model: "Civic", plate: "NEX-2002", year: 2023, tank: 47 },
        { id: Date.now() + 3, brand: "Ford", model: "Ranger", plate: "NEX-3003", year: 2025, tank: 80 },
        { id: Date.now() + 4, brand: "VW", model: "Gol", plate: "NEX-4004", year: 2022, tank: 55 },
        { id: Date.now() + 5, brand: "Fiat", model: "Toro", plate: "NEX-5005", year: 2024, tank: 60 }
    ];
    localStorage.setItem('fcs_vehicles', JSON.stringify(vehicles));

    // 2. Abastecimentos
    const fuels = [];
    vehicles.forEach(v => {
        for (let i = 0; i < 8; i++) {
            const cost = 200 + Math.random() * 200;
            fuels.push({
                id: Date.now() + Math.random(),
                date: randomDate(startDate, endDate),
                vehicle: `${v.brand} ${v.model} (${v.plate})`,
                vehicle_id: v.id,
                cost: cost.toFixed(2),
                liters: (cost / (5.5 + Math.random())).toFixed(2),
                km: 10000 + (i * 400) + Math.random() * 100
            });
        }
    });
    localStorage.setItem('fcs_fuels', JSON.stringify(fuels));

    // 3. Manutenções
    const manuts = [];
    const services = ['Troca de Óleo', 'Alinhamento', 'Balanceamento', 'Revisão Preventiva', 'Filtro de Ar'];
    vehicles.forEach(v => {
        for (let i = 0; i < 2; i++) {
            manuts.push({
                id: Date.now() + Math.random(),
                date: randomDate(startDate, endDate),
                vehicle: `${v.brand} ${v.model} (${v.plate})`,
                vehicle_id: v.id,
                service: randomItem(services),
                cost: (150 + Math.random() * 400).toFixed(2)
            });
        }
    });
    localStorage.setItem('fcs_maintenances', JSON.stringify(manuts));

    // 4. Lembretes / Agenda
    const reminders = [
        { id: 1, title: "Renovação Seguro", desc: "Seguro da frota vence em breve", date: "2026-05-20" },
        { id: 2, title: "Vistoria Semestral", desc: "Levar Ranger para vistoria", date: "2026-05-25" },
        { id: 3, title: "NexusFleet HQ Event", desc: "Inauguração da nova base", date: "2026-06-01" }
    ];
    localStorage.setItem('fcs_reminders', JSON.stringify(reminders));

    // 5. Postos e Clientes (para o mapa)
    const stations = [
        { lat: -23.5505, lng: -46.6333, name: 'Posto Ipiranga Centro', price: '5,89' },
        { lat: -23.5205, lng: -46.6833, name: 'Posto Shell Marginal', price: '5,95' },
        { lat: -23.5615, lng: -46.6553, name: 'Posto BR Paulista', price: '6,10' }
    ];
    localStorage.setItem('fcs_stations', JSON.stringify(stations));

    const book = [
        { name: "NexusFleet HQ (Base)", address: "Avenida Paulista, 1000, São Paulo, SP", lat: -23.5615, lon: -46.6553 },
        { name: "Cliente: Logística Express", address: "Rua do Porto, Santos, SP", lat: -23.9618, lon: -46.3322 },
        { name: "Cliente: Transpira", address: "Campinas, SP", lat: -22.9064, lon: -47.0616 }
    ];
    localStorage.setItem('fcs_book', JSON.stringify(book));

    console.log("Dados semeados com sucesso!");
})();
