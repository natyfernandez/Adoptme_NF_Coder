export const info = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'API AdoptMe',
        version: '1.0.0',
        description: 'Documentación de la API AdoptMe: sesiones, mascotas y adopciones.'
      },
      servers: [
        {
          url: 'http://localhost:8000'
        }
      ]
    },
    apis: ['./src/docs/*.yml'] 
  }
  