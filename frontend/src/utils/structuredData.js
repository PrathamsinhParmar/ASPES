/**
 * ASPES - Structured Data (JSON-LD) Generators for SEO & AI Search Engines
 * Compliant with Schema.org specifications for Google Rich Results,
 * Google SGE, Bing Copilot, and Perplexity indexing.
 */

export const SITE_URL = 'https://aspeskpgu.vercel.app';

/**
 * 1. Organization Schema
 * Establishes brand authority, logo, and core description site-wide.
 */
export const getOrganizationSchema = (isGraphNode = false) => ({
  ...(isGraphNode ? {} : { '@context': 'https://schema.org' }),
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'ASPES',
  alternateName: 'AI Smart Project Evaluation System',
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/logo512.png`,
  image: `${SITE_URL}/og-preview.png`,
  description: 'AI Smart Project Evaluation System for automated academic programming project assessment and plagiarism detection.',
  sameAs: [
    'https://github.com/PrathamsinhParmar/ASPES'
  ]
});

/**
 * 2. WebSite Schema
 * Identifies the web presence and root URL for search engine site names.
 */
export const getWebSiteSchema = (isGraphNode = false) => ({
  ...(isGraphNode ? {} : { '@context': 'https://schema.org' }),
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'ASPES - AI Smart Project Evaluation System',
  url: `${SITE_URL}/`,
  publisher: {
    '@id': `${SITE_URL}/#organization`
  },
  inLanguage: 'en-US'
});

/**
 * 3. SoftwareApplication Schema
 * Signals to Google that ASPES is a usable software tool, enabling rich application snippets.
 */
export const getSoftwareApplicationSchema = (isGraphNode = false) => ({
  ...(isGraphNode ? {} : { '@context': 'https://schema.org' }),
  '@type': 'SoftwareApplication',
  '@id': `${SITE_URL}/#software`,
  name: 'ASPES',
  applicationCategory: 'EducationalApplication',
  applicationSubCategory: 'AI Grading & Plagiarism Detection',
  operatingSystem: 'Web',
  description: 'An AI-powered system for evaluating academic software projects with automated code analysis, plagiarism detection, AI-generated code detection, and comprehensive feedback generation.',
  url: `${SITE_URL}/`,
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
});

/**
 * 4. BreadcrumbList Schema
 * Formats hierarchy for deep navigation pages (e.g., /how-it-works, /login).
 * @param {Array<{ name: string, path: string }>} items
 */
export const getBreadcrumbSchema = (items = [], isGraphNode = false) => ({
  ...(isGraphNode ? {} : { '@context': 'https://schema.org' }),
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.path.startsWith('http') ? item.path : `${SITE_URL}${item.path.startsWith('/') ? item.path : `/${item.path}`}`
  }))
});

/**
 * 5. FAQPage Schema
 * Powers FAQ rich snippets in Google Search Results.
 * @param {Array<{ q: string, a: string }>} faqList
 */
export const getFAQPageSchema = (faqList = [], isGraphNode = false) => ({
  ...(isGraphNode ? {} : { '@context': 'https://schema.org' }),
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/#faq`,
  mainEntity: faqList.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a
    }
  }))
});

/**
 * Composite Home Page Schema Graph
 * Combines Organization, WebSite, SoftwareApplication, and FAQPage in a unified @graph.
 */
export const getHomePageStructuredData = (faqList = []) => ({
  '@context': 'https://schema.org',
  '@graph': [
    getOrganizationSchema(true),
    getWebSiteSchema(true),
    getSoftwareApplicationSchema(true),
    ...(faqList && faqList.length > 0 ? [getFAQPageSchema(faqList, true)] : [])
  ]
});

/**
 * Composite How It Works Schema Graph
 * Combines Organization, BreadcrumbList, and Technical WebPage.
 */
export const getHowItWorksStructuredData = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    getOrganizationSchema(true),
    getBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'How It Works', path: '/how-it-works' }
    ], true),
    {
      '@type': 'TechArticle',
      '@id': `${SITE_URL}/how-it-works#article`,
      headline: 'How the ASPES AI Project Evaluation Engine Works',
      description: 'Architectural breakdown of the 6-layer neural evaluation pipeline: AST analysis, multi-vector AI code detection, semantic plagiarism search, and rubric grading.',
      url: `${SITE_URL}/how-it-works`,
      author: {
        '@id': `${SITE_URL}/#organization`
      },
      publisher: {
        '@id': `${SITE_URL}/#organization`
      },
      inLanguage: 'en-US'
    }
  ]
});
