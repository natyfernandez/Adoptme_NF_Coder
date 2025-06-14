import { usersService } from "../services/index.js";
import { createHash, passwordValidation } from "../utils/index.js";
import jwt from 'jsonwebtoken';
import UserDTO from '../dto/User.dto.js';

const register = async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;
        
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ 
                status: "error", 
                error: "Todos los campos son requeridos" 
            });
        }

        const exists = await usersService.getBy({email: email});
        if (exists) {
            return res.status(400).json({ 
                status: "error", 
                error: "El usuario ya existe" 
            });
        }

        const hashedPassword = await createHash(password);
        
        const user = {
            first_name,
            last_name,
            email,
            password: hashedPassword,
            role: 'user'
        };

        const result = await usersService.create(user);
        
        const userDto = UserDTO.getUserTokenFrom(result);
        const token = jwt.sign(userDto, process.env.JWT_SECRET || 'tokenSecretJWT', { 
            expiresIn: process.env.JWT_EXPIRES_IN || "1h" 
        });

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
        
        if (!email || !password) {
            return res.status(400).json({ 
                status: "error", 
                error: "Email y contraseña son requeridos" 
            });
        }

        const user = await usersService.getUserBy({email: email});
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

        const userDto = UserDTO.getUserTokenFrom(user);
        const token = jwt.sign(userDto, process.env.JWT_SECRET || 'tokenSecretJWT', { 
            expiresIn: process.env.JWT_EXPIRES_IN || "1h" 
        });

        await usersService.updateUser(user._id, { 
            last_connection: new Date() 
        });

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

        const user = await usersService.getUserBy({email: email});
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