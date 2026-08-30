// algorithms.js - Motor unificado de métodos cerrados

function solveBracket(f, xl, xu, tol = 0.5, maxIter = 50, isFalsePos = false) {
  let fxl = f(xl), fxu = f(xu);
  if (!Number.isFinite(fxl) || !Number.isFinite(fxu)) return { success: false, message: 'Función no finita en el intervalo.' };
  if (fxl * fxu > 0) return { success: false, message: 'Sin cambio de signo: f(a) · f(b) > 0.' };
  if (fxl === 0) return { success: true, root: xl, fRoot: 0, error: 0, iterations: 0, rows: [], message: 'Raíz exacta en a.' };
  if (fxu === 0) return { success: true, root: xu, fRoot: 0, error: 0, iterations: 0, rows: [], message: 'Raíz exacta en b.' };

  const rows = [];
  let prevXr = null;

  for (let i = 1; i <= maxIter; i++) {
    const denom = fxl - fxu;
    if (isFalsePos && Math.abs(denom) < 1e-15) return { success: false, message: 'Denominador cercano a cero.', rows };

    const xr = isFalsePos ? xu - (fxu * (xl - xu)) / denom : (xl + xu) / 2;
    const fxr = f(xr);
    const ea = prevXr === null ? null : Math.abs((xr - prevXr) / xr) * 100;
    rows.push({ iteration: i, a: xl, b: xu, xr, fxr, ea });

    if (Math.abs(fxr) < 1e-15 || (ea !== null && ea < tol)) {
      return { success: true, root: xr, fRoot: fxr, error: ea, iterations: i, rows, message: ea < tol ? 'Convergencia alcanzada (εa < tol).' : 'Raíz exacta.' };
    }

    if (fxl * fxr < 0) { xu = xr; fxu = fxr; } else { xl = xr; fxl = fxr; }
    prevXr = xr;
  }

  const last = rows[rows.length - 1];
  return { success: false, root: last.xr, fRoot: last.fxr, error: last.ea, iterations: maxIter, rows, message: 'Máximo de iteraciones alcanzado.' };
}

const bisection = (f, a, b, tol, max) => solveBracket(f, a, b, tol, max, false);
const falsePosition = (f, a, b, tol, max) => solveBracket(f, a, b, tol, max, true);
const formatNumber = (v, d = 6) => v == null ? '—' : Number(v).toFixed(d);
const formatError = (v) => v == null ? '—' : `${Number(v).toFixed(4)} %`;
