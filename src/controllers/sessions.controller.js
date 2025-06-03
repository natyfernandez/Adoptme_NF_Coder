import { usersService } from "../services/index.js";
import { createHash, passwordValidation } from "../utils/index.js";
import jwt from 'jsonwebtoken';
import UserDTO from '../dto/User.dto.js';

const register = async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;
        
        // Validación de campos requeridos
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ 
                status: "error", 
                error: "Todos los campos son requeridos" 
            });
        }

        // Verificar si el usuario ya existe
        const exists = await usersService.getUserByEmail(email);
        if (exists) {
            return res.status(400).json({ 
                status: "error", 
                error: "El usuario ya existe" 
            });
        }

        // Crear hash de la contraseña
        const hashedPassword = await createHash(password);
        
        // Crear objeto de usuario
        const user = {
            first_name,
            last_name,
            email,
            password: hashedPassword,
            role: 'user' // Asignar rol por defecto
        };

        // Guardar usuario en la base de datos
        const result = await usersService.create(user);
        
        // Generar token JWT
        const userDto = UserDTO.getUserTokenFrom(result);
        const token = jwt.sign(userDto, process.env.JWT_SECRET || 'tokenSecretJWT', { 
            expiresIn: process.env.JWT_EXPIRES_IN || "1h" 
        });

        // Configurar cookie y enviar respuesta
        res.cookie('coderCookie', token, { 
            maxAge: 3600000, 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        }).status(201).json({ 
            status: "success", 
            token,
            user: {
                id: result._id,
                first_name: result.first_name,
                last_name: result.last_name,
                email: result.email,
                role: result.role
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ 
            status: "error", 
            error: "Error interno del servidor" 
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validación de campos requeridos
        if (!email || !password) {
            return res.status(400).json({ 
                status: "error", 
                error: "Email y contraseña son requeridos" 
            });
        }

        // Buscar usuario en la base de datos
        const user = await usersService.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ 
                status: "error", 
                error: "Usuario no encontrado" 
            });
        }

        // Validar contraseña
        const isValidPassword = await passwordValidation(user, password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                status: "error", 
                error: "Credenciales inválidas" 
            });
        }

        // Generar token JWT
        const userDto = UserDTO.getUserTokenFrom(user);
        const token = jwt.sign(userDto, process.env.JWT_SECRET || 'tokenSecretJWT', { 
            expiresIn: process.env.JWT_EXPIRES_IN || "1h" 
        });

        // Actualizar última conexión
        await usersService.updateUser(user._id, { 
            last_connection: new Date() 
        });

        // Configurar cookie y enviar respuesta
        res.cookie('coderCookie', token, { 
            maxAge: 3600000, 
            httpOnly: true,
        }).status(200).json({ 
            status: "success", 
            token,
            user: {
                id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            status: "error", 
            error: "Error interno del servidor" 
        });
    }
};

const current = async (req, res) => {
    try {
        // El middleware de autenticación ya verificó el token
        // y adjuntó el usuario a req.user
        if (req.user) {
            return res.status(200).json({ 
                status: "success", 
                user: req.user 
            });
        }
        return res.status(401).json({ 
            status: "error", 
            error: "No autorizado" 
        });
    } catch (error) {
        console.error('Error en current:', error);
        res.status(500).json({ 
            status: "error", 
            error: "Error interno del servidor" 
        });
    }
};

const unprotectedLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                status: "error", 
                error: "Email y contraseña son requeridos" 
            });
        }

        const user = await usersService.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ 
                status: "error", 
                error: "Usuario no encontrado" 
            });
        }

        const isValidPassword = await passwordValidation(user, password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                status: "error", 
                error: "Credenciales inválidas" 
            });
        }

        const token = jwt.sign(user.toObject(), process.env.JWT_SECRET || 'tokenSecretJWT', { 
            expiresIn: "1h" 
        });

        res.cookie('unprotectedCookie', token, { 
            maxAge: 3600000 
        }).status(200).json({ 
            status: "success", 
            token,
            message: "Login sin protección exitoso" 
        });

    } catch (error) {
        console.error('Error en unprotectedLogin:', error);
        res.status(500).json({ 
            status: "error", 
            error: "Error interno del servidor" 
        });
    }
};

const unprotectedCurrent = async (req, res) => {
    try {
        const cookie = req.cookies['unprotectedCookie'];
        if (!cookie) {
            return res.status(401).json({ 
                status: "error", 
                error: "No autorizado" 
            });
        }

        const user = jwt.verify(cookie, process.env.JWT_SECRET || 'tokenSecretJWT');
        res.status(200).json({ 
            status: "success", 
            user 
        });

    } catch (error) {
        console.error('Error en unprotectedCurrent:', error);
        res.status(500).json({ 
            status: "error", 
            error: "Error interno del servidor" 
        });
    }
};

export default {
    register,
    login,
    current,
    unprotectedLogin,
    unprotectedCurrent
};