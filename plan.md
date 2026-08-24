# Plan de desarrollo: Bisección y Falsa Posición

## 1. Propósito del proyecto

Construir una aplicación web estática con **HTML, CSS y JavaScript puro** que resuelva los dos ejercicios de la GAA de Métodos Numéricos:

1. **Problema 1:** capacidad de un enlace de red mediante el método de **Bisección**.
2. **Problema 2:** punto de equilibrio entre costos on-premise y cloud mediante el método de **Falsa Posición** (*Regula Falsi*).

La aplicación debe permitir ejecutar cada método, mostrar la evaluación inicial de signos, generar la tabla completa de iteraciones y explicar el significado de la raíz en el problema de ingeniería.

---

## 2. Requisitos que debe cumplir

Cada solución debe incluir:

- La función matemática planteada como `f(x) = 0`.
- Un intervalo inicial `[a, b]` válido.
- Verificación de cambio de signo: `f(a) × f(b) < 0`.
- Tabla con las columnas solicitadas:
  - Iteración
  - `a` / `xl`
  - `b` / `xu`
  - `xr`
  - `f(xr)`
  - Error aproximado `εa (%)`
- Tolerancia por defecto: `0.5 %`.
- Máximo de iteraciones por defecto: `50`.
- Detención al cumplir `εa < tolerancia`, hallar raíz exacta o llegar al máximo de iteraciones.
- Interpretación final según el contexto de cada ejercicio.

El error aproximado relativo usado en ambos métodos será:

\[
\varepsilon_a = \left|\frac{x_{r,i}-x_{r,i-1}}{x_{r,i}}\right|\times100
\]

En la primera iteración el error no se puede calcular, porque no existe un valor anterior de `xr`; por ello se muestra `—`.

---

## 3. Estructura del proyecto

```text
metodos-numericos-web/
│
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── app.js
    ├── algorithms.js
    └── problems.js
```

### Responsabilidad de cada archivo

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Estructura visual, formularios, secciones de resultados y tablas |
| `css/styles.css` | Diseño, espaciados, tabla responsiva, mensajes de estado y estilos visuales |
| `js/problems.js` | Definición de las dos funciones y sus interpretaciones |
| `js/algorithms.js` | Algoritmos genéricos de bisección y falsa posición |
| `js/app.js` | Eventos de la interfaz, validaciones, renderizado de tablas y resultados |

Esta separación evita duplicar lógica. Los algoritmos no deben depender del DOM: reciben una función y parámetros numéricos, y devuelven datos. La capa de interfaz consume esos datos para renderizar la pantalla.

---

## 4. Diseño funcional de la interfaz

La página puede organizarse en dos tarjetas o pestañas: una por problema.

### 4.1. Contenido de cada tarjeta

1. Título del problema y método asignado.
2. Función matemática visible.
3. Explicación breve de las variables.
4. Panel de intervalo inicial:
   - Campo `a` o `xl`.
   - Campo `b` o `xu`.
   - Botón: **Validar intervalo**.
   - Resultado de `f(a)`, `f(b)` y el producto de signos.
5. Parámetros de ejecución:
   - Tolerancia porcentual.
   - Máximo de iteraciones.
   - Botón: **Ejecutar método**.
   - Botón opcional: **Restablecer valores**.
6. Resultado principal:
   - Aproximación de la raíz.
   - Valor de la función en la aproximación.
   - Error final.
   - Iteraciones ejecutadas.
   - Motivo de detención.
7. Tabla de iteraciones.
8. Interpretación contextual automática.

### 4.2. Valores iniciales sugeridos

| Problema | Método | Función | Intervalo por defecto |
|---|---|---|---|
| 1 | Bisección | `f(C) = 1/(C - 8.5) - 0.35 ln(C - 2)` | `[9, 10]` |
| 2 | Falsa posición | `f(t) = 45 + 12t - 20e^(0.4t)` | `[4, 5]` |

---

## 5. Modelo de datos

Cada fila de una tabla de iteraciones debe almacenarse como un objeto. Esto permite renderizarla, exportarla más adelante a CSV o reutilizarla para una gráfica.

