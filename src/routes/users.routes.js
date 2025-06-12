import { Router } from 'express';
import usersController from '../controllers/users.controller.js';
import uploader from '../utils/uploader.js'; 
import userModel from '../dao/models/User.js';

export const usersRouter = Router();

usersRouter.get('/', usersController.getAllUsers);
usersRouter.get('/:uid', usersController.getUser);
usersRouter.put('/:uid', usersController.updateUser);
usersRouter.delete('/:uid', usersController.deleteUser);

usersRouter.post('/:uid/documents', uploader.array('documents'), async (req, res) => {
    try {
        const { uid } = req.params;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No se enviaron archivos.' });
        }

        const documents = files.map(file => ({
            name: file.originalname,
            reference: file.path.replace(/\\/g, '/')
        }));

        const updatedUser = await userModel.findByIdAndUpdate(
            uid,
            { $push: { documents: { $each: documents } } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Documentos subidos correctamente',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error al subir documentos:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});
