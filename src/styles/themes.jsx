const createTheme = (mode) => {
  const isDark = mode === "dark";

  const vars = {
    // Paleta detalles (claro -> oscuro)
    "--palette-detail-0": "#FFFFFF",
    "--palette-detail-1": "#EEF4F7",
    "--palette-detail-2": "#CFE2E8",
    "--palette-detail-3": "#B0CFD9",
    "--palette-detail-4": "#99C1CE", // Principal
    "--palette-detail-5": "#72A9BB",
    "--palette-detail-6": "#5396AC",
    "--palette-detail-7": "#447B8D",
    "--palette-detail-8": "#35606E",
    "--palette-detail-9": "#26454F",
    "--palette-detail-10": "#172A30",
    "--palette-detail-11": "#080F11",

    // Sombras paleta de detalles (claro -> oscuro)
    "--palette-shadow-detail-1": "#99C1CE",
    "--palette-shadow-detail-2": "#8AAEB9",
    "--palette-shadow-detail-3": "#7B9BA5",
    "--palette-shadow-detail-4": "#6D8891",
    "--palette-shadow-detail-5": "#5F767E",
    "--palette-shadow-detail-6": "#51656B",
    "--palette-shadow-detail-7": "#445359",
    "--palette-shadow-detail-8": "#374347",
    "--palette-shadow-detail-9": "#2B3336",
    "--palette-shadow-detail-10": "#1F2426",
    "--palette-shadow-detail-11": "#131617",

    // Tokens semánticos
    "--color-primary": isDark
      ? "var(--palette-detail-8)"
      : "var(--palette-detail-4)",

    "--bg-page": isDark
      ? "var(--palette-detail-11)"
      : "var(--palette-detail-1)",
    "--bg-surface": isDark
      ? "var(--palette-shadow-detail-11)"
      : "var(--palette-detail-0)",
    "--bg-surface-muted": isDark
      ? "var(--palette-detail-9)"
      : "var(--palette-detail-2)",

    "--text-primary": isDark
      ? "var(--palette-detail-1)"
      : "var(--palette-detail-10)",
    "--text-secondary": isDark
      ? "var(--palette-detail-5)"
      : "var(--palette-detail-8)",

    "--border-subtle": isDark
      ? "var(--palette-detail-9)"
      : "var(--palette-detail-2)",
    "--border-strong": isDark
      ? "var(--palette-detail-10)"
      : "var(--palette-detail-3)",

    "--color-accent": isDark
      ? "var(--palette-detail-7)"
      : "var(--palette-detail-8)",
    "--color-accent-strong": isDark
      ? "var(--palette-detail-9)"
      : "var(--palette-detail-5)",
    "--color-accent-soft": isDark
      ? "var(--palette-detail-10)"
      : "var(--palette-detail-2)",

    // Semánticos de estado (por ahora mantenemos los existentes, pero centralizados)
    "--color-danger": "#F54E41",
    "--color-success": "#53B257",
    "--color-warning": "#FFC107",

    "--bg-success-soft": "rgba(83, 178, 87, 0.15)",
    "--bg-danger-soft": "rgba(245, 78, 65, 0.15)",
    "--bg-warning-soft": "rgba(255, 193, 7, 0.15)",
    "--bg-accent-soft": isDark
      ? "--palette-detail-8"
      : "--palette-detail-3",

    // Superficies auxiliares
    "--bg-sidebar-rail": isDark
      ? "var(--palette-detail-9)"
      : "var(--palette-detail-2)",

    // Sombras / overlays
    "--overlay-backdrop": isDark
      ? "rgba(8, 11, 17, 0.7)"
      : "rgba(8, 11, 17, 0.5)",

    "--shadow-elev-1": isDark
      ? "0 6px 18px #00000066"
      : "0 6px 18px #13141714",
    "--shadow-elev-2": isDark
      ? "0 10px 22px #00000080"
      : "0 10px 22px #1314171f",
  };

  return {
    mode,
    vars,

    // Keys usadas hoy en el código (compat)
    bgtotal: "var(--bg-page)",
    bg: "var(--bg-surface)",
    bgAlpha: "var(--bg-surface-muted)",
    bgtgderecha: "var(--bg-sidebar-rail)",

    text: "var(--text-primary)",
    textsecundary: "var(--text-secondary)",

    color1: "var(--color-accent)",
    color2: "var(--border-subtle)",
    colorError: "var(--color-danger)",

    // Sidebar usa bg3/bg4/bg5/bg6
    bg3: "var(--palette-shadow-detail-6)",
    bg4: "var(--border-subtle)",
    bg5: "var(--color-accent-strong)",
    bg6: "var(--color-accent-soft)",

    // Otros (por si hay pantallas que los lean)
    bgcards: "var(--bg-surface)",
    colortitlecard: "var(--text-primary)",
    colorsubtitlecard: "var(--text-secondary)",
    colorSubtitle: "var(--text-secondary)",
    colorScroll: "var(--border-strong)",
  };
};

export const Light = createTheme("light");
export const Dark = createTheme("dark");