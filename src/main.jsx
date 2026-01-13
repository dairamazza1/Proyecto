import { StrictMode, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter, useLocation } from "react-router-dom";
import { useAuthStore } from "./context/AuthStoreWithPermissions.jsx";
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
  const { pathname } = useLocation();
  const initialPath = useRef(null);

  if (initialPath.current === null) {
    initialPath.current = pathname;
  }

  useEffect(() => {
    // Inicializar sesi?n al cargar la aplicaci?n
    initializeAuth({
      skipProfileCheck: initialPath.current === "/set-password",
    });
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


