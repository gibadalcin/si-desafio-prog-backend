import { checkSchema } from 'express-validator';

export const horarioCreateSchema = checkSchema({
  dia: {
    in: ['body'],
    isInt: { options: { min: 1, max: 7 }, errorMessage: 'dia deve estar entre 1 e 7' },
    toInt: true,
  },
  turno: {
    in: ['body'],
    isInt: { options: { min: 1, max: 3 }, errorMessage: 'turno deve ser 1,2 ou 3' },
    toInt: true,
  },
  codigo: {
    in: ['body'],
    isString: true,
    trim: true,
    notEmpty: { errorMessage: 'codigo é obrigatório' },
  },
  descricao: {
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
  },
});

export const horarioUpdateSchema = checkSchema({
  dia: {
    in: ['body'],
    optional: true,
    isInt: { options: { min: 1, max: 7 }, errorMessage: 'dia deve estar entre 1 e 7' },
    toInt: true,
  },
  turno: {
    in: ['body'],
    optional: true,
    isInt: { options: { min: 1, max: 3 }, errorMessage: 'turno deve ser 1,2 ou 3' },
    toInt: true,
  },
  codigo: {
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
  },
  descricao: {
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
  },
});
