// Importa o template e a função de eventos do arquivo de login
import { LoginTemplate, initLoginEvents } from './pages/login.js';

// Função para gerenciar qual tela é exibida
function navigateTo(page) {
    const appContainer = document.getElementById('app');

    if (page === 'login') {
        // Injeta o HTML
        appContainer.innerHTML = LoginTemplate;
        // Inicia os eventos dos botões
        initLoginEvents();
    } 
    // Futuramente, você adicionará:
    // else if (page === 'agendamento') { ... }
}

// Quando o documento terminar de carregar, inicia na tela de login
document.addEventListener('DOMContentLoaded', () => {
    navigateTo('login');
});