```js
{
  iteration: 1,
  a: 9,
  b: 10,
  xr: 9.5,
  fxr: 0.123456,
  ea: null
}
```

El resultado del algoritmo debe seguir una estructura consistente:

```js
{
  success: true,
  message: 'Convergencia alcanzada por tolerancia.',
  root: 9.87,
  fRoot: 0.00012,
  error: 0.31,
  iterations: 8,
  rows: [/* filas de iteración */],
  stopReason: 'tolerance'
}
```

En caso de error de validación:

```js
{
  success: false,
  message: 'El intervalo no presenta cambio de signo.',
  rows: []
}
```

---

## 6. Validaciones comunes

Antes de ejecutar cualquier algoritmo, validar lo siguiente:

1. `a` y `b` deben ser números finitos.
2. Debe cumplirse `a < b`.
3. La tolerancia debe ser mayor que cero.
4. El máximo de iteraciones debe ser un entero positivo.
5. La función debe poder evaluarse en ambos extremos sin producir `NaN` ni infinito.
6. Debe existir cambio de signo o raíz en los extremos:

\[
f(a)\cdot f(b) \leq 0
\]

Si `f(a) = 0`, la raíz es exactamente `a`.

Si `f(b) = 0`, la raíz es exactamente `b`.

Si `f(a) × f(b) > 0`, no se debe iniciar un método cerrado; se debe mostrar un mensaje claro para que el usuario cambie el intervalo.

### 6.1. Validación particular del problema 1

La función es:

\[
f(C)=\frac{1}{C-8.5}-0.35\ln(C-2)
\]

Su dominio práctico indicado por el problema exige:

\[
C>8.5
\]

Por tanto, ambos extremos deben ser mayores a `8.5`. No basta con que `C > 2`, pues aunque el logaritmo queda definido, el modelo exige estabilidad del enlace por encima de 8.5 Mbps.

### 6.2. Validación particular del problema 2

La función exponencial está definida para todo número real. Sin embargo, el significado de `t` como años aconseja restringirlo a:

\[
t\geq0
\]

---

## 7. Algoritmo genérico de Bisección

### 7.1. Fundamento

La bisección toma el punto medio del intervalo actual:

\[
x_r=\frac{x_l+x_u}{2}
\]

Luego evalúa el signo de `f(xl) × f(xr)`:

- Si es negativo, la raíz se encuentra entre `xl` y `xr`; se actualiza `xu = xr`.
- Si es positivo, la raíz se encuentra entre `xr` y `xu`; se actualiza `xl = xr`.
- Si es cero, `xr` es una raíz exacta.

En cada iteración el ancho del intervalo se reduce a la mitad.

### 7.2. Pseudocódigo

```text
función biseccion(f, xl, xu, tolerancia, maxIter):
    validar xl, xu, tolerancia y maxIter
    fxl = f(xl)
    fxu = f(xu)

    si fxl == 0:
        retornar raíz exacta xl

    si fxu == 0:
        retornar raíz exacta xu

    si fxl * fxu > 0:
        retornar error: intervalo inválido

    xrAnterior = nulo
    filas = []

    para iteración desde 1 hasta maxIter:
        xr = (xl + xu) / 2
        fxr = f(xr)

        si xrAnterior es nulo:
            ea = nulo
        de lo contrario:
            ea = abs((xr - xrAnterior) / xr) * 100

        agregar {iteración, xl, xu, xr, fxr, ea} a filas

        si fxr == 0:
            retornar resultado por raíz exacta

        si ea no es nulo y ea < tolerancia:
            retornar resultado por tolerancia

        producto = fxl * fxr

        si producto < 0:
            xu = xr
            fxu = fxr
        de lo contrario:
            xl = xr
            fxl = fxr

        xrAnterior = xr

    retornar resultado por máximo de iteraciones
```

### 7.3. Implementación JavaScript sugerida

