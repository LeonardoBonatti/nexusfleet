# Documentação Técnica Oficial - NexusFleet
**Gestão Inteligente e Logística de Frotas**

**Projeto Acadêmico:** Faculdade de Americana (FAM)  
**Autoria e Desenvolvimento:** Leonardo Bonatti e João Emílio  
**Versão do Sistema:** 1.0.0 (Release Candidate)  
**Data da Documentação:** Abril de 2026  

---

## 1. Visão Geral do Projeto
O **NexusFleet** é um painel logístico (Dashboard) responsivo desenvolvido para automatizar, controlar e otimizar a gestão de frotas, consumo de combustível e manutenções preventivas. O projeto nasceu da necessidade acadêmica e mercadológica de mitigar custos operacionais do setor de transportes, combinando um visual altamente interativo com uma arquitetura técnica robusta.

## 2. Tecnologias Utilizadas
A construção do software baseia-se em um ecossistema moderno, utilizando os seguintes pilares:
- **Frontend (Interface do Usuário):** HTML5 Semântico, Vanilla JavaScript (ES6+), e CSS3 Avançado (utilizando Padrões *Glassmorphism* e Variáveis CSS para suporte a Dark/Light themes).
- **Backend (Regras de Negócio e API):** Node.js operando sobre o framework *Express.js*, construído em um paradigma de Orientação a Objetos (OOP) e arquitetura MVC (Model-View-Controller).
- **Banco de Dados (Persistência):** PostgreSQL provisionado em nuvem de alta disponibilidade atráves da plataforma corporativa *Neon.tech*.
- **PWA (Progressive Web App):** Manifesto e Service Workers configurados (`service-worker.js`) para permitir que a interface funcione off-line e com tempos de carregamento instantâneos utilizando o armazenamento local do dispositivo.
- **Integração Geo-Espacial:** Consumo da biblioteca autônoma e open-source *LeafletJS* para simulação de roteamento de rotas logísticas nos mapas de postos e integração viária.

## 3. Arquitetura do Sistema
O sistema emprega uma arquitetura modularizada, separando as interações visuais das requisições de backend:

### 3.1. Arquitetura MVC Adaptada
**Models:** (`/src/models/`): Estruturas em classes orientadas a objetos (ex: `User`, `Vehicle`, `FuelRecord`) que parametrizam a inserção de dados.
**Repositories & Controllers:** Módulos autônomos (`user.repository.js`, `user.controller.js`) que validam regras de negócio antes da operação chegar ao banco de dados.
**Views (Frontend):** Arquitetura Single Page Application (SPA) hibrida através do arquivo `app.js`, que injeta blocos HTML contidos na pasta `/pages` direto no `index.html` via requisições Fetch, evitando recarregamentos da tela (Fluxo ininterrupto de UX).

### 3.2. Fluxo de Autenticação (Authentication Flow)
1. O usuário acessa a plataforma de login.
2. É exibido um painel dinâmico com autenticação via email e senha corporativa.
3. Um processo de simulação visual de *Autenticação Multifator (MFA - 2FA)* protege o cofre logístico.
4. Após o `Handshake` de segurança, os metadados são gravados na memória local persistente (`localStorage`), com o token `fcs_auth`, permitindo total segurança contra roteamento forçado pela URL. O sistema de proteção *Auth Guard* bloqueia invasões do painel global.

## 4. Segurança e Hospedagem
- O servidor principal de Backend atende na porta `3000` via Express.
- As variáveis de acesso e chaves de segurança SSL (Strings Postgres) são estritamente contidas em arquivos isolados `.env`, devidamente incluídos no arquivo `.gitignore` para proteção das credenciais do projeto no GitHub.
- Exposição remota: Acesso em tempo real configurado via instanciamento de túneis seguros (`Localtunnel`), expondo a porta local do desenvolvedor em URL pública, permitindo validação cross-device durante a apresentação acadêmica.

## 5. Módulos do Sistema Visual
- **Dashboard (Motor de KPIs):** Renderiza cartões analíticos demonstrando custos mensais totais e deficiências médias da frota com sinalizadores delta visuais (positivos/negativos).
- **Abastecimento:** Módulo para inserir registro direto de litragem ou recarga nos veículos.
- **Histórico e Financeiro:** Páginas preparadas para demonstrar relatórios avançados cruzando KM / Litro com o banco de dados e APIs preditivas futuras.
- **Mapas e Logística:** Tela focada no mapeamento geoespacial da frota via Leaflet.

## 6. Conclusão e Continuidade
O NexusFleet demonstra com sucesso a sinergia entre Design UI/UX profissional, código de alta performance assíncrona com Javascript puro (`Promises`, `Async/Await`), e backend seguro com SQL Relacional. Ele está posicionado perfeitamente para receber implementações complexas de Big Data ou motores IA numa versão corporativa final, sendo uma excelente Prova de Conceito (PoC) e peça de portfólio acadêmica na instituição da Faculdade de Americana.

---
*Gerado por NexusFleet Intelligence Core.*
