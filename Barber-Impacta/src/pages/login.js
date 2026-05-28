// Template HTML da Tela de Login
export const LoginTemplate = `
    <div class="login-card">
        
        <div class="software-header">
            <h1 class="logo-title">BARBER</h1>
            <p class="logo-subtitle">FAST</p>
        </div>

        <div class="login-selection">
            <p>Selecione seu perfil de acesso para continuar.</p>
            
            <button id="btn-client" class="btn-profile btn-client">
                👤 Sou Cliente
            </button>
            
            <button id="btn-barber" class="btn-profile btn-barber">
                💈 Sou Barbeiro
            </button>
        </div>
        
    </div>
`;

// Lógica vinculada a esta tela
export function initLoginEvents() {
    const btnClient = document.getElementById('btn-client');
    const btnBarber = document.getElementById('btn-barber');

    if (btnClient) {
        btnClient.addEventListener('click', () => {
            console.log("Fluxo de Cliente iniciado");
            alert("Acessando como Cliente..."); 
        });
    }

    if (btnBarber) {
        btnBarber.addEventListener('click', () => {
            console.log("Fluxo de Barbeiro iniciado");
            alert("Acessando como Barbeiro...");
        });
    }
}