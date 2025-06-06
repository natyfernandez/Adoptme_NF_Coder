import { expect } from 'chai';
import supertest from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import { connectDB } from '../app.js';
import { createHash } from '../utils/index.js';

const requester = supertest(app);

describe('🚀 Adoptions Router', () => {
    let authToken = 'mocked-token'; // Replace with actual auth
    let userId;
    let petId;
    let adoptionId;
    const testEmail = `test${Date.now()}@mail.com`;

    before(async function () {
        this.timeout(10000);

        try {
            await connectDB();

            // Create test user
            const hashedPassword = await createHash('testPassword');
            const user = {
                first_name: 'Test',
                last_name: 'User',
                email: testEmail,
                password: hashedPassword,
                role: 'user',
                pets: []
            };

            const createdUser = await mongoose.connection.collection('users').insertOne(user);
            userId = createdUser.insertedId.toString();

            // Create test pet
            const petRes = await requester
                .post('/api/pets')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'MascotaTest',
                    specie: 'Perro',
                    birthDate: '2021-01-01',
                    adopted: false
                });

            petId = petRes.body.payload._id;

        } catch (error) {
            console.error('❌ Error in before hook:', error);
            throw error;
        }
    });

    after(async () => {
        await mongoose.connection.db.collection('adoptions').deleteMany({});
        await mongoose.connection.db.collection('pets').deleteMany({});
        await mongoose.connection.db.collection('users').deleteMany({});
        await mongoose.disconnect();
    });

    describe('POST /api/adoptions/:uid/:pid', () => {
        it('debería crear una adopción exitosamente', async () => {
            const res = await requester
                .post(`/api/adoptions/${userId}/${petId}`)
                .set('Authorization', `Bearer ${authToken}`);

            // Match your controller's response (200 with success message)
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('status', 'success');
            expect(res.body).to.have.property('message', 'Pet adopted successfully');
        });

        it('debería fallar si el usuario no existe', async () => {
            const fakeUserId = '507f1f77bcf86cd799439999';
            const res = await requester
                .post(`/api/adoptions/${fakeUserId}/${petId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(404);
        });
    });

    describe('GET /api/adoptions/:aid', () => {
        it('debería obtener una adopción por ID', async () => {
            // First create an adoption
            const createRes = await requester
                .post(`/api/adoptions/${userId}/${petId}`)
                .set('Authorization', `Bearer ${authToken}`);

            // Get the created adoption ID from the database
            const adoption = await mongoose.connection.collection('adoptions').findOne({
                owner: new mongoose.Types.ObjectId(userId),
                pet: new mongoose.Types.ObjectId(petId)
            });

            const res = await requester
                .get(`/api/adoptions/${adoption._id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('status', 'success');
            expect(res.body.payload).to.have.property('_id', adoption._id.toString());
        });
    });

    describe('GET /api/adoptions', () => {
        beforeEach(async () => {
            // Clear adoptions before each test
            await mongoose.connection.db.collection('adoptions').deleteMany({});
            // Reset pet adoption status
            await mongoose.connection.db.collection('pets').updateOne(
                { _id: new mongoose.Types.ObjectId(petId) },
                { $set: { adopted: false } }
            );
        });

        it('debería obtener todas las adopciones (vacío si no hay)', async () => {
            const res = await requester
                .get('/api/adoptions')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.payload).to.be.an('array').that.is.empty;
        });

        it('debería listar adopciones existentes', async () => {
            // Create two adoptions with different pets
            const petRes1 = await requester
                .post('/api/pets')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'MascotaTest1',
                    specie: 'Gato',
                    birthDate: '2020-01-01'
                });
            const petId1 = petRes1.body.payload._id;

            const petRes2 = await requester
                .post('/api/pets')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'MascotaTest2',
                    specie: 'Perro',
                    birthDate: '2019-01-01'
                });
            const petId2 = petRes2.body.payload._id;

            await requester
                .post(`/api/adoptions/${userId}/${petId1}`)
                .set('Authorization', `Bearer ${authToken}`);

            await requester
                .post(`/api/adoptions/${userId}/${petId2}`)
                .set('Authorization', `Bearer ${authToken}`);

            const res = await requester
                .get('/api/adoptions')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.payload).to.be.an('array').with.lengthOf(2);
        });
    });
});