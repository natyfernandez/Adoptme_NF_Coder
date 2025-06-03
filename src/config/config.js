import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno según el entorno
config({
    path: resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`)
});

export const CONFIG = {
    PORT: process.env.PORT || 8000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    FRONTEND_URL: process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 8000}`,

    // Base de datos
    MONGO_URI: process.env.MONGO_URI,
    MONGO_URI_TEST: process.env.MONGO_URI_TEST || 'mongodb://localhost/adoptme-test',

    // Seguridad
    SECRET_KEY: process.env.SECRET_KEY || 'secret-key-dev',
    JWT_SECRET: process.env.JWT_SECRET || 'jwt-secret-dev',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',

    // Email (solo necesario en producción/desarrollo)
    MAIL: process.env.NODE_ENV === 'test' ? null : {
        FROM: process.env.NODEMAILER_FROM || 'no-reply@adoptme.com',
        USER: process.env.NODEMAILER_USER,
        HOST: process.env.NODEMAILER_HOST,
        PORT: parseInt(process.env.NODEMAILER_PORT) || 587,
        PASSWORD: process.env.NODEMAILER_PASSWORD
    }
};

// Validaciones para entorno de producción
if (CONFIG.NODE_ENV === 'production') {
    const required = ['MONGO_URI', 'JWT_SECRET', 'SECRET_KEY'];
    required.forEach(key => {
        if (!process.env[key]) throw new Error(`Falta la variable crítica: ${key}`);
    });
}