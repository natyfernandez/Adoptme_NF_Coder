import { isValidObjectId } from 'mongoose';
import PetDTO from "../dto/Pet.dto.js";
import { petsService } from "../services/index.js"
import __dirname from "../utils/index.js";

const getAllPets = async (req, res) => {
    const pets = await petsService.getAll();
    res.send({ status: "success", payload: pets })
}

const createPet = async (req, res) => {
    const { name, specie, birthDate } = req.body;
    if (!name || !specie || !birthDate) return res.status(400).send({ status: "error", error: "Incomplete values" })
    const petForm = PetDTO.getPetInputFrom({ name, specie, birthDate });
    const pet = await petsService.create(petForm);
    res.send({ status: "success", payload: pet })
}

const getPet = async (req, res) => {
    try {
        const petId = req.params.pid;
        console.log("ID recibido:", petId);

        if (!petId || !isValidObjectId(petId)) {
            return res.status(400).send({ status: "error", error: "Invalid ID format" });
        }

        const pet = await petsService.getBy(petId);
        console.log("Pet encontrada:", pet);

        if (!pet) {
            return res.status(404).send({ status: "error", error: "Pet not found" });
        }

        res.send({ status: "success", payload: pet });
    } catch (error) {
        console.error("Error en getPet:", error);
        res.status(500).send({ status: "error", error: error.message });
    }
}

const updatePet = async (req, res) => {
    try {
        const petUpdateBody = req.body;
        const petId = req.params.pid;

        if (!petId || !isValidObjectId(petId)) {
            return res.status(400).send({ status: "error", error: "Invalid ID format" });
        }

        if (!petUpdateBody.name || !petUpdateBody.specie || !petUpdateBody.birthDate) {
            return res.status(400).send({ status: "error", error: "Incomplete values" });
        }

        const updatedPet = await petsService.update(petId, petUpdateBody);

        if (!updatedPet) {
            return res.status(404).send({ status: "error", error: "Pet not found" });
        }

        res.send({ status: "success", payload: updatedPet });
    } catch (error) {
        res.status(500).send({ status: "error", error: error.message });
    }
}

const deletePet = async (req, res) => {
    try {
        const petId = req.params.pid;

        if (!petId || !isValidObjectId(petId)) {
            return res.status(400).send({ status: "error", error: "Invalid ID format" });
        }

        const result = await petsService.delete(petId);

        if (!result) {
            return res.status(404).send({ status: "error", error: "Pet not found" });
        }

        res.send({ status: "success", message: "Pet deleted successfully", payload: result });
    } catch (error) {
        res.status(500).send({ status: "error", error: error.message });
    }
}

const createPetWithImage = async (req, res) => {
    const file = req.file;
    const { name, specie, birthDate } = req.body;
    if (!name || !specie || !birthDate) return res.status(400).send({ status: "error", error: "Incomplete values" })
    console.log(file);
    const pet = PetDTO.getPetInputFrom({
        name,
        specie,
        birthDate,
        image: `${__dirname}/../public/img/${file.filename}`
    });
    console.log(pet);
    const result = await petsService.create(pet);
    res.send({ status: "success", payload: result })
}
export default {
    getAllPets,
    getPet,
    createPet,
    updatePet,
    deletePet,
    createPetWithImage
}