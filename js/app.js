document.addEventListener('DOMContentLoaded', () => {
  // Tabs
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // KaTeX formulas
  if (typeof katex !== 'undefined') {
    katex.render(problems.networkCapacity.latexFormula, document.getElementById('formula-network'), { displayMode: true, throwOnError: false });
    katex.render(problems.cloudMigration.latexFormula, document.getElementById('formula-cloud'), { displayMode: true, throwOnError: false });
  }

  // Buttons
  document.getElementById('btn-run-network').addEventListener('click', () => run(problems.networkCapacity, 'network'));
  document.getElementById('btn-run-cloud').addEventListener('click', () => run(problems.cloudMigration, 'cloud'));
});

function run(problem, id) {
  const alertEl = document.getElementById('alert-' + id);
  const resultsEl = document.getElementById('results-' + id);
  alertEl.classList.add('hidden');
  alertEl.textContent = '';

  const { defaultA: a, defaultB: b, defaultTolerance: tol, defaultMaxIterations: maxIter } = problem;

  const domainErr = problem.validateDomain(a, b);
  if (domainErr) { showAlert(alertEl, domainErr); resultsEl.classList.add('hidden'); return; }

  // Sign check
  const fa = problem.f(a), fb = problem.f(b), prod = fa * fb;
  const sign = prod < 0 ? '✓ Cambio de signo detectado' : prod === 0 ? '✓ Raíz en extremo' : '✗ Sin cambio de signo';
  document.getElementById('sign-info-' + id).innerHTML =
    `f(${a}) = <strong>${formatNumber(fa)}</strong> · f(${b}) = <strong>${formatNumber(fb)}</strong> · Producto: <strong>${formatNumber(prod)}</strong> → ${sign}`;

  // Run algorithm
  const result = problem.algorithm(problem.f, a, b, tol, maxIter);

  if (!result.success && (!result.rows || result.rows.length === 0)) {
    showAlert(alertEl, result.message); resultsEl.classList.add('hidden'); return;
  }

  resultsEl.classList.remove('hidden');

  // Summary
  document.getElementById('summary-' + id).innerHTML =
    `<p><strong>Raíz:</strong> ${formatNumber(result.root)} ${problem.units} · <strong>f(raíz):</strong> ${formatNumber(result.fRoot, 8)} · <strong>Error:</strong> ${formatError(result.error)} · <strong>Iteraciones:</strong> ${result.iterations} · ${result.message}</p>`;

  // Table
  const tbody = document.getElementById('tbody-' + id);
  tbody.replaceChildren();
  for (const row of result.rows) {
    const tr = document.createElement('tr');
    [row.iteration, formatNumber(row.a), formatNumber(row.b), formatNumber(row.xr), formatNumber(row.fxr), formatError(row.ea)]
      .forEach(v => { const td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
    tbody.appendChild(tr);
  }

  // Interpretation
  document.getElementById('interp-' + id).innerHTML = problem.getInterpretation(result);
}

function showAlert(el, msg) { el.textContent = msg; el.classList.remove('hidden'); }
