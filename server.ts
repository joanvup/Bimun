import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api.ts';
import { getDb } from './server/db.ts';
import { initializeDatabaseManager } from './server/dbManager.ts';
import { securityHeadersMiddleware } from './server/security.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security: Remove server banner and inject OWASP security headers
  app.disable('x-powered-by');
  app.use(securityHeadersMiddleware);

  // Initialize Database Manager (SQLite, PostgreSQL or MySQL)
  await initializeDatabaseManager();
  await getDb();

  // Middleware
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API Routes
  app.use('/api', apiRouter);

  // Dynamic XML Sitemap for Google SEO (applet-seo)
  app.get('/sitemap.xml', (req, res) => {
    const host = req.get('host') || 'bimun.colegiobilingue.edu.co';
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    const now = new Date().toISOString().split('T')[0];

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Pagina Principal (Home) -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Seccion Nosotros -->
  <url>
    <loc>${baseUrl}/#nosotros</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- Seccion Comisiones / Comités -->
  <url>
    <loc>${baseUrl}/#comisiones</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- Matriz de Paises y Delegados -->
  <url>
    <loc>${baseUrl}/#paises</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- Cronograma Oficial de Eventos -->
  <url>
    <loc>${baseUrl}/#cronograma</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- Biblioteca de Documentos y Guias -->
  <url>
    <loc>${baseUrl}/#documentos</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- Seccion de Noticias y Comunicados -->
  <url>
    <loc>${baseUrl}/#noticias</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- Formulario de Inscripciones -->
  <url>
    <loc>${baseUrl}/#inscripciones</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <!-- Informacion de Contacto -->
  <url>
    <loc>${baseUrl}/#contacto</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemapXml.trim());
  });

  // Robots.txt to configure crawl instructions and sitemap reference
  app.get('/robots.txt', (req, res) => {
    const host = req.get('host') || 'bimun.colegiobilingue.edu.co';
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /api/admin/

Sitemap: ${protocol}://${host}/sitemap.xml`.trim());
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'BIMUN Platform API' });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BIMUN Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
