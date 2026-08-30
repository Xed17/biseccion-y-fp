// app.js - Manejo de pestañas, ejecución y renderizado

document.addEventListener('DOMContentLoaded', () => {
  // Tabs
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.panel').forEach(p => p.hidden = (p.id !== btn.dataset.tab));
    });
  });

  // Fórmulas KaTeX
  if (typeof katex !== 'undefined') {
    katex.render(problems.networkCapacity.latexFormula, document.getElementById('formula-network'), { displayMode: true, throwOnError: false });
    katex.render(problems.cloudMigration.latexFormula, document.getElementById('formula-cloud'), { displayMode: true, throwOnError: false });
  }

  // Botones
  document.getElementById('btn-run-network').addEventListener('click', () => run(problems.networkCapacity, 'network'));
  document.getElementById('btn-run-cloud').addEventListener('click', () => run(problems.cloudMigration, 'cloud'));
});

function run(problem, id) {
  const alertEl = document.getElementById('alert-' + id);
  const resultsEl = document.getElementById('results-' + id);
  alertEl.hidden = true;

  const { defaultA: a, defaultB: b, defaultTolerance: tol, defaultMaxIterations: maxIter } = problem;
  const domainErr = problem.validateDomain(a, b);
  if (domainErr) { alertEl.textContent = domainErr; alertEl.hidden = false; resultsEl.hidden = true; return; }

  // Verificación de signos
  const fa = problem.f(a), fb = problem.f(b), prod = fa * fb;
  const sign = prod < 0 ? '✓ Cambio de signo detectado' : prod === 0 ? '✓ Raíz en extremo' : '✗ Sin cambio de signo';
  document.getElementById('sign-info-' + id).innerHTML =
    `f(${a}) = <strong>${formatNumber(fa)}</strong> · f(${b}) = <strong>${formatNumber(fb)}</strong> · Producto: <strong>${formatNumber(prod)}</strong> → ${sign}`;

  // Ejecución del algoritmo
  const result = problem.algorithm(problem.f, a, b, tol, maxIter);
  if (!result.success && (!result.rows || result.rows.length === 0)) {
    alertEl.textContent = result.message; alertEl.hidden = false; resultsEl.hidden = true; return;
  }

  resultsEl.hidden = false;

  // Resumen
  document.getElementById('summary-' + id).innerHTML =
    `<p><strong>Raíz:</strong> ${formatNumber(result.root)} ${problem.units} · <strong>f(raíz):</strong> ${formatNumber(result.fRoot, 8)} · <strong>Error:</strong> ${formatError(result.error)} · <strong>Iteraciones:</strong> ${result.iterations} (${result.message})</p>`;

  // Tabla
  const tbody = document.getElementById('tbody-' + id);
  tbody.innerHTML = result.rows.map(r => `
    <tr>
      <td>${r.iteration}</td><td>${formatNumber(r.a)}</td><td>${formatNumber(r.b)}</td>
      <td>${formatNumber(r.xr)}</td><td>${formatNumber(r.fxr)}</td><td>${formatError(r.ea)}</td>
    </tr>`).join('');

  // Interpretación
  document.getElementById('interp-' + id).innerHTML = problem.getInterpretation(result);
}
