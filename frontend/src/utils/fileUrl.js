/**
 * File URL and format resolution utilities for ASPES.
 * Handles Cloudinary remote URLs, single-slash normalized paths,
 * and local static asset URLs without path doubling or corruption.
 */

export const getFileUrl = (path) => {
  if (!path) return '';

  let normalized = String(path).replace(/\\/g, '/').trim();

  // If path contains Cloudinary anywhere (e.g. uploads/https:/res.cloudinary.com/...)
  const cloudinaryIdx = normalized.indexOf('res.cloudinary.com');
  if (cloudinaryIdx !== -1) {
    const afterCloud = normalized.substring(cloudinaryIdx);
    return `https://${afterCloud}`;
  }

  // If path was mistakenly prepended with an internal endpoint before an absolute URL
  const embeddedHttps = normalized.indexOf('https:/');
  if (embeddedHttps !== -1) {
    const afterProtocol = normalized.substring(embeddedHttps + 7).replace(/^\/+/, '');
    return `https://${afterProtocol}`;
  }
  const embeddedHttp = normalized.indexOf('http:/');
  if (embeddedHttp !== -1) {
    const afterProtocol = normalized.substring(embeddedHttp + 6).replace(/^\/+/, '');
    return `http://${afterProtocol}`;
  }

  // Standard absolute URLs
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  // Local filesystem path mounted under /uploads
  const cleanRelative = normalized.replace(/^\.?\/+/, '');
  const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1')
    .replace(/\/api\/v1\/?$/, '');

  const finalRelative = cleanRelative.startsWith('uploads/') 
    ? cleanRelative 
    : `uploads/${cleanRelative}`;

  return `${baseUrl}/${finalRelative}`;
};

/**
 * Extracts normalized file extension from path or filename.
 * @param {string} pathOrName 
 * @returns {string} e.g. "pdf", "md", "docx", "doc", "txt", "zip"
 */
export const getFileExtension = (pathOrName) => {
  if (!pathOrName) return '';
  const clean = pathOrName.split('?')[0].split('#')[0];
  const parts = clean.split(/[/\\]/).pop().split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

export const isMarkdownFile = (pathOrName) => {
  const ext = getFileExtension(pathOrName);
  return ext === 'md' || ext === 'markdown';
};

export const isPdfFile = (pathOrName) => {
  return getFileExtension(pathOrName) === 'pdf';
};

export const isWordFile = (pathOrName) => {
  const ext = getFileExtension(pathOrName);
  return ext === 'docx' || ext === 'doc';
};

export const isTextFile = (pathOrName) => {
  const ext = getFileExtension(pathOrName);
  return ext === 'txt' || ext === 'rst';
};
