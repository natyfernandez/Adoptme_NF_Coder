import { Router } from 'express';
import petsController from '../controllers/pets.controller.js';
import uploader from '../utils/uploader.js';

export const petsRouter = Router();

petsRouter.get('/',petsController.getAllPets);
petsRouter.get('/:pid',petsController.getPet);
petsRouter.post('/',petsController.createPet);
petsRouter.post('/withimage',uploader.single('image'), petsController.createPetWithImage);
petsRouter.put('/:pid',petsController.updatePet);
petsRouter.delete('/:pid',petsController.deletePet);
