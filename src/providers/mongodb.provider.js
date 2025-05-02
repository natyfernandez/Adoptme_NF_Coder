import mongoose from 'mongoose';

class MongoDBProvider{
    connection=null;
    static instance; 

    constructor(){
        if(MongoDBProvider.instance){
            return MongoDBProvider.instance;
        }

        MongoDBProvider.instance = this ;
    }

    async connect(uri){
        if(!this.connection){
            try {
                this.connection = await mongoose.connect(uri)
            } catch (error) {
                console.error('Error connecting to MongoDB', error)
            }
        }

        return this.connection;
    }

    getInstance(){
        return this.connection
    }

}


export const mongodbProvider = new MongoDBProvider();