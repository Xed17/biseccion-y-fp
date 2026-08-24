// algorithms.js - Funciones puras de cálculo numérico

function validateBracket(f, xl, xu, tolerance, maxIterations) {
  if (!Number.isFinite(xl) || !Number.isFinite(xu)) {
    return { success: false, message: 'Los extremos del intervalo deben ser números válidos.' };
  }

  if (xl >= xu) {
    return { success: false, message: 'El límite inferior debe ser menor que el límite superior.' };
  }

  if (!Number.isFinite(tolerance) || tolerance <= 0) {
    return { success: false, message: 'La tolerancia debe ser mayor que cero.' };
  }

  if (!Number.isInteger(maxIterations) || maxIterations <= 0) {
    return { success: false, message: 'El máximo de iteraciones debe ser un entero positivo.' };
  }

  const fxl = f(xl);
  const fxu = f(xu);

  if (!Number.isFinite(fxl) || !Number.isFinite(fxu)) {
    return { success: false, message: 'La función no está definida o no es finita en el intervalo proporcionado.' };
  }

  if (fxl * fxu > 0) {
    return {
      success: false,
      message: 'El intervalo no es válido: f(a) y f(b) no tienen signos opuestos (f(a) · f(b) > 0).',
      fxl,
      fxu
    };
  }

  return { success: true, fxl, fxu };
}

function buildResult(success, message, root, fRoot, error, rows, stopReason) {
  return {
    success,
    message,
    root,
    fRoot,
    error,
    iterations: rows.length,
    rows,
    stopReason
  };
}

function exactEndpointResult(value, functionValue, endpoint) {
  return buildResult(
    true,
    `La raíz exacta coincide con el extremo ${endpoint}.`,
    value,
    functionValue,
    0,
    [],
    'exact-endpoint'
  );
}

function bisection(f, xl, xu, tolerance = 0.5, maxIterations = 50) {
  const validation = validateBracket(f, xl, xu, tolerance, maxIterations);
  if (!validation.success) return validation;

  let fxl = validation.fxl;
  let fxu = validation.fxu;

  if (fxl === 0) return exactEndpointResult(xl, fxl, 'a');
  if (fxu === 0) return exactEndpointResult(xu, fxu, 'b');

  const rows = [];
  let previousXr = null;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const xr = (xl + xu) / 2;
    const fxr = f(xr);
    const ea = previousXr === null
      ? null
      : Math.abs((xr - previousXr) / xr) * 100;

    rows.push({ iteration, a: xl, b: xu, xr, fxr, ea });

    if (Math.abs(fxr) < Number.EPSILON) {
      return buildResult(true, 'Raíz exacta encontrada (f(xr) = 0).', xr, fxr, ea, rows, 'exact-root');
    }

    if (ea !== null && ea < tolerance) {
      return buildResult(true, 'Convergencia alcanzada (εa < tolerancia).', xr, fxr, ea, rows, 'tolerance');
    }

    if (fxl * fxr < 0) {
      xu = xr;
      fxu = fxr;
    } else {
      xl = xr;
      fxl = fxr;
    }

    previousXr = xr;
  }

  const last = rows[rows.length - 1];
  return buildResult(false, 'Se alcanzó el número máximo de iteraciones.', last.xr, last.fxr, last.ea, rows, 'max-iterations');
}

function falsePosition(f, xl, xu, tolerance = 0.5, maxIterations = 50) {
  const validation = validateBracket(f, xl, xu, tolerance, maxIterations);
  if (!validation.success) return validation;

  let fxl = validation.fxl;
  let fxu = validation.fxu;

  if (fxl === 0) return exactEndpointResult(xl, fxl, 'a');
  if (fxu === 0) return exactEndpointResult(xu, fxu, 'b');

  const rows = [];
  let previousXr = null;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const denominator = fxl - fxu;

    if (Math.abs(denominator) < Number.EPSILON) {
      return {
        success: false,
        message: 'No es posible calcular xr: el denominador (f(xl) - f(xu)) es prácticamente cero.',
        rows
      };
    }

    const xr = xu - (fxu * (xl - xu)) / denominator;
    const fxr = f(xr);
    const ea = previousXr === null
      ? null
      : Math.abs((xr - previousXr) / xr) * 100;

    rows.push({ iteration, a: xl, b: xu, xr, fxr, ea });

    if (Math.abs(fxr) < Number.EPSILON) {
      return buildResult(true, 'Raíz exacta encontrada (f(xr) = 0).', xr, fxr, ea, rows, 'exact-root');
    }

    if (ea !== null && ea < tolerance) {
      return buildResult(true, 'Convergencia alcanzada (εa < tolerancia).', xr, fxr, ea, rows, 'tolerance');
    }

    if (fxl * fxr < 0) {
      xu = xr;
      fxu = fxr;
    } else {
      xl = xr;
      fxl = fxr;
    }

    previousXr = xr;
  }

  const last = rows[rows.length - 1];
  return buildResult(false, 'Se alcanzó el número máximo de iteraciones.', last.xr, last.fxr, last.ea, rows, 'max-iterations');
}

function formatNumber(value, digits = 6) {
  if (value === null || value === undefined) return '—';
  return Number(value).toFixed(digits);
}

function formatError(value) {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toFixed(4)} %`;
}
