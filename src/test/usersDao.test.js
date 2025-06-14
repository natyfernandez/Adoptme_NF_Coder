import mongoose from 'mongoose';
import { connectDB } from '../app.js';
import Users from '../dao/Users.dao.js';
import { expect } from 'chai';

const usersDao = new Users();

describe('🧪 Test DAO de Usuarios', () => {
    let usersDao;

    before(async () => {
        await connectDB();
        usersDao = new Users();
    });

    afterEach(async () => {
        await mongoose.connection.collection('users').deleteMany({});
    });

    after(async () => {
        await mongoose.connection.close();
    });

    it('debería guardar un usuario correctamente', async () => {
        const userMock = {
            first_name: 'Juan',
            last_name: 'Pérez',
            email: 'juan@example.com',
            password: 'secreta123'
        };

        const result = await usersDao.save(userMock);
        expect(result).to.have.property('_id');
        expect(result.email).to.equal(userMock.email);
    });

    it('debería obtener un usuario por su email', async () => {
        await usersDao.save({
            first_name: 'Laura',
            last_name: 'González',
            email: 'laura@example.com',
            password: 'clave123'
        });

        const result = await usersDao.getBy({ email: 'laura@example.com' });
        expect(result).to.exist;
        expect(result.first_name).to.equal('Laura');
    });

    it('debería actualizar un usuario', async () => {
        const user = await usersDao.save({
            first_name: 'Carlos',
            last_name: 'Díaz',
            email: 'carlos@example.com',
            password: 'abc123'
        });

        await usersDao.update(user._id, { last_name: 'Domínguez' });
        const updatedUser = await usersDao.getBy({ _id: user._id });

        expect(updatedUser.last_name).to.equal('Domínguez');
    });

    it('debería eliminar un usuario', async () => {
        const user = await usersDao.save({
            first_name: 'Ana',
            last_name: 'López',
            email: 'ana@example.com',
            password: 'test123'
        });

        await usersDao.delete(user._id);
        const result = await usersDao.getBy({ _id: user._id });

        expect(result).to.be.null;
    });
});