```js
export function bisection(f, xl, xu, tolerance = 0.5, maxIterations = 50) {
  const validation = validateBracket(f, xl, xu, tolerance, maxIterations);
  if (!validation.success) return validation;

  let fxl = validation.fxl;
  let fxu = validation.fxu;

  if (fxl === 0) return exactEndpointResult(xl, fxl, 'xl');
  if (fxu === 0) return exactEndpointResult(xu, fxu, 'xu');

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
      return buildResult(true, 'Raíz exacta encontrada.', xr, fxr, ea, rows, 'exact-root');
    }

    if (ea !== null && ea < tolerance) {
      return buildResult(true, 'Convergencia alcanzada por tolerancia.', xr, fxr, ea, rows, 'tolerance');
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

  const last = rows.at(-1);
  return buildResult(false, 'Se alcanzó el máximo de iteraciones.', last.xr, last.fxr, last.ea, rows, 'max-iterations');
}
```

> Nota: `fxu` se actualiza por consistencia y legibilidad, aunque bisección puede funcionar usando solamente `fxl` y `fxr` para decidir el intervalo.

---

## 8. Algoritmo genérico de Falsa Posición

### 8.1. Fundamento

Falsa posición mantiene el intervalo con cambio de signo, pero no calcula el punto medio. Estima la intersección con el eje `x` de la recta que une los puntos:

\[
(x_l,f(x_l))\quad\text{y}\quad(x_u,f(x_u))
\]

La fórmula es:

\[
x_r=x_u-\frac{f(x_u)(x_l-x_u)}{f(x_l)-f(x_u)}
\]

La actualización de extremos es igual que en bisección:

- Si `f(xl) × f(xr) < 0`, asignar `xu = xr`.
- Si `f(xl) × f(xr) > 0`, asignar `xl = xr`.
- Si `f(xr) = 0`, terminar.

### 8.2. Precaución numérica

Antes de dividir debe verificarse que el denominador no sea prácticamente cero:

\[
f(x_l)-f(x_u) \neq 0
\]

Si su valor absoluto es demasiado pequeño, el algoritmo debe detenerse y notificar que no puede construir una interpolación lineal estable.

### 8.3. Pseudocódigo

```text
función falsaPosicion(f, xl, xu, tolerancia, maxIter):
    validar xl, xu, tolerancia y maxIter
    fxl = f(xl)
    fxu = f(xu)

    si fxl == 0:
        retornar raíz exacta xl

    si fxu == 0:
        retornar raíz exacta xu

    si fxl * fxu > 0:
        retornar error: intervalo inválido

    xrAnterior = nulo
    filas = []

    para iteración desde 1 hasta maxIter:
        denominador = fxl - fxu

        si abs(denominador) es muy pequeño:
            retornar error numérico

        xr = xu - fxu * (xl - xu) / denominador
        fxr = f(xr)

        si xrAnterior es nulo:
            ea = nulo
        de lo contrario:
            ea = abs((xr - xrAnterior) / xr) * 100

        agregar {iteración, xl, xu, xr, fxr, ea} a filas

        si fxr == 0:
            retornar resultado por raíz exacta

        si ea no es nulo y ea < tolerancia:
            retornar resultado por tolerancia

        producto = fxl * fxr

        si producto < 0:
            xu = xr
            fxu = fxr
        de lo contrario:
            xl = xr
            fxl = fxr

        xrAnterior = xr

    retornar resultado por máximo de iteraciones
```

### 8.4. Implementación JavaScript sugerida

```js
export function falsePosition(f, xl, xu, tolerance = 0.5, maxIterations = 50) {
  const validation = validateBracket(f, xl, xu, tolerance, maxIterations);
  if (!validation.success) return validation;

  let fxl = validation.fxl;
  let fxu = validation.fxu;

  if (fxl === 0) return exactEndpointResult(xl, fxl, 'xl');
  if (fxu === 0) return exactEndpointResult(xu, fxu, 'xu');

  const rows = [];
  let previousXr = null;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const denominator = fxl - fxu;

    if (Math.abs(denominator) < Number.EPSILON) {
      return {
        success: false,
        message: 'No es posible calcular xr: el denominador es demasiado pequeño.',
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
      return buildResult(true, 'Raíz exacta encontrada.', xr, fxr, ea, rows, 'exact-root');
    }

    if (ea !== null && ea < tolerance) {
      return buildResult(true, 'Convergencia alcanzada por tolerancia.', xr, fxr, ea, rows, 'tolerance');
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

  const last = rows.at(-1);
  return buildResult(false, 'Se alcanzó el máximo de iteraciones.', last.xr, last.fxr, last.ea, rows, 'max-iterations');
}
```

