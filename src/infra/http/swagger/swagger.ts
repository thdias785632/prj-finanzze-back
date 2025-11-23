import swaggerAutogen from 'swagger-autogen';
import dotenv from 'dotenv';

dotenv.config();

const doc = {
  info: {
    version: '1.0.0',
    title: 'Finanzze Api',
    description: 'Backend API for Finanzze',
  },
  servers: [
    {
      url: process.env.URL || 'http://localhost:3000',
      description: process.env.ENV || 'development',
    },
  ],
  components: {
    createUser: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'John Doe',
        },
        email: {
          type: 'string',
          example: 'email@email.com',
        },
        password: {
          type: 'string',
          example: '123456',
        },
      },
    },
    loginUser: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'email@email.com',
        },
        password: {
          type: 'string',
          example: '123456',
        },
      },
    },
    createCard: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '1234567890',
        },
        name: {
          type: 'string',
          example: 'John Doe',
        },
        active: {
          type: 'boolean',
          example: 'true',
        },
        flag: {
          type: 'string',
          example: 'VISA',
        }
      },
    },
    updateCard: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: '1234567890',
        },
        userId: {
          type: 'string',
          example: '1234567890',
        },
        name: {
          type: 'string',
          example: 'John Doe',
        },
        active: {
          type: 'boolean',
          example: 'true',
        },
        flag: {
          type: 'string',
          example: 'VISA',
        }
      },
    },
    createCardExpense: {
      type: 'object',
      properties: {
        cardId: {
          type: 'string',
          example: '1234567890',
        },
        userId: {
          type: 'string',
          example: '1234567890',
        },
        name: {
          type: 'string',
          example: 'John Doe',
        },
        value: {
          type: 'number',
          example: 100.00,
        },
        installments: {
          type: 'number',
          example: 1,
        },
        referenceDate: {
          type: 'string',
          example: '2023-10-01T00:00:00Z',
        },
        active: {
          type: 'boolean',
          example: 'true',
        },
        recurrent: {
          type: 'boolean',
          example: 'false',
        },
      },
    },
    createExpenses: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '1234567890',
        },
        name: {
          type: 'string',
          example: 'John Doe',
        },
        value: {
          type: 'number',
          example: 100.00,
        },
        referenceDate: {
          type: 'string',
          example: '2023-10-01T00:00:00Z',
        },
        endDate: {
          type: 'string',
          example: '2023-10-01T00:00:00Z',
        },
        active: {
          type: 'boolean',
          example: 'true',
        },
        recurrent: {
          type: 'boolean',
          example: 'false',
        },
      },
    },
    createRevenues: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '1234567890',
        },
        name: {
          type: 'string',
          example: 'John Doe',
        },
        value: {
          type: 'number',
          example: 100.00,
        },
        referenceDate: {
          type: 'string',
          example: '2023-10-01T00:00:00Z',
        },
        active: {
          type: 'boolean',
          example: 'true',
        },
        recurrent: {
          type: 'boolean',
          example: 'false',
        },
      },
    },
    createCategory: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '1234567890',
        },
        name: {
          type: 'string',
          example: 'John Doe',
        },
      },
    },
  },
  definitions: {
    getCards: [
      {
        id: "ed253c67-dba9-4bc3-96a7-cbef7ecdf838",
        userId: "87749533-0527-4816-8f64-2bd4880ed580",
        name: "UNIQUE",
        active: true,
        flag: "VISA"
      }
    ],
    getCardExpensess: [
      {
        id: "ed253c67-dba9-4bc3-96a7-cbef7ecdf838",
        cardId: "87749533-0527-4816-8f64-2bd4880ed580",
        userId: "87749533-0527-4816-8f64-2bd4880ed580",
        name: "UNIQUE",
        value: 100.00,
        installments: 1,
        referenceDate: "2023-10-01T00:00:00Z",
        active: true,
        recurrent: false
      }
    ],
    getExpensess: [
      {
        id: "ed253c67-dba9-4bc3-96a7-cbef7ecdf838",
        userId: "87749533-0527-4816-8f64-2bd4880ed580",
        name: "UNIQUE",
        value: 100.00,
        referenceDate: "2023-10-01T00:00:00Z",
        endDate: "2023-10-01T00:00:00Z",
        active: true,
        recurrent: false
      }
    ],
    getCompleteExtract: [
      {
        totalExpensesss: 127.65,
        totalRevenues: 127.65,
        revenues: [
          {
            name: "Maquina",
            value: 127.65
          }
        ],
        cardExpensess: [
          {
            name: "Maquina",
            value: 127.65
          }
        ],
        fixedExpensess: [
          {
            name: "Maquina",
            value: 127.65
          }
        ]
      }
    ],
    getRevenues: [
      {
        id: "ed253c67-dba9-4bc3-96a7-cbef7ecdf838",
        userId: "87749533-0527-4816-8f64-2bd4880ed580",
        name: "Salário",
        value: 100.00,
        referenceDate: "2023-10-01T00:00:00Z",
        active: true,
        recurrent: false
      }
    ],
    getCardsExtract: [
      {
        card: {
          id: "ed253c67-dba9-4bc3-96a7-cbef7ecdf838",
          userId: "87749533-0527-4816-8f64-2bd4880ed580",
          name: "UNIQUE",
          active: true,
          flag: "VISA"
        },
        total: 100.00,
        cardExpensess: [
          {
            id: "ed253c67-dba9-4bc3-96a7-cbef7ecdf838",
            cardId: "87749533-0527-4816-8f64-2bd4880ed580",
            userId: "87749533-0527-4816-8f64-2bd4880ed580",
            name: "UNIQUE",
            value: 100.00,
            installments: 1,
            referenceDate: "2023-10-01T00:00:00Z",
            active: true,
            recurrent: false
          }
        ]
      }
    ],
    getCategories: [
      {
        id: "ed253c67-dba9-4bc3-96a7-cbef7ecdf838",
        userId: "87749533-0527-4816-8f64-2bd4880ed580",
        name: "Moradia",
      },
      {
        id: "ed253c67-dba9-4bc3-96a7-cbef7ecdf838",
        userId: "87749533-0527-4816-8f64-2bd4880ed580",
        name: "Alimentação",
      }
    ],
  }
};

const outputFile = './swagger-output.json';
const routes = ['../routes/index.ts'];

swaggerAutogen({openapi: '3.0.0'})(outputFile, routes, doc);