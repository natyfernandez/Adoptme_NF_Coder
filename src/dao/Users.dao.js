import userModel from "./models/User.js";


export default class Users {

    get = (params) => {
        return userModel.find(params);
    }

    getBy = (params) => {
        return userModel.findOne(params);
    }

    getById = (id) => {
        return userModel.findById(id);
    }

    save = (doc) => {
        return userModel.create(doc);
    }

    update = async (id, doc) => {
        return userModel.findByIdAndUpdate(id, { $set: doc }, { new: true });
    }

    delete = (id) => {
        return userModel.findByIdAndDelete(id);
    }
}