---

## 9. Funciones compartidas de apoyo

### 9.1. Validación del intervalo

```js
export function validateBracket(f, xl, xu, tolerance, maxIterations) {
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
      message: 'El intervalo no es válido: f(a) y f(b) no tienen signos opuestos.',
      fxl,
      fxu
    };
  }

  return { success: true, fxl, fxu };
}
```

### 9.2. Construcción del resultado

```js
export function buildResult(success, message, root, fRoot, error, rows, stopReason) {
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

export function exactEndpointResult(value, functionValue, endpoint) {
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
```

---

## 10. Configuración de los ejercicios

El archivo `problems.js` debe definir los datos propios de cada situación, sin mezclarlos con el algoritmo.

```js
export const problems = {
  networkCapacity: {
    id: 'network-capacity',
    title: 'Problema 1: Capacidad de enlace',
    method: 'bisection',
    variable: 'C',
    units: 'Mbps',
    defaultA: 9,
    defaultB: 10,
    defaultTolerance: 0.5,
    defaultMaxIterations: 50,
    f: (C) => 1 / (C - 8.5) - 0.35 * Math.log(C - 2),
    validateDomain: (a, b) => {
      if (a <= 8.5 || b <= 8.5) {
        return 'Para este modelo, ambos límites deben ser mayores que 8.5 Mbps.';
      }
      return null;
    }
  },

  cloudMigration: {
    id: 'cloud-migration',
    title: 'Problema 2: Equilibrio de costos',
    method: 'false-position',
    variable: 't',
    units: 'años',
    defaultA: 4,
    defaultB: 5,
    defaultTolerance: 0.5,
    defaultMaxIterations: 50,
    f: (t) => 45 + 12 * t - 20 * Math.exp(0.4 * t),
    validateDomain: (a, b) => {
      if (a < 0 || b < 0) {
        return 'El tiempo debe ser mayor o igual que cero.';
      }
      return null;
    }
  }
};
```

---

## 11. Lógica específica del problema 1

### 11.1. Ecuación

\[
f(C)=\frac{1}{C-8.5}-0.35\ln(C-2)
\]

### 11.2. Restricción de dominio

\[
C>8.5
\]

### 11.3. Validación del intervalo propuesto

Con `[9, 10]`:

\[
f(9)\approx1.3189>0
\]

\[
f(10)\approx-0.0613<0
\]

Por tanto, existe un cambio de signo en el intervalo y bisección puede usarse correctamente.

### 11.4. Flujo del programa

1. Leer `a`, `b`, tolerancia y máximo de iteraciones.
2. Verificar que `a > 8.5` y `b > 8.5`.
3. Evaluar `f(a)` y `f(b)`.
4. Si no hay cambio de signo, detener y mostrar un mensaje.
5. Ejecutar `bisection()`.
6. Renderizar la tabla con las filas devueltas.
7. Mostrar el resultado como capacidad estimada.
8. Construir la interpretación:

```text
La capacidad calculada aproxima el valor C para el cual el modelo iguala
T(C) a cero. Para una contratación real debe redondearse hacia arriba,
pues contratar una capacidad inferior puede dejar el enlace por debajo
del umbral estimado y no incorpora margen ante variaciones de demanda.
```

### 11.5. Consideración de coherencia del modelo

En la aplicación debe presentarse este resultado como la solución de la ecuación propuesta por el ejercicio. En un escenario real, un tiempo de espera físico no suele interpretarse literalmente como negativo; el modelo se está usando aquí para hallar un umbral matemático de diseño.

---

## 12. Lógica específica del problema 2

### 12.1. Ecuación

\[
f(t)=45+12t-20e^{0.4t}
\]

