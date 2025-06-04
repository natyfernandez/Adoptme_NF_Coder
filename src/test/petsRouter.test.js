import supertest from 'supertest';
import { expect } from 'chai';
import app from '../app.js';
import { connectDB } from '../app.js';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Configuración para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requester = supertest(app);

describe('🧪 Test de Pets Router (API Endpoints)', function() {
    this.timeout(10000);

    let authToken;
    let testPetId;

    before(async () => {
        await connectDB();
        
        // Registrar usuario
        const testEmail = `test${Date.now()}@mail.com`;
        const registerRes = await requester.post('/api/sessions/register').send({
            first_name: 'Test',
            last_name: 'User',
            email: testEmail,
            password: 'test123'
        });
        
        // Asegurar que obtenemos el token correctamente
        authToken = registerRes.body.token || registerRes.text;
        if (!authToken) {
            throw new Error('No se pudo obtener el token de autenticación');
        }
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

            expect(res.status).to.be.oneOf([200, 201]);
            
            // Ajusta según el formato real de tu API
            testPetId = res.body._id || res.body.payload?._id || res.body.data?._id;
            expect(testPetId).to.exist;
        });

        it('debería retornar error 400 con datos inválidos', async () => {
            const res = await requester
                .post('/api/pets')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Incomplete' });

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('error');
        });
    });

    describe('GET /api/pets', () => {
        it('debería obtener todas las mascotas', async () => {
            const res = await requester
                .get('/api/pets')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            expect(res.body).to.satisfy(body => 
                Array.isArray(body) || 
                Array.isArray(body.payload) || 
                Array.isArray(body.data)
            );
        });
    });

    describe('GET /api/pets/:pid', () => {
        it('debería obtener una mascota por ID', async () => {
            if (!testPetId) {
                throw new Error('No se creó la mascota de prueba correctamente');
            }

            const res = await requester
                .get(`/api/pets/${testPetId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            expect(res.body._id || res.body.payload?._id || res.body.data?._id).to.equal(testPetId);
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
        it('debería actualizar una mascota', async function() {
            if (!testPetId) {
                throw new Error('No se creó la mascota de prueba correctamente');
            }

            const updates = { name: 'Nombre Actualizado' };
            const res = await requester
                .put(`/api/pets/${testPetId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates);

            expect(res.status).to.equal(200);
            expect(res.body.name || res.body.payload?.name || res.body.data?.name).to.equal('Nombre Actualizado');
        });
    });

    describe('DELETE /api/pets/:pid', () => {
        it('debería eliminar una mascota', async function() {
            if (!testPetId) {
                throw new Error('No se creó la mascota de prueba correctamente');
            }

            // Eliminar
            const deleteRes = await requester
                .delete(`/api/pets/${testPetId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(deleteRes.status).to.equal(200);

            // Verificar que fue eliminada
            const checkRes = await requester
                .get(`/api/pets/${testPetId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(checkRes.status).to.equal(404);
        });
    });

    describe('POST /api/pets/withimage', () => {
        it('debería crear mascota con imagen', async function() {
            this.timeout(15000);
            
            const testFilePath = path.join(__dirname, 'test-image.jpg');
            fs.writeFileSync(testFilePath, 'contenido de prueba');
            
            try {
                const res = await requester
                    .post('/api/pets/withimage')
                    .set('Authorization', `Bearer ${authToken}`)
                    .field('name', 'Mascota con imagen')
                    .field('specie', 'Gato')
                    .attach('image', testFilePath);

                expect(res.status).to.be.oneOf([200, 201]);
                expect(res.body).to.satisfy(body => 
                    body.image !== undefined || 
                    body.payload?.image !== undefined || 
                    body.data?.image !== undefined
                );
            } finally {
                if (fs.existsSync(testFilePath)) {
                    fs.unlinkSync(testFilePath);
                }
            }
        });
    });
});