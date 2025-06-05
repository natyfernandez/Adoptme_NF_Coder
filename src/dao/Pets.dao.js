import petModel from "./models/Pet.js";

export default class Pet {

    get = (params) => {
        return petModel.find(params)
    }

    getBy = (id) => {
        return petModel.findById(id);
    };

    save = (doc) => {
        return petModel.create(doc);
    }

    update = async (id, doc) => {
        return petModel.findByIdAndUpdate(id, { $set: doc }, { new: true })
    }

    delete = (id) => {
        return petModel.findByIdAndDelete(id);
    }
}