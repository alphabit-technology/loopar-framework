import { promises as fs } from 'fs';
import { extname } from 'path';

export function zstdMiddleware(options = {}) {
  const { 
    root = 'dist/client',
    priority = ['zst', 'br', 'gz'],
  } = options;

  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const acceptEncoding = req.headers['accept-encoding'] || '';
    const supportsZstd = acceptEncoding.includes('zstd');
    const supportsBrotli = acceptEncoding.includes('br');
    const supportsGzip = acceptEncoding.includes('gzip');

    const originalPath = req.path;
    const ext = extname(originalPath);
    
    if (!['.js', '.css', '.html', '.json', '.svg'].includes(ext)) {
      return next();
    }

    const filePath = `${root}${originalPath}`;

    try {
      if (supportsZstd && priority.includes('zst')) {
        const zstPath = `${filePath}.zst`;
        const exists = await fileExists(zstPath);
        
        if (exists) {
          const compressed = await fs.readFile(zstPath);
          
          res.setHeader('Content-Encoding', 'zstd');
          res.setHeader('Content-Type', getContentType(ext));
          res.setHeader('Vary', 'Accept-Encoding');
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          
          return res.send(compressed);
        }
      }

      if (supportsBrotli && priority.includes('br')) {
        const brPath = `${filePath}.br`;
        const exists = await fileExists(brPath);
        
        if (exists) {
          res.setHeader('Content-Encoding', 'br');
          res.setHeader('Content-Type', getContentType(ext));
          res.setHeader('Vary', 'Accept-Encoding');
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          
          const compressed = await fs.readFile(brPath);
          return res.send(compressed);
        }
      }

      if (supportsGzip && priority.includes('gz')) {
        const gzPath = `${filePath}.gz`;
        const exists = await fileExists(gzPath);
        
        if (exists) {
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Content-Type', getContentType(ext));
          res.setHeader('Vary', 'Accept-Encoding');
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          
          const compressed = await fs.readFile(gzPath);
          return res.send(compressed);
        }
      }

      next();
    } catch (error) {
      console.error('Error serving compressed file:', error);
      next();
    }
  };
}

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function getContentType(ext) {
  const types = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
}