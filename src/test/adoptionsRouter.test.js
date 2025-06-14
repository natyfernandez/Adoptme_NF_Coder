import { expect } from 'chai';
import supertest from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import { connectDB } from '../app.js';
import { createHash } from '../utils/index.js';

const requester = supertest(app);

describe('🚀 Adoptions Router', () => {
    let authToken;
    let userId;
    let petId;
    let adoptionId;
    const testEmail = `test${Date.now()}@mail.com`;

    before(async function () {
        this.timeout(10000);
        await connectDB();
    });

    beforeEach(async () => {
        await mongoose.connection.db.collection('adoptions').deleteMany({});
        await mongoose.connection.db.collection('pets').deleteMany({});
        await mongoose.connection.db.collection('users').deleteMany({});

        const userRes = await requester.post('/api/sessions/register').send({
            first_name: 'Test',
            last_name: 'User',
            email: testEmail,
            password: 'testPassword',
        });

        authToken = userRes.body.token;
        userId = userRes.body.user.id;

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
    });

    after(async () => {
        await mongoose.disconnect();
    });

    describe('POST /api/adoptions/:uid/:pid', () => {
        it('debería crear una adopción exitosamente', async () => {
            const newUser = await requester.post('/api/sessions/register').send({
                first_name: 'Test',
                last_name: 'User',
                email: `otro${Date.now()}@mail.com`,
                password: 'testPassword',
            });

            let newUserId = newUser.body.user.id;

            const adoption = await requester
                .post(`/api/adoptions/${newUserId}/${petId}`)

            adoptionId = adoption.body.payload._id;

            expect(adoption.status).to.equal(200);
            expect(adoption.body).to.have.property('status', 'success');
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
            const res = await requester
                .post(`/api/adoptions/${userId}/${petId}`)
                .set('Authorization', `Bearer ${authToken}`);

            const adoptionId = res.body.payload._id;

            const adoption = await requester
                .get(`/api/adoptions/${adoptionId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(adoption.status).to.equal(200);
            expect(adoption.body).to.have.property('status', 'success');
            expect(adoption.body.payload).to.have.property('_id', adoptionId);
        });
    });

    describe('GET /api/adoptions', () => {
        beforeEach(async () => {
            await mongoose.connection.db.collection('adoptions').deleteMany({});
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