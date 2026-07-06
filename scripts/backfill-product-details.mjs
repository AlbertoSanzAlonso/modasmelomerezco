/**
 * Rellena el campo `details` de productos que aún no lo tienen.
 *
 * Uso:
 *   VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-product-details.mjs
 *
 * Requiere ejecutar antes la migración:
 *   supabase/migrations/20260706120000_add_product_details.sql
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Faltan VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}

const hashSeed = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const pick = (items, seed) => items[seed % items.length];
const normalize = (value) => value?.trim().toLowerCase() || '';

const CLOTHING_DETAILS = [
  'Corte favorecedor con tejido de tacto suave y buen caído. Una pieza versátil que combina con facilidad en looks de día o de noche.',
  'Confección cuidada con acabados que marcan la diferencia. Diseño pensado para acompañarte con comodidad sin renunciar al estilo.',
  'Prenda seleccionada por su calidad y presencia. Ideal para elevar tu armario con un toque femenino y actual.',
  'Silueta equilibrada y tejido agradable al contacto con la piel. Perfecta para quienes buscan elegancia en el día a día.',
];

const BAG_DETAILS = [
  'Accesorio funcional con acabados cuidados y capacidad práctica para el día a día. Un complemento atemporal que eleva cualquier outfit.',
  'Diseño equilibrado entre estilo y utilidad. Espacio suficiente para lo esencial, con detalles que aportan carácter.',
  'Bolso pensado para acompañarte con comodidad y presencia. Combina con facilidad tanto en looks casuales como más arreglados.',
];

const ACCESSORY_DETAILS = [
  'Complemento delicado que aporta personalidad al look sin sobrecargarlo. Acabado cuidado y presencia sutil.',
  'Pieza versátil para dar el toque final a cualquier conjunto. Diseño actual con un acabado refinado.',
  'Detalle seleccionado por su equilibrio entre estilo y funcionalidad. Fácil de combinar y de llevar.',
];

const GENERIC_DETAILS = [
  'Pieza seleccionada por su calidad y estilo. Pensada para acompañarte con elegancia en el día a día.',
  'Artículo cuidadosamente escogido por su presencia y versatilidad. Un básico con carácter propio.',
  'Diseño actual con acabados cuidados. Ideal para quienes buscan estilo sin complicaciones.',
];

const CARE_LINES = [
  'Consulta la etiqueta del artículo para el cuidado recomendado.',
  'Para conservar su aspecto, sigue las indicaciones de la etiqueta.',
  'Recomendamos revisar la etiqueta antes del primer lavado o limpieza.',
];

const getTemplatePool = (category, subcategory) => {
  const label = `${normalize(category)} ${normalize(subcategory)}`;

  if (label.includes('bolso') || label.includes('bolsos') || label.includes('cartera')) {
    return BAG_DETAILS;
  }

  if (
    label.includes('accesorio') ||
    label.includes('accesorios') ||
    label.includes('joya') ||
    label.includes('joyas') ||
    label.includes('collar') ||
    label.includes('pendiente') ||
    label.includes('cintur')
  ) {
    return ACCESSORY_DETAILS;
  }

  if (
    label.includes('ropa') ||
    label.includes('vestido') ||
    label.includes('falda') ||
    label.includes('pantalon') ||
    label.includes('pantalón') ||
    label.includes('camisa') ||
    label.includes('blusa') ||
    label.includes('jersey') ||
    label.includes('abrigo') ||
    label.includes('chaqueta')
  ) {
    return CLOTHING_DETAILS;
  }

  return GENERIC_DETAILS;
};

const generateProductDetails = ({ name, category, subcategory }) => {
  const seed = hashSeed(`${name}|${category || ''}|${subcategory || ''}`);
  const main = pick(getTemplatePool(category, subcategory), seed);
  const care = pick(CARE_LINES, seed + 7);
  return `${main}\n\n${care}`;
};

const supabase = createClient(supabaseUrl, serviceRoleKey);

const { data: products, error } = await supabase
  .from('products')
  .select('product_id, name, details, categories(name), subcategories(name)');

if (error) {
  console.error('Error al leer productos:', error.message);
  process.exit(1);
}

const pending = (products || []).filter((product) => !product.details?.trim());
console.log(`Productos sin detalles: ${pending.length}`);

let updated = 0;

for (const product of pending) {
  const details = generateProductDetails({
    name: product.name,
    category: product.categories?.name,
    subcategory: product.subcategories?.name,
  });

  const { error: updateError } = await supabase
    .from('products')
    .update({ details })
    .eq('product_id', product.product_id);

  if (updateError) {
    console.error(`Error en ${product.product_id}:`, updateError.message);
    continue;
  }

  updated += 1;
  console.log(`✓ ${product.name}`);
}

console.log(`\nActualizados: ${updated}/${pending.length}`);
