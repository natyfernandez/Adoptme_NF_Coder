import mongoose from 'mongoose';
import { connectDB } from '../app.js';
import Pets from '../dao/Pets.dao.js';
import { expect } from 'chai';

const petsDao = new Pets();

describe('🧪 Test DAO de Mascotas', () => {
    let petsDao;

    before(async () => {
        await connectDB();
        petsDao = new Pets();
    });

    afterEach(async () => {
        await mongoose.connection.collection('pets').deleteMany({});
    });

    after(async () => {
        await mongoose.connection.close();
    });

    it('debería guardar una mascota correctamente', async () => {
        const petMock = {
            name: 'Firulais',
            specie: 'Perro',
            birthDate: new Date('2021-01-01')
        };

        const result = await petsDao.save(petMock);
        expect(result).to.have.property('_id');
        expect(result.name).to.equal(petMock.name);
    });

    it('debería obtener una mascota por id', async () => {
        const pet = await petsDao.save({ name: 'Michi', specie: 'Gato' });

        const petId = pet._id

        const resPet = await petsDao.getBy(petId);
        expect(resPet).to.exist;
        expect(resPet.specie).to.equal('Gato');
    });

    it('debería actualizar una mascota', async () => {
        const pet = await petsDao.save({ name: 'Bobby', specie: 'Perro' });
        await petsDao.update(pet._id, { name: 'Bobby Jr.' });

        const updatedPet = await petsDao.getBy({ _id: pet._id });
        expect(updatedPet.name).to.equal('Bobby Jr.');
    });

    it('debería eliminar una mascota', async () => {
        const pet = await petsDao.save({ name: 'Pelusa', specie: 'Conejo' });
        await petsDao.delete(pet._id);

        const result = await petsDao.getBy({ _id: pet._id });
        expect(result).to.be.null;
    });
});