export const Horario = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    dia: { type: 'integer', description: '1..7 (1=domingo)' },
    turno: { type: 'integer', description: '1=manhã,2=tarde,3=noite' },
    codigo: { type: 'string' },
    descricao: { type: 'string' }
  },
  required: ['dia', 'turno', 'codigo']
};

export const HorarioCreate = {
  type: 'object',
  properties: {
    dia: { type: 'integer' },
    turno: { type: 'integer' },
    codigo: { type: 'string' },
    descricao: { type: 'string' }
  },
  required: ['dia', 'turno', 'codigo']
};
