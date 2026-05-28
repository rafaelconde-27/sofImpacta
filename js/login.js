        console.log("3. Script principal carregado! Iniciando sistema...");

        // --- CAPTURAR INFORMAÇÕES ---
        const modalLogin = document.getElementById('login-modal');
        const modalSenha = document.getElementById('senha-modal');
        const modalCadastro = document.getElementById('cadastro-modal');

        const inputTelefone = document.getElementById('telefone-login');
        const btnEntrar = document.getElementById('btn-entrar');

        const inputCadNome = document.getElementById('cad-nome');
        const inputCadTelefone = document.getElementById('cad-telefone');
        const inputCadEmail = document.getElementById('cad-email');
        const inputCadSenha = document.getElementById('cad-senha');
        const inputCadConfirmaSenha = document.getElementById('cad-confirma-senha');
        const btnCadastrar = document.getElementById('btn-cadastrar');

        // --- MÁSCARA PARA O TELEFONE ---
        if (inputTelefone) {
            inputTelefone.addEventListener('input', function (e) {
                let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
                e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
            });
        }

        // --- FUNÇÕES DE NAVEGAÇÃO ---
        function voltarParaLogin() {
            if (modalSenha) modalSenha.style.display = 'none';
            if (modalCadastro) modalCadastro.style.display = 'none';
            if (modalLogin) modalLogin.style.display = 'flex';
        }

        // --- LÓGICA DO BOTÃO DE ENTRAR ---
        if (btnEntrar) {
            btnEntrar.addEventListener('click', async () => {
                const telefoneValue = inputTelefone.value;
                
                if (telefoneValue.length >= 14) {
                    const btnOriginalText = btnEntrar.innerHTML;
                    btnEntrar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';
                    btnEntrar.disabled = true;

                    try {
                        const { data, error } = await window.supabaseClient
                            .from('clientes')
                            .select('id, celular')
                            .eq('celular', telefoneValue)
                            .single(); 

                        if (error && error.code === 'PGRST116') {
                            console.log("Usuário não cadastrado. Abrindo tela de cadastro...");
                            modalLogin.style.display = 'none';
                            modalCadastro.style.display = 'flex';
                            inputCadTelefone.value = telefoneValue; 
                        } else if (data) {
                            console.log("Usuário encontrado! Abrindo tela de senha...");
                            modalLogin.style.display = 'none';
                            modalSenha.style.display = 'flex';
                        } else if (error) {
                            console.error("Erro no banco de dados:", error);
                            alert("Erro ao verificar o banco de dados. Verifique a segurança (RLS) no Supabase.");
                        }
                    } catch (err) {
                        console.error("Erro fatal na requisição:", err);
                    } finally {
                        btnEntrar.innerHTML = btnOriginalText;
                        btnEntrar.disabled = false;
                    }
                    
                } else {
                    alert('Por favor, insira um número de celular válido com DDD.');
                }
            });
        }

        // --- LÓGICA DO BOTÃO DE CADASTRAR ---
        if (btnCadastrar) {
            btnCadastrar.addEventListener('click', async () => {
                console.log("Botão Cadastrar clicado!");
                const nome = inputCadNome.value.trim();
                const celular = inputCadTelefone.value;
                const email = inputCadEmail.value.trim();
                const senha = inputCadSenha.value;
                const confirmaSenha = inputCadConfirmaSenha.value;

                if (!nome || !senha || !confirmaSenha) {
                    alert("Por favor, preencha todos os campos obrigatórios (*).");
                    return;
                }
                if (senha !== confirmaSenha) {
                    alert("As senhas não coincidem!");
                    return;
                }

                const btnOriginalText = btnCadastrar.innerHTML;
                btnCadastrar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
                btnCadastrar.disabled = true;

                try {
                    const { data, error } = await window.supabaseClient
                        .from('clientes')
                        .insert([{ nome: nome, celular: celular, email: email || null, senha: senha }]);

                    if (error) {
                        console.error("Erro ao cadastrar:", error);
                        alert("Erro ao cadastrar: " + error.message);
                    } else {
                        alert("Cadastro realizado com sucesso!");
                        modalCadastro.style.display = 'none';
                        modalLogin.style.display = 'none';
                    }
                } catch (err) {
                    console.error("Erro fatal no cadastro:", err);
                } finally {
                    btnCadastrar.innerHTML = btnOriginalText;
                    btnCadastrar.disabled = false;
                }
            });
        }

        // --- LÓGICA DO BOTÃO DE ACESSAR (SENHA) ---
        const btnEntrarSenha = document.getElementById('btn-entrar-senha');
        const inputSenhaLogin = document.getElementById('senha-login');

        if (btnEntrarSenha) {
            btnEntrarSenha.addEventListener('click', async () => {
                const senhaValue = inputSenhaLogin.value;
                const telefoneValue = inputTelefone.value; // Puxa o celular que já foi digitado na primeira tela

                if (!senhaValue) {
                    alert("Por favor, digite sua senha.");
                    return;
                }

                const btnOriginalText = btnEntrarSenha.innerHTML;
                btnEntrarSenha.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';
                btnEntrarSenha.disabled = true;

                try {
                    const { data, error } = await window.supabaseClient
                        .from('clientes')
                        .select('nome')
                        .eq('celular', telefoneValue)
                        .eq('senha', senhaValue)
                        .single(); 

                    if (error && error.code === 'PGRST116') {
                        alert("Senha incorreta. Tente novamente.");
                        } else if (data) {
                    // Senha correta
                    console.log(`Login efetuado com sucesso! Bem-vindo(a), ${data.nome}`);
                    
                    // Fecha o modal de senha
                    modalSenha.style.display = 'none';
                    
                    // Muda o botão principal e injeta os dados no dropdown
                    const btnToggle = document.getElementById('btn-toggle-dropdown');
                    if (btnToggle) {
                        const primeiroNome = data.nome.split(' ')[0];
                        btnToggle.innerHTML = `<i class="fa-solid fa-user-check"></i> Olá, ${primeiroNome}`;
                        
                        // Preenche o menu suspenso com os dados do banco
                        document.getElementById('dropdown-nome').innerText = data.nome;
                        document.getElementById('dropdown-telefone').innerText = telefoneValue;
                    }
                } else if (error) {
                        console.error("Erro no banco de dados:", error);
                    }
                } catch (err) {
                    console.error("Erro fatal na requisição de login:", err);
                } finally {
                    // Restaura o visual do botão
                    btnEntrarSenha.innerHTML = btnOriginalText;
                    btnEntrarSenha.disabled = false;
                }
            });
        }

         // --- LÓGICA DO MENU DROPDOWN E BOTÃO ENTRAR NAVBAR ---
        document.addEventListener('click', function(event) {
            const btnToggle = document.getElementById('btn-toggle-dropdown');
            const dropdown = document.getElementById('dropdown-menu');
            
            // Verifica se o clique foi no botão "Entrar / Registrar" (ou no nome logado)
            if (event.target.closest('#btn-toggle-dropdown')) {
                
                // Se estiver logado (tem "Olá"), abre/fecha o menu suspenso
                if (btnToggle.innerHTML.includes('Olá')) {
                    dropdown.classList.toggle('show');
                } 
                // Se NÃO estiver logado, abre a tela preta de Login
                else {
                    modalLogin.style.display = 'flex';
                }
            } 
            // Se o clique foi em qualquer outro lugar da tela, fecha o menu suspenso
            else if (dropdown && !event.target.closest('.dropdown-content')) {
                dropdown.classList.remove('show');
            }
        });

        // Lógica para sair da conta
        const btnSair = document.getElementById('btn-sair');
        if (btnSair) {
            btnSair.addEventListener('click', (e) => {
                e.preventDefault(); 
                
                const btnToggle = document.getElementById('btn-toggle-dropdown');
                const dropdown = document.getElementById('dropdown-menu');
                
                // Reseta o visual do botão para o estado original
                btnToggle.innerHTML = 'Entrar / Registrar'; 
                dropdown.classList.remove('show'); 
                
                // Limpa os dados preenchidos nos inputs
                if(typeof inputTelefone !== 'undefined') inputTelefone.value = '';
                if(typeof inputSenhaLogin !== 'undefined') inputSenhaLogin.value = '';
                
                console.log("Usuário deslogado.");
            });
        }

       // --- PERMITIR "ENTER" PARA AVANÇAR NOS MODAIS ---
        // Enter no campo de Telefone (Tela 1)
        if (inputTelefone && btnEntrar) {
            inputTelefone.addEventListener('keydown', function(event) {
                // Verifica se a tecla pressionada foi o Enter (código 13)
                if (event.key === 'Enter' || event.keyCode === 13) {
                    event.preventDefault(); // Evita recarregar a página
                    console.log("Enter detetado no Telefone!"); // Aviso para o nosso teste (F12)
                    btnEntrar.click(); // Dispara o botão
                }
            });
        }

        // Enter no campo de Senha (Tela 2)
        // Como o inputSenhaLogin não foi declarado lá no topo com os outros, declaramos aqui:
        const inputSenhaLoginEnter = document.getElementById('senha-login');
        const btnEntrarSenhaEnter = document.getElementById('btn-entrar-senha');

        if (inputSenhaLoginEnter && btnEntrarSenhaEnter) {
            inputSenhaLoginEnter.addEventListener('keydown', function(event) {
                if (event.key === 'Enter' || event.keyCode === 13) {
                    event.preventDefault(); 
                    console.log("Enter detetado na Senha!");
                    btnEntrarSenhaEnter.click(); 
                }
            });
        }

        // Enter no último campo de Cadastro (Confirmação de Senha)
        if (inputCadConfirmaSenha && btnCadastrar) {
            inputCadConfirmaSenha.addEventListener('keydown', function(event) {
                if (event.key === 'Enter' || event.keyCode === 13) {
                    event.preventDefault();
                    console.log("Enter detetado no Cadastro!");
                    btnCadastrar.click(); 
                }
            });
        }