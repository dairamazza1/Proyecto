import { useState } from "react";
import styled from "styled-components";
import {
  Btn1,
  ModalCambiosForm,
  TablaCambios,
  getCambiosByEmpleadoId,
  deleteCambio,
  Spinner1,
  useCompanyStore,
} from "../../index";
import { usePermissions } from "../../hooks/usePermissions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v } from "../../styles/variables";
import Swal from "sweetalert2";

export function CambiosSection({ empleadoId, title = "Cambios de turnos" }) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedCambio, setSelectedCambio] = useState(null);
  const { dataCompany } = useCompanyStore();
  const queryClient = useQueryClient();
  
  // Hook de permisos
  const { canCreate } = usePermissions();
  
  const empresaNombre =
    dataCompany?.name ||
    dataCompany?.business_name ||
    dataCompany?.razon_social ||
    dataCompany?.nombre ||
    "Empresa";

  const { data, isLoading, error } = useQuery({
    queryKey: ["cambios", empleadoId],
    queryFn: () => getCambiosByEmpleadoId(empleadoId),
    enabled: !!empleadoId,
    refetchOnWindowFocus: false,
  });

  const handleNuevo = () => {
    setSelectedCambio(null);
    setOpenModal(true);
  };

  const handleEditar = (cambio) => {
    setSelectedCambio(cambio);
    setOpenModal(true);
  };

  const { mutate: doEliminar } = useMutation({
    mutationFn: deleteCambio,
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err?.message || "Error al eliminar cambio.",
      });
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "Cambio eliminado",
        text: "Se elimino el cambio.",
      });
      queryClient.invalidateQueries({ queryKey: ["cambios", empleadoId] });
    },
  });

  const handleEliminar = (cambio) => {
    Swal.fire({
<<<<<<< HEAD
      title: "ÂEstas seguro(a)?",
=======
      title: "�Estas seguro(a)?",
>>>>>>> permisos
      text: "Una vez eliminado, no podras recuperar este registro.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, eliminar",
    }).then((result) => {
      if (result.isConfirmed) {
        doEliminar(cambio.id);
      }
    });
  };

  if (isLoading) {
    return <Spinner1 />;
  }

  if (error) {
    return <span>ha ocurrido un error: {error.message}</span>;
  }

  return (
    <Section>
      <div className="sectionHeader">
<<<<<<< HEAD
        <h3>{title}</h3>
        <Btn1
          icono={<v.iconoagregar />}
          titulo="nuevo"
          bgcolor={v.colorPrincipal}
          funcion={handleNuevo}
        />
=======
        <h3>Cambios de turnos</h3>
        {canCreate('cambios') && (
          <Btn1
            icono={<v.iconoagregar />}
            titulo="nuevo"
            bgcolor={v.colorPrincipal}
            funcion={handleNuevo}
          />
        )}
>>>>>>> permisos
      </div>

      {data?.length ? (
        <TablaCambios
          data={data}
          onEdit={handleEditar}
          onDelete={handleEliminar}
          empresaNombre={empresaNombre}
        />
      ) : (
        <EmptyState>Sin registros por el momento.</EmptyState>
      )}

      {openModal && (
        <ModalCambiosForm
          empleadoId={empleadoId}
          cambio={selectedCambio}
          onClose={() => setOpenModal(false)}
        />
      )}
    </Section>
  );
}

const Section = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  display: grid;
  gap: 14px;

  .sectionHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
`;

const EmptyState = styled.div`
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed ${({ theme }) => theme.color2};
  color: ${({ theme }) => theme.textsecundary};
  text-align: center;
`;


