
import fs from 'fs';
import path from 'path';

const products = JSON.parse(fs.readFileSync('scratch/db_stock.json', 'utf8'));

const categories: Record<string, string[]> = {
  'vestidos': ['vestido', 'vestidos'],
  'blusas_camisas_tops': ['blusa', 'camisa', 'camiseta', 'top', 'corpiño', 'lenceras', 'body'],
  'pantalones_faldas': ['pantalón', 'pantalones', 'bermudas', 'falda', 'vaquero'],
  'chaquetas_abrigos': ['chaqueta', 'sudadera', 'sudaderas', 'blazer', 'punto'],
  'chalecos': ['chaleco'],
  'conjuntos': ['conjunto', 'conjuntos'],
  'bolsos': ['bolso', 'bolsa', 'neceser']
};

const organized: Record<string, any[]> = {
  'vestidos': [],
  'blusas_camisas_tops': [],
  'pantalones_faldas': [],
  'chaquetas_abrigos': [],
  'chalecos': [],
  'conjuntos': [],
  'bolsos': []
};

// Specific items to prioritize or ensure inclusion
const priorityItems = [
  'Top Rojo Camelia',
  'Body Florida',
  'Body Mery',
  'Body Silvia'
];

products.forEach((p: any) => {
  const nameLower = p.name.toLowerCase();
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(k => nameLower.includes(k))) {
      // Prioritize priority items by unshifting them
      if (priorityItems.some(pi => p.name.includes(pi))) {
        organized[cat].unshift(p);
      } else {
        organized[cat].push(p);
      }
      break;
    }
  }
});

const baseDest = 'artifacts/catalog_photos';
if (fs.existsSync(baseDest)) {
  fs.rmSync(baseDest, { recursive: true, force: true });
}
fs.mkdirSync(baseDest, { recursive: true });

for (const [cat, items] of Object.entries(organized)) {
  const catDir = path.join(baseDest, cat);
  if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

  const limit = (cat === 'bolsos') ? 2 : 6;
  const toProcess = items.slice(0, limit);
  
  toProcess.forEach(item => {
    const src = path.join('public/assets/products', `product_${item.product_id}.webp`);
    const dest = path.join(catDir, `${item.name.replace(/\//g, '-').trim()}.webp`);
    
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied: ${src} -> ${dest}`);
    } else {
      console.warn(`File not found: ${src} for item ${item.name}`);
    }
  });
}
