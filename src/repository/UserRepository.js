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
    
    updateUser = (id, userData) => {
        return this.dao.update(id, userData);
    }
    
    createUser = (userData) => {
        return this.dao.save(userData);
    }
}