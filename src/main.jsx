import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { useAuthStore } from "./context/AuthStore.jsx";
import {
  // useQuery,
  // useMutation,
  // useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

// Wrapper para inicializar autenticación
function AppWrapper() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    // Inicializar sesión al cargar la aplicación
    initializeAuth();
  }, [initializeAuth]);

  return <App />;
}

export { AppWrapper };

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppWrapper />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
