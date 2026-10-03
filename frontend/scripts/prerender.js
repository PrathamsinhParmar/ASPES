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
    path: '/',
    title: 'ASPES – AI Smart Project Evaluation System | KPGU',
    description: "ASPES is KPGU's AI-powered project evaluation portal — automated code quality analysis, AI-generated code detection, and plagiarism checks for student projects at Drs. Kiran & Pallavi Patel Global, design and developed by Prathamsinh Parmar(Pratham Rajput).",
    keywords: 'aspes, aspes kpgu, ai evaluation portal kpgu, ai portal kpgu, ai smart project evaluation system, ai project evaluation system, kpgu ai project evaluation, aspes ai portal, pratham rajput, prathamsinh parmar',
    canonical: 'https://aspeskpgu.vercel.app/',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://aspeskpgu.vercel.app/#organization',
          name: 'ASPES - AI Smart Project Evaluation System',
          alternateName: 'ASPES KPGU',
          url: 'https://aspeskpgu.vercel.app/',
          logo: 'https://aspeskpgu.vercel.app/logo512.png',
          image: 'https://aspeskpgu.vercel.app/og-preview.png',
          description: 'An AI-powered academic project evaluation portal developed at Drs. Kiran & Pallavi Patel Global University (KPGU), Krishna School of Emerging Technology & Applied Research.',
          sameAs: ['https://github.com/PrathamsinhParmar/ASPES']
        },
        {
          '@type': 'WebSite',
          '@id': 'https://aspeskpgu.vercel.app/#website',
          name: 'ASPES - AI Smart Project Evaluation System',
          url: 'https://aspeskpgu.vercel.app/',
          publisher: {
            '@id': 'https://aspeskpgu.vercel.app/#organization'
          },
          inLanguage: 'en-US'
        },
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://aspeskpgu.vercel.app/#software',
          name: 'ASPES',
          applicationCategory: 'EducationalApplication',
          applicationSubCategory: 'AI Grading & Plagiarism Detection',
          operatingSystem: 'Web',
          description: 'An AI-powered system for evaluating academic software projects with automated code analysis, plagiarism detection, AI-generated code detection, and comprehensive feedback generation.',
          url: 'https://aspeskpgu.vercel.app/',
          keywords: 'ASPES, ASPES KPGU, AI evaluation portal, AI portal KPGU, AI smart project evaluation system, AI project evaluation system, AI code plagiarism detector, AI generated code detector, KPGU AI project evaluation',
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            bestRating: '5',
            worstRating: '1',
            ratingCount: '128'
          },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          },
          featureList: [
            'Automated code quality analysis',
            'AI-generated code detection',
            'Documentation quality evaluation',
            'Report-to-code alignment verification',
            'Semantic plagiarism detection',
            'GPT-4 powered feedback generation'
          ]
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://aspeskpgu.vercel.app/#faq',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'How does ASPES detect AI-generated code from ChatGPT, Claude, and Copilot?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'ASPES uses multi-vector token predictability, perplexity distribution, and burstiness analysis. Human programming shows natural, irregular problem-solving cadence and personalized naming conventions. Generative LLMs exhibit statistically flat, low-entropy token transitions. Combined with AST structural fingerprinting, ASPES distinguishes authentic human development from LLM synthesis.'
              }
            },
            {
              '@type': 'Question',
              name: 'What is "Report-to-Code Alignment" and what are "Phantom Features"?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Many students submit extensive documentation detailing features (e.g. "OAuth 2.0 Auth", "WebSocket Live Sync") that were never implemented in code. ASPES parses the PDF report with semantic NLP, extracts functional claims, and cross-checks them against actual AST routes, endpoints, and database models to uncover unimplemented or exaggerated claims.'
              }
            },
            {
              '@type': 'Question',
              name: 'Can professors customize the evaluation rubrics and override scores?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Absolutely. ASPES acts as an intelligent evaluation copilot, not a replacement for faculty judgment. Professors have full discretion in the Faculty Review Portal to adjust criteria weightings (e.g., 40% AST quality, 30% Plagiarism, 30% Documentation) and override any AI recommendation with qualitative commentary.'
              }
            },
            {
              '@type': 'Question',
              name: 'Is student source code and proprietary project data kept secure?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. ASPES strictly adheres to academic confidentiality standards. Repositories are processed in ephemeral, isolated sandboxes and student data is never used to train public LLMs or external models. All access is governed by strict Role-Based Access Control (RBAC).'
              }
            },
            {
              '@type': 'Question',
              name: 'Which programming languages and project types does ASPES evaluate?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'ASPES natively parses Abstract Syntax Trees for Python, JavaScript/TypeScript, Java, C/C++, and SQL, along with automated package manifest audits across full-stack web, mobile, machine learning, and systems software.'
              }
            }
          ]
        }
      ]
    }
  },
  {
    path: '/how-it-works',
    title: 'How ASPES Works – AI Project Evaluation at KPGU',
    description: "Learn how ASPES evaluates academic programming projects using six AI components: code analysis, AI-generated code detection, plagiarism detection, documentation review, and GPT-4 feedback — built for KPGU's Krishna School of Emerging Technology, design and developed by Prathamsinh Parmar(Pratham Rajput).",
    keywords: 'aspes, aspes portal kpgu, kpgu ai portal, aspes project evaluation portal, aspes portal, ai based project evaluation kpgu, automated project evaluation tool, ai code plagiarism detector, ai generated code detector, krishna school of emerging technology ai project, automated code quality analyzer',
    canonical: 'https://aspeskpgu.vercel.app/how-it-works',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://aspeskpgu.vercel.app/#organization',
          name: 'ASPES - AI Smart Project Evaluation System',
          url: 'https://aspeskpgu.vercel.app/',
          logo: 'https://aspeskpgu.vercel.app/logo512.png',
          description: 'An AI-powered academic project evaluation portal developed at Drs. Kiran & Pallavi Patel Global University (KPGU).'
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aspeskpgu.vercel.app/' },
            { '@type': 'ListItem', position: 2, name: 'How It Works', item: 'https://aspeskpgu.vercel.app/how-it-works' }
          ]
        },
        {
          '@type': 'TechArticle',
          '@id': 'https://aspeskpgu.vercel.app/how-it-works#article',
          headline: 'How ASPES Evaluates Your Academic Projects',
          description: "Learn how ASPES evaluates academic programming projects using six AI components: code analysis, AI-generated code detection, plagiarism detection, documentation review, and GPT-4 feedback — built for KPGU's Krishna School of Emerging Technology.",
          url: 'https://aspeskpgu.vercel.app/how-it-works',
          inLanguage: 'en-US'
        }
      ]
    }
  },
  {
    path: '/login',
    title: 'Login – ASPES KPGU AI Evaluation Portal',
    description: "Log in to ASPES, KPGU's AI-based project evaluation system, to submit and track your academic project assessments.",
    keywords: 'aspes kpgu, kpgu ai portal, ai evaluation portal',
    canonical: 'https://aspeskpgu.vercel.app/login',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://aspeskpgu.vercel.app/#organization',
          name: 'ASPES - AI Smart Project Evaluation System',
          url: 'https://aspeskpgu.vercel.app/',
          logo: 'https://aspeskpgu.vercel.app/logo512.png'
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aspeskpgu.vercel.app/' },
            { '@type': 'ListItem', position: 2, name: 'Login', item: 'https://aspeskpgu.vercel.app/login' }
          ]
        }
      ]
    }
  },
  {
    path: '/register',
    title: 'Register – ASPES KPGU AI Evaluation Portal',
    description: "Create your ASPES account to access KPGU's AI-powered academic project evaluation and feedback system.",
    keywords: 'aspes kpgu project, kpgu student project ai tool, ai evaluation portal kpgu',
    canonical: 'https://aspeskpgu.vercel.app/register',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://aspeskpgu.vercel.app/#organization',
          name: 'ASPES - AI Smart Project Evaluation System',
          url: 'https://aspeskpgu.vercel.app/',
          logo: 'https://aspeskpgu.vercel.app/logo512.png'
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aspeskpgu.vercel.app/' },
            { '@type': 'ListItem', position: 2, name: 'Register', item: 'https://aspeskpgu.vercel.app/register' }
          ]
        }
      ]
    }
  }
];

