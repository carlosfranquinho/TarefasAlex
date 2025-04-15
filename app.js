let tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];
let tarefaAtualId = null;
let paginaAtual = 1;
let semanaAtual = new Date();
let mesAtual = new Date();
let graficoSemanal, graficoMensal;
let modoAtual = "semana";
const tarefasPorPagina = 48;


function salvar() {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
}


function abrirFormulario(id = null) {
  const modal = document.getElementById("modal");
  const tituloInput = document.getElementById("form-titulo");
  const descricaoInput = document.getElementById("form-descricao");
  const tempoInput = document.getElementById("form-tempo");
  const temposDiv = document.getElementById("form-tempos-anteriores");
  const tituloModal = document.getElementById("modal-titulo");

  if (id) {
    const tarefa = tarefas.find((t) => t.id === id);
    if (!tarefa) return;
    tarefaAtualId = id;
    tituloModal.textContent = "Editar Tarefa";
    tituloInput.value = tarefa.titulo;
    descricaoInput.value = tarefa.descricao;
    tempoInput.value = "";

    const temposPorData = agruparTemposPorData(tarefa.tempos || []);
    let html = `<small><strong>🗓️ Tarefa iniciada em ${formatarData(
      tarefa.dataCriacao
    )}</strong><br><br>`;
    for (const data in temposPorData) {
      html += `- ${formatarTempoTexto(temposPorData[data])} em ${formatarData(
        data
      )}<br>`;
    }
    html += `<br><strong>Tempo total:</strong> ${formatarTempoTotal(
      tarefa.tempos
    )} </small>`;
    if (tarefa.concluida && tarefa.dataConclusao) {
      html += `<br><br><strong>✅ Tarefa concluída em ${formatarData(
        tarefa.dataConclusao
      )}</strong>`;
    }

    temposDiv.innerHTML = html;
    document.getElementById("campo-concluido").classList.remove("escondido");
    document.getElementById("checkbox-concluido").checked = tarefa.concluida;
  } else {
    tarefaAtualId = null;
    tituloModal.textContent = "Nova Tarefa";
    tituloInput.value = "";
    descricaoInput.value = "";
    tempoInput.value = "";
    temposDiv.innerHTML = "";
    document.getElementById("campo-concluido").classList.add("escondido");
  }

  modal.style.display = "flex";
}


function fecharModal() {
  document.getElementById("modal").style.display = "none";
  tarefaAtualId = null;
}


function guardarTarefa() {
  const titulo = document.getElementById("form-titulo").value.trim();
  const descricao = document.getElementById("form-descricao").value.trim();
  const tempoDiario =
    parseInt(document.getElementById("form-tempo").value) || 0;
  const concluida = document.getElementById("checkbox-concluido").checked;
  const agora = new Date().toISOString();

  if (!titulo) return;

  if (tarefaAtualId !== null) {
    const index = tarefas.findIndex((t) => t.id === tarefaAtualId);
    if (index !== -1) {
      const tarefa = tarefas[index];
      tarefa.titulo = titulo;
      tarefa.descricao = descricao;
      tarefa.dataAtualizacao = agora;
      tarefa.concluida = concluida;
      if (concluida && !tarefa.dataConclusao) {
        tarefa.dataConclusao = agora;
      }
      if (tempoDiario > 0) {
        tarefa.tempos.push({ minutos: tempoDiario, data: agora });
      }
    }
  } else {
    const novaTarefa = {
      id: crypto.randomUUID(),
      titulo,
      descricao,
      concluida: false,
      dataCriacao: agora,
      dataConclusao: null,
      dataAtualizacao: agora,
      tempos: tempoDiario > 0 ? [{ minutos: tempoDiario, data: agora }] : [],
    };
    tarefas.push(novaTarefa);
  }

  salvar();
  fecharModal();
  renderTarefas();
}


function renderTarefas() {
  const container = document.getElementById("lista-tarefas");
  const pesquisa = document.getElementById("pesquisa").value.toLowerCase();
  container.innerHTML = "";

  const tarefasFiltradas = tarefas
    .filter(
      (t) =>
        t.titulo.toLowerCase().includes(pesquisa) ||
        t.descricao.toLowerCase().includes(pesquisa)
    )
    .sort((a, b) => {
      if (a.concluida !== b.concluida) return a.concluida ? 1 : -1;
      return new Date(b.dataAtualizacao) - new Date(a.dataAtualizacao);
    });

  const totalPaginas = Math.ceil(tarefasFiltradas.length / tarefasPorPagina);
  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas || 1;

  const inicio = (paginaAtual - 1) * tarefasPorPagina;
  const fim = inicio + tarefasPorPagina;
  const tarefasPagina = tarefasFiltradas.slice(inicio, fim);

  tarefasPagina.forEach((t) => {
    const div = document.createElement("div");
    div.className = "tarefa";
    div.setAttribute("data-id", t.id);

    if (t.concluida) div.classList.add("concluida");

    const tempoTotal = Array.isArray(t.tempos)
      ? t.tempos.reduce((a, b) => a + b.minutos, 0)
      : 0;

    div.innerHTML = `
      <h3>${t.titulo}</h3>
      <p>${t.descricao || ""}</p>
      <p><strong>Tempo total:</strong> ${formatarTempoTotal(t.tempos)}</p>
      <div class="botoes">
        <button onclick="abrirFormulario('${t.id}')">📄 Abrir</button>
      </div>
    `;
    container.appendChild(div);
  });
  criarControloPaginacao();
}