### 12.2. Validación del intervalo propuesto

Con `[4, 5]`:

\[
f(4)\approx-6.06<0
\]

\[
f(5)\approx57.22>0
\]

Existe cambio de signo, por lo que el intervalo encierra un punto de equilibrio.

### 12.3. Flujo del programa

1. Leer `a`, `b`, tolerancia y máximo de iteraciones.
2. Verificar que ambos tiempos sean no negativos.
3. Evaluar `f(a)` y `f(b)`.
4. Si no hay cambio de signo, impedir la ejecución.
5. Ejecutar `falsePosition()`.
6. Renderizar tabla y resultado.
7. Calcular los costos en la raíz aproximada:

\[
C_1(t)=45+12t
\]

\[
C_2(t)=20e^{0.4t}
\]

8. Mostrar la interpretación automática:

```text
En el tiempo aproximado t encontrado, ambos costos acumulados son iguales.
Antes del punto de equilibrio, si f(t) < 0, entonces C1(t) < C2(t):
el sistema local es menos costoso. Después del punto, si f(t) > 0,
entonces C1(t) > C2(t): el modelo indica que operar en la nube resulta
menos costoso.
```

### 12.4. Aclaración de interpretación

No debe afirmarse simplemente que “conviene migrar desde el instante cero” o “conviene migrar solo al final” sin comparar signos. La decisión pedida se deriva de:

\[
f(t)=C_1(t)-C_2(t)
\]

- `f(t) < 0`: local cuesta menos.
- `f(t) = 0`: costos iguales.
- `f(t) > 0`: nube cuesta menos.

---

## 13. Renderizado de tabla

### 13.1. Formato numérico

Usar una función para evitar demasiados decimales y mantener consistencia:

```js
export function formatNumber(value, digits = 6) {
  if (value === null || value === undefined) return '—';
  return Number(value).toFixed(digits);
}

export function formatError(value) {
  return value === null || value === undefined
    ? '—'
    : `${value.toFixed(4)} %`;
}
```

### 13.2. Generación segura del cuerpo de tabla

Preferir `document.createElement()` y `textContent` en lugar de concatenar directamente valores del usuario con `innerHTML`.

```js
export function renderIterations(tbody, rows) {
  tbody.replaceChildren();

  for (const row of rows) {
    const tr = document.createElement('tr');
    const values = [
      row.iteration,
      formatNumber(row.a),
      formatNumber(row.b),
      formatNumber(row.xr),
      formatNumber(row.fxr),
      formatError(row.ea)
    ];

    for (const value of values) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }
}
```

La tabla debe registrar los valores de `a` y `b` **antes de actualizarlos**, ya que son el intervalo utilizado para calcular el `xr` de esa fila.

---

## 14. Flujo de eventos en `app.js`

```text
Al cargar la página:
    Mostrar valores por defecto de ambos problemas.
    Validar y mostrar el intervalo sugerido.

Al hacer clic en “Validar intervalo”:
    Leer valores del formulario.
    Aplicar validación de dominio del problema.
    Evaluar f(a), f(b) y f(a) × f(b).
    Mostrar si hay cambio de signo.

Al hacer clic en “Ejecutar método”:
    Leer y convertir todos los valores a Number.
    Validar dominio particular.
    Elegir algoritmo según el problema.
    Ejecutar algoritmo con f, a, b, tolerancia y máximo.
    Mostrar mensaje de éxito o error.
    Renderizar tabla.
    Renderizar resultado principal.
    Renderizar interpretación de ingeniería.
```

Ejemplo de función controladora:

```js
function runProblem(problem, algorithm, formElements, outputElements) {
  const a = Number(formElements.a.value);
  const b = Number(formElements.b.value);
  const tolerance = Number(formElements.tolerance.value);
  const maxIterations = Number.parseInt(formElements.maxIterations.value, 10);

  const domainError = problem.validateDomain(a, b);
  if (domainError) {
    showStatus(outputElements.status, domainError, 'error');
    clearOutputs(outputElements);
    return;
  }

  const result = algorithm(problem.f, a, b, tolerance, maxIterations);
  showStatus(outputElements.status, result.message, result.success ? 'success' : 'warning');
  renderIterations(outputElements.tableBody, result.rows);

  if (result.root !== undefined) {
    renderResult(problem, result, outputElements.summary);
    renderInterpretation(problem, result, outputElements.interpretation);
  }
}
```

