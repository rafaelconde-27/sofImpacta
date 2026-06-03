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
            
            // --- TRAVA DE SEGURANÇA: VERIFICA PERMISSÃO ---
            // Se a pessoa tentar abrir a aba de acessos, verificamos quem ela é
            if (idAba === 'acessos') {
                const nivelAcesso = localStorage.getItem('barbeiroLogadoNivel') || 'OPERADOR';
                
                // Se não for Administrador, exibe o aviso e cancela a abertura da aba
                if (nivelAcesso.toUpperCase() !== 'ADMINISTRADOR') {
                    mostrarToast("Sem permissão! Área restrita a Administradores.", "aviso");
                    return; 
                }
            }
            // ----------------------------------------------

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

        // Função para sair do sistema (Retorna à página principal limpando TUDO)
        window.sairDoSistema = function() {
            console.log("Saindo do sistema...");
            
            // 1. Apaga a memória do barbeiro logado
            localStorage.removeItem('barbeiroLogadoNome');
            localStorage.removeItem('barbeiroLogadoNivel');
            
            // 2. Apaga a memória do cliente logado (Evita o Auto-Login no index.html)
            localStorage.removeItem('userNome');
            localStorage.removeItem('userTelefone');
            localStorage.removeItem('agendNome');
            localStorage.removeItem('agendTelefone');
            
            // 3. Redireciona de volta para a tela inicial (Seleção de Perfil)
            window.location.href = 'index.html'; 
        };


        function sairDoSistema() {
            // Redireciona de volta para o site principal externo
            window.location.href = 'index.html';
        }

        // --- LÓGICA DO MÓDULO DE SERVIÇOS ---
        function abrirModalServico() {
            document.getElementById('modal-servico').style.display = 'flex';
        }

        function fecharModalServico() {
            document.getElementById('modal-servico').style.display = 'none';
            // Limpa os campos quando fecha
            document.getElementById('serv-nome').value = '';
            document.getElementById('serv-desc').value = '';
            document.getElementById('serv-preco').value = '';
            document.getElementById('serv-duracao').value = '';
        }

        // BUSCAR SERVIÇOS NO BANCO
        async function carregarServicos() {
            const lista = document.getElementById('lista-servicos');
            if (!lista) return;

            // --- TRAVA DE SEGURANÇA: VERIFICA PERMISSÃO ---
            const nivelAcesso = localStorage.getItem('barbeiroLogadoNivel') || 'OPERADOR';
            const ehAdmin = nivelAcesso.toUpperCase() === 'ADMINISTRADOR';

            // Oculta o botão de "+ Novo Serviço" no cabeçalho se não for Administrador
            const btnNovoServico = document.querySelector('#aba-servicos .aba-header button');
            if (btnNovoServico) {
                btnNovoServico.style.display = ehAdmin ? 'block' : 'none';
            }
            // ----------------------------------------------

            lista.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;"><i class="fa-solid fa-spinner fa-spin"></i> Buscando serviços...</p>';

            try {
                const { data, error } = await window.supabaseClient
                    .from('servicos')
                    .select('*')
                    .order('nome', { ascending: true });

                if (error) throw error;

                if (data.length === 0) {
                    lista.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">Nenhum serviço cadastrado ainda.</p>';
                    return;
                }

                lista.innerHTML = ''; // Limpa a mensagem de carregamento

                // Monta o Card de cada serviço
                data.forEach(servico => {
                    const precoFormatado = Number(servico.preco).toFixed(2).replace('.', ',');
                    const desc = servico.descricao ? servico.descricao : '<em>Sem descrição</em>';
                    
                    // GERA O BOTÃO DE EXCLUIR APENAS SE FOR ADMINISTRADOR
                    let btnExcluirHtml = '';
                    if (ehAdmin) {
                        btnExcluirHtml = `
                            <button class="btn-excluir-serv" onclick="excluirServico('${servico.id}')" title="Excluir Serviço">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        `;
                    }

                    const card = `
                        <div class="servico-card">
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <h3>${servico.nome}</h3>
                                    ${btnExcluirHtml}
                                </div>
                                <p>${desc}</p>
                            </div>
                            <div class="servico-detalhes">
                                <span class="servico-preco">R$ ${precoFormatado}</span>
                                <span class="servico-duracao"><i class="fa-regular fa-clock"></i> ${servico.duracao} min</span>
                            </div>
                        </div>
                    `;
                    lista.innerHTML += card;
                });

            } catch (err) {
                console.error("Erro ao carregar serviços:", err);
                lista.innerHTML = '<p style="text-align: center; color: #ff4d4d; grid-column: 1/-1;">Erro ao carregar os serviços. Verifique o banco.</p>';
            }
        }

        // SALVAR NOVO SERVIÇO
        document.addEventListener('DOMContentLoaded', () => {
            // Carrega os serviços assim que o painel abrir
            carregarServicos();

            const btnSalvar = document.getElementById('btn-salvar-servico');
            if (btnSalvar) {
                btnSalvar.addEventListener('click', async () => {
                    const nome = document.getElementById('serv-nome').value.trim();
                    const desc = document.getElementById('serv-desc').value.trim();
                    const preco = document.getElementById('serv-preco').value;
                    const duracao = document.getElementById('serv-duracao').value;

                    // VERIFICAÇÃO DE CAMPOS VAZIOS
            if (!nome || !preco || !duracao) {
                mostrarToast('O Nome, Preço e Duração são obrigatórios!', 'aviso');
                return;
            }

            const textoOriginal = btnSalvar.innerHTML;
            btnSalvar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
            btnSalvar.disabled = true;

            try {
                const { error } = await window.supabaseClient
                    .from('servicos')
                    .insert([{ 
                        nome: nome, 
                        descricao: desc || null, 
                        preco: parseFloat(preco), 
                        duracao: parseInt(duracao) 
                    }]);

                if (error) throw error;

                fecharModalServico();
                
                // MENSAGEM DE SUCESSO BONITA!
                mostrarToast('Serviço adicionado com sucesso!');
                
                carregarServicos(); 
                
            } catch (err) {
                console.error('Erro ao salvar serviço:', err);
                mostrarToast('Erro ao salvar: ' + err.message, 'aviso');
            } finally {
                btnSalvar.innerHTML = textoOriginal;
                btnSalvar.disabled = false;
            }
                });
            }
        });

        // FUNÇÃO EXTRA: EXCLUIR SERVIÇO
        async function excluirServico(id) {
            if(confirm("Tem certeza que deseja excluir este serviço do catálogo?")) {
                try {
                    const { error } = await window.supabaseClient
                        .from('servicos')
                        .delete()
                        .eq('id', id);
                        
                    if (error) throw error;
                    carregarServicos(); // Atualiza a lista
                } catch(err) {
                    alert("Erro ao excluir: " + err.message);
                }
            }
        }

        // --- SISTEMA DE NOTIFICAÇÃO ELEGANTE (TOAST) PARA A GESTÃO ---
        window.mostrarToast = function(mensagem, tipo = 'padrao') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast ${tipo === 'aviso' ? 'toast-warning' : ''}`;
            
            const icone = tipo === 'aviso' ? '<i class="fa-solid fa-triangle-exclamation"></i>' : '<i class="fa-solid fa-circle-check"></i>';

            toast.innerHTML = `${icone} <span>${mensagem}</span>`;
            
            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('show');
            }, 10);

            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 400); 
            }, 3500);
        }

        // --- LÓGICA DO MÓDULO DE EQUIPE ---
        function abrirModalEquipe() {
            document.getElementById('modal-equipe').style.display = 'flex';
        }

        function fecharModalEquipe() {
            document.getElementById('modal-equipe').style.display = 'none';
            // Limpa campos
            document.getElementById('eqp-nome').value = '';
            document.getElementById('eqp-telefone').value = '';
            document.getElementById('eqp-comissao').value = '';
            document.getElementById('eqp-status').value = 'Ativo';
        }

        // BUSCAR PROFISSIONAIS NO BANCO
        async function carregarEquipe() {
            const lista = document.getElementById('lista-equipe');
            if (!lista) return;

            // --- TRAVA DE SEGURANÇA: VERIFICA PERMISSÃO ---
            const nivelAcesso = localStorage.getItem('barbeiroLogadoNivel') || 'OPERADOR';
            const ehAdmin = nivelAcesso.toUpperCase() === 'ADMINISTRADOR';

            // Oculta o botão "+ Adicionar Profissional" se não for Admin
            const btnNovaEquipe = document.querySelector('#aba-equipe .aba-header button');
            if (btnNovaEquipe) {
                btnNovaEquipe.style.display = ehAdmin ? 'block' : 'none';
            }
            // ----------------------------------------------

            lista.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;"><i class="fa-solid fa-spinner fa-spin"></i> Buscando equipe...</p>';

            try {
                const { data, error } = await window.supabaseClient
                    .from('equipe')
                    .select('*')
                    .order('nome', { ascending: true });

                if (error) throw error;

                if (data.length === 0) {
                    lista.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">Nenhum profissional cadastrado.</p>';
                    return;
                }

                lista.innerHTML = ''; 

                data.forEach(prof => {
                    const statusClass = prof.status === 'Ativo' ? 'status-ativo' : 'status-inativo';
                    
                    // GERA A COMISSÃO E O BOTÃO DE EXCLUIR APENAS SE FOR ADMINISTRADOR
                    let btnRemoverHtml = '';
                    let infoComissaoHtml = '';
                    
                    if (ehAdmin) {
                        infoComissaoHtml = `<div class="equipe-comissao">Comissão: ${prof.comissao || 0}%</div>`;
                        
                        btnRemoverHtml = `
                            <hr style="width: 100%; border: 0; border-top: 1px solid #2a2a2a; margin-bottom: 20px;">
                            <button class="btn-remover-eqp" onclick="removerProfissional('${prof.id}')">
                                🗑 Remover Profissional
                            </button>
                        `;
                    }

                    // Se não for admin, adicionamos uma margem top no status para não ficar grudado no telefone já que a comissão sumiu
                    const marginAjuste = !ehAdmin ? 'margin-top: 15px;' : '';

                    const card = `
                        <div class="equipe-card">
                            <div class="equipe-avatar">👨🏼‍💼</div>
                            <h3>${prof.nome}</h3>
                            <p>${prof.telefone || 'Sem telefone'}</p>
                            
                            ${infoComissaoHtml}
                            
                            <div class="badge-status ${statusClass}" style="${marginAjuste}">${prof.status.toUpperCase()}</div>
                            ${btnRemoverHtml}
                        </div>
                    `;
                    lista.innerHTML += card;
                });

            } catch (err) {
                console.error("Erro ao carregar equipe:", err);
                lista.innerHTML = '<p style="text-align: center; color: #ff4d4d; grid-column: 1/-1;">Erro ao carregar a equipe.</p>';
            }
        }

        // Adicionando a chamada da equipe junto com os serviços quando a tela carrega
        document.addEventListener('DOMContentLoaded', () => {
            // Você já tem uma função assim no seu JS, basta adicionar carregarEquipe() dentro dela, ou deixar esta nova solta aqui:
            carregarEquipe();
        });

        // SALVAR NOVO PROFISSIONAL
        document.addEventListener('DOMContentLoaded', () => {
            const btnSalvarEquipe = document.getElementById('btn-salvar-equipe');
            if (btnSalvarEquipe) {
                btnSalvarEquipe.addEventListener('click', async () => {
                    const nome = document.getElementById('eqp-nome').value.trim();
                    const telefone = document.getElementById('eqp-telefone').value.trim();
                    const comissao = document.getElementById('eqp-comissao').value;
                    const status = document.getElementById('eqp-status').value;

                    if (!nome) {
                        mostrarToast('O Nome do profissional é obrigatório!', 'aviso');
                        return;
                    }

                    const textoOriginal = btnSalvarEquipe.innerHTML;
                    btnSalvarEquipe.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
                    btnSalvarEquipe.disabled = true;

                    try {
                        const { error } = await window.supabaseClient
                            .from('equipe')
                            .insert([{ 
                                nome: nome, 
                                telefone: telefone || null, 
                                comissao: comissao ? parseFloat(comissao) : 0, 
                                status: status 
                            }]);

                        if (error) throw error;

                        fecharModalEquipe();
                        mostrarToast('Profissional adicionado à equipe com sucesso!');
                        carregarEquipe(); 
                        
                    } catch (err) {
                        console.error('Erro ao salvar profissional:', err);
                        mostrarToast('Erro ao salvar: ' + err.message, 'aviso');
                    } finally {
                        btnSalvarEquipe.innerHTML = textoOriginal;
                        btnSalvarEquipe.disabled = false;
                    }
                });
            }
        });

        // FUNÇÃO PARA REMOVER PROFISSIONAL
        async function removerProfissional(id) {
            if(confirm("Tem certeza que deseja remover este profissional da equipe?")) {
                try {
                    const { error } = await window.supabaseClient
                        .from('equipe')
                        .delete()
                        .eq('id', id);
                        
                    if (error) throw error;
                    mostrarToast('Profissional removido!', 'aviso');
                    carregarEquipe(); 
                } catch(err) {
                    mostrarToast("Erro ao remover: " + err.message, "aviso");
                }
            }
        }

        // --- LÓGICA DE CONFIGURAÇÕES GERAIS E HORÁRIOS ---
        let horariosSelecionados = []; // Guarda os horários ativos na memória

        // 1. Gera os botões de horário dinamicamente
        // 1. Gera os botões de horário dinamicamente baseados na Duração e Intervalo
        window.gerarGradeHorarios = function() {
            const grid = document.getElementById('grid-horarios');
            if(!grid) return;
            
            grid.innerHTML = '';
            horariosSelecionados = []; // Limpa a memória de horários selecionados
            
            // Verifica a permissão
            const nivelAcesso = localStorage.getItem('barbeiroLogadoNivel') || 'OPERADOR';
            const ehAdmin = nivelAcesso.toUpperCase() === 'ADMINISTRADOR';

            // Pega os valores dos inputs de configuração
            const inputDuracao = document.getElementById('conf-duracao');
            const inputIntervalo = document.getElementById('conf-intervalo');

            let duracao = inputDuracao ? parseInt(inputDuracao.value) : 30;
            let intervalo = inputIntervalo ? parseInt(inputIntervalo.value) : 0;

            // Se apagarem o campo ou colocarem número negativo, assume padrão seguro
            if (isNaN(duracao) || duracao <= 0) duracao = 30;
            if (isNaN(intervalo) || intervalo < 0) intervalo = 0;

            const passoMinutos = duracao + intervalo;

            // O dia começa às 07:00 (7 * 60 minutos = 420) e vai até 23:00 (1380 minutos)
            const inicioMinutos = 7 * 60; 
            const fimMinutos = 23 * 60;   

            for(let tempoAtual = inicioMinutos; tempoAtual <= fimMinutos; tempoAtual += passoMinutos) {
                
                // Converte os minutos de volta para Hora:Minuto
                let h = Math.floor(tempoAtual / 60);
                let m = tempoAtual % 60;
                
                let horaFormatada = h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
                
                let slot = document.createElement('div');
                slot.className = 'time-slot';
                slot.id = 'slot-' + horaFormatada.replace(':', '');
                slot.innerText = horaFormatada;
                
                // Lógica de clicar e mudar de cor (APENAS PARA ADMIN)
                if (ehAdmin) {
                    slot.onclick = function() {
                        this.classList.toggle('active');
                        if(this.classList.contains('active')) {
                            if(!horariosSelecionados.includes(horaFormatada)) {
                                horariosSelecionados.push(horaFormatada);
                            }
                        } else {
                            horariosSelecionados = horariosSelecionados.filter(horario => horario !== horaFormatada);
                        }
                    };
                } else {
                    slot.style.cursor = 'default';
                }
                
                grid.appendChild(slot);
            }
        }

        // 2. Busca os dados salvos no banco ao abrir a página
        async function carregarConfiguracoesMaster() {
            
            // --- TRAVA DE SEGURANÇA ---
            const nivelAcesso = localStorage.getItem('barbeiroLogadoNivel') || 'OPERADOR';
            const ehAdmin = nivelAcesso.toUpperCase() === 'ADMINISTRADOR';

            if (!ehAdmin) {
                const botoesSalvar = document.querySelectorAll('.config-btn');
                botoesSalvar.forEach(btn => btn.style.display = 'none');

                const inputsConfig = document.querySelectorAll('.config-input-group input');
                inputsConfig.forEach(input => {
                    input.readOnly = true;
                    input.style.opacity = '0.7'; 
                    input.style.cursor = 'not-allowed'; 
                });
            }
            // --------------------------

            try {
                const { data, error } = await window.supabaseClient
                    .from('configuracoes')
                    .select('*')
                    .eq('id', 1)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;
                
                if (data) {
                    document.getElementById('conf-nome').value = data.nome_barbearia || '';
                    document.getElementById('conf-telefone').value = data.telefone || '';
                    document.getElementById('conf-endereco').value = data.endereco || '';
                    document.getElementById('conf-duracao').value = data.duracao_padrao || 30;
                    document.getElementById('conf-intervalo').value = data.intervalo || 0;

                    // GERA A GRADE NOVAMENTE COM OS VALORES QUE VIERAM DO BANCO!
                    gerarGradeHorarios();

                    // Restaura os botões amarelos apenas DEPOIS que a grade foi gerada
                    if (data.horarios_ativos && Array.isArray(data.horarios_ativos)) {
                        horariosSelecionados = data.horarios_ativos;
                        horariosSelecionados.forEach(hora => {
                            let idSlot = 'slot-' + hora.replace(':', '');
                            let botao = document.getElementById(idSlot);
                            if (botao) botao.classList.add('active');
                        });
                    }
                }
            } catch (err) {
                console.error("Erro ao carregar configurações:", err);
            }
        }

        // Inicializa a tela gerando os botões e buscando do banco
        document.addEventListener('DOMContentLoaded', () => {
            gerarGradeHorarios();
            carregarConfiguracoesMaster();
        });

        // 3. Salvar apenas a grade de Horários
        window.salvarHorariosMaster = async function() {
            const btn = event.currentTarget;
            const textoOriginal = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
            btn.disabled = true;

            try {
                const { error } = await window.supabaseClient
                    .from('configuracoes')
                    .update({ horarios_ativos: horariosSelecionados })
                    .eq('id', 1);

                if (error) throw error;
                if(typeof mostrarToast === 'function') mostrarToast('Grade de horários atualizada!');
                else alert('Horários salvos!');
            } catch (err) {
                alert("Erro ao salvar horários: " + err.message);
            } finally {
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
            }
        }

        // 4. Salvar apenas os dados Gerais (Inputs)
        window.salvarConfigGerais = async function() {
            const btn = event.currentTarget;
            const textoOriginal = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
            btn.disabled = true;

            const nome = document.getElementById('conf-nome').value;
            const tel = document.getElementById('conf-telefone').value;
            const end = document.getElementById('conf-endereco').value;
            const duracao = document.getElementById('conf-duracao').value;
            const intervalo = document.getElementById('conf-intervalo').value;

            try {
                const { error } = await window.supabaseClient
                    .from('configuracoes')
                    .update({ 
                        nome_barbearia: nome,
                        telefone: tel,
                        endereco: end,
                        duracao_padrao: parseInt(duracao) || 30,
                        intervalo: parseInt(intervalo) || 0
                    })
                    .eq('id', 1);

                if (error) throw error;
                if(typeof mostrarToast === 'function') mostrarToast('Configurações gerais atualizadas!');
                else alert('Configurações salvas!');
            } catch (err) {
                alert("Erro ao salvar configurações: " + err.message);
            } finally {
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
            }
        }

        // ==========================================
        // MÓDULO DA AGENDA (RESTRIÇÃO E RENDERIZAÇÃO)
        // ==========================================

        // 1. Configura o calendário para os próximos 10 dias e carrega barbeiros
        document.addEventListener('DOMContentLoaded', async () => {
            const inputFiltroData = document.getElementById('filtro-data-agenda');
            if (inputFiltroData) {
                const dataHoje = new Date();
                
                // Define data limite para 10 dias à frente
                const dataLimite = new Date();
                dataLimite.setDate(dataHoje.getDate() + 10);

                // Formata as datas para YYYY-MM-DD
                const stringHoje = dataHoje.toISOString().split('T')[0];
                const stringLimite = dataLimite.toISOString().split('T')[0];

                // Aplica as restrições no input HTML
                inputFiltroData.min = stringHoje;
                inputFiltroData.max = stringLimite;
                inputFiltroData.value = stringHoje; // Inicia na data de hoje
            }

            // Alimenta o select com os barbeiros da equipe
            await preencherFiltroBarbeiros();
            
            // Dispara a busca inicial para o dia de hoje
            carregarAgendaDoDia();
        });

        async function preencherFiltroBarbeiros() {
            const select = document.getElementById('filtro-prof-agenda');
            if(!select) return;

            // Busca os dados de quem logou na memória (se não achar, assume Administrador por segurança)
            const nivelAcesso = localStorage.getItem('barbeiroLogadoNivel') || 'ADMINISTRADOR';
            const nomeLogado = localStorage.getItem('barbeiroLogadoNome') || '';

            try {
                const { data, error } = await window.supabaseClient.from('equipe').select('id, nome').eq('status', 'Ativo');
                if (data) {
                    select.innerHTML = ''; // Limpa as opções padrão

                    if (nivelAcesso.toUpperCase() === 'OPERADOR') {
                        // Filtra a equipe para encontrar o ID do barbeiro logado (O Nome no acesso deve ser igual ao da equipe)
                        const meuPerfil = data.find(prof => prof.nome === nomeLogado);
                        
                        if (meuPerfil) {
                            select.innerHTML = `<option value="${meuPerfil.id}">${meuPerfil.nome}</option>`;
                        } else {
                            select.innerHTML = `<option value="erro">Perfil não encontrado na equipe</option>`;
                        }
                        
                        // Esconde a caixa de seleção visualmente (o usuário não poderá clicar nem ver outros)
                        select.style.display = 'none'; 
                    } else {
                        // Se for ADMINISTRADOR: Mostra a opção "Todos" e lista completa, mantendo a caixa visível
                        select.style.display = 'block';
                        select.innerHTML = `<option value="todos">Todos os barbeiros</option>`;
                        data.forEach(prof => {
                            select.innerHTML += `<option value="${prof.id}">${prof.nome}</option>`;
                        });
                    }
                }
            } catch(err) { console.error(err); }
        }

        // 2. Busca e cruza os dados
        window.carregarAgendaDoDia = async function() {
            const dataSelecionada = document.getElementById('filtro-data-agenda').value;
            const selectProf = document.getElementById('filtro-prof-agenda');
            const profissionalId = selectProf.value;
            const nomeProfissional = selectProf.options[selectProf.selectedIndex]?.text || '';
            
            const gradeHtml = document.getElementById('grade-horarios-agenda');
            const listaHtml = document.getElementById('lista-agendamentos-dia');
            const btnBloquear = document.getElementById('btn-bloquear-dia');
            
            if(!gradeHtml || !listaHtml || !dataSelecionada) return;

            gradeHtml.innerHTML = '<p style="color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Atualizando grade...</p>';
            listaHtml.innerHTML = '<p style="color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Buscando clientes...</p>';

            // Controle de exibição do botão de bloqueio (Segurança Visual Absoluta)
            const nomeLogado = localStorage.getItem('barbeiroLogadoNome') || '';

            if (btnBloquear) {
                if (profissionalId === 'todos' || !profissionalId) {
                    btnBloquear.style.display = 'none';
                } else if (nomeProfissional !== nomeLogado) {
                    // NINGUÉM (nem administrador) pode ver o botão na agenda de outra pessoa
                    btnBloquear.style.display = 'none'; 
                } else {
                    // O botão só aparece se o nome logado for EXATAMENTE IGUAL ao nome selecionado no filtro
                    btnBloquear.style.display = 'flex';
                }
            }

            try {
                // A. Puxa a Grade Master
                const { data: config } = await window.supabaseClient.from('configuracoes').select('horarios_ativos').eq('id', 1).single();
                const horariosMaster = config?.horarios_ativos || [];

                // B. Puxa os agendamentos reais daquela data
                let queryAgendamentos = window.supabaseClient.from('agendamentos').select('*').eq('data_agendamento', dataSelecionada);
                if (profissionalId !== 'todos') {
                    queryAgendamentos = queryAgendamentos.eq('profissional_id', profissionalId);
                }
                
                const { data: agendamentos, error } = await queryAgendamentos.order('horario', { ascending: true });
                if (error) throw error;

                // VERIFICA SE O DIA ESTÁ BLOQUEADO
                const bloqueio = agendamentos.find(ag => ag.status === 'BLOQUEIO');

                if (btnBloquear && profissionalId !== 'todos') {
                    if (bloqueio) {
                        btnBloquear.innerHTML = '<i class="fa-solid fa-unlock"></i> Desbloquear Dia';
                        btnBloquear.style.backgroundColor = '#25D366'; // Verde
                        btnBloquear.onclick = () => desbloquearDiaSelecionado(bloqueio.id, nomeProfissional); // Passa o nome para segurança
                    } else {
                        btnBloquear.innerHTML = '<i class="fa-solid fa-lock"></i> Bloquear Dia';
                        btnBloquear.style.backgroundColor = '#f43f5e'; // Vermelho
                        btnBloquear.onclick = () => bloquearDiaSelecionado(dataSelecionada, profissionalId, nomeProfissional);
                    }
                }

                gradeHtml.innerHTML = '';
                
                if (bloqueio) {
                     gradeHtml.innerHTML = '<p style="color: #ff4d4d; font-weight: bold; grid-column: 1/-1;"><i class="fa-solid fa-lock"></i> Agenda bloqueada (Folga/Feriado).</p>';
                     listaHtml.innerHTML = '<p style="color: var(--text-muted);">Sem agendamentos. (Dia Bloqueado)</p>';
                     return; 
                }

                if (horariosMaster.length === 0) {
                    gradeHtml.innerHTML = '<p style="color: #ff4d4d; grid-column: 1/-1;">Nenhum horário configurado.</p>';
                } else {
                    const horariosOcupados = agendamentos.map(ag => ag.horario);
                    horariosMaster.sort().forEach(hora => {
                        const taOcupado = horariosOcupados.includes(hora);
                        const classe = taOcupado ? 'time-slot slot-ocupado' : 'time-slot slot-livre';
                        
                        gradeHtml.innerHTML += `
                            <div class="${classe}" title="${taOcupado ? 'Horário Reservado' : 'Disponível'}">
                                ${hora}
                            </div>
                        `;
                    });
                }

                listaHtml.innerHTML = '';
                if (agendamentos.length === 0) {
                    listaHtml.innerHTML = '<p style="color: var(--text-muted);">Nenhum cliente agendado para esta data.</p>';
                } else {
                    agendamentos.forEach(ag => {
                        const profTexto = profissionalId === 'todos' ? `<p><i class="fa-solid fa-scissors"></i> ${ag.profissional_nome}</p>` : '';
                        listaHtml.innerHTML += `
                            <div class="agendamento-card">
                                <div class="agendamento-info">
                                    <h4>${ag.cliente_nome}</h4>
                                    <p><i class="fa-brands fa-whatsapp"></i> ${ag.cliente_telefone}</p>
                                    ${profTexto}
                                </div>
                                <div class="agendamento-hora">${ag.horario}</div>
                            </div>
                        `;
                    });
                }

            } catch (err) {
                gradeHtml.innerHTML = '<p style="color: #ff4d4d;">Erro de sincronização.</p>';
                listaHtml.innerHTML = '<p style="color: #ff4d4d;">Erro de sincronização.</p>';
            }
        }

        // ==========================================
        // FUNÇÕES DE BLOQUEIO/DESBLOQUEIO (COM SEGURANÇA E MODAL ESTILIZADO)
        // ==========================================
        // ==========================================
        // FUNÇÕES DE BLOQUEIO/DESBLOQUEIO (TRAVA ABSOLUTA)
        // ==========================================
        window.bloquearDiaSelecionado = async function(data, profissionalId, profissionalNome) {
            
            // Trava de Segurança no Código (Backup)
            const nomeLogado = localStorage.getItem('barbeiroLogadoNome') || '';
            
            // SE O NOME DO ACESSO FOR DIFERENTE DO NOME DA AGENDA, BLOQUEIA IMEDIATAMENTE
            if (profissionalNome !== nomeLogado) {
                mostrarToast("Você só pode bloquear a sua própria agenda!", "aviso");
                return;
            }

            const dataFormatada = data.split('-').reverse().join('/');
            
            const confirmou = await confirmarAcao(
                "Bloquear Agenda",
                `Tem certeza que deseja BLOQUEAR a sua agenda no dia ${dataFormatada}?`,
                "#f43f5e", 
                "fa-lock"
            );

            if (confirmou) {
                const btnBloquear = document.getElementById('btn-bloquear-dia');
                const textoOriginal = btnBloquear.innerHTML;
                btnBloquear.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Bloqueando...';
                btnBloquear.disabled = true;

                try {
                    const { error } = await window.supabaseClient
                        .from('agendamentos')
                        .insert([{
                            cliente_nome: 'DIA BLOQUEADO',
                            cliente_telefone: '00000000000',
                            profissional_id: profissionalId,
                            profissional_nome: profissionalNome,
                            servicos: [], 
                            data_agendamento: data,
                            horario: 'BLOQUEIO',
                            status: 'BLOQUEIO'
                        }]);

                    if (error) throw error;
                    if(typeof mostrarToast === 'function') mostrarToast("Seu dia foi bloqueado com sucesso!");
                    carregarAgendaDoDia(); 
                } catch (err) {
                    if(typeof mostrarToast === 'function') mostrarToast("Erro ao bloquear dia: " + err.message, "aviso");
                    btnBloquear.innerHTML = textoOriginal;
                    btnBloquear.disabled = false;
                }
            }
        }

        window.desbloquearDiaSelecionado = async function(idBloqueio, profissionalNome) {
            
            // Trava de Segurança no Código (Backup)
            const nomeLogado = localStorage.getItem('barbeiroLogadoNome') || '';
            
            if (profissionalNome !== nomeLogado) {
                mostrarToast("Você só pode desbloquear a sua própria agenda!", "aviso");
                return;
            }

            const confirmou = await confirmarAcao(
                "Desbloquear Agenda",
                `Deseja DESBLOQUEAR este dia e liberar a sua agenda novamente?`,
                "#25D366", 
                "fa-unlock"
            );

            if (confirmou) {
                const btnBloquear = document.getElementById('btn-bloquear-dia');
                btnBloquear.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Desbloqueando...';
                btnBloquear.disabled = true;

                try {
                    const { error } = await window.supabaseClient
                        .from('agendamentos')
                        .delete()
                        .eq('id', idBloqueio);

                    if (error) throw error;
                    if(typeof mostrarToast === 'function') mostrarToast("Seu dia foi desbloqueado com sucesso!");
                    carregarAgendaDoDia(); 
                } catch (err) {
                    if(typeof mostrarToast === 'function') mostrarToast("Erro ao desbloquear dia: " + err.message, "aviso");
                    btnBloquear.innerHTML = '<i class="fa-solid fa-unlock"></i> Desbloquear Dia';
                    btnBloquear.disabled = false;
                }
            }
        }

        // ==========================================
        // MÓDULO DE GESTÃO DE ACESSOS (BARBEIROS)
        // ==========================================

        // 1. Função para buscar a tabela "barbeiro" no Supabase e desenhar na tela
        window.carregarAcessos = async function() {
            const lista = document.getElementById('lista-acessos');
            if (!lista) return;

            lista.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Buscando acessos...</p>';

            try {
                const { data, error } = await window.supabaseClient
                    .from('barbeiro')
                    .select('*')
                    .order('nome', { ascending: true });

                if (error) throw error;

                if (data.length === 0) {
                    lista.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum usuário cadastrado.</p>';
                    return;
                }

                lista.innerHTML = '';

                data.forEach(user => {
                    const nivel = user.nivel_acesso || 'OPERADOR';
                    const status = user.status || 'ATIVO';
                    
                    const classeNivel = nivel.toUpperCase() === 'ADMINISTRADOR' ? 'badge-admin' : 'badge-operador';
                    const classeStatus = status.toUpperCase() === 'ATIVO' ? 'badge-ativo-tab' : 'badge-inativo-tab';

                    // Define o texto do botão de status
                    const textoStatusBtn = status.toUpperCase() === 'ATIVO' ? 'Desativar' : 'Ativar';
                    const iconeStatus = status.toUpperCase() === 'ATIVO' ? 'fa-power-off' : 'fa-check';

                    const row = `
                        <div class="acessos-row">
                            <div style="font-weight: bold; color: #fff; font-size: 0.95rem;">${user.nome}</div>
                            <div style="color: #ccc; font-size: 0.95rem;">${user.login}</div>
                            <div><span class="badge-nivel ${classeNivel}">${nivel.toUpperCase()}</span></div>
                            <div><span class="badge-status-tab ${classeStatus}">${status.toUpperCase()}</span></div>
                            <div class="acoes-botoes">
                                <button class="btn-editar-ac" onclick="editarAcesso('${user.id}', '${user.nome}', '${user.login}', '${nivel}', '${status}', '${user.senha || ''}')">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                
                                <button class="btn-desativar-ac" onclick="mudarStatusAcesso('${user.id}', '${status}')" title="${textoStatusBtn}">
                                    <i class="fa-solid ${iconeStatus}"></i>
                                </button>
                                
                                <button class="btn-excluir-ac" onclick="deletarAcessoBanco('${user.id}')" title="Excluir do Banco">
                                    <i class="fa-solid fa-trash"></i> Excluir
                                </button>
                            </div>
                        </div>
                    `;
                    lista.innerHTML += row;
                });

            } catch (err) {
                console.error("Erro ao carregar acessos:", err);
                lista.innerHTML = '<p style="text-align: center; color: #ff4d4d; padding: 20px;">Erro ao carregar a base de dados.</p>';
            }
        }

        // 4. Função para Desativar/Ativar (Apenas muda a coluna 'status' no Supabase)
        window.mudarStatusAcesso = async function(id, statusAtual) {
            const novoStatus = statusAtual.toUpperCase() === 'ATIVO' ? 'INATIVO' : 'ATIVO';
            
            try {
                const { error } = await window.supabaseClient
                    .from('barbeiro')
                    .update({ status: novoStatus })
                    .eq('id', id);
                    
                if (error) throw error;
                mostrarToast(`Acesso alterado para ${novoStatus}!`);
                carregarAcessos(); // Atualiza a tela
            } catch(err) {
                mostrarToast("Erro ao mudar status: " + err.message, "aviso");
            }
        }

        // 5. Função para EXCLUIR DEFINITIVAMENTE do banco de dados
        window.deletarAcessoBanco = async function(id) {
            if (confirm("ATENÇÃO: Tem certeza que deseja EXCLUIR DEFINITIVAMENTE este usuário do banco de dados? Esta ação não pode ser desfeita.")) {
                try {
                    const { error } = await window.supabaseClient
                        .from('barbeiro')
                        .delete()
                        .eq('id', id);
                        
                    if (error) throw error;
                    mostrarToast("Cadastro excluído permanentemente!", "aviso");
                    carregarAcessos(); // Atualiza a tela removendo a linha
                } catch (err) {
                    mostrarToast("Erro ao excluir: " + err.message, "aviso");
                }
            }
        }

        // ==========================================
        // 2. Modais, Preenchimento de Dados e Filtro
        // ==========================================
        
        // Função para buscar a equipe e filtrar quem ainda não tem acesso
        window.carregarProfissionaisDisponiveis = async function(nomeAtual = null) {
            const selectNome = document.getElementById('acesso-nome');
            if(!selectNome) return;

            selectNome.innerHTML = '<option value="">Carregando...</option>';

            try {
                // 1. Puxa todos os profissionais ativos da equipe
                const { data: equipe, error: errEquipe } = await window.supabaseClient.from('equipe').select('nome').eq('status', 'Ativo');
                if (errEquipe) throw errEquipe;

                // 2. Puxa todos os acessos já criados
                const { data: acessos, error: errAcessos } = await window.supabaseClient.from('barbeiro').select('nome');
                if (errAcessos) throw errAcessos;

                const nomesComAcesso = acessos.map(a => a.nome);

                // 3. Cruza os dados: Mostra apenas quem não está na tabela de acessos (ou o próprio usuário sendo editado)
                const disponiveis = equipe.filter(prof => !nomesComAcesso.includes(prof.nome) || prof.nome === nomeAtual);

                if (disponiveis.length === 0) {
                     selectNome.innerHTML = '<option value="">Sem profissionais disponíveis para vincular</option>';
                     return;
                }

                selectNome.innerHTML = '<option value="">Selecione um profissional...</option>';
                
                disponiveis.forEach(prof => {
                    const selected = (prof.nome === nomeAtual) ? 'selected' : '';
                    selectNome.innerHTML += `<option value="${prof.nome}" ${selected}>${prof.nome}</option>`;
                });

            } catch (err) {
                console.error("Erro ao carregar profissionais:", err);
                selectNome.innerHTML = '<option value="">Erro ao buscar equipe</option>';
            }
        }

        window.abrirModalAcesso = function() {
            document.getElementById('titulo-modal-acesso').innerText = "Novo Acesso";
            document.getElementById('acesso-id').value = ''; // Limpa o ID para saber que é um INSERT
            document.getElementById('acesso-login').value = '';
            document.getElementById('acesso-senha').value = '';
            document.getElementById('acesso-nivel').value = 'OPERADOR';
            document.getElementById('acesso-status').value = 'ATIVO';
            
            // Destrava o menu suspenso para poder escolher
            document.getElementById('acesso-nome').disabled = false;
            
            // Chama a função que vai preencher o dropdown
            carregarProfissionaisDisponiveis();
            
            document.getElementById('modal-acesso').style.display = 'flex';
        }

        window.fecharModalAcesso = function() {
            document.getElementById('modal-acesso').style.display = 'none';
        }

        window.editarAcesso = function(id, nome, login, nivel, status, senha) {
            document.getElementById('titulo-modal-acesso').innerText = "Editar Acesso";
            document.getElementById('acesso-id').value = id; 
            document.getElementById('acesso-login').value = login;
            document.getElementById('acesso-senha').value = senha; 
            document.getElementById('acesso-nivel').value = nivel;
            document.getElementById('acesso-status').value = status;
            
            // Trava o menu suspenso (Não faz sentido mudar de pessoa na edição, se for outra pessoa, exclui e cria de novo)
            document.getElementById('acesso-nome').disabled = true;
            
            // Chama a função passando o nome atual para ele já vir selecionado
            carregarProfissionaisDisponiveis(nome);
            
            document.getElementById('modal-acesso').style.display = 'flex';
        }

        // 3. Salvar (Insert ou Update) no Supabase
        window.salvarAcesso = async function() {
            const id = document.getElementById('acesso-id').value;
            const nome = document.getElementById('acesso-nome').value.trim();
            const login = document.getElementById('acesso-login').value.trim();
            const senha = document.getElementById('acesso-senha').value;
            const nivel = document.getElementById('acesso-nivel').value;
            const status = document.getElementById('acesso-status').value;

            if (!nome || !login || !senha) {
                mostrarToast("Selecione o profissional, crie o Login e a Senha!", "aviso");
                return;
            }

            const btn = document.getElementById('btn-salvar-acesso');
            const textoOriginal = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
            btn.disabled = true;

            try {
                let error;
                
                if (id) {
                    // Se tem ID, é uma ATUALIZAÇÃO (Update)
                    const res = await window.supabaseClient
                        .from('barbeiro')
                        .update({ nome: nome, login: login, senha: senha, nivel_acesso: nivel, status: status })
                        .eq('id', id);
                    error = res.error;
                } else {
                    // Se não tem ID, é um CADASTRO NOVO (Insert)
                    const res = await window.supabaseClient
                        .from('barbeiro')
                        .insert([{ nome: nome, login: login, senha: senha, nivel_acesso: nivel, status: status }]);
                    error = res.error;
                }

                if (error) throw error;

                fecharModalAcesso();
                mostrarToast("Acesso salvo com sucesso!");
                carregarAcessos(); // Atualiza a tabela imediatamente na tela

            } catch (err) {
                console.error("Erro ao salvar acesso:", err);
                mostrarToast("Erro ao salvar: " + err.message, "aviso");
            } finally {
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
            }
        }

        // 4. Deletar (ou Desativar permanentemente)
        window.excluirAcesso = async function(id) {
            if (confirm("Tem certeza que deseja DELETAR permanentemente este acesso? (O usuário não poderá mais logar)")) {
                try {
                    const { error } = await window.supabaseClient
                        .from('barbeiro')
                        .delete()
                        .eq('id', id);
                        
                    if (error) throw error;
                    mostrarToast("Acesso removido do sistema!", "aviso");
                    carregarAcessos(); 
                } catch (err) {
                    mostrarToast("Erro ao excluir: " + err.message, "aviso");
                }
            }
        }

        // 5. Garantir que a tabela carregue sozinha quando você entrar no Gestão
        document.addEventListener('DOMContentLoaded', () => {
            carregarAcessos();
        });

        // ==========================================
        // MÓDULO DE GESTÃO DE ASSINATURAS (PLANOS)
        // ==========================================
        // 1. Carregar Planos do Banco de Dados
        window.carregarAssinaturasAdmin = async function() {
            const lista = document.getElementById('lista-assinaturas-admin');
            if (!lista) return;

            // --- TRAVA DE SEGURANÇA: VERIFICA PERMISSÃO ---
            const nivelAcesso = localStorage.getItem('barbeiroLogadoNivel') || 'OPERADOR';
            const ehAdmin = nivelAcesso.toUpperCase() === 'ADMINISTRADOR';

            // Oculta o botão de "+ Novo Plano" no cabeçalho se não for Administrador
            const btnNovoPlano = document.querySelector('#aba-assinaturas .aba-header button');
            if (btnNovoPlano) {
                btnNovoPlano.style.display = ehAdmin ? 'block' : 'none';
            }
            // ----------------------------------------------

            lista.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;"><i class="fa-solid fa-spinner fa-spin"></i> Buscando planos...</p>';

            try {
                const { data, error } = await window.supabaseClient
                    .from('assinaturas')
                    .select('*')
                    .order('preco', { ascending: true });

                if (error) throw error;

                if (data.length === 0) {
                    lista.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">Nenhum plano de assinatura cadastrado.</p>';
                    return;
                }

                lista.innerHTML = '';

                data.forEach(plano => {
                    const precoFmt = Number(plano.preco).toFixed(2).replace('.', ',');
                    const ehDestaque = plano.destaque;
                    const borda = ehDestaque ? 'border: 2px solid var(--gold);' : 'border: 1px solid #333;';
                    const badge = ehDestaque ? '<span style="background: var(--gold); color: #000; font-size: 0.7rem; font-weight: bold; padding: 2px 8px; border-radius: 4px;">DESTAQUE</span>' : '';
                    
                    const beneficiosString = plano.beneficios ? plano.beneficios.join('\n') : '';
                    const beneficiosEncoded = encodeURIComponent(beneficiosString);

                    // GERA OS BOTÕES APENAS SE FOR ADMINISTRADOR
                    let divBotoes = '';
                    if (ehAdmin) {
                        divBotoes = `
                            <div style="display: flex; gap: 10px; border-top: 1px solid #222; padding-top: 15px;">
                                <button class="btn-editar-ac" style="flex: 1; justify-content: center;" onclick="abrirModalAssinatura('${plano.id}', '${plano.nome}', '${plano.preco}', '${plano.destaque}', '${beneficiosEncoded}')">
                                    <i class="fa-solid fa-pen"></i> Editar
                                </button>
                                <button class="btn-excluir-ac" style="flex: 1; justify-content: center;" onclick="excluirAssinatura('${plano.id}')">
                                    <i class="fa-solid fa-trash"></i> Excluir
                                </button>
                            </div>
                        `;
                    }

                    const card = `
                        <div style="background-color: #111; ${borda} border-radius: 10px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                                    <h3 style="margin: 0; color: ${ehDestaque ? '#fff' : 'var(--gold)'}; font-family: 'Playfair Display', serif; font-size: 1.5rem;">${plano.nome}</h3>
                                    ${badge}
                                </div>
                                <p style="font-size: 1.8rem; font-weight: bold; color: #fff; margin: 0 0 15px 0;">
                                    R$ ${precoFmt} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal;">/mês</span>
                                </p>
                                <ul style="color: var(--text-muted); font-size: 0.85rem; padding-left: 20px; margin-bottom: 20px; line-height: 1.6;">
                                    ${plano.beneficios.map(b => `<li>${b}</li>`).join('')}
                                </ul>
                            </div>
                            
                            ${divBotoes}
                        </div>
                    `;
                    lista.innerHTML += card;
                });

            } catch (err) {
                console.error("Erro ao carregar assinaturas:", err);
                lista.innerHTML = '<p style="text-align: center; color: #ff4d4d; grid-column: 1/-1;">Erro ao carregar os planos.</p>';
            }
        }
        // 2. Funções do Modal
        window.abrirModalAssinatura = function(id = '', nome = '', preco = '', destaque = 'false', beneficiosEncoded = '') {
            document.getElementById('titulo-modal-assinatura').innerText = id ? "Editar Plano" : "Novo Plano";
            document.getElementById('ass-id').value = id;
            document.getElementById('ass-nome').value = nome;
            document.getElementById('ass-preco').value = preco;
            document.getElementById('ass-destaque').value = destaque === 'true' || destaque === true ? 'true' : 'false';
            
            // Decodifica os benefícios que vieram do botão
            document.getElementById('ass-beneficios').value = beneficiosEncoded ? decodeURIComponent(beneficiosEncoded) : '';
            
            document.getElementById('modal-assinatura').style.display = 'flex';
        }

        window.fecharModalAssinatura = function() {
            document.getElementById('modal-assinatura').style.display = 'none';
        }

        // 3. Salvar (Insert ou Update)
        window.salvarAssinatura = async function() {
            const id = document.getElementById('ass-id').value;
            const nome = document.getElementById('ass-nome').value.trim();
            const preco = document.getElementById('ass-preco').value;
            const destaque = document.getElementById('ass-destaque').value === 'true';
            const beneficiosTxt = document.getElementById('ass-beneficios').value;

            if (!nome || !preco) {
                mostrarToast("Nome e Preço são obrigatórios!", "aviso");
                return;
            }

            // Pega o texto da textarea, divide por quebra de linha (Enter), tira espaços em branco e remove linhas vazias
            const arrayBeneficios = beneficiosTxt.split('\n')
                                                .map(item => item.trim())
                                                .filter(item => item !== '');

            if (arrayBeneficios.length === 0) {
                mostrarToast("Adicione pelo menos um benefício!", "aviso");
                return;
            }

            const btn = document.getElementById('btn-salvar-assinatura');
            const textoOriginal = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
            btn.disabled = true;

            try {
                const payload = { 
                    nome: nome, 
                    preco: parseFloat(preco), 
                    destaque: destaque, 
                    beneficios: arrayBeneficios // Mandando como Array, como o script.js espera
                };

                let error;
                
                if (id) {
                    // Edição
                    const res = await window.supabaseClient.from('assinaturas').update(payload).eq('id', id);
                    error = res.error;
                } else {
                    // Criação
                    const res = await window.supabaseClient.from('assinaturas').insert([payload]);
                    error = res.error;
                }

                if (error) throw error;

                fecharModalAssinatura();
                mostrarToast(id ? "Plano atualizado com sucesso!" : "Plano criado com sucesso!");
                carregarAssinaturasAdmin(); // Atualiza a tela

            } catch (err) {
                console.error("Erro ao salvar plano:", err);
                mostrarToast("Erro ao salvar: " + err.message, "aviso");
            } finally {
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
            }
        }

        // 4. Deletar Plano
        window.excluirAssinatura = async function(id) {
            if (confirm("ATENÇÃO: Tem certeza que deseja DELETAR este plano do catálogo? Isso não afeta os clientes que já o assinaram.")) {
                try {
                    const { error } = await window.supabaseClient.from('assinaturas').delete().eq('id', id);
                        
                    if (error) throw error;
                    mostrarToast("Plano removido com sucesso!", "aviso");
                    carregarAssinaturasAdmin(); 
                } catch (err) {
                    mostrarToast("Erro ao excluir: " + err.message, "aviso");
                }
            }
        }

        // 5. Garantir carregamento ao abrir a página
        document.addEventListener('DOMContentLoaded', () => {
            carregarAssinaturasAdmin();
        });

        // ==========================================
        // ESPIÃO DE ALTERAÇÕES NA DURAÇÃO E INTERVALO
        // ==========================================
        document.addEventListener('DOMContentLoaded', () => {
            const inputDuracao = document.getElementById('conf-duracao');
            const inputIntervalo = document.getElementById('conf-intervalo');

            // Sempre que o Administrador alterar o número, refaz a grade ao vivo
            if (inputDuracao) inputDuracao.addEventListener('input', gerarGradeHorarios);
            if (inputIntervalo) inputIntervalo.addEventListener('input', gerarGradeHorarios);
        });

        // ==========================================
        // MODAL DE CONFIRMAÇÃO ESTILIZADO
        // ==========================================
        window.confirmarAcao = function(titulo, texto, corHex, iconeClass) {
            return new Promise((resolve) => {
                const modal = document.getElementById('modal-confirmacao');
                document.getElementById('titulo-confirmacao').innerText = titulo;
                document.getElementById('texto-confirmacao').innerText = texto;
                
                const iconeDiv = document.getElementById('icone-confirmacao');
                iconeDiv.style.color = corHex;
                iconeDiv.innerHTML = `<i class="fa-solid ${iconeClass}"></i>`;
                
                // Muda a cor do botão para combinar (Verde para liberar, Vermelho para bloquear)
                const btnOk = document.getElementById('btn-ok-confirmacao');
                btnOk.style.backgroundColor = corHex;
                btnOk.style.color = corHex === '#25D366' ? '#000' : '#fff'; 
                
                modal.style.display = 'flex';
                
                btnOk.onclick = function() {
                    modal.style.display = 'none';
                    resolve(true); // O usuário clicou em Confirmar
                };
                
                document.getElementById('btn-cancelar-confirmacao').onclick = function() {
                    modal.style.display = 'none';
                    resolve(false); // O usuário clicou em Cancelar
                };
            });
        }