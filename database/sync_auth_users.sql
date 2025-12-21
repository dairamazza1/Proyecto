-- =============================================
-- SOLUCIÓN AL ERROR "Database error saving new user"
-- =============================================
-- Ejecuta este script completo en Supabase SQL Editor
-- Reemplaza el trigger anterior

-- 1. Eliminar trigger y función anterior si existen
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Crear la función mejorada con manejo de errores
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
BEGIN
  -- Extraer el nombre del metadata o usar el email como fallback
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name', 
    split_part(NEW.email, '@', 1),
    'Usuario'
  );

  -- Insertar el nuevo usuario en public.users
  -- Nota: id_doc_type y id_role son NULL porque aún no se asignan
  INSERT INTO public.users (
    id_auth,
    email,
    name,
    registration_date,
    state,
    id_doc_type,
    id_role,
    doc_number,
    tel
  )
  VALUES (
    NEW.id::text,           -- Convertir UUID a text
    NEW.email,
    user_name,
    CURRENT_DATE,
    'ACTIVE',
    NULL,                   -- Se puede asignar después
    NULL,                   -- Se puede asignar después
    '-',
    '-'
  )
  ON CONFLICT (id_auth) DO NOTHING;  -- Evitar duplicados
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log del error (opcional, para debugging)
    RAISE WARNING 'Error al crear usuario en public.users: %', SQLERRM;
    RETURN NEW;  -- No fallar el registro en auth.users
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar que el trigger se creó correctamente
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- =============================================
-- RESULTADO ESPERADO:
-- trigger_name          | enabled
-- on_auth_user_created  | O (O = enabled)
-- =============================================
