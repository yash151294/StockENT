const compression = require('compression');

const compressionMiddleware = compression({
  filter: (req, res) => {
    if (
      req.headers['cache-control'] &&
      req.headers['cache-control'].includes('no-transform')
    ) {
      return false;
    }
    if (res.getHeader('content-encoding')) {
      return false;
    }
    const contentLength = res.getHeader('content-length');
    if (contentLength && parseInt(contentLength) < 1024) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
});

module.exports = { compressionMiddleware };
