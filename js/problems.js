// problems.js - Definición de los problemas, funciones matemáticas e interpretaciones

const problems = {
  networkCapacity: {
    id: 'network-capacity',
    title: 'Problema 1: Capacidad de Enlace de Red',
    methodName: 'Método de Bisección',
    algorithm: bisection,
    variable: 'C',
    units: 'Mbps',
    latexFormula: 'f(C) = \\frac{1}{C - 8.5} - 0.35 \\ln(C - 2) = 0',
    description: 'Determinar la capacidad de enlace C (Mbps) necesaria para garantizar un tiempo de retardo objetivo nulo según el modelo analítico de tráfico.',
    defaultA: 9,
    defaultB: 10,
    defaultTolerance: 0.5,
    defaultMaxIterations: 50,
    domainDescription: 'Dominio de estabilidad del enlace: C > 8.5 Mbps',
    f: (C) => 1 / (C - 8.5) - 0.35 * Math.log(C - 2),
    validateDomain: (a, b) => {
      if (a <= 8.5 || b <= 8.5) {
        return 'Para este modelo de red, ambos límites deben ser estrictamente mayores a 8.5 Mbps (C > 8.5).';
      }
      return null;
    },
    getInterpretation: (result) => {
      const rootFormatted = Number(result.root).toFixed(4);
      const rootCeil = Math.ceil(result.root);
      return `
        <p><strong>Resultado técnico:</strong> La raíz calculada es aproximadamente <strong>${rootFormatted} Mbps</strong> (con un error relativo de <strong>${formatError(result.error)}</strong> tras <strong>${result.iterations}</strong> iteraciones).</p>
        <p><strong>Significado en ingeniería de redes:</strong> Esta capacidad representa el umbral teórico exacto donde el tiempo medio de respuesta modelado se equilibra. En la práctica comercial y de infraestructura de telecomunicaciones, la capacidad contratada debe <em>redondearse hacia arriba</em> (al menos a <strong>${rootCeil} Mbps</strong> o al plan comercial estándar superior), ya que contratar una capacidad inferior dejaría el enlace saturado y sin margen operativo ante fluctuaciones de tráfico.</p>
      `;
    }
  },

  cloudMigration: {
    id: 'cloud-migration',
    title: 'Problema 2: Equilibrio de Costos (On-Premise vs Cloud)',
    methodName: 'Método de Falsa Posición (Regula Falsi)',
    algorithm: falsePosition,
    variable: 't',
    units: 'años',
    latexFormula: 'f(t) = 45 + 12t - 20 e^{0.4t} = 0',
    description: 'Hallar el instante t (años) en el que se igualan los costos acumulados del sistema local On-Premise C₁(t) y el servicio Cloud C₂(t).',
    costFormulasLatex: {
      c1: 'C_1(t) = 45 + 12t',
      c2: 'C_2(t) = 20 e^{0.4t}'
    },
    defaultA: 3,
    defaultB: 4,
    defaultTolerance: 0.5,
    defaultMaxIterations: 50,
    domainDescription: 'Dominio temporal: t ≥ 0 años',
    f: (t) => 45 + 12 * t - 20 * Math.exp(0.4 * t),
    validateDomain: (a, b) => {
      if (a < 0 || b < 0) {
        return 'El tiempo t debe ser mayor o igual que cero (t ≥ 0).';
      }
      return null;
    },
    getInterpretation: (result) => {
      const rootFormatted = Number(result.root).toFixed(4);
      const t = result.root;
      const c1 = 45 + 12 * t;
      const c2 = 20 * Math.exp(0.4 * t);
      return `
        <p><strong>Punto de equilibrio económico:</strong> Se alcanza en <strong>t ≈ ${rootFormatted} años</strong> (con costo aproximado de <strong>${c1.toFixed(2)} kUSD</strong>), hallado en <strong>${result.iterations}</strong> iteraciones con un error de <strong>${formatError(result.error)}</strong>.</p>
        <p><strong>Criterio de decisión financiera:</strong></p>
        <ul>
          <li><strong>Para t &lt; ${rootFormatted} años (f(t) &lt; 0):</strong> El costo On-Premise C₁(t) es menor que el Cloud C₂(t). Conviene mantener la infraestructura local durante este periodo inicial.</li>
          <li><strong>En t = ${rootFormatted} años (f(t) = 0):</strong> Ambos modelos de costos son financieramente equivalentes.</li>
          <li><strong>Para t &gt; ${rootFormatted} años (f(t) &gt; 0):</strong> Debido al crecimiento exponencial del modelo, el costo acumulado local supera al proyectado o el comportamiento relativo cambia según la curva; la organización debe planificar la transición estratégica antes de superar este umbral de viabilidad.</li>
        </ul>
      `;
    }
  }
};
