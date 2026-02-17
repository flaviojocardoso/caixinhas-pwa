// ---------- REFERÊNCIAS DOM ----------
const el = {
  home: document.getElementById("home"),
  config: document.getElementById("config"),
  entrada: document.getElementById("entrada"),
  avisoSobra: document.getElementById("avisoSobra"),
  caixas: document.getElementById("caixas"),
  listaConfigCaixas: document.getElementById("listaConfigCaixas"),
  listaHistorico: document.getElementById("listaHistoricoHome"),
  freedomBar: document.getElementById("freedom-bar"),
  freedomText: document.getElementById("freedom-text"),
  freedomAcumulado: document.getElementById("freedom-acumulado"),
  freedomMeta: document.getElementById("freedom-meta")
};

// ---------- DADOS PADRÃO ----------
const contasPadrao = [
  { nome: "Empréstimo 💸 (4/10)", meta: 150, vencimento: 2, modo: "auto" },
  { nome: "Água 💧", meta: 200, vencimento: 6, modo: "auto" },
  { nome: "Faculdade 🎓", meta: 900, vencimento: 8, modo: "auto" },
  { nome: "Seguro Moto 🛡️", meta: 185, vencimento: 9, modo: "auto" },
  { nome: "Luz Barbearia 💈", meta: 130, vencimento: 9, modo: "auto" },
  { nome: "Escola 🏫", meta: 1000, vencimento: 15, modo: "auto" },
  { nome: "Moto 🏍️", meta: 1100, vencimento: 15, modo: "auto" },
  { nome: "Internet Casa 🌐", meta: 100, vencimento: 20, modo: "auto" },
  { nome: "Internet Barbearia 📶", meta: 45, vencimento: 20, modo: "auto" },
  { nome: "Casa 🏠", meta: 900, vencimento: 20, modo: "auto" },
  { nome: "Aluguel Barbearia 💈", meta: 325, vencimento: 25, modo: "auto" },
  { nome: "Luz Casa 💡", meta: 250, vencimento: 26, modo: "auto" }
];

// ---------- ESTADO INICIAL ----------
let config = JSON.parse(localStorage.getItem("config")) || { tema: "dark" }; 
let caixas = JSON.parse(localStorage.getItem("caixas")) || [];
let historico = JSON.parse(localStorage.getItem("historico")) || [];

// ---------- SALVAR ----------
function salvarTudo() {
  localStorage.setItem("config", JSON.stringify(config));
  localStorage.setItem("caixas", JSON.stringify(caixas));
  localStorage.setItem("historico", JSON.stringify(historico));
}

// ---------- TEMA ----------
function aplicarTema() {
  if (config.tema === "light") {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }
}
function toggleTema() {
  config.tema = config.tema === "light" ? "dark" : "light";
  aplicarTema();
  salvarTudo();
}

// ---------- NAVEGAÇÃO ----------
function mostrar(tela) {
  el.home.hidden = tela !== "home";
  el.config.hidden = tela !== "config";
  if(tela === 'home') renderHome();
}

// ---------- UTILITÁRIOS ----------
function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
function formatarMoeda(val) {
  // Proteção contra NaN na exibição
  if (isNaN(val)) val = 0;
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function estaPaga(c) {
  if (!c.pagoParaData) return false;
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const d = new Date(c.pagoParaData);
  const alvo = obterDataAlvo(c, true); 
  return d.getMonth() === alvo.getMonth() && d.getFullYear() === alvo.getFullYear();
}
function obterDataAlvo(c, ignorarPagamento = false) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  let alvo = new Date(hoje.getFullYear(), hoje.getMonth(), c.vencimento);
  if (alvo < hoje) {
      const estaCheia = c.acumulado >= c.meta;
      const pagou = !ignorarPagamento && c.pagoParaData && (() => {
          const d = new Date(c.pagoParaData);
          return d.getMonth() === alvo.getMonth() && d.getFullYear() === alvo.getFullYear();
      })();
      if (estaCheia || pagou) alvo.setMonth(alvo.getMonth() + 1);
  } else {
      if (!ignorarPagamento && c.pagoParaData) {
          const d = new Date(c.pagoParaData);
          if (d.getMonth() === alvo.getMonth() && d.getFullYear() === alvo.getFullYear()) {
             alvo.setMonth(alvo.getMonth() + 1);
          }
      }
  }
  return alvo;
}
function diasRestantes(c) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const alvo = obterDataAlvo(c);
  const diffTime = alvo - hoje;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ---------- MOTOR DE DISTRIBUIÇÃO (SEM CENTAVOS) ----------
