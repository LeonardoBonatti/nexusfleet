/**
 * login_handler.js
 * Lida com a autenticação JWT no frontend
 */

async function login() {
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    if (!email || !senha) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    try {
        const res = await fetch("/api/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password: senha })
        });

        const data = await res.json();

        if (res.ok && data.token) {
            localStorage.setItem('fcs_auth', data.token);
            localStorage.setItem('fcs_user', JSON.stringify(data.user));
            window.location.href = "index.html";
        } else {
            alert(data.error || "Erro ao realizar login.");
        }
    } catch (err) {
        console.error("Erro no login:", err);
        alert("Erro de conexão com o servidor.");
    }
}

async function cadastrar() {
    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    if (!nome || !email || !senha) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    try {
        const res = await fetch("/api/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: nome, email, password: senha })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Cadastro realizado com sucesso! Faça login para continuar.");
            window.location.href = "login.html";
        } else {
            alert(data.error || "Erro ao realizar cadastro.");
        }
    } catch (err) {
        console.error("Erro no cadastro:", err);
        alert("Erro de conexão com o servidor.");
    }
}
