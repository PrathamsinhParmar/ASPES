import React from 'react';
import { Helmet } from 'react-helmet-async';

import { getOrganizationSchema } from '../../utils/structuredData';

const DEFAULT_TITLE = 'ASPES – AI-Powered Academic Project Evaluation System';
const DEFAULT_DESCRIPTION = 'ASPES automates student code grading with AI: AST syntax audits, multi-vector AI code detection, plagiarism checks, and instant rubric feedback. Try live demo.';
const SITE_URL = 'https://aspeskpgu.vercel.app';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  canonicalPath,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  schema,
}) => {
  // Prevent duplicate branding suffix if title already contains ASPES
  const fullTitle = title
    ? (title.includes('ASPES') ? title : `${title} | ASPES`)
    : DEFAULT_TITLE;

  const effectivePath = canonicalPath || canonical || '';
  const canonicalUrl = effectivePath
    ? `${SITE_URL}${effectivePath.startsWith('/') ? effectivePath : `/${effectivePath}`}`
    : SITE_URL;

  const imageUrl = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`;

  // Structured data: use provided schema, or fallback to Organization schema for indexed pages
  const jsonLd = schema || (!noindex ? getOrganizationSchema() : null);

  const googleSiteVerification = process.env.REACT_APP_GOOGLE_SITE_VERIFICATION;
  const bingSiteVerification = process.env.REACT_APP_BING_SITE_VERIFICATION;

  return (
    <Helmet>
      {/* Search Engine Verification Tags */}
      {googleSiteVerification && (
        <meta name="google-site-verification" content={googleSiteVerification} />
      )}
      {bingSiteVerification && (
        <meta name="msvalidate.01" content={bingSiteVerification} />
      )}

      {/* Primary HTML Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Crawl Directives */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}

      {/* Author & Application Identification */}
      <meta name="author" content="ASPES Team, KPGU" />
      <meta name="application-name" content="ASPES" />

      {/* Open Graph / Facebook / LinkedIn / WhatsApp */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="ASPES - KPGU" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="ASPES - AI Smart Project Evaluation System" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Structured Data (JSON-LD) */}
      {jsonLd && (
        <script id="schema-jsonld" type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
