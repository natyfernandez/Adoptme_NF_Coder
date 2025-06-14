import supertest from 'supertest';
import { expect } from 'chai';
import app from '../app.js';
import { connectDB } from '../app.js';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requester = supertest(app);

describe('🧪 Test de Pets Router (API Endpoints)', function () {
    this.timeout(10000);

    let authToken;
    let testPetId;
    let deletePetId;
    let petIdSpecific;

    before(async () => {
        await connectDB();

        const testEmail = `test${Date.now()}@mail.com`;
        const registerRes = await requester.post('/api/sessions/register').send({
            first_name: 'Test',
            last_name: 'User',
            email: testEmail,
            password: 'test123'
        });
        authToken = registerRes.body.token || registerRes.text;

        const createSpecificPet = await requester
            .post('/api/pets')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Original',
                specie: 'Gato',
                birthDate: '2021-01-01'
            });
        petIdSpecific = createSpecificPet.body.payload._id;

        const createDeletePet = await requester
            .post('/api/pets')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Para Eliminar',
                specie: 'Gato',
                birthDate: '2021-01-01'
            });
        deletePetId = createDeletePet.body.payload._id;
    });

    after(async () => {
        await mongoose.connection.collection('pets').deleteMany({});
        await mongoose.connection.collection('users').deleteMany({});
        await mongoose.connection.close();
    });

    describe('POST /api/pets', () => {
        it('debería crear una nueva mascota', async () => {
            const newPet = {
                name: 'Max',
                specie: 'Perro',
                birthDate: '2020-01-01'
            };

            const res = await requester
                .post('/api/pets')
                .set('Authorization', `Bearer ${authToken}`)
                .send(newPet);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('status', 'success');
            expect(res.body.payload).to.have.property('_id');
            testPetId = res.body.payload._id;
        });

        it('debería retornar error 400 con datos inválidos', async () => {
            const res = await requester
                .post('/api/pets')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Incomplete' });

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('status', 'error');
        });
    });

    describe('GET /api/pets', () => {
        it('debería obtener todas las mascotas', async () => {
            const res = await requester
                .get('/api/pets')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('status', 'success');
            expect(res.body.payload).to.be.an('array');
        });
    });

    describe('GET /api/pets/:pid', () => {
        it('debería obtener una mascota por ID', async () => {
            const res = await requester
                .get(`/api/pets/${petIdSpecific}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('status', 'success');
            expect(res.body.payload).to.have.property('_id', petIdSpecific);
        });

        it('debería retornar 404 para mascota no encontrada', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await requester
                .get(`/api/pets/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(404);
        });
    });

    describe('PUT /api/pets/:pid', () => {
        it('debería actualizar una mascota', async () => {
            const updates = {
                name: 'Nombre Actualizado',
                specie: 'Perro',
                birthDate: '2020-01-01'
            };

            const res = await requester
                .put(`/api/pets/${petIdSpecific}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('status', 'success');
            expect(res.body.payload).to.have.property('name', 'Nombre Actualizado');
        });
    });

    describe('DELETE /api/pets/:pid', () => {
        it('debería eliminar una mascota', async () => {
            const deleteRes = await requester
                .delete(`/api/pets/${deletePetId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(deleteRes.status).to.equal(200);
            expect(deleteRes.body).to.have.property('status', 'success');

            const checkRes = await requester
                .get(`/api/pets/${deletePetId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(checkRes.status).to.equal(404);
        });
    });

    describe('POST /api/pets/withimage', () => {
        it('debería crear mascota con imagen', async function () {
            const testFilePath = path.join(__dirname, 'test-image.jpg');
            fs.writeFileSync(testFilePath, 'contenido de prueba');

            try {
                const res = await requester
                    .post('/api/pets/withimage')
                    .set('Authorization', `Bearer ${authToken}`)
                    .field('name', 'Mascota con imagen')
                    .field('specie', 'Gato')
                    .field('birthDate', '2022-01-01')
                    .attach('image', testFilePath, {
                        filename: 'test-image.jpg',
                        contentType: 'image/jpeg'
                    });

                expect(res.status).to.equal(200);
                expect(res.body).to.have.property('status', 'success');
                expect(res.body.payload).to.have.property('image');
            } finally {
                if (fs.existsSync(testFilePath)) {
                    fs.unlinkSync(testFilePath);
                }
            }
        });

        it('debería retornar error 400 si faltan datos', async function () {
            const testFilePath = path.join(__dirname, 'test-image.jpg');
            fs.writeFileSync(testFilePath, 'contenido de prueba');

            try {
                const res = await requester
                    .post('/api/pets/withimage')
                    .set('Authorization', `Bearer ${authToken}`)
                    .attach('image', testFilePath);

                expect(res.status).to.equal(400);
                expect(res.body).to.have.property('status', 'error');
            } finally {
                if (fs.existsSync(testFilePath)) {
                    fs.unlinkSync(testFilePath);
                }
            }
        });
    });
});