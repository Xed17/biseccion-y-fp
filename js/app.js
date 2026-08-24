// app.js - Manejador de eventos y renderizado de la interfaz

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  renderFormulas();
  setupEventListeners();
});

// 1. Inicialización de pestañas
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabButtons.forEach((b) => b.classList.remove('active'));
      tabPanels.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

// 2. Renderizado de fórmulas con KaTeX
function renderFormulas() {
  if (typeof katex === 'undefined') {
    // Si KaTeX no carga, dejamos texto plano legible
    document.getElementById('formula-network').textContent = 'f(C) = 1/(C - 8.5) - 0.35 ln(C - 2) = 0';
    document.getElementById('formula-cloud').textContent = 'f(t) = 45 + 12t - 20 e^(0.4t) = 0';
    return;
  }

  try {
    katex.render(problems.networkCapacity.latexFormula, document.getElementById('formula-network'), {
      displayMode: true,
      throwOnError: false
    });

    katex.render(problems.cloudMigration.latexFormula, document.getElementById('formula-cloud'), {
      displayMode: true,
      throwOnError: false
    });

    katex.render(problems.cloudMigration.costFormulasLatex.c1, document.getElementById('formula-cloud-c1'), {
      displayMode: false,
      throwOnError: false
    });

    katex.render(problems.cloudMigration.costFormulasLatex.c2, document.getElementById('formula-cloud-c2'), {
      displayMode: false,
      throwOnError: false
    });
  } catch (err) {
    console.error('Error renderizando fórmulas con KaTeX:', err);
  }
}

// 3. Configuración de botones de ejecución
function setupEventListeners() {
  const btnNetwork = document.getElementById('btn-run-network');
  if (btnNetwork) {
    btnNetwork.addEventListener('click', () => {
      runMethod(problems.networkCapacity, 'network');
    });
  }

  const btnCloud = document.getElementById('btn-run-cloud');
  if (btnCloud) {
    btnCloud.addEventListener('click', () => {
      runMethod(problems.cloudMigration, 'cloud');
    });
  }
}

// 4. Lógica de ejecución general
function runMethod(problem, prefix) {
  const alertEl = document.getElementById(`alert-${prefix}`);
  const resultsContainer = document.getElementById(`results-container-${prefix}`);

  // Ocultar alertas previas
  alertEl.className = 'alert-message';
  alertEl.textContent = '';

  const a = problem.defaultA;
  const b = problem.defaultB;
  const tolerance = problem.defaultTolerance;
  const maxIterations = problem.defaultMaxIterations;

  // Validación de dominio del problema
  const domainError = problem.validateDomain(a, b);
  if (domainError) {
    alertEl.textContent = domainError;
    alertEl.classList.add('error');
    resultsContainer.classList.add('hidden');
    return;
  }

  // Evaluación inicial de f(a) y f(b)
  const fa = problem.f(a);
  const fb = problem.f(b);
  const prod = fa * fb;

  // Renderizar la verificación de signos en la interfaz
  renderSignVerification(prefix, a, b, fa, fb, prod);

  // Ejecutar el algoritmo numérico
  const result = problem.algorithm(problem.f, a, b, tolerance, maxIterations);

  if (!result.success && result.rows.length === 0) {
    alertEl.textContent = result.message;
    alertEl.classList.add('error');
    resultsContainer.classList.add('hidden');
    return;
  }

  // Mostrar el contenedor de resultados
  resultsContainer.classList.remove('hidden');

  // Renderizar resumen, tabla e interpretación
  renderSummary(prefix, problem, result);
  renderTableRows(prefix, result.rows);
  renderInterpretation(prefix, problem, result);
}

// 5. Renderizado de verificación de signos
function renderSignVerification(prefix, a, b, fa, fb, prod) {
  const faEl = document.getElementById(`sign-fa-${prefix}`);
  const fbEl = document.getElementById(`sign-fb-${prefix}`);
  const prodEl = document.getElementById(`sign-prod-${prefix}`);
  const statusEl = document.getElementById(`sign-status-${prefix}`);

  faEl.textContent = formatNumber(fa, 6);
  fbEl.textContent = formatNumber(fb, 6);
  prodEl.textContent = formatNumber(prod, 6);

  statusEl.replaceChildren();
  const tag = document.createElement('span');
  tag.className = 'sign-status-tag';

  if (prod < 0) {
    tag.classList.add('valid');
    tag.textContent = '✓ Hay cambio de signo en el intervalo: f(a) · f(b) < 0. El método cerrado puede aplicarse.';
  } else if (prod === 0) {
    tag.classList.add('valid');
    tag.textContent = '✓ Uno de los extremos es raíz exacta: f(a) · f(b) = 0.';
  } else {
    tag.classList.add('invalid');
    tag.textContent = '✗ No hay cambio de signo: f(a) · f(b) > 0. No se garantiza una raíz en este intervalo.';
  }

  statusEl.appendChild(tag);
}

// 6. Renderizado del resumen de convergencia
function renderSummary(prefix, problem, result) {
  const rootEl = document.getElementById(`summary-root-${prefix}`);
  const frootEl = document.getElementById(`summary-froot-${prefix}`);
  const errorEl = document.getElementById(`summary-error-${prefix}`);
  const itersEl = document.getElementById(`summary-iters-${prefix}`);

  rootEl.textContent = `${formatNumber(result.root, 6)} ${problem.units}`;
  frootEl.textContent = formatNumber(result.fRoot, 8);
  errorEl.textContent = formatError(result.error);
  itersEl.textContent = `${result.iterations} (${result.message})`;
}

// 7. Renderizado seguro de las filas de la tabla
function renderTableRows(prefix, rows) {
  const tbody = document.getElementById(`table-body-${prefix}`);
  tbody.replaceChildren();

  rows.forEach((row) => {
    const tr = document.createElement('tr');

    const cellData = [
      row.iteration,
      formatNumber(row.a, 6),
      formatNumber(row.b, 6),
      formatNumber(row.xr, 6),
      formatNumber(row.fxr, 6),
      formatError(row.ea)
    ];

    cellData.forEach((val) => {
      const td = document.createElement('td');
      td.textContent = val;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

// 8. Renderizado de la interpretación contextual
function renderInterpretation(prefix, problem, result) {
  const interpEl = document.getElementById(`interpretation-${prefix}`);
  interpEl.innerHTML = problem.getInterpretation(result);
}
