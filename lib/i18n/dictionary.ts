export type Lang = "es" | "en";

export type Dictionary = {
  header: {
    navAriaLabel: string;
    nav: { home: string; stats: string; ranking: string; performance: string };
    openMenu: string;
    closeMenu: string;
  };
  hero: {
    headline: string;
    subhead: string;
    play: string;
    viewRanking: string;
    viewProfile: string;
    login: string;
    demoNote: string;
  };
  manifesto: {
    heading: string;
    card1: { title: string; body: string };
    card2: { title: string; body: string };
    card3: { title: string; body: string };
  };
  domains: {
    heading: string;
    subhead: string;
    item1: { title: string; body: string };
    item2: { title: string; body: string };
    item3: { title: string; body: string };
  };
  sustainment: {
    heading: string;
    p1: string;
    p2: string;
    p3: string;
  };
  donation: {
    trigger: string;
    title: string;
    subtitle: string;
    close: string;
  };
  footer: {
    tagline: string;
    navAriaLabel: string;
    terms: string;
    privacy: string;
  };
  stats: {
    heading: string;
    subhead: string;
    footnote: string;
    panorama: {
      eyebrow: string;
      heading: string;
      subhead: string;
      curveHeading: string;
      marker1: string;
      marker2: string;
      marker3: string;
      marker4: string;
      marker5: string;
      factorsHeading: string;
      factor1: { title: string; body: string };
      factor2: { title: string; body: string };
      factor3: { title: string; body: string };
      mythsHeading: string;
      myth1: { myth: string; reality: string };
      myth2: { myth: string; reality: string };
      myth3: { myth: string; reality: string };
      revealCta: string;
    };
    performance: {
      eyebrow: string;
      heading: string;
      subhead: string;
      precisionHeading: string;
      timeHeading: string;
      easy: string;
      medium: string;
      hard: string;
      avgTimeUnit: string;
      generalLabel: string;
      yourLabel: string;
    };
    leaderboard: {
      heading: string;
      filterAriaLabel: string;
      tabGeneral: string;
      tabTimes: string;
      tabPercentiles: string;
      challenge: {
        heading: string;
        title: string;
        body: string;
        cta: string;
      };
    };
    patrons: { heading: string; subhead: string; top: string };
  };
  ranking: {
    heading: string;
    subhead: string;
  };
  notFound: {
    heading: string;
    subhead: string;
    cta: string;
  };
  profile: {
    loggedOutTitle: string;
    loggedOutBody: string;
    login: string;
    demoNote: string;
    iqEstimate: string;
    rank: string;
    logout: string;
    backHome: string;
  };
  themeToggle: { toLight: string; toDark: string };
  languageToggle: { switchTo: string };
  social: {
    heading: string;
    github: string;
    instagram: string;
    tiktok: string;
    discord: string;
    soon: string;
  };
};