function distribuir() {
  const entrada = Number(el.entrada.value);
  if (!entrada || entrada <= 0) return alert("Digite um valor de entrada.");
  
  el.avisoSobra.hidden = true;
  el.avisoSobra.innerText = "";
  caixas.forEach(c => c.ultimoDeposito = 0);

  const reg = { id: Date.now(), data: Date.now(), entrada: entrada, distribuicao: [] };

  let totalNecessario = 0;
  caixas.forEach(c => { totalNecessario += Math.max(0, c.meta - c.acumulado); });

  // 1. MODO ABUNDÂNCIA (Paga tudo se der)
  if (entrada >= totalNecessario) {
      caixas.forEach(c => {
          const falta = Math.max(0, c.meta - c.acumulado);
          if (falta > 0) {
              c.acumulado = c.meta;
              c.ultimoDeposito = falta;
              reg.distribuicao.push({ caixa: c.nome, valor: falta });
          }
      });
      const sobraLivre = round2(entrada - totalNecessario);
      if (sobraLivre > 0) {
          el.avisoSobra.innerHTML = `✨ Tudo pago! Sobrou <strong>${formatarMoeda(sobraLivre)}</strong> livre.`;
          el.avisoSobra.hidden = false;
      }
  } 
  // 2. MODO ESCASSEZ (Inteligente)
  else {
      let dinheiroDisponivel = entrada;
      let safety = 0;

      // Loop de distribuição
      while (dinheiroDisponivel > 0.01 && safety < 15) {
          safety++;
          
          // Quem ainda precisa?
          let caixasPendentes = caixas.filter(c => c.acumulado < c.meta);
          if (caixasPendentes.length === 0) break;

          // Calcula Pesos
          let pesos = caixasPendentes.map(c => {
             if (c.modo === "manual") return c.percentual > 0 ? c.percentual : 0;
             const falta = c.meta - c.acumulado;
             const dias = diasRestantes(c);
             if (dias <= 0) return falta * 10000; // Vencida suga tudo
             
             let diasParaCalculo = Math.max(0.5, dias - 1);
             let peso = falta / diasParaCalculo;
             if (dias <= 3) peso = peso * 3; // Urgência
             return peso;
          });

          let totalPesos = pesos.reduce((a, b) => a + b, 0);
          if (totalPesos === 0) break;

          let dinheiroDessaRodada = dinheiroDisponivel;
          dinheiroDisponivel = 0; // Zera para redistribuir sobras

          caixasPendentes.forEach((c, i) => {
              if (pesos[i] <= 0) return;
              
              let valor = (pesos[i] / totalPesos) * dinheiroDessaRodada;
              const falta = round2(c.meta - c.acumulado);

              // --- REGRA DE OURO: MÍNIMO R$ 1,00 ---
              // Se for receber mixaria (ex: 0.80) E não for para quitar (falta 0.80)
              // Então NÃO deposita e devolve pro monte.
              if (valor < 1.00 && valor < falta) {
                  dinheiroDisponivel += valor; 
                  return; 
              }

              valor = round2(valor);
              
              // Deposita
              if (valor > falta) {
                  let troco = valor - falta;
                  c.acumulado = c.meta;
                  c.ultimoDeposito += falta;
                  let hist = reg.distribuicao.find(x => x.caixa === c.nome);
                  if (hist) hist.valor += falta; else reg.distribuicao.push({ caixa: c.nome, valor: falta });
                  dinheiroDisponivel += troco; 
              } else {
                  c.acumulado = round2(c.acumulado + valor);
                  c.ultimoDeposito += valor;
                  let hist = reg.distribuicao.find(x => x.caixa === c.nome);
                  if (hist) hist.valor += valor; else reg.distribuicao.push({ caixa: c.nome, valor: valor });
              }
          });
      }
      
      // FALLBACK FINAL: Se sobrou dinheiro (porque todo mundo ia receber < 1 real)
      // Joga tudo na conta MAIS URGENTE para não sobrar dinheiro na mesa.
      if (dinheiroDisponivel > 0.01) {
          let pendentes = caixas.filter(c => c.acumulado < c.meta);
          if(pendentes.length > 0) {
             // Ordena por urgência (menor dias restantes)
             pendentes.sort((a, b) => diasRestantes(a) - diasRestantes(b));
             const urgente = pendentes[0];
             
             // Deposita tudo nela
             urgente.acumulado = round2(urgente.acumulado + dinheiroDisponivel);
             urgente.ultimoDeposito += dinheiroDisponivel;
             let hist = reg.distribuicao.find(x => x.caixa === urgente.nome);
             if (hist) hist.valor += dinheiroDisponivel; else reg.distribuicao.push({ caixa: urgente.nome, valor: dinheiroDisponivel });
          }
      }
  }

  historico.push(reg);
  salvarTudo();
  renderHome(); 
  el.entrada.value = "";
}

