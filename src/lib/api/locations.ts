
import { supabase } from '../supabase';
import { PROVINCE_BY_PREFIX } from "@/constants/locations";

export const locations = {
  getByZip: async (zip: string) => {
    // 1. Identificar provincia por prefijo (El más fiable en España)
    const prefix = zip.substring(0, 2);
    const identifiedProvince = PROVINCE_BY_PREFIX[prefix];
    
    // 2. Intentar base de datos local de Supabase
    try {
      const { data, error } = await supabase
        .from('spanish_locations')
        .select('*')
        .eq('zip_code', zip)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          city: data.municipality,
          province: identifiedProvince || data.province
        };
      }
    } catch (dbError) {
      console.warn('Supabase location fetch failed:', dbError);
    }

    // 3. Fallback a API externa si no existe en nuestra DB
    try {
      const externalRes = await fetch(`https://api.zippopotam.us/es/${zip}`);
      if (externalRes.ok) {
        const externalData = await externalRes.json();
        if (externalData.places && externalData.places.length > 0) {
          const place = externalData.places[0];
          const result = {
            city: place['place name'],
            province: identifiedProvince || place['state']
          };

          // Guardar en caché de Supabase para la próxima vez
          const { data: savedData } = await supabase
            .from('spanish_locations')
            .insert([{
              zip_code: zip,
              municipality: result.city,
              province: result.province
            }])
            .select()
            .single();
          
          return {
            id: savedData?.id,
            ...result
          };
        }
      }
    } catch (error) {
      console.error('Total failure fetching zip code:', error);
    }
    
    if (identifiedProvince) {
      return { city: '', province: identifiedProvince };
    }
    
    return null;
  }
};
