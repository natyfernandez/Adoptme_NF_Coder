import GenericRepository from "./GenericRepository.js";

export default class UserRepository extends GenericRepository {
    constructor(dao) {
        super(dao);
    }
    
    getUserBy = (params) => {
        return this.getBy(params);
    }

    getUserById = (id) => {
        return this.getById(id);
    }
    
    updateUser = (id, userData) => {
        return this.dao.update(id, userData);
    }
    
    createUser = (userData) => {
        return this.dao.save(userData);
    }
}