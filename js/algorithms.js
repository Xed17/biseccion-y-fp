// algorithms.js - Bisección y Falsa Posición
function solveBracket(f, xl, xu, tol = 0.5, maxIter = 50, isFalsePos = false) {
  let fxl = f(xl), fxu = f(xu);
  if (!Number.isFinite(fxl) || !Number.isFinite(fxu)) return { success: false, message: 'Valores no finitos en extremos.' };
  if (fxl * fxu > 0) return { success: false, message: 'Sin cambio de signo: f(a) · f(b) > 0.' };

  const rows = [];
  let prevXr = null;

  for (let i = 1; i <= maxIter; i++) {
    const denom = fxl - fxu;
    if (isFalsePos && Math.abs(denom) < 1e-15) return { success: false, message: 'Denominador cercano a cero.', rows };
    const xr = isFalsePos ? xu - (fxu * (xl - xu)) / denom : (xl + xu) / 2;
    const fxr = f(xr);
    if (!Number.isFinite(fxr)) return { success: false, message: `Discontinuidad en xr ≈ ${formatNumber(xr, 4)}.`, rows };

    const ea = prevXr === null ? null : Math.abs((xr - prevXr) / xr) * 100;
    rows.push({ iteration: i, a: xl, b: xu, xr, fxr, ea });

    if (Math.abs(fxr) < 1e-15 || (ea !== null && ea < tol)) {
      if (Math.abs(fxr) > 50) return { success: false, root: xr, fRoot: fxr, error: ea, iterations: i, rows, message: 'Discontinuidad/asíntota detectada.' };
      return { success: true, root: xr, fRoot: fxr, error: ea, iterations: i, rows, message: 'Convergencia alcanzada.' };
    }

    if (fxl * fxr < 0) { xu = xr; fxu = fxr; } else { xl = xr; fxl = fxr; }
    prevXr = xr;
  }

  const last = rows[rows.length - 1];
  return { success: false, root: last.xr, fRoot: last.fxr, error: last.ea, iterations: maxIter, rows, message: 'Máx. iteraciones alcanzado.' };
}

const bisection = (f, a, b, tol, max) => solveBracket(f, a, b, tol, max, false);
const falsePosition = (f, a, b, tol, max) => solveBracket(f, a, b, tol, max, true);
const formatNumber = (v, d = 6) => v == null ? '—' : Number(v).toFixed(d);
const formatError = (v) => v == null ? '—' : `${Number(v).toFixed(4)} %`;
