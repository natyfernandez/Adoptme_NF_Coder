import { Router } from 'express';
import { generateMockPets } from '../utils/mockingPets.js';
import { generateMockUsers } from '../utils/mockingUsers.js';
import petModel from '../dao/models/Pet.js';
import userModel from '../dao/models/User.js';

export const mocksRouter = Router();

mocksRouter.get('/mockingpets', async (req, res) => {
    try {
        const pets = generateMockPets(50);
        await petModel.insertMany(pets);
        res.status(200).json({ status: 'success', inserted: pets.length, payload: pets });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

mocksRouter.get('/mockingusers', async (req, res) => {
    try {
        const users = await generateMockUsers(50);
        await userModel.insertMany(users);
        res.status(200).json({ status: 'success', inserted: users.length, payload: users });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});


mocksRouter.post('/generateData', async (req, res) => {
    try {
        const { users = 0, pets = 0 } = req.body;

        const mockUsers = await generateMockUsers(users);
        const insertedUsers = await userModel.insertMany(mockUsers);

        const mockPets = generateMockPets(pets);
        const insertedPets = await petModel.insertMany(mockPets);

        res.status(200).json({
            status: 'success',
            users: insertedUsers.length,
            pets: insertedPets.length,
        });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});