// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Database errors
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({ error: 'Data already exists', message: err.message });
  }

  if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({ error: 'Invalid reference', message: err.message });
  }

  // Validation errors
  if (err.status === 400) {
    return res.status(400).json({ error: 'Bad Request', message: err.message });
  }

  // Not found
  if (err.status === 404) {
    return res.status(404).json({ error: 'Not Found', message: err.message });
  }

  // Default error
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

module.exports = errorHandler;
