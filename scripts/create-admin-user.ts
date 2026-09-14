/**
 * Crea un usuario administrador (Auth API + fila en `admins` si existe la tabla).
 *
 * Uso:
 *   npx tsx scripts/create-admin-user.ts email@ejemplo.com "ContraseñaSegura"
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];

if (!email || !password || !email.includes('@')) {
  console.error('Uso: npx tsx scripts/create-admin-user.ts email@ejemplo.com "ContraseñaSegura"');
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error('Error creando usuario en Auth:', error.message);
    process.exit(1);
  }

  const userId = data.user?.id;
  if (!userId) {
    console.error('No se obtuvo id de usuario.');
    process.exit(1);
  }

  const username = email.split('@')[0];
  const { error: adminsError } = await supabase.from('admins').insert({
    admin_id: userId,
    email,
    username,
    password: bcrypt.hashSync(password, 10),
    role: 'admin',
  });

  if (adminsError) {
    console.warn(
      'Usuario Auth creado, pero no se pudo guardar en tabla admins:',
      adminsError.message,
    );
    console.warn('El login en /admin/login seguirá funcionando con email y contraseña.');
  }

  console.log('Administrador creado correctamente.');
  console.log('  Email:', email);
  console.log('  Login: https://www.modasmelomerezco.es/admin/login');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
