import { INSFORGE_URL, headers } from './client';
import { PROVINCE_BY_PREFIX } from "@/constants/locations";

export const locations = {
  getByZip: async (zip: string) => {
    console.log('Fetching location for zip:', zip);
    
    // 1. Identify province by zip prefix (Most reliable in Spain)
    const prefix = zip.substring(0, 2);
    const identifiedProvince = PROVINCE_BY_PREFIX[prefix];
    
    // 2. Try local database for city
    try {
      const response = await fetch(`${INSFORGE_URL}/api/database/records/spanish_locations?zip_code=eq.${zip}&select=*`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          console.log('Found in local DB:', data[0]);
          return {
            id: data[0].id,
            city: data[0].municipality,
            province: identifiedProvince || data[0].province
          };
        }
      }
    } catch (dbError) {
      console.warn('Local DB location fetch failed:', dbError);
    }

    // 3. Fallback to external API for city name
    try {
      const externalRes = await fetch(`https://api.zippopotam.us/es/${zip}`);
      if (externalRes.ok) {
        const externalData = await externalRes.json();
        if (externalData.places && externalData.places.length > 0) {
          const place = externalData.places[0];
          const rawCity = place['place name'];

          const result = {
            city: rawCity,
            province: identifiedProvince || place['state']
          };

          // Cache it and get the new ID
          const saveRes = await fetch(`${INSFORGE_URL}/api/database/records/spanish_locations`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=representation' },
            body: JSON.stringify({
              zip_code: zip,
              municipality: result.city,
              province: result.province
            })
          });
          
          if (saveRes.ok) {
            const savedData = await saveRes.json();
            return {
              id: savedData[0].id,
              ...result
            };
          }

          return result;
        }
      }
    } catch (error) {
      console.error('Total failure fetching zip code:', error);
    }
    
    // Last resort: if we have the province by prefix but no city name
    if (identifiedProvince) {
      return { city: '', province: identifiedProvince };
    }
    
    return null;
  }
};