export const dictionary: Record<Lang, Dictionary> = {
  es: {
    header: {
      navAriaLabel: "Principal",
      nav: {
        home: "Inicio",
        stats: "Estadísticas",
        ranking: "Ranking",
        performance: "Rendimiento",
      },
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
    },
    hero: {
      headline: "El límite de tu mente es el primero que nunca cuestionaste.",
      subhead:
        "Construimos IQ.Pulse para que cuestionarlo sea posible: una forma honesta de medir, entender y expandir tu potencial cognitivo.",
      play: "Jugar",
      viewRanking: "Ver el ranking",
      viewProfile: "Ver perfil",
      login: "Iniciar sesión",
      demoNote: "Demo visual — no se piden datos reales todavía.",
    },
    manifesto: {
      heading: "El creador y la misión",
      card1: {
        title: "Por qué existe",
        body: "La psicometría seria suele vivir detrás de paywalls, papers académicos o consultoras corporativas. IQ.Pulse busca lo contrario: acercar herramientas de medición cognitiva rigurosas a quien quiera usarlas, sin letra chica ni promesas vacías.",
      },
      card2: {
        title: "Quién está detrás",
        body: "Detrás de IQ.Pulse hay una sola persona, obsesionada con una pregunta simple: ¿qué tan bien entendemos realmente nuestra propia mente? No hay equipo de marketing ni ronda de inversión — hay tiempo libre, curiosidad y la convicción de que medir el potencial cognitivo debería ser accesible para cualquiera.",
      },
      card3: {
        title: "Qué busca aportar",
        body: "Esto es un trabajo en construcción, no un producto terminado. Cada prueba, cada métrica y cada línea de código se revisa en público, con la meta de aportar —aunque sea un poco— a que medir la mente deje de ser un misterio reservado para pocos.",
      },
    },
    domains: {
      heading: "Qué mide IQ.Pulse",
      subhead: "Tres dominios cognitivos centrales, medidos por separado.",
      item1: {
        title: "Razonamiento lógico",
        body: "Capacidad de identificar patrones y resolver problemas nuevos sin depender de conocimiento previo.",
      },
      item2: {
        title: "Memoria de trabajo",
        body: "Cuánta información podés retener y manipular activamente al mismo tiempo.",
      },
      item3: {
        title: "Velocidad de procesamiento",
        body: "Qué tan rápido interpretás y respondés ante información simple bajo presión de tiempo.",
      },
    },
    sustainment: {
      heading: "Modelo de sostenimiento",
      p1: "IQ.Pulse es y seguirá siendo de acceso libre. No hay planes premium ni resultados bloqueados detrás de un pago.",
      p2: "Mantener el proyecto online — servidores, dominio, tiempo de desarrollo — tiene un costo real. Por eso, quienes quieran colaborar pueden hacerlo mediante donaciones voluntarias. No es un pedido de caridad: es una forma honesta de que quienes valoran el proyecto ayuden a sostenerlo.",
      p3: "Cada aporte, sin importar el tamaño, se destina directamente a infraestructura y desarrollo. Nada más.",
    },
    donation: {
      trigger: "Invitar un café",
      title: "Invitar un café",
      subtitle: "Si te gustó el proyecto, podés apoyarlo por cualquiera de estas vías.",
      close: "Cerrar",
    },
    footer: {
      tagline: "Medición cognitiva honesta y de acceso libre, sostenida por quienes la usan.",
      navAriaLabel: "Enlaces del pie de página",
      terms: "Términos",
      privacy: "Privacidad",
    },
    stats: {
      heading: "Estadísticas",
      subhead: "Un vistazo a los números detrás de IQ.Pulse.",
      footnote:
        "Todos los datos de esta página son ilustrativos de ejemplo — todavía no existe un backend de analítica en este proyecto.",
      panorama: {
        eyebrow: "Ciencia cognitiva en general",
        heading: "Panorama",
        subhead: "Esto es ciencia general sobre la inteligencia — no son números de IQ.Pulse, son datos válidos para cualquier persona en cualquier test.",
        curveHeading: "Qué significa cada percentil",
        marker1: "Corresponde al extremo inferior de la distribución: alrededor del 14% de las personas puntúa en este rango.",
        marker2: "El tramo justo por debajo del promedio, donde se ubica cerca de un tercio de la población.",
        marker3: "El tramo justo por encima del promedio — junto con el anterior, agrupa a casi 7 de cada 10 personas.",
        marker4: "Un rendimiento notablemente por encima del promedio, propio de aproximadamente 1 de cada 7 personas.",
        marker5: "El extremo superior de la distribución: menos del 5% de la población alcanza este rango.",
        factorsHeading: "Factores que influyen",
        factor1: {
          title: "Sueño y rendimiento cognitivo",
          body: "La privación de sueño afecta de forma medible la memoria de trabajo y la velocidad de procesamiento — es uno de los factores ambientales más estudiados en la cognición.",
        },
        factor2: {
          title: "Memoria de trabajo vs. razonamiento fluido",
          body: "Son capacidades relacionadas pero distintas: la memoria de trabajo es cuánta información retenés activamente; el razonamiento fluido es tu capacidad de resolver problemas nuevos sin depender de esa información.",
        },
        factor3: {
          title: "Por qué fluctúan los resultados",
          body: "Ningún test cognitivo da un número perfectamente estable: el estrés, el cansancio y hasta la hora del día introducen variación entre una medición y otra.",
        },
        mythsHeading: "Mitos vs. realidades",
        myth1: {
          myth: "El CI es un número fijo que no cambia nunca.",
          reality: "El puntaje medido sí puede variar con la práctica, el estado de ánimo o el entorno — la capacidad subyacente es más estable que cualquier medición puntual.",
        },
        myth2: {
          myth: "Un test de CI mide qué tan inteligente sos en general.",
          reality: "Mide capacidades cognitivas específicas (razonamiento, memoria, velocidad) — no creatividad, inteligencia emocional ni habilidades prácticas.",
        },
        myth3: {
          myth: "Un solo resultado es una medición exacta y definitiva.",
          reality: "Todo test tiene un margen de error: un mismo puntaje puede variar unos puntos entre una toma y otra, por eso importa más la tendencia que un número aislado.",
        },
        revealCta: "Ver la realidad",
      },
      performance: {
        eyebrow: "Sobre el test de IQ.Pulse",
        heading: "Rendimiento",
        subhead: "A diferencia del Panorama de arriba, esto sí es específico de IQ.Pulse: cómo se comporta nuestra propia medición en la práctica.",
        precisionHeading: "Precisión promedio por dominio",
        timeHeading: "Tiempo promedio por dificultad",
        easy: "Fácil",
        medium: "Media",
        hard: "Difícil",
        avgTimeUnit: "seg. promedio",
        generalLabel: "General",
        yourLabel: "Vos",
      },
      leaderboard: {
        heading: "Tabla clasificatoria",
        filterAriaLabel: "Filtrar clasificación",
        tabGeneral: "Top general",
        tabTimes: "Mejores tiempos",
        tabPercentiles: "Mejores percentiles",
        challenge: {
          heading: "Reto del mes",
          title: "El acertijo espacial de este mes",
          body: "Un desafío mensual distinto para toda la comunidad — próximamente vas a poder resolverlo y comparar tu tiempo con el resto.",
          cta: "Próximamente",
        },
      },
      patrons: {
        heading: "Muro de mecenas",
        subhead: "Gracias a quienes colaboran con una donación, IQ.Pulse sigue online.",
        top: "Top",
      },
    },
    ranking: {
      heading: "Ranking",
      subhead: "La tabla clasificatoria y el reto del mes, en un solo lugar.",
    },
    notFound: {
      heading: "Esta página no existe",
      subhead: "El enlace puede estar roto o la página se movió de lugar.",
      cta: "Volver al inicio",
    },
    profile: {
      loggedOutTitle: "No iniciaste sesión",
      loggedOutBody:
        "Es una demo visual: no hace falta contraseña, solo activá el estado de sesión para ver cómo se vería tu perfil.",
      login: "Iniciar sesión",
      demoNote: "Perfil de demostración — no hay cuentas reales todavía.",
      iqEstimate: "CI estimado",
      rank: "Puesto en el ranking",
      logout: "Cerrar sesión",
      backHome: "Volver al inicio",
    },
    themeToggle: { toLight: "Cambiar a modo claro", toDark: "Cambiar a modo oscuro" },
    languageToggle: { switchTo: "Switch to English" },
    social: {
      heading: "Seguinos",
      github: "GitHub",
      instagram: "Instagram",
      tiktok: "TikTok",
      discord: "Discord",
      soon: "Pronto",
    },
  },
  en: {
    header: {
      navAriaLabel: "Main",
      nav: {
        home: "Home",
        stats: "Stats",
        ranking: "Ranking",
        performance: "Performance",
      },
      openMenu: "Open menu",
      closeMenu: "Close menu",
    },
    hero: {
      headline: "The limit of your mind is the first one you never questioned.",
      subhead:
        "We built IQ.Pulse to make questioning it possible: an honest way to measure, understand, and expand your cognitive potential.",
      play: "Play",
      viewRanking: "View ranking",
      viewProfile: "View profile",
      login: "Log in",
      demoNote: "Visual demo — no real data required yet.",
    },
    manifesto: {
      heading: "The creator and the mission",
      card1: {
        title: "Why it exists",
        body: "Serious psychometrics usually lives behind paywalls, academic papers, or corporate consultancies. IQ.Pulse aims for the opposite: bringing rigorous cognitive measurement tools to anyone who wants to use them, with no fine print and no empty promises.",
      },
      card2: {
        title: "Who's behind it",
        body: "Behind IQ.Pulse there's just one person, obsessed with a simple question: how well do we really understand our own minds? There's no marketing team or funding round — there's free time, curiosity, and the conviction that measuring cognitive potential should be accessible to anyone.",
      },
      card3: {
        title: "What it aims to contribute",
        body: "This is a work in progress, not a finished product. Every test, every metric, and every line of code is reviewed in public, with the goal of contributing — even a little — to making measuring the mind stop being a mystery reserved for a few.",
      },
    },
    domains: {
      heading: "What IQ.Pulse measures",
      subhead: "Three core cognitive domains, measured separately.",
      item1: {
        title: "Logical reasoning",
        body: "The ability to spot patterns and solve new problems without relying on prior knowledge.",
      },
      item2: {
        title: "Working memory",
        body: "How much information you can hold and actively manipulate at the same time.",
      },
      item3: {
        title: "Processing speed",
        body: "How quickly you interpret and respond to simple information under time pressure.",
      },
    },
    sustainment: {
      heading: "Sustainment model",
      p1: "IQ.Pulse is and will remain free to access. There are no premium plans or results locked behind a paywall.",
      p2: "Keeping the project online — servers, domain, development time — has a real cost. That's why anyone who wants to contribute can do so through voluntary donations. It's not a charity ask: it's an honest way for people who value the project to help sustain it.",
      p3: "Every contribution, no matter the size, goes directly to infrastructure and development. Nothing else.",
    },
    donation: {
      trigger: "Buy me a coffee",
      title: "Buy me a coffee",
      subtitle: "If you liked the project, you can support it through any of these options.",
      close: "Close",
    },
    footer: {
      tagline: "Honest, free-to-access cognitive measurement, sustained by the people who use it.",
      navAriaLabel: "Footer links",
      terms: "Terms",
      privacy: "Privacy",
    },
    stats: {
      heading: "Stats",
      subhead: "A look at the numbers behind IQ.Pulse.",
      footnote:
        "All the data on this page is illustrative sample data — there is no analytics backend in this project yet.",
      panorama: {
        eyebrow: "Cognitive science, in general",
        heading: "Panorama",
        subhead: "This is general science about intelligence — not IQ.Pulse's own numbers, but data that holds true for anyone on any test.",
        curveHeading: "What each percentile means",
        marker1: "The lower end of the distribution: around 14% of people score in this range.",
        marker2: "The band just below average, where close to a third of the population sits.",
        marker3: "The band just above average — together with the previous one, it groups almost 7 out of 10 people.",
        marker4: "A performance notably above average, typical of roughly 1 in 7 people.",
        marker5: "The upper end of the distribution: fewer than 5% of the population reaches this range.",
        factorsHeading: "Factors that play a role",
        factor1: {
          title: "Sleep and cognitive performance",
          body: "Sleep deprivation measurably affects working memory and processing speed — it's one of the most studied environmental factors in cognition research.",
        },
        factor2: {
          title: "Working memory vs. fluid reasoning",
          body: "These are related but distinct abilities: working memory is how much information you actively hold; fluid reasoning is your ability to solve new problems without relying on that information.",
        },
        factor3: {
          title: "Why results fluctuate",
          body: "No cognitive test gives a perfectly stable number: stress, fatigue, and even the time of day introduce variation between one measurement and the next.",
        },
        mythsHeading: "Myths vs. facts",
        myth1: {
          myth: "IQ is a fixed number that never changes.",
          reality: "The measured score can vary with practice, mood, or environment — the underlying ability is more stable than any single measurement.",
        },
        myth2: {
          myth: "An IQ test measures how smart you are overall.",
          reality: "It measures specific cognitive abilities (reasoning, memory, speed) — not creativity, emotional intelligence, or practical skills.",
        },
        myth3: {
          myth: "A single result is an exact, definitive measurement.",
          reality: "Every test has a margin of error: the same score can vary by a few points between one sitting and the next, which is why the trend matters more than any one number.",
        },
        revealCta: "See the reality",
      },
      performance: {
        eyebrow: "About the IQ.Pulse test",
        heading: "Performance",
        subhead: "Unlike the Panorama above, this part IS specific to IQ.Pulse: how our own measurement behaves in practice.",
        precisionHeading: "Average precision by domain",
        timeHeading: "Average time by difficulty",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        avgTimeUnit: "sec. avg",
        generalLabel: "General",
        yourLabel: "You",
      },
      leaderboard: {
        heading: "Leaderboard",
        filterAriaLabel: "Filter leaderboard",
        tabGeneral: "Top overall",
        tabTimes: "Best times",
        tabPercentiles: "Best percentiles",
        challenge: {
          heading: "Challenge of the month",
          title: "This month's spatial puzzle",
          body: "A different monthly challenge for the whole community — soon you'll be able to solve it and compare your time with everyone else.",
          cta: "Coming soon",
        },
      },
      patrons: {
        heading: "Wall of patrons",
        subhead: "Thanks to everyone who contributes a donation, IQ.Pulse stays online.",
        top: "Top",
      },
    },
    ranking: {
      heading: "Ranking",
      subhead: "The leaderboard and the challenge of the month, in one place.",
    },
    notFound: {
      heading: "This page doesn't exist",
      subhead: "The link might be broken, or the page moved somewhere else.",
      cta: "Back to home",
    },
    profile: {
      loggedOutTitle: "You're not logged in",
      loggedOutBody:
        "It's a visual demo: no password needed, just turn on the session state to see what your profile would look like.",
      login: "Log in",
      demoNote: "Demo profile — no real accounts yet.",
      iqEstimate: "Estimated IQ",
      rank: "Leaderboard position",
      logout: "Log out",
      backHome: "Back to home",
    },
    themeToggle: { toLight: "Switch to light mode", toDark: "Switch to dark mode" },
    languageToggle: { switchTo: "Cambiar a español" },
    social: {
      heading: "Follow us",
      github: "GitHub",
      instagram: "Instagram",
      tiktok: "TikTok",
      discord: "Discord",
      soon: "Soon",
    },
  },
};
