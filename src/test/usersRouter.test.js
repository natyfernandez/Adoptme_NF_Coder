import supertest from 'supertest';
import { expect } from 'chai';
import app from '../app.js';
import { connectDB } from '../app.js';
import mongoose from 'mongoose';
import { createHash } from '../utils/index.js';

const requester = supertest(app);

describe('🧪 Test de Users Router (API Endpoints)', function () {
    this.timeout(10000);

    let authToken;
    let testUserId;
    const testEmail = `test${Date.now()}@mail.com`;
    const testPassword = 'test123';

    before(async function () {
        try {
            await connectDB();

            const hashedPassword = await createHash(testPassword);
            const user = {
                first_name: 'Test',
                last_name: 'User',
                email: testEmail,
                password: hashedPassword,
                role: 'user'
            };

            const createdUser = await mongoose.connection.collection('users').insertOne(user);
            testUserId = createdUser.insertedId.toString();

            const loginRes = await requester.post('/api/sessions/login').send({
                email: testEmail,
                password: testPassword
            });
            
            if (loginRes.status !== 200 || !loginRes.body.token) {
                throw new Error('No se pudo obtener token de autenticación');
            }

            authToken = loginRes.body.token;
        } catch (error) {
            console.error('Error en before hook:', error);
            throw error;
        }
    });

    after(async function () {
        try {
            await mongoose.connection.collection('users').deleteMany({});
            await mongoose.connection.close();
        } catch (error) {
            console.error('Error en after hook:', error);
        }
    });

    describe('GET /api/users', function () {
        it('debería obtener todos los usuarios', async function () {
            const res = await requester
                .get('/api/users')
                .set('Cookie', [`coderCookie=${authToken}`]);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('status', 'success');
            expect(res.body.payload).to.be.an('array');
            expect(res.body.payload.some(u => u._id === testUserId)).to.be.true;
        });
    });

    describe('GET /api/users/:uid', function () {
        it('debería obtener un usuario por ID', async function () {
            const res = await requester
                .get(`/api/users/${testUserId}`)
                .set('Cookie', [`coderCookie=${authToken}`]);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('status', 'success');
            expect(res.body.payload._id).to.equal(testUserId);
        });

        it('debería retornar error 404 para usuario no encontrado', async function () {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await requester
                .get(`/api/users/${fakeId}`)
                .set('Cookie', [`coderCookie=${authToken}`]);

            expect(res.status).to.equal(404);
        });

        it('debería retornar error 400 con ID inválido', async function () {
            const res = await requester
                .get('/api/users/invalid-id')
                .set('Cookie', [`coderCookie=${authToken}`]);

            expect(res.status).to.equal(400);
        });
    });

    describe('PUT /api/users/:uid', function () {
        it('debería actualizar un usuario con datos válidos', async function () {
            const updates = { first_name: 'Updated' };

            const res = await requester
                .put(`/api/users/${testUserId}`)
                .set('Cookie', [`coderCookie=${authToken}`])
                .send(updates);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('status', 'success');
            expect(res.body.payload.first_name).to.equal('Updated');

            const updatedUser = await mongoose.connection.collection('users').findOne({ 
                _id: new mongoose.Types.ObjectId(testUserId) 
            });
            expect(updatedUser.first_name).to.equal('Updated');
        });

        it('debería retornar error 400 con datos inválidos', async function () {
            const invalidUpdates = { email: 'no-es-un-email-valido' };

            const res = await requester
                .put(`/api/users/${testUserId}`)
                .set('Cookie', [`coderCookie=${authToken}`])
                .send(invalidUpdates);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('status', 'error');
        });
    });

    describe('DELETE /api/users/:uid', function () {
        it('debería eliminar un usuario existente', async function () {
            const userToDelete = {
                first_name: 'ToDelete',
                last_name: 'User',
                email: `todelete${Date.now()}@mail.com`,
                password: 'password123'
            };
            const createdUser = await mongoose.connection.collection('users').insertOne(userToDelete);
            const userIdToDelete = createdUser.insertedId.toString();

            const res = await requester
                .delete(`/api/users/${userIdToDelete}`)
                .set('Cookie', [`coderCookie=${authToken}`]);

            expect(res.status).to.equal(200);

            const deletedUser = await mongoose.connection.collection('users').findOne({ 
                _id: new mongoose.Types.ObjectId(userIdToDelete) 
            });
            expect(deletedUser).to.be.null;
        });

        it('debería retornar error 404 para usuario no encontrado', async function () {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await requester
                .delete(`/api/users/${fakeId}`)
                .set('Cookie', [`coderCookie=${authToken}`]);

            expect(res.status).to.equal(404);
        });
    });
});