// import styled from "styled-components";
// import {
//   Title,
//   Btn1,
//   Buscador,
//   useModulesStore,
//   TablaCategorias,
//   RegistrarCategorias,
// } from "../../index";
// import { v } from "../../styles/variables";
// import { useState } from "react";
// export function CategoriesTemplate() {
//   const [openRegistro, SetopenRegistro] = useState(false);
//   const { dataModules, setBuscador } = useModulesStore();
//   const [accion,setAccion] = useState("");
//   const [dataSelect,setdataSelect] = useState("");

//   function nuevoRegistro(){
//     SetopenRegistro(!openRegistro);
//     setAccion("Nuevo");
//     setdataSelect([]);
//   }
//   return (
//     <Container>
//       {/* <section className="area1">area1</section> */}

//       {
        
//        openRegistro && (<RegistrarCategorias onClose={() => SetopenRegistro(!openRegistro) } dataSelect={dataSelect} accion = {accion}/>)
      
//       }

//       <section className="area2">
//         <Title>Categorias</Title>
//         <Btn1
//           funcion={nuevoRegistro}
//           bgcolor={v.colorPrincipal}
//           titulo="nuevo"
//           icono={<v.iconoagregar />}
//         ></Btn1>
//       </section>
//       <section className="area3">
//         <Buscador setBuscador={setBuscador}></Buscador>
//       </section>
//       <section className="main">
        
        
//         <TablaCategorias setdataSelect={setdataSelect} setAccion={setAccion} SetopenRegistro={SetopenRegistro} data={dataModules} />
//       </section>
//     </Container>
//   );
// }
// const Container = styled.div`
//   height: calc(100dvh - 30px); //altura completa de la pantalla
//   padding: 15px; //espacio interno
//   display: grid; //establece un contenedor de cuadrícula
//   grid-template: 
//   /* "area1" 100px  */
//     "area2" 60px
//     "area3" 60px
//     "main" auto; //define las áreas de la cuadrícula

//   .area1 {
//     grid-area: area1;
//     /* background-color: #bc99ce; */
//   }
//   .area2 {
//     grid-area: area2;
//     /* background-color: #9fce99; */
//     display: flex; //establece un contenedor flexible
//     justify-content: end; //alinear elementos al final del contenedor
//     align-items: center; //centrar elementos verticalmente
//     gap: 15px; //espacio entre elementos
//   }
//   .area3 {
//     grid-area: area3;
//     /* background-color: #bc99ce; */
//     display: flex; //establece un contenedor flexible
//     justify-content: end; //alinear elementos al final del contenedor
//     align-items: center; //centrar elementos verticalmente
//   }
//   .main {
//     grid-area: main;
//     /* background-color: #99a6ce; */
//   }
// `;
