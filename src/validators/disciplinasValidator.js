import { checkSchema } from 'express-validator';

export const disciplinaCreateSchema = checkSchema({
  codigo: {
    in: ['body'],
    isString: true,
    trim: true,
    notEmpty: { errorMessage: 'codigo é obrigatório' },
  },
  nome: {
    in: ['body'],
    isString: true,
    trim: true,
    notEmpty: { errorMessage: 'nome é obrigatório' },
  },
  carga_horaria: {
    in: ['body'],
    optional: true,
    isInt: { options: { min: 0 }, errorMessage: 'carga_horaria deve ser inteiro >= 0' },
    toInt: true,
  },
});

export const disciplinaUpdateSchema = checkSchema({
  codigo: {
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
  },
  nome: {
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
  },
  carga_horaria: {
    in: ['body'],
    optional: true,
    isInt: { options: { min: 0 }, errorMessage: 'carga_horaria deve ser inteiro >= 0' },
    toInt: true,
  },
});
