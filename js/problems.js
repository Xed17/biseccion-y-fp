// problems.js - Definiciones de problemas, parser Math.js e interpretaciones
const problems = {
  network: {
    algorithm: bisection,
    defaultVar: 'C',
    units: 'Mbps',
    raw: '1 / (C - 8.5) - 0.35 * log(C - 2)',
    a: 9, b: 10, tol: 0.5, max: 50,
    validateDomain: (a, b) => {
      if (a <= 2 || b <= 2) return 'Límites deben ser > 2 (por ln(C - 2)).';
      if (a === 8.5 || b === 8.5) return 'Asíntota vertical en C = 8.5 (división por cero).';
      if (a < 8.5 && b > 8.5) return 'El intervalo no puede cruzar la asíntota en C = 8.5.';
      return null;
    },
    interpret: (res) => {
      const r = Number(res.root);
      if (r < 8.5) {
        return `<p><strong>Raíz en rama (2, 8.5):</strong> ${r.toFixed(4)} Mbps (${formatError(res.error)} en ${res.iterations} iter.). En el modelo M/M/1 con tráfico λ = 8.5 Mbps, la operación estable se ubica en C > 8.5 Mbps.</p>`;
      }
      return `<p><strong>Capacidad calculada:</strong> <strong>${r.toFixed(4)} Mbps</strong> (error: <strong>${formatError(res.error)}</strong> en <strong>${res.iterations}</strong> iter., |f(C)| = ${Math.abs(res.fRoot).toExponential(2)}).</p>
      <ul>
        <li><strong>Mínimo a contratar:</strong> <strong>${r.toFixed(2)} Mbps</strong>.</li>
        <li><strong>Redondeo hacia arriba (mínimo ${Math.ceil(r)} Mbps):</strong> Por planes comerciales enteros de ISPs (10 Mbps), margen ante ráfagas de tráfico y estabilidad en colas M/M/1 alejadas de la saturación.</li>
      </ul>`;
    }
  },

  cloud: {
    algorithm: falsePosition,
    defaultVar: 't',
    units: 'años',
    raw: '45 + 12 * t - 20 * exp(0.4 * t)',
    a: 3, b: 4, tol: 0.5, max: 50,
    validateDomain: (a, b) => (a < 0 || b < 0) ? 'El tiempo t debe ser ≥ 0 años.' : null,
    interpret: (res) => {
      const t = Number(res.root), cost = (45 + 12 * t).toFixed(2);
      return `<p><strong>Punto de equilibrio:</strong> <strong>t ≈ ${t.toFixed(4)} años</strong> (~${(t * 12).toFixed(1)} meses) con costo igualado en <strong>${cost} miles de soles (S/.)</strong> (${formatError(res.error)} en ${res.iterations} iter.).</p>
      <ul>
        <li><strong>Decisión de migración:</strong> Conviene operar en la nube durante los primeros <strong>${t.toFixed(2)} años</strong>.</li>
        <li><strong>Justificación de costos:</strong> Para t < ${t.toFixed(2)} años, On-Premise es más caro por inversión inicial ($45 + 12t > 20e^{0.4t}$); para t > ${t.toFixed(2)} años, el crecimiento exponencial del consumo en nube supera al mantenimiento de servidores propios.</li>
      </ul>`;
    }
  }
};

function getExpressionVariable(node, fallback = 'x') {
  const syms = node.filter(n => n.isSymbolNode && !math[n.name] && !['e', 'pi', 'i'].includes(n.name));
  return syms.length ? syms[0].name : fallback;
}

function parseFunction(expr, defaultVar = 'x') {
  if (!expr?.trim()) throw new Error('Ecuación vacía.');
  const node = math.parse(expr.trim());
  const varName = getExpressionVariable(node, defaultVar);
  const compiled = node.compile();

  const evalFn = (v) => {
    const scope = { [varName]: v, ln: Math.log, log: Math.log, exp: Math.exp, e: Math.E, pi: Math.PI };
    const res = compiled.evaluate(scope);
    return (res && typeof res === 'object' && 'im' in res) ? NaN : Number(res);
  };

  let latexFormula;
  try { latexFormula = `f(${varName}) = ${node.toTex({ parenthesis: 'auto' })} = 0`; }
  catch { latexFormula = `f(${varName}) = ${expr} = 0`; }

  return { node, varName, evalFn, latexFormula };
}

function getMathInterpretation(res, v = 'x') {
  return `<p><strong>Resultado:</strong> ${v} ≈ <strong>${formatNumber(res.root, 6)}</strong> · <strong>|f(${v})|:</strong> ${Number(Math.abs(res.fRoot)).toExponential(4)} · <strong>Error:</strong> ${formatError(res.error)} en <strong>${res.iterations}</strong> iteraciones (${res.message}).</p>`;
}
