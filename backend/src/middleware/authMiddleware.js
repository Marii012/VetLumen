const jwt = require('jsonwebtoken');

const JWT_SECRET = 'VetLumen_2026_Secure_JWT_9Xf#82Lm@Qv!P7z';

const authMiddleware = (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Token não fornecido.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido ou expirado.'
    });
  }
};

module.exports = authMiddleware;