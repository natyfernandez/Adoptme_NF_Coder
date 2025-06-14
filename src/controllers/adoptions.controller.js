import { isValidObjectId } from 'mongoose'; 
import { adoptionsService, petsService, usersService } from "../services/index.js";

const getAllAdoptions = async (req, res) => {
    try {
        const result = await adoptionsService.getAll();
        if (!result) {
            console.log(`Adopciones no encontradas, ${result}`)
            return res.status(404).send({ status: "error", error: "Adoption not found" });
        }
        res.send({ status: "success", payload: result });
    } catch (error) {
        console.error("Error getting adoptions:", error);
        res.status(500).send({ status: "error", error: "Internal server error" });
    }
};

const getAdoption = async (req, res) => {
    try {
        const adoptionId = req.params.aid;
        if (!adoptionId || !isValidObjectId(adoptionId)) {
            return res.status(400).send({ status: "error", error: "Invalid ID format" });
        }

        const adoption = await adoptionsService.getBy({_id: adoptionId});
        console.log("Adopcion encontrada:", adoption);

        if (!adoption) {
            console.log(`Adopcion no encontrada, ${adoptionId}`)
            return res.status(404).send({ status: "error", error: "Adoption not found" });
        }

        res.send({ status: "success", payload: adoption });
    } catch (error) {
        console.error("Error getting adoption:", error);
        res.status(500).send({ status: "error", error: "Internal server error" });
    }
};

const createAdoption = async (req, res) => {
    try {
        const { uid, pid } = req.params;

        const user = await usersService.getUserById(uid);
        if (!user) {
            console.error('User not found')
            return res.status(404).send({ status: "error", error: "User not found" });
        }

        const pet = await petsService.getBy(pid);
        if (!pet) {
            console.error('Pet not found')
            return res.status(404).send({ status: "error", error: "Pet not found" });
        }

        if (pet.adopted) {
            console.error('La mascota ya esta adoptada')
            return res.status(400).send({ status: "error", error: "Pet is already adopted" });
        }

        user.pets.push(pet._id);
        await usersService.update(
            user._id,
            { pets: user.pets },
        );

        await petsService.update(
            pet._id,
            { adopted: true, owner: user._id },
        );

        const adoption = await adoptionsService.create(
            { owner: user._id, pet: pet._id },
        );

        res.send({ status: "success", payload: adoption, message: "Pet adopted successfully" });
    } catch (error) {
        console.error("Error in adoption process:", error);
        res.status(500).send({
            status: "error",
            error: "Failed to complete adoption",
            details: error.message
        });
    }
};

export default {
    createAdoption,
    getAllAdoptions,
    getAdoption
};