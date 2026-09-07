// Centralized error handler. express-async-errors forwards thrown errors
// from async route handlers here.
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 'P2002') {
    // Prisma unique constraint violation
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({ error: `That ${field} is already in use.` });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Something went wrong.' });
}

module.exports = errorHandler;