function agruparTemposPorData(tempos) {
  const mapa = {};
  tempos.forEach(({ minutos, data }) => {
    const chave = data.slice(0, 10);
    if (!mapa[chave]) mapa[chave] = 0;
    mapa[chave] += minutos;
  });
  return mapa;
}


function formatarData(dataIso) {
  const [ano, mes, dia] = dataIso.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}


function formatarTempoTotal(tempos = []) {
  const totalMin = tempos.reduce((acc, t) => acc + t.minutos, 0);
  const dias = Math.floor(totalMin / 420);
  const restoMin = totalMin % 420;
  const horas = Math.floor(restoMin / 60);
  const minutos = restoMin % 60;

  const partes = [];
  if (dias > 0) partes.push(`${dias} dia${dias > 1 ? "s" : ""}`);
  if (horas > 0) partes.push(`${horas} hora${horas > 1 ? "s" : ""}`);
  if (minutos > 0 || partes.length === 0)
    partes.push(`${minutos} minuto${minutos > 1 ? "s" : ""}`);

  return partes.join(", ");
}


function formatarTempoTexto(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  const partes = [];
  if (h > 0) partes.push(`${h} hora${h > 1 ? "s" : ""}`);
  if (m > 0) partes.push(`${m} minuto${m > 1 ? "s" : ""}`);
  return partes.join(", ");
}


function abrirAnalise() {
  document.getElementById("modal-analise").style.display = "flex";
  atualizarGraficos();
}


function fecharAnalise() {
  document.getElementById("modal-analise").style.display = "none";
}


function anteriorSemana() {
  semanaAtual.setDate(semanaAtual.getDate() - 7);
  atualizarGraficos();
}


function proximaSemana() {
  semanaAtual.setDate(semanaAtual.getDate() + 7);
  atualizarGraficos();
}


function anteriorMes() {
  mesAtual.setMonth(mesAtual.getMonth() - 1);
  atualizarGraficos();
}


function proximoMes() {
  mesAtual.setMonth(mesAtual.getMonth() + 1);
  atualizarGraficos();
}


function atualizarGraficos() {
  const semanaNum = getNumeroSemana(semanaAtual);
  const ano = semanaAtual.getFullYear();
  const mesNome = mesAtual.toLocaleString("pt-PT", { month: "long" });
  const anoMes = mesAtual.getFullYear();

  document.getElementById("periodo-label").textContent =
    modoAtual === "semana"
      ? `Semana ${semanaNum} de ${ano}`
      : `${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)} ${anoMes}`;

  const dadosSemanais = calcularDadosPorSemana(semanaNum, ano);
  const dadosMensais = calcularDadosPorMes(mesAtual.getMonth(), anoMes);

  document.getElementById("btnSemanaAnterior").disabled = false;
  document.getElementById("btnSemanaSeguinte").disabled = false;
  document.getElementById("btnMesAnterior").disabled = false;
  document.getElementById("btnMesSeguinte").disabled = false;

  if (modoAtual === "semana") {
    renderizarGrafico(
      "grafico-semanal",
      dadosSemanais,
      "Tempo por tarefa (semana)",
      true,
      (g) => (graficoSemanal = g)
    );
  } else {
    renderizarGrafico(
      "grafico-mensal",
      dadosMensais,
      "Tempo por tarefa (mês)",
      true,
      (g) => (graficoMensal = g)
    );
  }
}


function renderizarGrafico(id, dados, titulo, adaptativo, setRefCallback) {
  const ctx = document.getElementById(id).getContext("2d");

  const existing = Chart.getChart(ctx.canvas);
  if (existing) existing.destroy();

  const data = {
    labels: Object.keys(dados),
    datasets: [
      {
        label: titulo,
        data: Object.values(dados),
        backgroundColor: "#59a7f9",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (ctx) {
            const minutos = ctx.raw;
            const h = Math.floor(minutos / 60);
            const m = minutos % 60;
            if (h === 0) return `${m} min`;
            return `${h}h ${m}min`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (val) {
            const h = Math.floor(val / 60);
            const m = val % 60;
            if (h === 0) return `${m} min`;
            return `${h}h ${m}min`;
          },
        },
      },
    },
  };

  const chart = new Chart(ctx, {
    type: "bar",
    data,
    options,
  });

  setRefCallback(chart);
}


