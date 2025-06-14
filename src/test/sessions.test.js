import supertest from 'supertest';
import { expect } from 'chai';
import app from '../app.js';
import { connectDB } from '../app.js';
import mongoose from 'mongoose';

const requester = supertest(app);

describe('🧪 Test de sesiones', function() {
    this.timeout(5000);

    before(async () => {
        await connectDB();
    });

    after(async () => {
        await mongoose.connection.collection('users').deleteMany({});
        await mongoose.connection.close();
    });

    it('POST /api/sessions/register → debería registrar un nuevo usuario con token', async () => {
        const testEmail = `test${Date.now()}@mail.com`;
        const testPassword = 'test123';

        const res = await requester.post('/api/sessions/register').send({
            first_name: 'Test',
            last_name: 'User',
            email: testEmail,
            password: testPassword
        });

        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('status', 'success');
        expect(res.body).to.have.property('token').that.is.a('string');
        expect(res.body.token.length).to.be.greaterThan(20);
        expect(res.body).to.have.property('user');
    });

    it('POST /api/sessions/login → debería loguear correctamente con token', async () => {
        const testEmail = `test@mail.com`;
        const testPassword = 'test123';

        await requester.post('/api/sessions/register').send({
            first_name: 'Test',
            last_name: 'User',
            email: testEmail,
            password: testPassword
        });

        const loginRes = await requester.post('/api/sessions/login').send({
            email: testEmail,
            password: testPassword
        });

        expect(loginRes.status).to.equal(200);
        expect(loginRes.body).to.have.property('status', 'success');
        expect(loginRes.body).to.have.property('token').that.is.a('string');
        expect(loginRes.body.token.length).to.be.greaterThan(20);
        expect(loginRes.body).to.have.property('user');
    });
});