function desfazerUltima() {
  if (!historico.length) return alert("Nada para desfazer.");
  const ult = historico.pop();
  ult.distribuicao.forEach(d => {
    const cx = caixas.find(c => c.nome === d.caixa);
    if (cx) {
      cx.acumulado = round2(cx.acumulado - d.valor);
      if(cx.acumulado < 0) cx.acumulado = 0;
      cx.ultimoDeposito = 0; 
    }
  });
  el.avisoSobra.hidden = true;
  salvarTudo();
  renderHome();
  alert(`Desfeita entrada de ${formatarMoeda(ult.entrada)}`);
}

function togglePagamentoPeloNome(nomeCaixa) {
  const c = caixas.find(x => x.nome === nomeCaixa);
  if (!c) return;
  const jaPago = estaPaga(c);
  if (jaPago) {
      if(confirm(`Desfazer pagamento de "${c.nome}"?`)) { c.pagoParaData = null; salvarTudo(); renderHome(); }
      return;
  }
  const alvo = obterDataAlvo(c);
  if(confirm(`Marcar "${c.nome}" como paga?`)) { c.acumulado = 0; c.ultimoDeposito = 0; c.pagoParaData = alvo.toISOString(); salvarTudo(); renderHome(); }
}

function renderHome() {
  el.caixas.innerHTML = "";
  caixas = caixas.filter(c => c.meta !== Infinity);

  // BARRA DE LIBERDADE
  const totalMeta = caixas.reduce((acc, c) => acc + c.meta, 0);
  const totalAcumulado = caixas.reduce((acc, c) => acc + c.acumulado, 0);
  const freedomPercent = totalMeta > 0 ? Math.min(100, (totalAcumulado / totalMeta) * 100) : 0;
  el.freedomBar.style.width = `${freedomPercent}%`;
  el.freedomText.innerText = `${freedomPercent.toFixed(0)}%`;
  el.freedomAcumulado.innerText = formatarMoeda(totalAcumulado);
  el.freedomMeta.innerText = `Meta: ${formatarMoeda(totalMeta)}`;

  const listaOrdenada = [...caixas].sort((a, b) => {
      const pagoA = estaPaga(a); const pagoB = estaPaga(b);
      if (pagoA && !pagoB) return 1; if (!pagoA && pagoB) return -1;
      return diasRestantes(a) - diasRestantes(b);
  });

  listaOrdenada.forEach((c) => {
    const metaNum = c.meta;
    const progresso = metaNum > 0 ? Math.min(100, (c.acumulado / metaNum) * 100) : 0;
    let dias = diasRestantes(c);
    const alvo = obterDataAlvo(c);
    const dataFormatada = alvo.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
    let cor = "#4caf50"; if (progresso < 90) cor = "#03a9f4"; if (progresso < 50) cor = "#ff9800";
    let textoMeta = formatarMoeda(c.meta);
    let textoInfo = "";
    let botaoTexto = "✅ Paguei"; let estiloBotao = ""; 
    let classeUrgente = ""; let avisoUrgencia = ""; let estiloCard = "";
    
    // PREVISÃO
    let previsaoHTML = "";
    const matchParcela = c.nome.match(/\((\d+)\/(\d+)\)/);
    if (matchParcela) {
        const atual = parseInt(matchParcela[1]); const total = parseInt(matchParcela[2]);
        const faltamMeses = total - atual;
        if (faltamMeses > 0) previsaoHTML = `<span class="previsao-termino">⌛ Faltam ${faltamMeses} meses</span>`;
        else if (faltamMeses === 0) previsaoHTML = `<span class="previsao-termino" style="color:var(--success)">🎉 Última!</span>`;
    }

    if (estaPaga(c)) {
         textoInfo = ` • ${dataFormatada} (Próximo)`;
         cor = "#8a84ff"; botaoTexto = "✔ Pago";
         estiloBotao = "background:transparent; border:1px solid #555; color:#777;"; 
         estiloCard = "opacity: 0.75; filter: grayscale(0.4);"; 
    } else {
         if (dias < 0) {
             textoInfo = ` • ${dataFormatada} (VENCIDA)`;
             cor = "#b71c1c"; classeUrgente = "urgente";
             avisoUrgencia = `<span class="texto-urgente">🚨 VENCIDA!</span>`;
         } else if (dias === 0) {
             textoInfo = ` • ${dataFormatada} (HOJE)`;
             cor = "#d50000"; classeUrgente = "urgente";
             avisoUrgencia = `<span class="texto-urgente">⚠️ Vence HOJE!</span>`;
         } else {
             textoInfo = ` • ${dataFormatada} (${dias} dias)`;
             if (dias <= 3 && progresso < 100) {
                 cor = "#ff4444"; classeUrgente = "urgente";
                 avisoUrgencia = `<span class="texto-urgente">⚠️ Falta ${formatarMoeda(c.meta - c.acumulado)}</span>`;
             }
         }
    }
    
    const nomeSafe = c.nome.replace(/'/g, "\\'");
    el.caixas.innerHTML += `
      <div class="card ${classeUrgente}" style="${estiloCard}">
        <div style="display:flex; justify-content:space-between; align-items:center">
            <div><strong>${c.nome}</strong><small>${textoInfo}</small>${previsaoHTML}${avisoUrgencia}</div>
            <button class="btn-check" style="${estiloBotao}" onclick="togglePagamentoPeloNome('${nomeSafe}')">${botaoTexto}</button>
        </div>
        <div class="barra"><div class="barra-interna" style="width:${progresso}%; background:${cor}"></div></div>
        <div style="display:flex; justify-content:space-between; align-items:flex-end">
            <div><p class="total">${formatarMoeda(c.acumulado)}</p><small>${textoMeta}</small></div>
             ${c.ultimoDeposito > 0 ? `<div class="guardar">Entrou: +${formatarMoeda(c.ultimoDeposito)}</div>` : ``}
        </div>
      </div>
    `;
  });
  renderHistoricoHome();
}

function renderConfigCaixas() {
  el.listaConfigCaixas.innerHTML = "";
  caixas.forEach((c, i) => {
    el.listaConfigCaixas.innerHTML += `
      <div class="card config-item">
        <label>Nome</label><input value="${c.nome}" onchange="atualizarCaixa(${i}, 'nome', this.value)">
        <label>Meta</label><input type="number" value="${c.meta}" onchange="atualizarCaixa(${i}, 'meta', this.value)">
        <label style="color:var(--success)">Saldo Atual</label><input type="number" value="${c.acumulado}" onchange="atualizarCaixa(${i}, 'acumulado', this.value)">
        <label>Vencimento</label><input type="number" value="${c.vencimento || 1}" onchange="atualizarCaixa(${i}, 'vencimento', this.value)">
        <div class="config-actions">
           <button class="btn-danger" onclick="removerCaixa(${i})">🗑️</button>
           <button class="btn-zerar" onclick="zerarSaldoCaixa(${i})">↺ Zerar</button>
        </div>
      </div>
    `;
  });
}
function atualizarCaixa(i, campo, valor) {
  if (campo !== 'nome') valor = Number(valor);
  caixas[i][campo] = valor; salvarTudo();
  if (campo === 'acumulado' || campo === 'nome') renderHome();
}
function zerarSaldoCaixa(i) { if(confirm("Zerar saldo?")) { caixas[i].acumulado = 0; salvarTudo(); renderHome(); renderConfigCaixas(); } }
function novaCaixa() { caixas.push({ nome: "Nova", meta: 100, vencimento: 10, acumulado: 0, modo: "auto" }); salvarTudo(); renderConfigCaixas(); }
function removerCaixa(i) { if(confirm("Apagar?")) { caixas.splice(i, 1); salvarTudo(); renderConfigCaixas(); renderHome(); } }
function resetarTudo() { if (confirm("Resetar TUDO?")) { localStorage.clear(); location.reload(); } }

// ---------- INICIALIZAÇÃO E LIMPEZA DE DADOS (NaN FIX) ----------
(function init() {
  if (caixas.length === 0) caixas = [...contasPadrao];
  
  // LIMPEZA: Remove NaN e garante números
  caixas.forEach(c => {
      c.meta = Number(c.meta) || 0;
      c.acumulado = Number(c.acumulado) || 0;
      c.vencimento = Number(c.vencimento) || 1;
  });

  caixas = caixas.filter(c => c.meta !== Infinity);
  aplicarTema(); renderHome(); renderConfigCaixas();
})();

window.mostrar = mostrar; window.distribuir = distribuir; window.desfazerUltima = desfazerUltima;
window.novaCaixa = novaCaixa; window.removerCaixa = removerCaixa; window.zerarSaldoCaixa = zerarSaldoCaixa;
window.atualizarCaixa = atualizarCaixa; window.resetarTudo = resetarTudo; window.togglePagamentoPeloNome = togglePagamentoPeloNome; window.toggleTema = toggleTema;