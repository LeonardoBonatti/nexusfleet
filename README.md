# ⛽ Gestão Inteligente de Combustível (Nível Profissional)

Bem-vindo ao **Fuel Control System**, um sistema web completo desenvolvido em **Node.js** com banco de dados **PostgreSQL**, arquitetado sob padrões de **Programação Orientada a Objetos** e **Múltiplas Camadas (MVC/Repository)** para garantir alta escalabilidade, manutenibilidade e segurança.

## 🎯 Objetivo
Um sistema projetado para gerenciar frotas, controlar custos com combustíveis, manutenções de veículos e providenciar dashboards analíticos (BI) contendo insights de inteligência artificial / algoritmos de recomendação (Comparador de combustível, rotas próximas, previsão de gastos).

## 📁 Estrutura de Pastas

Abaixo está o descritivo de cada diretório e seu respectivo escopo na aplicação.

```text
/fuel-control-system
│
├── /src                   # Código-fonte principal do Backend
│   ├── /models            # Classes e Entidades Puras (POO)
│   ├── /repositories      # Abstração de Acesso ao Banco de Dados (SQL Queries)
│   ├── /services          # Regras de negócio (Business Logic)
│   ├── /controllers       # Controladores que respondem às rotas HTTP
│   ├── /routes            # Definição e agrupamento de Rotas Express
│   ├── /middlewares       # Camadas de validação e Autenticação (JWT)
│   ├── /utils             # Funções utilitárias (Formatadores, Senhas, etc.)
│   └── /config            # Configuração do banco de dados e integrações
│
├── /database              # Definições estruturais de banco de dados
│   ├── schema.sql         # Tabelas principais do banco relacional
│   └── /migrations        # Histórico de alterações (opcional para uso de ORM futuro)
│
├── /frontend              # Projeto UI (Vanilla + HTML/CSS modular)
│   ├── /assets            # Imagens, fontes, ícones
│   ├── /components        # Componentes visuais isolados (Sidebar, Navbar, Cards)
│   ├── /pages             # Estruturas HTML das páginas
│   ├── index.html         # Página principal base (Dashboard)
│   ├── styles.css         # Reset e design system global, incluindo Dark Mode
│   └── app.js             # Script global de interação
│
├── .env.example           # Modelo de variáveis de ambiente base
├── package.json           # Dependências do NodeJS
├── server.js              # Ponto de entrada da aplicação
└── README.md              # Este arquivo
```

---

## 🚀 Como Rodar o Projeto

Siga os passos abaixo na ordem mencionada:

### 1. Requisitos Prévios
- Node.js (v18 ou superior)
- PostgreSQL instalado na sua máquina
- Visual Studio Code

### 2. Passo a Passo Inicial

1. **Instale as dependências** no diretório base do projeto:
   ```bash
   npm install
   ```

2. **Configuração de Variáveis de Ambiente:**
   Duplique o arquivo `.env.example`, renomeie a cópia para `.env` e preencha as credenciais do seu banco de dados local.

3. **Iniciando o Banco de Dados:**
   - Crie um banco com o nome estipulado na sua variável `DB_NAME` (ex: `fuel_control_db`).
   - Copie e rode o código de `database/schema.sql` no seu Dbeaver/PgAdmin ou via psql. Isso irá gerar todas as tabelas corretamente.

4. **Rodando a Aplicação:**

   **Para ambiente de desenvolvimento (Auto-Reload com Nodemon):**
   ```bash
   npm run dev
   ```

   **Para Produção:**
   ```bash
   npm start
   ```

5. O servidor backend agora vai rodar em `http://localhost:3000`.

### 3. Acessando o Frontend
1. Caso você esteja usando o **Visual Studio Code**, instale a extensão **Live Server**.
2. Clique com botão direito no arquivo `/frontend/index.html` e escolha **Open with Live Server**.
3. O Frontend estará em contato direto com a base!

---

## 👨‍💻 Princípios e Padrões Aplicados
- **SRP (Single Responsibility):** Cada pasta do `src` tem uma função isolada (O controller não acessa o banco, não valida dados diretamente).
- **POO:** Tudo centralizado em classes (ex: `UserService`).
- **Segurança:** Senhas dos usuários hasehdas em `bcrypt`, login operante via `JWT`.

### 💡 Exemplos de Uso
1. Acesse o Frontend.
2. Realize o seu cadastro ou login (Caso implementado na tela base) ou utilize as rotas REST (Ex: `POST /api/users/register`).
3. Cadastre Veículos usando a Rota `/api/vehicles`.
4. Lance um abastecimento e teste os Endpoints ou cards do Dashboard que fazem os cálculos inteligentes na Rota `/api/fuels/report`.
