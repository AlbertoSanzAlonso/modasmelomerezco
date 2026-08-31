export interface ProductDetailsContext {
  name: string;
  category?: string;
  subcategory?: string;
}

const hashSeed = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const pick = <T,>(items: T[], seed: number): T =>
  items[seed % items.length];

const normalize = (value?: string) => value?.trim().toLowerCase() || '';

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

const getTemplatePool = (category?: string, subcategory?: string) => {
  const categoryName = normalize(category);
  const subcategoryName = normalize(subcategory);
  const label = `${categoryName} ${subcategoryName}`;

  if (label.includes('bolso') || label.includes('bolsos') || label.includes('cartera')) {
    return BAG_DETAILS;
  }

  if (
    label.includes('calzado') ||
    label.includes('zapato') ||
    label.includes('zapatos') ||
    label.includes('sandalia') ||
    label.includes('bota') ||
    label.includes('botines')
  ) {
    return [
      'Calzado con buen ajuste y acabado cuidado. Pensado para acompañarte con estilo y comodidad en el día a día.',
      'Diseño equilibrado entre presencia y confort. Ideal para completar looks de día o de noche con un toque actual.',
      'Pieza seleccionada por su calidad y silueta. Un básico de armario que eleva cualquier conjunto.',
    ];
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

export const generateProductDetails = ({
  name,
  category,
  subcategory,
}: ProductDetailsContext): string => {
  const seed = hashSeed(`${name}|${category || ''}|${subcategory || ''}`);
  const main = pick(getTemplatePool(category, subcategory), seed);
  const care = pick(CARE_LINES, seed + 7);

  return `${main}\n\n${care}`;
};
