import supertest from 'supertest';
import { expect } from 'chai';
import app from '../app.js';
import { connectDB } from '../app.js';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

const requester = supertest(app);

describe('🧪 Test de Pets Router (API Endpoints)', function() {
    this.timeout(10000); // Aumentamos el timeout global

    let authToken;
    let testPetId;

    before(async () => {
        await connectDB();
        
        // Registrar usuario y obtener token
        const testEmail = `test${Date.now()}@mail.com`;
        const registerRes = await requester.post('/api/sessions/register').send({
            first_name: 'Test',
            last_name: 'User',
            email: testEmail,
            password: 'test123'
        });
        authToken = registerRes.text; // Asumiendo que el token viene como texto
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

            expect(res.status).to.equal(201); // Cambiado a 201 para creación
            expect(res.body.payload).to.have.property('_id');
            testPetId = res.body.payload._id; // Guardamos el ID para otros tests
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
            expect(res.body.payload).to.be.an('array');
        });
    });

    describe('GET /api/pets/:pid', () => {
        it('debería obtener una mascota por ID', async () => {
            // Primero creamos una mascota para obtener su ID
            const createRes = await requester
                .post('/api/pets')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Temp Pet',
                    specie: 'Gato'
                });

            const petId = createRes.body.payload._id;
            
            const res = await requester
                .get(`/api/pets/${petId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.payload).to.have.property('_id', petId);
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
            this.timeout(10000);
            // Crear mascota primero
            const createRes = await requester
                .post('/api/pets')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Original',
                    specie: 'Perro'
                });
            
            const petId = createRes.body.payload._id;
            
            // Actualizar
            const updates = { name: 'Nombre Actualizado' };
            const res = await requester
                .put(`/api/pets/${petId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates);

            expect(res.status).to.equal(200);
            expect(res.body.payload.name).to.equal('Nombre Actualizado');
        });
    });

    describe('DELETE /api/pets/:pid', () => {
        it('debería eliminar una mascota', async () => {
            this.timeout(10000);
            // Crear mascota primero
            const createRes = await requester
                .post('/api/pets')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Para Eliminar',
                    specie: 'Perro'
                });
            
            const petId = createRes.body.payload._id;
            
            // Eliminar
            const deleteRes = await requester
                .delete(`/api/pets/${petId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(deleteRes.status).to.equal(200);

            // Verificar que fue eliminada
            const checkRes = await requester
                .get(`/api/pets/${petId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(checkRes.status).to.equal(404);
        });
    });

    describe('POST /api/pets/withimage', () => {
        it('debería crear mascota con imagen', async function() {
            this.timeout(15000); // Más tiempo para la subida
            
            // Crear un archivo de prueba temporal
            const testFilePath = path.join(__dirname, 'test-image.jpg');
            fs.writeFileSync(testFilePath, 'contenido de prueba');
            
            try {
                const res = await requester
                    .post('/api/pets/withimage')
                    .set('Authorization', `Bearer ${authToken}`)
                    .field('name', 'Mascota con imagen')
                    .field('specie', 'Gato')
                    .attach('image', testFilePath);

                expect(res.status).to.equal(201);
                expect(res.body.payload).to.have.property('image');
            } finally {
                // Eliminar el archivo temporal
                fs.unlinkSync(testFilePath);
            }
        });
    });
});