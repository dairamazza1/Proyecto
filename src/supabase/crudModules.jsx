import Swal from "sweetalert2";
import { supabase } from "../index";

const table = "module";
export async function InsertModule(p, file) {
  //no se debe repetir la descripcion del modulo/categoría  a menos que haya sucursal con las mismas categorias. en una misma suc no repite
    const { error, data } = await supabase.rpc("insertmodules", p);
console.log(p);

  
//   const pt = {
//   "_name": "test",
//   "_icon": "-",
//   "_id_company": 1,
//   "_color": "#000000"
// }
//  const { error, data } = await supabase.rpc("insertmodules", pt);




  if (error) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.message,
    });
    return;
  }
  if (file?.size != undefined) {

    const nuevoId = data;
    const urlimagen = await uploadFile(nuevoId, file);

    const pIconToEdit = {
      icon: urlimagen.publicUrl,
      id: nuevoId,
    };
    await editIconModule(pIconToEdit);
  }
}

async function uploadFile(idCategory, file) {
  const ruta = "modules/" + idCategory ;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(ruta, file, {
      cacheControl: "0",
      upsert: true,
    });
  if (error) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.message,
    });
    return;
  }
  //acceder a la img de forma pública
  if (data) {
    const { data: urlimagen } = ( supabase.storage
      .from("images")
      .getPublicUrl(ruta));
    return urlimagen;
  }
}

async function editIconModule(p) {
  const { error } = await supabase.from("module").update(p).eq("id", p.id);
  if (error) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.message,
    });
    return;
  }
}

export async function getModule(p) {
  const { data } = await supabase
    .from(table)
    .select()
    .eq("id_company", p.id_company)
    .order("id", { ascending: false });
  return data;
}

export async function searchModule(p) {
  const { data } = await supabase
    .from(table)
    .select()
    .eq("id_company", p.id_company)
    .ilike("name", "%" + p.description + "%");
  return data;
}

export async function deleteModule(p) {
  const { error } = await supabase.from(table).delete().eq("id", p.id);
  if (error) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.message,
    });
    return;
  }
  if (p.icon != "-") {
    const ruta = "modules/" + p.id;
    await supabase.storage.from("images").remove([ruta]);
  }
}

export async function editModule(p, fileOld, fileNew) {
  const { error } = await supabase.rpc("editCategory", p); //trigger de supabase

  if (error) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.message,
    });

    //el usuario tiene una img agregada
    if (fileNew != "-" && fileNew.size != undefined) {
      if (fileOld != "-") {
        await editIconStorage(p._id, fileNew);
      } else {
        const dataImg = await uploadFile(p._id, fileNew);
        const pIconToEdit = {
          icon: dataImg.publicUrl,
          id: p._id,
        };
        await editIconModule(pIconToEdit);
      }
    }
  }
}

export async function editIconStorage(id, file) {
  const ruta = "modules/" + id;
  await supabase.storage.from("images").update(ruta, file, {
    cacheControl: "0",
    upsert: true,
  });
}