routes.forEach((route) => {
  let routeHtml = baseHtml;

  // Replace Title
  routeHtml = routeHtml.replace(/<title>.*?<\/title>/gi, `<title>${route.title}</title>`);
  routeHtml = routeHtml.replace(/<meta\s+name=["']title["']\s+content=["'][^"']*?["']\s*\/?>/gi, `<meta name="title" content="${route.title}" />`);
  routeHtml = routeHtml.replace(/<meta\s+property=["']og:title["']\s+content=["'][^"']*?["']\s*\/?>/gi, `<meta property="og:title" content="${route.title}" />`);
  routeHtml = routeHtml.replace(/<meta\s+name=["']twitter:title["']\s+content=["'][^"']*?["']\s*\/?>/gi, `<meta name="twitter:title" content="${route.title}" />`);

  // Replace Description
  routeHtml = routeHtml.replace(/<meta\s+name=["']description["']\s+content=["'][^"']*?["']\s*\/?>/gi, `<meta name="description" content="${route.description}" />`);
  routeHtml = routeHtml.replace(/<meta\s+property=["']og:description["']\s+content=["'][^"']*?["']\s*\/?>/gi, `<meta property="og:description" content="${route.description}" />`);
  routeHtml = routeHtml.replace(/<meta\s+name=["']twitter:description["']\s+content=["'][^"']*?["']\s*\/?>/gi, `<meta name="twitter:description" content="${route.description}" />`);

  // Replace Keywords
  if (route.keywords) {
    routeHtml = routeHtml.replace(/<meta\s+name=["']keywords["']\s+content=["'][^"']*?["']\s*\/?>/gi, `<meta name="keywords" content="${route.keywords}" />`);
  }

  // Replace Canonical & URL
  routeHtml = routeHtml.replace(/<link\s+rel=["']canonical["']\s+href=["'][^"']*?["']\s*\/?>/gi, `<link rel="canonical" href="${route.canonical}" />`);
  routeHtml = routeHtml.replace(/<meta\s+property=["']og:url["']\s+content=["'][^"']*?["']\s*\/?>/gi, `<meta property="og:url" content="${route.canonical}" />`);
  routeHtml = routeHtml.replace(/<meta\s+name=["']twitter:url["']\s+content=["'][^"']*?["']\s*\/?>/gi, `<meta name="twitter:url" content="${route.canonical}" />`);

  // Inject or Replace JSON-LD Schema with id="schema-jsonld" and data-rh="true"
  if (route.schema) {
    const schemaTag = `<script id="schema-jsonld" type="application/ld+json" data-rh="true">\n    ${JSON.stringify(route.schema, null, 2)}\n    </script>`;
    if (/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i.test(routeHtml)) {
      routeHtml = routeHtml.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i, schemaTag);
    } else {
      routeHtml = routeHtml.replace('</head>', `    ${schemaTag}\n  </head>`);
    }
  }

  // Handle root route (build/index.html)
  if (route.path === '/') {
    fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), routeHtml, 'utf-8');
    console.log(`[Prerender] Statically snapshot route: / -> ${path.join(BUILD_DIR, 'index.html')}`);
    return;
  }

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
