import fs from 'fs';
import path from 'path';

const SITEMAP_URL = 'https://codedummy.app';

try {
  // 1. Read App.tsx to extract PROJECT_META keys and LESSONS ids dynamically
  const appPath = path.join(process.cwd(), 'src', 'App.tsx');
  if (!fs.existsSync(appPath)) {
    throw new Error(`App.tsx not found at path: ${appPath}`);
  }

  const appContent = fs.readFileSync(appPath, 'utf8');

  // Parse PROJECT_META keys
  // Look for the PROJECT_META block
  const metaStartIndex = appContent.indexOf('export const PROJECT_META');
  if (metaStartIndex === -1) {
    throw new Error('PROJECT_META definition not found in App.tsx');
  }
  
  // Grab a chunk of code starting from PROJECT_META definition
  const metaChunk = appContent.slice(metaStartIndex, metaStartIndex + 6000);
  const projectKeys = [];
  const projectRegex = /(\w+)\s*:\s*\{/g;
  let projectMatch;
  while ((projectMatch = projectRegex.exec(metaChunk)) !== null) {
    const key = projectMatch[1];
    // Ignore keys that are property labels like title, description, image
    if (key !== 'title' && key !== 'description' && key !== 'image') {
      projectKeys.push(key);
    }
  }

  // Parse LESSONS ids
  const lessonsStartIndex = appContent.indexOf('export const LESSONS');
  if (lessonsStartIndex === -1) {
    throw new Error('export const LESSONS not found in App.tsx');
  }
  const lessonsChunk = appContent.slice(lessonsStartIndex, lessonsStartIndex + 2000);
  const lessonIds = [];
  const lessonRegex = /id:\s*(\d+)/g;
  let lessonMatch;
  while ((lessonMatch = lessonRegex.exec(lessonsChunk)) !== null) {
    lessonIds.push(parseInt(lessonMatch[1], 10));
  }

  console.log('Dynamic sitemap generator crawling summary:');
  console.log(`- Found ${projectKeys.length} Capstone Projects in PROJECT_META:`, projectKeys);
  console.log(`- Found ${lessonIds.length} Interactive Lessons in LESSONS:`, lessonIds);

  // 2. Build the list of URLs for the sitemap
  const urls = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/?view=projects', priority: '0.9', changefreq: 'weekly' },
    { loc: '/?view=agent', priority: '0.9', changefreq: 'weekly' },
    { loc: '/?view=analytics', priority: '0.8', changefreq: 'weekly' }
  ];

  // Add lesson query parameter URLs
  lessonIds.forEach(id => {
    urls.push({
      loc: `/?lesson=${id}`,
      priority: '0.8',
      changefreq: 'weekly'
    });
  });

  // Add project blueprint query parameter URLs
  projectKeys.forEach(key => {
    urls.push({
      loc: `/?project=${key}`,
      priority: '0.9',
      changefreq: 'weekly'
    });
  });

  // 3. Generate XML
  const lastmod = new Date().toISOString().split('T')[0];
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${SITEMAP_URL}${url.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent);
  console.log('✔ public/sitemap.xml generated successfully!');

} catch (err) {
  console.error('❌ Sitemap generation failed:', err.message);
  process.exit(1);
}
