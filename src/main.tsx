import { createRoot } from "react-dom/client";
import "./index.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { LanguageProvider } from "./context/LanguageContext.tsx";
import { CalendarProvider } from "./context/CalendarContext.tsx";

// Register service worker for offline + instant navigation support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Apply saved font size before first render
const FONT_SIZE_MAP: Record<string, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
  xlarge: "20px",
};
const savedFontSize = localStorage.getItem("wms_font_size") || "medium";
document.documentElement.style.setProperty("--base-font-size", FONT_SIZE_MAP[savedFontSize] ?? "16px");

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <LanguageProvider>
      <CalendarProvider>
        <AuthProvider>
          <AppWrapper>
            <App />
          </AppWrapper>
        </AuthProvider>
      </CalendarProvider>
    </LanguageProvider>
  </ThemeProvider>,
);
