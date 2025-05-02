import { fakerES as faker } from '@faker-js/faker';

export const generateMockPets = (qty = 1) => {
    const species = ['Perro', 'Gato', 'Conejo', 'Loro', 'Tortuga'];
    const pets = [];

    for (let i = 0; i < qty; i++) {
        pets.push({
            name: faker.person.firstName(),
            specie: faker.helpers.arrayElement(species),
            birthDate: faker.date.past(5),
            adopted: faker.datatype.boolean(),
            owner: null,
            image: faker.image.urlLoremFlickr({ category: 'animals' }),
        });
    }

    return pets;
};
