/**
 * Middleware de Validação
 * - Centraliza resultado de `express-validator` e retorna 400 com detalhes quando houver erros.
 */
import { validationResult } from 'express-validator';

export default function validationMiddleware(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
}