---

## 15. Pruebas mínimas

Antes de entregar, verificar estos casos.

| Caso | Resultado esperado |
|---|---|
| Problema 1, `[9,10]`, tolerancia `0.5` | Ejecuta bisección y converge antes de 50 iteraciones |
| Problema 1, `a=8.5` | Rechaza por dominio inválido |
| Problema 1, intervalo sin cambio de signo | Rechaza antes de iterar |
| Problema 2, `[4,5]`, tolerancia `0.5` | Ejecuta falsa posición y converge antes de 50 iteraciones |
| Problema 2, intervalo con `a > b` | Rechaza por orden inválido |
| Tolerancia `0` o negativa | Rechaza por parámetro inválido |
| Máximo de iteraciones no entero o negativo | Rechaza por parámetro inválido |
| Máximo muy bajo, por ejemplo `1` | Muestra resultado parcial y aviso de máximo alcanzado |

También comprobar manualmente que:

- La fila 1 muestre `—` en el error.
- El error de la fila 2 se calcule contra el `xr` de la fila 1.
- No se rendericen valores `NaN`, `Infinity` o errores de JavaScript.
- El método seleccionado corresponda exactamente con el enunciado: bisección para el problema 1 y falsa posición para el problema 2.

---

## 16. Mejora opcional: exportar resultados

Si deseas enriquecer la entrega, añade un botón **Exportar CSV**. El archivo puede contener el encabezado y todas las filas de iteración.

```js
export function downloadCsv(rows, filename) {
  const header = ['Iteración', 'a', 'b', 'xr', 'f(xr)', 'ea (%)'];
  const lines = rows.map((row) => [
    row.iteration,
    row.a,
    row.b,
    row.xr,
    row.fxr,
    row.ea ?? ''
  ]);

  const csv = [header, ...lines]
    .map((line) => line.join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

---

## 17. Orden recomendado de implementación

1. Crear el HTML con dos secciones de formulario y dos tablas vacías.
2. Diseñar CSS básico y responsivo; hacer que las tablas permitan desplazamiento horizontal en pantallas pequeñas.
3. Implementar `validateBracket()` y probarla en consola.
4. Implementar y probar el algoritmo de bisección de forma aislada.
5. Implementar y probar falsa posición de forma aislada.
6. Crear `problems.js` con ambas funciones y reglas de dominio.
7. Conectar botones y formularios desde `app.js`.
8. Renderizar tablas y tarjetas de resultados.
9. Añadir mensajes de error, interpretación contextual y botón de restablecimiento.
10. Realizar pruebas con los casos de la sección 15.
11. Opcionalmente agregar exportación CSV y una gráfica de `f(x)` para visualizar el aislamiento de la raíz.

---

## 18. Criterios de calidad de la entrega

La entrega estará bien planteada si demuestra que:

- No se ejecuta un método cerrado sin validar primero el cambio de signo.
- El intervalo se actualiza según el signo de `f(xl) × f(xr)`.
- El error se calcula con dos aproximaciones consecutivas de `xr`.
- La primera fila no reporta un error ficticio.
- Cada fila conserva el intervalo usado en esa iteración.
- La lógica matemática está separada de la interfaz web.
- La interpretación final no solo muestra un número: explica qué representa para la capacidad del enlace o para la decisión entre on-premise y nube.

---

## 19. Resultado esperado del sistema

Al finalizar tendrás una página web didáctica y verificable que permitirá:

- Ajustar intervalos, tolerancia y número máximo de iteraciones.
- Confirmar visualmente el cambio de signo.
- Ejecutar el método que exige cada problema.
- Revisar cada iteración como en la tabla modelo adjunta.
- Obtener una raíz aproximada reproducible.
- Interpretar el resultado técnico dentro de ambos escenarios de ingeniería.
