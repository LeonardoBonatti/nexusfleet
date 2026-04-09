-- 🗄️ Esquema do Banco de Dados Relacional (PostgreSQL)
-- Execute este arquivo para configurar a estruturação base da aplicação.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Usuários (Administradores/Gerentes)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin', -- admin, user
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Motoristas
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_category VARCHAR(10),
    efficiency_score NUMERIC(5,2) DEFAULT 100.00, -- Score de eficiência base
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Veículos
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plate VARCHAR(20) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    year_fabrication INT NOT NULL,
    fuel_capacity NUMERIC(10,2) NOT NULL,
    fuel_type VARCHAR(50) NOT NULL, -- Gasolina, Álcool, Diesel, Flex
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Histórico de Abastecimento
CREATE TABLE IF NOT EXISTS fuel_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    fuel_type VARCHAR(50) NOT NULL,
    liters NUMERIC(10,2) NOT NULL,
    price_per_liter NUMERIC(10,2) NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    odometer NUMERIC(10,2) NOT NULL, -- Quilometragem na hora do abastecimento
    station_name VARCHAR(150),
    location VARCHAR(255),
    fill_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela de Manutenções do Veículo
CREATE TABLE IF NOT EXISTS maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL, -- Ex: Troca de óleo, Revisão Geral
    cost NUMERIC(10,2) NOT NULL,
    odometer NUMERIC(10,2) NOT NULL,
    description TEXT,
    service_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    next_due_odometer NUMERIC(10,2), -- Quilometragem para próxima revisão
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabela de Alertas (Alertas Inteligentes e Fraudes)
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- consumo_elevado, fraude_suspeita, revisao_pendente
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabela de Relatórios e Inteligência
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_month INT NOT NULL,
    reference_year INT NOT NULL,
    total_fuel_cost NUMERIC(15,2),
    total_maintenance_cost NUMERIC(15,2),
    average_consumption NUMERIC(10,2),
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
