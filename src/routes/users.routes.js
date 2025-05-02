import { Router } from 'express';
import usersController from '../controllers/users.controller.js';

export const usersRouter = Router();

usersRouter.get('/',usersController.getAllUsers);

usersRouter.get('/:uid',usersController.getUser);
usersRouter.put('/:uid',usersController.updateUser);
usersRouter.delete('/:uid',usersController.deleteUser);
