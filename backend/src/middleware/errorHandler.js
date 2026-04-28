const errorHandler = (err, req, res, next) => {
  console.error(`❌ ${err.message}`);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.code === 11000) return res.status(400).json({ success: false, message: 'Duplicate entry' });
  if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid ID format' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'File too large' });

  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server Error' });
};

module.exports = errorHandler;
