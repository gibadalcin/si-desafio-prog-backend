export const Disciplina = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    codigo: { type: 'string' },
    nome: { type: 'string' },
    carga_horaria: { type: 'integer' }
  },
  required: ['codigo', 'nome']
};

export const DisciplinaCreate = {
  type: 'object',
  properties: {
    codigo: { type: 'string' },
    nome: { type: 'string' },
    carga_horaria: { type: 'integer' }
  },
  required: ['codigo', 'nome']
};
