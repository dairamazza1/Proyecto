import { useState } from "react";
import styled from "styled-components";
import { useAuthStore } from "../../store/AuthStore";
import { apiService } from "../../api/apiService";

export function HomeTemplate() {
  const { cerrarSesion } = useAuthStore();
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCallBackend = async () => {
    setLoading(true);
    const result = await apiService.sendGreeting('Vite');
    
    if (result.success) {
      setResponse(result.data.message);
      console.log(result.data);
    } else {
      setResponse(`Error: ${result.error}`);
    }
    setLoading(false);
  };

  return (
    <Container>
      <span>Home template</span>
      <button onClick={cerrarSesion}>cerrar</button>
      
      <TestBackendSection>
        <h3>Probar Backend</h3>
        <button onClick={handleCallBackend} disabled={loading}>
          {loading ? 'Cargando...' : 'Llamar Backend'}
        </button>
        {response && <ResponseText>{response}</ResponseText>}
      </TestBackendSection>
    </Container>
  );
}
const Container = styled.div`
  height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
`;

const TestBackendSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  max-width: 400px;

  button {
    padding: 0.5rem 1rem;
    background: #0070f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background: #0051cc;
    }

    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }
`;

const ResponseText = styled.p`
  background: #f0f0f0;
  padding: 1rem;
  border-radius: 4px;
  margin: 0;
`;
