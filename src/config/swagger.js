import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import * as disciplinaSchemas from '../docs/components/disciplinasSchema.js';
import * as horarioSchemas from '../docs/components/horariosSchema.js';

const baseSchemas = {
	Role: {
		type: 'object',
		properties: {
			id: { type: 'integer' },
			name: { type: 'string' },
			description: { type: 'string' }
		}
	},
	Usuario: {
		type: 'object',
		properties: {
			id: { type: 'integer' },
			nome: { type: 'string' },
			email: { type: 'string' },
			ra: { type: ['string', 'null'] },
			siape: { type: ['string', 'null'] },
			roles: { type: 'array', items: { type: 'string' } }
		}
	},
	AuthRequest: {
		type: 'object',
		required: ['email', 'senha'],
		properties: {
			email: { type: 'string' },
			senha: { type: 'string' }
		}
	},
	AuthResponse: {
		type: 'object',
		properties: {
			accessToken: { type: 'string' },
			refreshToken: { type: 'string' },
			user: { $ref: '#/components/schemas/Usuario' }
		}
	},
	Turma: {
		type: 'object',
		properties: {
			id: { type: 'integer' },
			codigo: { type: 'string' },
			nome: { type: 'string' },
			vagas: { type: 'integer' },
			disciplina_id: { type: ['integer', 'null'] },
			professor_id: { type: ['integer', 'null'] },
			horario_id: { type: ['integer', 'null'] },
			created_at: { type: 'string', format: 'date-time' }
		}
		,example: {
			id: 1,
			codigo: 'TURMA2025A',
			nome: 'Turma de Exemplo',
			vagas: 40,
			disciplina_id: 2,
			professor_id: 3,
			horario_id: 1,
			created_at: '2025-11-02T12:00:00.000Z'
		}
	},
	Matricula: {
		type: 'object',
		properties: {
			id: { type: 'integer' },
			aluno_id: { type: 'integer' },
			turma_id: { type: 'integer' },
			created_at: { type: 'string', format: 'date-time' }
		}
	}
	,
	// request/creation schemas
	UsuarioCreate: {
		type: 'object',
		required: ['nome', 'email', 'senha'],
		properties: {
			nome: { type: 'string' },
			email: { type: 'string' },
			senha: { type: 'string' },
			ra: { type: ['string', 'null'] },
			siape: { type: ['string', 'null'] },
			roles: { type: 'array', items: { type: 'string' } }
		}
	},
	RoleAssign: {
		type: 'object',
		required: ['role'],
		properties: {
			role: { type: 'string' }
		}
	},
	MatriculaCreate: {
		type: 'object',
		required: ['turmaId'],
		properties: {
			turmaId: { type: 'integer' }
		}
	}
};

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'API Sistema de Matrículas',
			version: '1.0.0',
			description: 'API para SPA de matrículas - documentação gerada via swagger-jsdoc'
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT'
				}
			},
			schemas: {
				...baseSchemas,
				...disciplinaSchemas,
				...horarioSchemas
			}
		}
	},
	apis: ['./src/controllers/*.js', './src/routers/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);

export default function setupSwagger(app) {
	app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Expor o JSON do OpenAPI para importação/integração (ex: Postman, CI)
export function setupSwaggerJson(app) {
	app.get('/api-docs.json', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		res.send(swaggerSpec);
	});
}
