        function abrirAbaGestao(idAba, elementoClicado) {
            // Remove 'active' de todas as abas no menu
            const tabs = document.querySelectorAll('.dash-tab');
            tabs.forEach(tab => tab.classList.remove('active'));

            // Remove 'active' de todos os containers de conteúdo
            const conteudos = document.querySelectorAll('.aba-conteudo');
            conteudos.forEach(conteudo => conteudo.classList.remove('active'));

            // Ativa o botão e a tela correspondente
            elementoClicado.classList.add('active');
            document.getElementById('aba-' + idAba).classList.add('active');
        }

        // Função para trocar de abas
        window.abrirAbaGestao = function(idAba, elementoClicado) {
            // 1. Remove a seleção de todos os botões do menu
            const tabs = document.querySelectorAll('.dash-tab');
            tabs.forEach(tab => tab.classList.remove('active'));

            // 2. Esconde todos os conteúdos das abas
            const conteudos = document.querySelectorAll('.aba-conteudo');
            conteudos.forEach(conteudo => conteudo.classList.remove('active'));

            // 3. Ativa o botão clicado e mostra a aba correspondente
            elementoClicado.classList.add('active');
            
            const abaParaAbrir = document.getElementById('aba-' + idAba);
            if (abaParaAbrir) {
                abaParaAbrir.classList.add('active');
            } else {
                console.error("Erro: A aba 'aba-" + idAba + "' não foi encontrada no HTML.");
            }
        };

        // Função para sair do sistema (Retorna à página principal)
        window.sairDoSistema = function() {
            console.log("Saindo do sistema...");
            // O comando abaixo redireciona para o site do cliente
            window.location.href = 'index.html'; 
        };

        // Coloca a data de hoje no filtro da agenda ao abrir
        document.addEventListener('DOMContentLoaded', () => {
            const inputFiltroData = document.getElementById('filtro-data-agenda');
            if (inputFiltroData) {
                const hoje = new Date().toISOString().split('T')[0];
                inputFiltroData.value = hoje;
            }
        });

        function sairDoSistema() {
            // Redireciona de volta para o site principal externo
            window.location.href = 'index.html';
        }

        // Define a data atual no filtro assim que entra
        document.addEventListener('DOMContentLoaded', () => {
            const inputFiltroData = document.getElementById('filtro-data-agenda');
            if (inputFiltroData) {
                const hoje = new Date().toISOString().split('T')[0];
                inputFiltroData.value = hoje;
            }
        });