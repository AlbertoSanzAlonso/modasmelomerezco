
import { supabase } from '../supabase';
import { PROVINCE_BY_PREFIX } from "@/constants/locations";

export type LocationByZipResult = {
  id?: number;
  city: string;
  province: string;
  /** Localidades asociadas al CP (varios municipios comparten CP en España). */
  municipalities?: string[];
};

export const locations = {
  getByZip: async (zip: string): Promise<LocationByZipResult | null> => {
    // 1. Identificar provincia por prefijo (El más fiable en España)
    const prefix = zip.substring(0, 2);
    const identifiedProvince = PROVINCE_BY_PREFIX[prefix];
    
    // 2. Intentar base de datos local de Supabase
    try {
      const { data: rows } = await supabase
        .from('spanish_locations')
        .select('*')
        .eq('zip_code', zip);

      if (rows && rows.length > 0) {
        const municipalities = [
          ...new Set(rows.map((r) => r.municipality).filter(Boolean)),
        ] as string[];
        const first = rows[0];
        return {
          id: first.id,
          city: municipalities[0] || first.municipality,
          province: identifiedProvince || first.province,
          municipalities,
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
          const municipalities = [
            ...new Set(
              externalData.places
                .map((p: { 'place name'?: string }) => p['place name'])
                .filter(Boolean),
            ),
          ] as string[];
          const province =
            identifiedProvince || externalData.places[0]['state'];
          const city = municipalities[0] || '';

          // Guardar la primera en caché (el resto se obtiene de la API externa)
          const { data: savedData } = await supabase
            .from('spanish_locations')
            .insert([
              {
                zip_code: zip,
                municipality: city,
                province,
              },
            ])
            .select()
            .maybeSingle();
          
          return {
            id: savedData?.id,
            city,
            province,
            municipalities,
          };
        }
      }
    } catch (error) {
      console.error('Total failure fetching zip code:', error);
    }
    
    if (identifiedProvince) {
      return { city: '', province: identifiedProvince, municipalities: [] };
    }
    
    return null;
  },
};
