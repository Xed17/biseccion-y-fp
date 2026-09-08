// app.js - Controlador de interfaz y ejecución de métodos numéricos
const $ = (id) => document.getElementById(id);
const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '').replace(/log\(/g, 'ln(');

document.addEventListener('DOMContentLoaded', () => {
  // Pestañas
  document.querySelectorAll('.tab').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.panel').forEach(p => p.hidden = (p.id !== btn.dataset.tab));
    };
  });

  // Configuración de cada problema
  ['network', 'cloud'].forEach(id => {
    const p = problems[id];
    const input = $('expr-' + id), formula = $('formula-' + id), note = $('domain-note-' + id);

    const render = () => {
      try {
        const parsed = parseFunction(input.value, p.defaultVar);
        input.classList.remove('error');
        formula.classList.remove('syntax-error');
        if (window.katex) katex.render(parsed.latexFormula, formula, { displayMode: true, throwOnError: false });
        note.innerHTML = norm(input.value) === norm(p.raw)
          ? (id === 'network' ? 'Dominio continuo: (2, 8.5) y (8.5, ∞). Asíntota en C = 8.5.' : 'Dominio sugerido: t ≥ 0 años.')
          : `Variable: <strong>${parsed.varName}</strong> · Validación de dominio automática.`;
      } catch (e) {
        input.classList.add('error');
        formula.classList.add('syntax-error');
        formula.innerHTML = `⚠️ <em>${e.message || 'Expresión inválida'}</em>`;
      }
    };

    input.oninput = render;

    $('btn-reset-' + id).onclick = () => {
      input.value = id === 'network' ? '1 / (C - 8.5) - 0.35 * ln(C - 2)' : '45 + 12 * t - 20 * exp(0.4 * t)';
      $('a-' + id).value = p.a;
      $('b-' + id).value = p.b;
      $('tol-' + id).value = p.tol;
      $('max-' + id).value = p.max;
      $('alert-' + id).hidden = $('results-' + id).hidden = true;
      render();
    };

    $('btn-run-' + id).onclick = () => run(id, p);
    render();
  });
});

function run(id, p) {
  const alertEl = $('alert-' + id), resultsEl = $('results-' + id);
  alertEl.hidden = true;

  let parsed;
  try { parsed = parseFunction($('expr-' + id).value, p.defaultVar); }
  catch (e) { return showError(alertEl, resultsEl, e.message); }

  const a = +$('a-' + id).value, b = +$('b-' + id).value;
  const tol = +$('tol-' + id).value, maxIter = +$('max-' + id).value;

  if ([a, b, tol, maxIter].some(isNaN)) return showError(alertEl, resultsEl, 'Ingresa valores numéricos válidos en todos los campos.');
  if (a >= b) return showError(alertEl, resultsEl, 'El límite a debe ser estrictamente menor que b.');
  if (tol <= 0 || maxIter < 1) return showError(alertEl, resultsEl, 'La tolerancia debe ser > 0 y máx. iteraciones ≥ 1.');

  const isOrig = norm($('expr-' + id).value) === norm(p.raw);
  if (isOrig && p.validateDomain) {
    const dErr = p.validateDomain(a, b);
    if (dErr) return showError(alertEl, resultsEl, dErr);
  }

  const fa = parsed.evalFn(a), fb = parsed.evalFn(b);
  if (!Number.isFinite(fa) || !Number.isFinite(fb)) {
    return showError(alertEl, resultsEl, `Función no finita en extremos: f(${a})=${fa}, f(${b})=${fb}.`);
  }

  const prod = fa * fb;
  const signInfo = $('sign-info-' + id);
  const signMsg = prod < 0 ? '✓ Cambio de signo' : prod === 0 ? '✓ Raíz en extremo' : '✗ Sin cambio de signo';
  const signColor = prod <= 0 ? '#15803d' : '#b91c1c';
  signInfo.innerHTML = `f(${a}) = <strong>${formatNumber(fa)}</strong> · f(${b}) = <strong>${formatNumber(fb)}</strong> · Producto: <strong>${formatNumber(prod)}</strong> → <span style="color:${signColor};font-weight:600;">${signMsg}</span>`;

  if (prod > 0) return showError(alertEl, resultsEl, `Sin cambio de signo en [${a}, ${b}]. Bisección y Falsa Posición requieren f(a)·f(b) < 0.`);

  const res = p.algorithm(parsed.evalFn, a, b, tol, maxIter);
  if (!res.success && (!res.rows || !res.rows.length)) return showError(alertEl, resultsEl, res.message);

  resultsEl.hidden = false;
  const unit = isOrig ? ` ${p.units}` : '';
  const statusColor = res.success ? '#15803d' : '#b91c1c';

  $('summary-' + id).innerHTML = `
    <p><strong>Raíz (${parsed.varName}):</strong> <strong>${formatNumber(res.root, 6)}${unit}</strong> · 
    <strong>f(${parsed.varName}):</strong> ${formatNumber(res.fRoot, 8)} · 
    <strong>Error:</strong> ${formatError(res.error)} · 
    <strong>Iteraciones:</strong> ${res.iterations} 
    (<span style="color:${statusColor};font-weight:600;">${res.message}</span>)</p>`;

  $('tbody-' + id).innerHTML = res.rows.map(r => `
    <tr>
      <td>${r.iteration}</td><td>${formatNumber(r.a)}</td><td>${formatNumber(r.b)}</td>
      <td>${formatNumber(r.xr)}</td><td>${formatNumber(r.fxr)}</td><td>${formatError(r.ea)}</td>
    </tr>`).join('');

  $('interp-' + id).innerHTML = isOrig ? p.interpret(res) : getMathInterpretation(res, parsed.varName);
}

function showError(alertEl, resultsEl, msg) {
  alertEl.textContent = msg;
  alertEl.hidden = false;
  resultsEl.hidden = true;
}
