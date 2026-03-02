export const lightTheme = {
    mode: "light",
  
    // Core
    background: "#fdeff2",   // your Home PINK background
    card: "#ffffff",
    text: "#222222",
    subtleText: "#6c6c6c",
    border: "#E5E5E5",
  
    // Home accents
    accent: "#ff2d95",
  
    // Status colours
    success: "#19b46b",
    muted: "#9b9b9b",
  
    // Section colours (keep your current section vibe)
    reflect: {
      tint: "#d8d3ff",
      title: "#8f79ea",
      inputBg: "#f6edff",
      placeholder: "#b9a5ff",
      button: "#b49cff",
    },
    grow: {
      tint: "#cdeed6",
      title: "#9fe7c0",
      inputBg: "#e8fbf1",
      placeholder: "#b7e8d0",
      button: "#9fe7c0",
      inputText: "#2b6a54",
      inputBorder: "#c9f3df",
    },
    thrive: {
      tint: "#edc1cf",
      title: "#f06292",
      panelBg: "#fde2ec",
      pillBg: "#ffe0ec",
      iconCircleBg: "#fff0f7",
      
      chevBg: "#ffe0ec",
      pillBorder: "#ffd0e2",
      pillText: "#b56b87",

      chipBg: "#fde3ee",
      chipBorder: "#f6bfd4",

      bubbleBg: "#f7d1df",
      userBubbleBg: "#f2f2f2",

      sendBtnBg: "#f8c7da",
      placeholder: "#9a9a9a",

      disclaimerText: "#8a8a8a",
      footerBg: "#f8eaf1",
      regenerateBtnBg: "#e5b3c7",
    },
  };
  
  export const darkTheme = {
    mode: "dark",
  
    background: "#0B0B0F",
    card: "#16161D",
    text: "#FFFFFF",
    subtleText: "#B9BAC4",
    border: "#2A2A35",
  
    accent: "#ff4aa8",
  
    success: "#35d07f",
    muted: "#8b8f9a",
  
    reflect: {
      tint: "#3b3458",
      title: "#c9b9ff",
      inputBg: "#221d33",
      placeholder: "#8c7ec1",
      button: "#7d69c8",
    },
    grow: {
      tint: "#20392f",
      title: "#8fe3bc",
      inputBg: "#183026",
      placeholder: "#6cae92",
      button: "#3bbf88",
      inputText: "#bff3dc",
      inputBorder: "#244b3b",
    },
    thrive: {
      tint: "#3a2430",
      title: "#ff78a8",
      panelBg: "#2b1820",
      pillBg: "#3a2530",
      iconCircleBg: "#2a1a22",

      chevBg: "#3a2530",
      pillBorder: "#4b2b38",
      pillText: "#d7a9bc",

      chipBg: "#2b1820",
      chipBorder: "#4b2b38",

      bubbleBg: "#3a2430",
      userBubbleBg: "#1c1c24",

      sendBtnBg: "#4b2b38",
      placeholder: "#8b8f9a",

      disclaimerText: "#B9BAC4",
      footerBg: "#22131a",
      regenerateBtnBg: "#5a3342",
    },
  };
  
  export type AppTheme = typeof lightTheme;