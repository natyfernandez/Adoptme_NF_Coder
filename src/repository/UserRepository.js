import GenericRepository from "./GenericRepository.js";

export default class UserRepository extends GenericRepository {
    constructor(dao) {
        super(dao);
    }
    
    getUserByEmail = (email) => {
        return this.getBy({email});
    }
    
    getUserById = (id) => {
        return this.getBy({_id: id});
    }
    
    // Método nuevo para actualizar usuario
    updateUser = (id, userData) => {
        return this.dao.update(id, userData);
    }
    
    // Método opcional para crear (ya existe en GenericRepository)
    createUser = (userData) => {
        return this.dao.save(userData);
    }
}