const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://aspeskpgu.vercel.app';
const TODAY = new Date().toISOString().split('T')[0];

const PUBLIC_ROUTES = [
  {
    path: '/',
    changefreq: 'weekly',
    priority: '1.0'
  },
  {
    path: '/how-it-works',
    changefreq: 'monthly',
    priority: '0.8'
  },
  {
    path: '/login',
    changefreq: 'monthly',
    priority: '0.3'
  },
  {
    path: '/register',
    changefreq: 'monthly',
    priority: '0.3'
  }
];

const generateSitemapXml = () => {
  const urlEntries = PUBLIC_ROUTES.map((route) => {
    const loc = route.path === '/' ? BASE_URL : `${BASE_URL}${route.path}`;
    return `    <url>
        <loc>${loc}</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>${route.changefreq}</changefreq>
        <priority>${route.priority}</priority>
    </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>
`;
};

const xml = generateSitemapXml();

// Write to public/ directory
const publicSitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
fs.writeFileSync(publicSitemapPath, xml, 'utf-8');
console.log(`[Sitemap] Generated public/sitemap.xml with ${PUBLIC_ROUTES.length} routes for ${TODAY}`);

// Also write to build/ directory if it exists
const buildSitemapPath = path.resolve(__dirname, '../build/sitemap.xml');
if (fs.existsSync(path.resolve(__dirname, '../build'))) {
  fs.writeFileSync(buildSitemapPath, xml, 'utf-8');
  console.log(`[Sitemap] Synced sitemap.xml to build/ directory`);
}
