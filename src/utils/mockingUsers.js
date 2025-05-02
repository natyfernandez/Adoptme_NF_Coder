// src/utils/mockingUsers.js
import { fakerES as faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

export const generateMockUsers = async (qty = 1) => {
    const users = [];
    const hashedPassword = await bcrypt.hash('coder123', 10);

    for (let i = 0; i < qty; i++) {
        users.push({
            first_name: faker.person.firstName(),
            last_name: faker.person.lastName(),
            email: faker.internet.email(),
            age: faker.number.int({ min: 18, max: 80 }),
            password: hashedPassword,
            role: faker.helpers.arrayElement(['user', 'admin']),
            pets: [],
        });
    }

    return users;
};
