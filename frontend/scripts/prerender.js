const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, '../build');
let indexPath = path.join(BUILD_DIR, 'index.html');

if (!fs.existsSync(indexPath)) {
  const publicIndexPath = path.resolve(__dirname, '../public/index.html');
  if (fs.existsSync(publicIndexPath)) {
    console.log('[Prerender] Notice: build/index.html not found, falling back to public/index.html for snapshot base.');
    indexPath = publicIndexPath;
  } else {
    console.error('[Prerender] Error: Neither build/index.html nor public/index.html found.');
    process.exit(0);
  }
}

if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

const baseHtml = fs.readFileSync(indexPath, 'utf-8');

const routes = [
  {
    path: '/how-it-works',
    title: 'How It Works – ASPES | 6-Layer AI Project Evaluation System',
    description: 'Explore how ASPES evaluates student code: 6-layer neural pipeline with AST parsing, multi-vector AI detection, cross-repo plagiarism checks, and rubric grading.',
    canonical: 'https://aspeskpgu.vercel.app/how-it-works'
  },
  {
    path: '/login',
    title: 'Login – ASPES | AI Project Evaluation System',
    description: 'Sign in to the ASPES academic portal to review student code evaluations, inspect multi-vector AI detection telemetry, and access automated rubric scorecards.',
    canonical: 'https://aspeskpgu.vercel.app/login'
  },
  {
    path: '/register',
    title: 'Register – ASPES | AI Project Evaluation System',
    description: 'Create an ASPES university account to submit student repositories, execute automated AST code analysis, detect AI-generated code, and streamline project grading.',
    canonical: 'https://aspeskpgu.vercel.app/register'
  }
];

routes.forEach((route) => {
  let routeHtml = baseHtml;

  // Replace Title
  routeHtml = routeHtml.replace(/<title>.*?<\/title>/gi, `<title>${route.title}</title>`);
  routeHtml = routeHtml.replace(/<meta name="title" content=".*?" \/>/gi, `<meta name="title" content="${route.title}" />`);
  routeHtml = routeHtml.replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${route.title}" />`);
  routeHtml = routeHtml.replace(/<meta name="twitter:title" content=".*?" \/>/gi, `<meta name="twitter:title" content="${route.title}" />`);

  // Replace Description
  routeHtml = routeHtml.replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${route.description}" />`);
  routeHtml = routeHtml.replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${route.description}" />`);
  routeHtml = routeHtml.replace(/<meta name="twitter:description" content=".*?" \/>/gi, `<meta name="twitter:description" content="${route.description}" />`);

  // Replace Canonical & URL
  routeHtml = routeHtml.replace(/<link rel="canonical" href=".*?" \/>/gi, `<link rel="canonical" href="${route.canonical}" />`);
  routeHtml = routeHtml.replace(/<meta property="og:url" content=".*?" \/>/gi, `<meta property="og:url" content="${route.canonical}" />`);
  routeHtml = routeHtml.replace(/<meta name="twitter:url" content=".*?" \/>/gi, `<meta name="twitter:url" content="${route.canonical}" />`);

  // Output to route directory (e.g. build/login/index.html)
  const targetDir = path.join(BUILD_DIR, route.path.replace(/^\//, ''));
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetIndexPath = path.join(targetDir, 'index.html');
  fs.writeFileSync(targetIndexPath, routeHtml, 'utf-8');

  // Also write route.html at root of build (e.g. build/login.html)
  const targetHtmlPath = path.join(BUILD_DIR, `${route.path.replace(/^\//, '')}.html`);
  fs.writeFileSync(targetHtmlPath, routeHtml, 'utf-8');

  console.log(`[Prerender] Statically snapshot route: ${route.path} -> ${targetIndexPath}`);
});

console.log('[Prerender] Successfully generated static snapshots for public routes.');
