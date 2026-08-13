export type Lang = "es" | "en";

export type Dictionary = {
  header: {
    navAriaLabel: string;
    nav: { home: string; play: string; ranking: string; performance: string };
    openMenu: string;
    closeMenu: string;
    preferences: string;
    skipToContent: string;
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
    performance: {
      eyebrow: string;
      heading: string;
      subhead: string;
      precisionHeading: string;
      precisionSubhead: string;
      timeHeading: string;
      timeSubhead: string;
      easy: string;
      medium: string;
      hard: string;
      avgTimeUnit: string;
      generalLabel: string;
      yourLabel: string;
      lockedTitle: string;
      lockedCta: string;
    };
    leaderboard: {
      heading: string;
      filterAriaLabel: string;
      tabGeneral: string;
      tabTimes: string;
      tabPercentiles: string;
      tabStreaks: string;
      streakUnit: string;
      pointsUnit: string;
      timeUnit: string;
      loading: string;
      empty: string;
      challenge: {
        heading: string;
        title: string;
        body: string;
        cellLabel: string;
        startCta: string;
        roundLabel: string;
        mistakesLabel: string;
        solvedLabel: string;
        failedLabel: string;
        nextInLabel: string;
        thisWeekLabel: string;
        gameNames: {
          oddHexagon: string;
          mirror: string;
          sequence: string;
          flashCount: string;
        };
        mirrorHint: string;
        sequenceRevealHint: string;
        sequenceAnswerHint: string;
        flashCountRevealHint: string;
        flashCountAnswerHint: string;
      };
    };
    patrons: { heading: string; subhead: string; top: string };
  };
  ranking: {
    heading: string;
    subhead: string;
  };
  quiz: {
    reasoningTitle: string;
    reasoningDescription: string;
    memoryTitle: string;
    memoryDescription: string;
    speedTitle: string;
    speedDescription: string;
    pathfinderTitle: string;
    pathfinderDescription: string;
    pathfinderInstructions: string;
    wordBurstTitle: string;
    wordBurstDescription: string;
    wordBurstMemorize: string;
    wordBurstRecall: string;
    dailyHeading: string;
    dailyProgressLabel: string;
    dailyDoneToday: string;
    startDailyCta: string;
    freePracticeHeading: string;
    freePracticeSubhead: string;
    streakDaysLabel: string;
    exitToMenuCta: string;
    timeRemainingLabel: string;
    matrixInstructions: string;
    digitSpanMemorize: string;
    digitSpanRecall: string;
    digitSpanClear: string;
    digitSpanSubmit: string;
    digitSpanCorrectSequence: string;
    stroopInstructions: string;
    resultsHeading: string;
    resultsIqLabel: string;
    resultsRadarLabel: string;
    resultsPercentileLabel: string;
    resultsBetterThanLabel: string;
    resultsBetterThanSuffix: string;
    resultsTimeLabel: string;
    resultsPointsLabel: string;
    resultsBody: string;
    iqClassifications: {
      verySuperior: string;
      superior: string;
      highAverage: string;
      average: string;
      lowAverage: string;
      borderline: string;
      low: string;
    };
    playAgainCta: string;
    viewProfileCta: string;
    sessionStartError: string;
    resultError: string;
    copyResultCta: string;
    copiedLabel: string;
  };
  notFound: {
    heading: string;
    subhead: string;
    cta: string;
  };
  legal: {
    updatedOnLabel: string;
  };
  profile: {
    heading: string;
    loggedOutTitle: string;
    loggedOutBody: string;
    login: string;
    demoNote: string;
    iqEstimate: string;
    rank: string;
    logout: string;
    backHome: string;
    badgeHeading: string;
    badgeTitle: string;
    badgeBody: string;
    viewRankingCta: string;
    viewPerformanceCta: string;
    headerAriaLabel: string;
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
        play: "Jugar",
        ranking: "Ranking",
        performance: "Rendimiento",
      },
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
      preferences: "Preferencias",
      skipToContent: "Saltar al contenido principal",
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
      performance: {
        eyebrow: "Sobre el test de IQ.Pulse",
        heading: "Rendimiento",
        subhead: "Estamos afinando cómo mostrar tu comparación con el resto — vuelve pronto.",
        precisionHeading: "Precisión promedio por dominio",
        precisionSubhead: "% de respuestas correctas",
        timeHeading: "Tiempo promedio por dificultad",
        timeSubhead: "Menos tiempo es mejor",
        easy: "Fácil",
        medium: "Media",
        hard: "Difícil",
        avgTimeUnit: "seg.",
        generalLabel: "General",
        yourLabel: "Vos",
        lockedTitle: "Iniciá sesión para ver tus stats",
        lockedCta: "Iniciar sesión",
      },
      leaderboard: {
        heading: "Tabla clasificatoria",
        filterAriaLabel: "Filtrar clasificación",
        tabGeneral: "Top general",
        tabTimes: "Mejores tiempos",
        tabPercentiles: "Mejores percentiles",
        tabStreaks: "Rachas",
        streakUnit: "días",
        pointsUnit: "pts",
        timeUnit: "seg",
        loading: "Cargando…",
        empty: "Todavía no hay resultados — jugá el desafío diario para aparecer acá.",
        challenge: {
          heading: "Reto de la semana",
          title: "El acertijo espacial de esta semana",
          body: "Encontrá la figura que no encaja, 3 veces seguidas. Tenés 10 segundos por ronda y hasta 3 errores en total.",
          cellLabel: "Casilla",
          startCta: "Iniciar desafío semanal",
          roundLabel: "Ronda",
          mistakesLabel: "Errores",
          solvedLabel: "¡Completaste el reto de esta semana!",
          failedLabel: "No llegaste esta vez.",
          nextInLabel: "Próximo reto en",
          thisWeekLabel: "Esta semana:",
          gameNames: {
            oddHexagon: "Figura distinta",
            mirror: "Espejo",
            sequence: "Secuencia",
            flashCount: "Conteo veloz",
          },
          mirrorHint: "Encontrá la figura espejada, no solo rotada.",
          sequenceRevealHint: "Memorizá el orden.",
          sequenceAnswerHint: "Repetilo en el mismo orden.",
          flashCountRevealHint: "Contá rápido las figuras.",
          flashCountAnswerHint: "¿Cuántas viste?",
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
    quiz: {
      reasoningTitle: "Matriz de patrones",
      reasoningDescription: "Encontrá el patrón numérico y completá la grilla.",
      memoryTitle: "Retención de dígitos",
      memoryDescription: "Memorizá una secuencia y repetila en orden.",
      speedTitle: "Stroop",
      speedDescription: "Reaccioná rápido al color real, no al que dice la palabra.",
      pathfinderTitle: "Camino óptimo",
      pathfinderDescription: "Encontrá el camino que llega a la meta sin cruzar el obstáculo.",
      pathfinderInstructions: "Elegí el camino que llega a la bandera sin pasar por la X.",
      wordBurstTitle: "Ráfaga de palabras",
      wordBurstDescription: "Memorizá las palabras que aparecen y luego marcalas entre las opciones.",
      wordBurstMemorize: "Memorizá estas palabras",
      wordBurstRecall: "Tocá todas las que viste",
      dailyHeading: "Entrenamiento de hoy",
      dailyProgressLabel: "completados hoy",
      dailyDoneToday: "Completaste el entrenamiento de hoy",
      startDailyCta: "Iniciar desafío diario",
      freePracticeHeading: "Práctica libre",
      freePracticeSubhead: "Elegí un juego suelto para practicar un área puntual.",
      streakDaysLabel: "días de racha",
      exitToMenuCta: "← Volver a elegir",
      timeRemainingLabel: "Tiempo restante",
      matrixInstructions: "Encontrá el número que falta en la secuencia.",
      digitSpanMemorize: "Memorizá esta secuencia",
      digitSpanRecall: "Escribila en el mismo orden",
      digitSpanClear: "Borrar",
      digitSpanSubmit: "Confirmar",
      digitSpanCorrectSequence: "Era:",
      stroopInstructions: "Tocá el color de la TINTA, no lo que dice la palabra.",
      resultsHeading: "Resultado",
      resultsIqLabel: "CI estimado",
      resultsRadarLabel: "Por dominio",
      resultsPercentileLabel: "Percentil",
      resultsBetterThanLabel: "Mejor que el",
      resultsBetterThanSuffix: "de las personas",
      iqClassifications: {
        verySuperior: "Muy superior",
        superior: "Superior",
        highAverage: "Promedio alto",
        average: "Promedio",
        lowAverage: "Promedio bajo",
        borderline: "Límite",
        low: "Muy bajo",
      },
      resultsTimeLabel: "Tiempo total",
      resultsPointsLabel: "Puntos de hoy",
      resultsBody: "Resultado ilustrativo — mientras el motor de quiz sigue en construcción, este número no reemplaza un test cognitivo validado.",
      playAgainCta: "Jugar de nuevo",
      viewProfileCta: "Ver tu perfil",
      sessionStartError: "No se pudo conectar con la base de datos.",
      resultError: "No se pudo calcular el resultado final.",
      copyResultCta: "Copiar",
      copiedLabel: "Copiado",
    },
    notFound: {
      heading: "Esta página no existe",
      subhead: "El enlace puede estar roto o la página se movió de lugar.",
      cta: "Volver al inicio",
    },
    legal: {
      updatedOnLabel: "Última actualización",
    },
    profile: {
      heading: "Tu perfil",
      loggedOutTitle: "No iniciaste sesión",
      loggedOutBody:
        "Es una demo visual: no hace falta contraseña, solo activá el estado de sesión para ver cómo se vería tu perfil.",
      login: "Iniciar sesión",
      demoNote: "Perfil de demostración — no hay cuentas reales todavía.",
      iqEstimate: "CI estimado",
      rank: "Puesto en el ranking",
      logout: "Cerrar sesión",
      backHome: "Volver al inicio",
      badgeHeading: "Logros",
      badgeTitle: "Top 10 en Rendimiento",
      badgeBody: "Entre los mejores puntajes registrados en la comparación de rendimiento.",
      viewRankingCta: "Ver tu posición en el ranking",
      viewPerformanceCta: "Ver tu comparación de rendimiento",
      headerAriaLabel: "Ir a tu perfil",
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
        play: "Play",
        ranking: "Ranking",
        performance: "Performance",
      },
      openMenu: "Open menu",
      closeMenu: "Close menu",
      preferences: "Preferences",
      skipToContent: "Skip to main content",
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
      performance: {
        eyebrow: "About the IQ.Pulse test",
        heading: "Performance",
        subhead: "We're fine-tuning how to show your comparison against everyone else — check back soon.",
        precisionHeading: "Average precision by domain",
        precisionSubhead: "% of correct answers",
        timeHeading: "Average time by difficulty",
        timeSubhead: "Less time is better",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        avgTimeUnit: "sec",
        generalLabel: "General",
        yourLabel: "You",
        lockedTitle: "Log in to see your stats",
        lockedCta: "Log in",
      },
      leaderboard: {
        heading: "Leaderboard",
        filterAriaLabel: "Filter leaderboard",
        tabGeneral: "Top overall",
        tabTimes: "Best times",
        tabPercentiles: "Best percentiles",
        tabStreaks: "Streaks",
        streakUnit: "days",
        pointsUnit: "pts",
        timeUnit: "sec",
        loading: "Loading…",
        empty: "No results yet — play the daily challenge to show up here.",
        challenge: {
          heading: "Challenge of the week",
          title: "This week's spatial puzzle",
          body: "Find the odd shape, 3 times in a row. You've got 10 seconds per round and up to 3 mistakes total.",
          cellLabel: "Cell",
          startCta: "Start weekly challenge",
          roundLabel: "Round",
          mistakesLabel: "Mistakes",
          solvedLabel: "You completed this week's challenge!",
          failedLabel: "Not this time.",
          nextInLabel: "Next challenge in",
          thisWeekLabel: "This week:",
          gameNames: {
            oddHexagon: "Odd shape out",
            mirror: "Mirror",
            sequence: "Sequence",
            flashCount: "Flash count",
          },
          mirrorHint: "Find the mirrored shape, not just a rotated one.",
          sequenceRevealHint: "Memorize the order.",
          sequenceAnswerHint: "Repeat it in the same order.",
          flashCountRevealHint: "Count the shapes fast.",
          flashCountAnswerHint: "How many did you see?",
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
    quiz: {
      reasoningTitle: "Pattern matrix",
      reasoningDescription: "Find the numeric pattern and fill the grid.",
      memoryTitle: "Digit span",
      memoryDescription: "Memorize a sequence and repeat it in order.",
      speedTitle: "Stroop",
      speedDescription: "React fast to the real color, not what the word says.",
      pathfinderTitle: "Best path",
      pathfinderDescription: "Find the path that reaches the goal without crossing the obstacle.",
      pathfinderInstructions: "Pick the path that reaches the flag without crossing the X.",
      wordBurstTitle: "Word Burst",
      wordBurstDescription: "Memorize the words that appear, then tap them out of a larger grid.",
      wordBurstMemorize: "Memorize these words",
      wordBurstRecall: "Tap all the ones you saw",
      dailyHeading: "Today's training",
      dailyProgressLabel: "completed today",
      dailyDoneToday: "You've completed today's training",
      startDailyCta: "Start daily challenge",
      freePracticeHeading: "Free practice",
      freePracticeSubhead: "Pick a single game to practice one area.",
      streakDaysLabel: "day streak",
      exitToMenuCta: "← Back to menu",
      timeRemainingLabel: "Time remaining",
      matrixInstructions: "Find the missing number in the sequence.",
      digitSpanMemorize: "Memorize this sequence",
      digitSpanRecall: "Type it in the same order",
      digitSpanClear: "Clear",
      digitSpanSubmit: "Submit",
      digitSpanCorrectSequence: "It was:",
      stroopInstructions: "Tap the INK color, not what the word says.",
      resultsHeading: "Result",
      resultsIqLabel: "Estimated IQ",
      resultsRadarLabel: "By domain",
      resultsPercentileLabel: "Percentile",
      resultsBetterThanLabel: "Better than",
      resultsBetterThanSuffix: "of people",
      iqClassifications: {
        verySuperior: "Very superior",
        superior: "Superior",
        highAverage: "High average",
        average: "Average",
        lowAverage: "Low average",
        borderline: "Borderline",
        low: "Very low",
      },
      resultsTimeLabel: "Total time",
      resultsPointsLabel: "Today's points",
      resultsBody: "Illustrative result — while the quiz engine is still being built, this number doesn't replace a validated cognitive test.",
      playAgainCta: "Play again",
      viewProfileCta: "View your profile",
      sessionStartError: "Couldn't connect to the database.",
      resultError: "Couldn't calculate the final result.",
      copyResultCta: "Copy",
      copiedLabel: "Copied",
    },
    notFound: {
      heading: "This page doesn't exist",
      subhead: "The link might be broken, or the page moved somewhere else.",
      cta: "Back to home",
    },
    legal: {
      updatedOnLabel: "Last updated",
    },
    profile: {
      heading: "Your profile",
      loggedOutTitle: "You're not logged in",
      loggedOutBody:
        "It's a visual demo: no password needed, just turn on the session state to see what your profile would look like.",
      login: "Log in",
      demoNote: "Demo profile — no real accounts yet.",
      iqEstimate: "Estimated IQ",
      rank: "Leaderboard position",
      logout: "Log out",
      backHome: "Back to home",
      badgeHeading: "Achievements",
      badgeTitle: "Top 10 in Performance",
      badgeBody: "Among the top scores recorded in the performance comparison.",
      viewRankingCta: "View your ranking position",
      viewPerformanceCta: "View your performance comparison",
      headerAriaLabel: "Go to your profile",
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
