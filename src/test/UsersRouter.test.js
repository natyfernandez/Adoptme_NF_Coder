import supertest from 'supertest';
import { expect } from 'chai';
import app from '../app.js';
import { connectDB } from '../app.js';
import mongoose from 'mongoose';
import { createHash } from '../utils/index.js';

const requester = supertest(app);

describe('🧪 Test de Users Router (API Endpoints)', function() {
    this.timeout(10000); // 10 segundos de timeout para todas las pruebas
    
    let authToken;
    let testUserId;
    const testEmail = `test${Date.now()}@mail.com`;
    const testPassword = 'test123';

    before(async function() {
        try {
            // Conectar a la base de datos
            await connectDB();
            
            // Crear usuario de prueba directamente en la base de datos
            // para evitar dependencia del endpoint de registro
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
            
            // Hacer login para obtener token
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

    after(async function() {
        try {
            // Limpiar base de datos
            await mongoose.connection.collection('users').deleteMany({});
            await mongoose.connection.close();
        } catch (error) {
            console.error('Error en after hook:', error);
        }
    });

    describe('POST /api/users', function() {
        it('debería crear un nuevo usuario con datos válidos', async function() {
            const newUser = {
                first_name: 'New',
                last_name: 'User',
                email: `newuser${Date.now()}@mail.com`,
                password: 'password123',
                role: 'user'
            };

            const res = await requester
                .post('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send(newUser);

            expect(res.status).to.equal(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.property('_id');
            expect(res.body.first_name).to.equal(newUser.first_name);
            expect(res.body.email).to.equal(newUser.email);
        });

        it('debería retornar error 400 con datos incompletos', async function() {
            const invalidUser = {
                first_name: 'Incomplete',
                email: `incomplete${Date.now()}@mail.com`
            };

            const res = await requester
                .post('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidUser);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('error');
            expect(res.body.error).to.include('incompletos');
        });

        it('debería retornar error 401 sin token de autenticación', async function() {
            const newUser = {
                first_name: 'NoAuth',
                last_name: 'User',
                email: `noauth${Date.now()}@mail.com`,
                password: 'password123'
            };

            const res = await requester
                .post('/api/users')
                .send(newUser);

            expect(res.status).to.equal(401);
        });
    });

    describe('GET /api/users', function() {
        it('debería obtener todos los usuarios', async function() {
            const res = await requester
                .get('/api/users')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.be.at.least(1);
            
            // Verificar que el usuario de prueba está en la lista
            const testUser = res.body.find(u => u._id === testUserId);
            expect(testUser).to.exist;
            expect(testUser.email).to.equal(testEmail);
        });

        it('debería retornar error 401 sin autenticación', async function() {
            const res = await requester.get('/api/users');
            expect(res.status).to.equal(401);
        });
    });

    describe('GET /api/users/:uid', function() {
        it('debería obtener un usuario por ID', async function() {
            const res = await requester
                .get(`/api/users/${testUserId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('object');
            expect(res.body._id).to.equal(testUserId);
            expect(res.body.email).to.equal(testEmail);
        });

        it('debería retornar error 404 para usuario no encontrado', async function() {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await requester
                .get(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(404);
        });

        it('debería retornar error 400 con ID inválido', async function() {
            const res = await requester
                .get('/api/users/invalid-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(400);
        });
    });

    describe('PUT /api/users/:uid', function() {
        it('debería actualizar un usuario con datos válidos', async function() {
            const updates = { 
                last_name: 'Updated',
                age: 30 
            };

            const res = await requester
                .put(`/api/users/${testUserId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates);

            expect(res.status).to.equal(200);
            expect(res.body.last_name).to.equal('Updated');
            expect(res.body.age).to.equal(30);
        });

        it('debería retornar error 400 con datos inválidos', async function() {
            const invalidUpdates = { 
                email: 'invalid-email' 
            };

            const res = await requester
                .put(`/api/users/${testUserId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidUpdates);

            expect(res.status).to.equal(400);
        });
    });

    describe('DELETE /api/users/:uid', function() {
        let userIdToDelete;

        beforeEach(async function() {
            // Crear un usuario para eliminar
            const user = {
                first_name: 'ToDelete',
                last_name: 'User',
                email: `todelete${Date.now()}@mail.com`,
                password: 'password123'
            };
            
            const createdUser = await mongoose.connection.collection('users').insertOne(user);
            userIdToDelete = createdUser.insertedId.toString();
        });

        it('debería eliminar un usuario existente', async function() {
            const res = await requester
                .delete(`/api/users/${userIdToDelete}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            
            // Verificar que el usuario fue eliminado
            const deletedUser = await mongoose.connection.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userIdToDelete) });
            expect(deletedUser).to.be.null;
        });

        it('debería retornar error 404 para usuario no encontrado', async function() {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await requester
                .delete(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(404);
        });
    });
});