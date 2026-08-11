export type Lang = "es" | "en";

export type Dictionary = {
  header: {
    nav: { home: string; stats: string };
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
    viewRanking: string;
    collaborate: string;
    terms: string;
    privacy: string;
  };
  floatingBar: { viewStats: string };
  stats: {
    heading: string;
    subhead: string;
    footnote: string;
    metrics: {
      heading: string;
      avgIQ: string;
      testsCompleted: string;
      trend: string;
      distribution: string;
    };
    leaderboard: {
      heading: string;
      tabGeneral: string;
      tabTimes: string;
      tabPercentiles: string;
    };
    patrons: { heading: string; subhead: string; top: string };
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
      nav: { home: "Inicio", stats: "Estadísticas" },
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
      viewRanking: "Ver ranking",
      collaborate: "Colaborar",
      terms: "Términos",
      privacy: "Privacidad",
    },
    floatingBar: { viewStats: "Ver stats" },
    stats: {
      heading: "Estadísticas",
      subhead: "Un vistazo a los números detrás de IQ.Pulse.",
      footnote:
        "Todos los datos de esta página son ilustrativos de ejemplo — todavía no existe un backend de analítica en este proyecto.",
      metrics: {
        heading: "Panel de métricas generales",
        avgIQ: "CI medio registrado",
        testsCompleted: "Pruebas realizadas",
        trend: "últimas semanas",
        distribution: "Distribución de percentiles global",
      },
      leaderboard: {
        heading: "Tabla clasificatoria",
        tabGeneral: "Top general",
        tabTimes: "Mejores tiempos",
        tabPercentiles: "Mejores percentiles",
      },
      patrons: {
        heading: "Muro de mecenas",
        subhead: "Gracias a quienes colaboran con una donación, IQ.Pulse sigue online.",
        top: "Top",
      },
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
      nav: { home: "Home", stats: "Stats" },
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
      viewRanking: "View ranking",
      collaborate: "Support",
      terms: "Terms",
      privacy: "Privacy",
    },
    floatingBar: { viewStats: "View stats" },
    stats: {
      heading: "Stats",
      subhead: "A look at the numbers behind IQ.Pulse.",
      footnote:
        "All the data on this page is illustrative sample data — there is no analytics backend in this project yet.",
      metrics: {
        heading: "General metrics panel",
        avgIQ: "Average recorded IQ",
        testsCompleted: "Tests completed",
        trend: "past weeks",
        distribution: "Global percentile distribution",
      },
      leaderboard: {
        heading: "Leaderboard",
        tabGeneral: "Top overall",
        tabTimes: "Best times",
        tabPercentiles: "Best percentiles",
      },
      patrons: {
        heading: "Wall of patrons",
        subhead: "Thanks to everyone who contributes a donation, IQ.Pulse stays online.",
        top: "Top",
      },
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
