// problems.js - Definición de problemas, funciones e interpretación técnica

const problems = {
  networkCapacity: {
    algorithm: bisection,
    units: 'Mbps',
    latexFormula: 'f(C) = \\frac{1}{C - 8.5} - 0.35 \\ln(C - 2) = 0',
    defaultA: 9, defaultB: 10, defaultTolerance: 0.5, defaultMaxIterations: 50,
    f: (C) => 1 / (C - 8.5) - 0.35 * Math.log(C - 2),
    validateDomain: (a, b) => (a <= 8.5 || b <= 8.5) ? 'Ambos límites deben ser > 8.5 Mbps.' : null,
    getInterpretation: (res) => `
      <p><strong>Resultado técnico:</strong> Raíz en <strong>${Number(res.root).toFixed(4)} Mbps</strong> (error: <strong>${formatError(res.error)}</strong> en <strong>${res.iterations}</strong> iteraciones).</p>
      <p><strong>Ingeniería:</strong> Representa el umbral teórico donde el retardo se equilibra. En infraestructura comercial debe redondearse hacia arriba (mínimo <strong>${Math.ceil(res.root)} Mbps</strong>) para evitar saturación y mantener margen operativo ante variaciones de tráfico.</p>`
  },

  cloudMigration: {
    algorithm: falsePosition,
    units: 'años',
    latexFormula: 'f(t) = 45 + 12t - 20 e^{0.4t} = 0',
    defaultA: 3, defaultB: 4, defaultTolerance: 0.5, defaultMaxIterations: 50,
    f: (t) => 45 + 12 * t - 20 * Math.exp(0.4 * t),
    validateDomain: (a, b) => (a < 0 || b < 0) ? 'El tiempo t debe ser ≥ 0.' : null,
    getInterpretation: (res) => `
      <p><strong>Punto de equilibrio:</strong> Se alcanza en <strong>t ≈ ${Number(res.root).toFixed(4)} años</strong> (costo aproximado: <strong>${(45 + 12 * res.root).toFixed(2)} kUSD</strong> en <strong>${res.iterations}</strong> iteraciones).</p>
      <ul>
        <li><strong>t &lt; ${Number(res.root).toFixed(4)} años:</strong> El costo On-Premise es menor que Cloud (f(t) &gt; 0); conviene operar localmente.</li>
        <li><strong>t &gt; ${Number(res.root).toFixed(4)} años:</strong> El crecimiento exponencial del costo acumulado aconseja migrar antes de este punto.</li>
      </ul>`
  }
};