function getNumeroSemana(data) {
  const d = new Date(
    Date.UTC(data.getFullYear(), data.getMonth(), data.getDate())
  );
  const diaSemana = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - diaSemana);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - inicioAno) / 86400000 + 1) / 7);
}


function calcularDadosPorSemana(semana, ano) {
  const resultado = {};
  tarefas.forEach((t) => {
    (t.tempos || []).forEach(({ minutos, data }) => {
      const d = new Date(data);
      const anoData = d.getFullYear();
      const semanaData = getNumeroSemana(d);
      if (anoData === ano && semanaData === semana) {
        resultado[t.titulo] = (resultado[t.titulo] || 0) + minutos;
      }
    });
  });
  return resultado;
}


function calcularDadosPorMes(mes, ano) {
  const resultado = {};
  tarefas.forEach((t) => {
    (t.tempos || []).forEach(({ minutos, data }) => {
      const d = new Date(data);
      if (d.getMonth() === mes && d.getFullYear() === ano) {
        resultado[t.titulo] = (resultado[t.titulo] || 0) + minutos;
      }
    });
  });
  return resultado;
}


function mostrarModo(modo) {
  modoAtual = modo;

  document
    .getElementById("botao-semana")
    .classList.toggle("ativo", modo === "semana");
  document
    .getElementById("botao-mes")
    .classList.toggle("ativo", modo === "mes");

  document.getElementById("secao-semanal").style.display =
    modo === "semana" ? "block" : "none";
  document.getElementById("secao-mensal").style.display =
    modo === "mes" ? "block" : "none";

  atualizarGraficos();
}


function voltarParaAtual() {
  semanaAtual = new Date();
  mesAtual = new Date();
  atualizarGraficos();
}


function anteriorPeriodo() {
  if (modoAtual === "semana") anteriorSemana();
  else anteriorMes();
}


function proximoPeriodo() {
  if (modoAtual === "semana") proximaSemana();
  else proximoMes();
}


function exportarTarefas() {
  const dados = JSON.stringify(tarefas, null, 2);
  const blob = new Blob([dados], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "tarefas-alexandrina.json";
  a.click();
  URL.revokeObjectURL(url);
}


function importarTarefas() {
  const ficheiro = document.getElementById("ficheiro-importar").files[0];
  if (!ficheiro) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const dados = JSON.parse(e.target.result);
      if (!Array.isArray(dados)) throw new Error("Formato inválido");

      dados.forEach((tarefa) => {
        if (!tarefa.id) tarefa.id = crypto.randomUUID();
        if (!tarefa.tempos) tarefa.tempos = [];
        if (!tarefa.dataAtualizacao)
          tarefa.dataAtualizacao = new Date().toISOString();
      });

      tarefas = dados;
      salvar();
      renderTarefas();
      alert("Tarefas importadas com sucesso!");
    } catch (err) {
      alert("Erro ao importar: " + err.message);
    }
  };

  reader.readAsText(ficheiro);
}


function mudarPagina(direcao) {
  paginaAtual += direcao;
  renderTarefas();
}


function criarControloPaginacao() {
  const container = document.getElementById("paginacao");
  container.innerHTML = `
      <button onclick="mudarPagina(-1)" ${
        paginaAtual === 1 ? "disabled" : ""
      }>◀ Anterior</button>
      <span>Página ${paginaAtual}</span>
      <button onclick="mudarPagina(1)" ${
        paginaAtual * tarefasPorPagina >= tarefas.length ? "disabled" : ""
      }>Próxima ▶</button>
    `;
}


function apagarTarefa() {
  if (!tarefaAtualId) return;
  if (!confirm("Tens a certeza que queres apagar esta tarefa, Alex?")) return;

  const divTarefa = document.querySelector(
    `.tarefa[data-id="${tarefaAtualId}"]`
  );

  if (divTarefa) {
    divTarefa.classList.add("fade-out");

    setTimeout(() => {
      tarefas = tarefas.filter((t) => t.id !== tarefaAtualId);
      salvar();
      fecharModal();
      renderTarefas();
    }, 500);
  } else {
    tarefas = tarefas.filter((t) => t.id !== tarefaAtualId);
    salvar();
    fecharModal();
    renderTarefas();
  }
}

renderTarefas();