import { usersService } from "../services/index.js";

const formatUser = (user) => {
    return {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
    };
};

const getAllUsers = async (req, res) => {
    try {
        const users = await usersService.getAll();
        const formattedUsers = users.map(user => formatUser(user));
        res.status(200).send({
            status: "success",
            payload: formattedUsers
        });
    } catch (error) {
        res.status(500).send({
            status: "error",
            error: error.message
        });
    }
};

const getUser = async (req, res) => {
    try {
        const userId = req.params.uid;
        const user = await usersService.getUserById(userId);
        if (!user) return res.status(404).send({
            status: "error",
            error: "User not found"
        });

        res.status(200).send({
            status: "success",
            payload: {
                _id: user._id.toString(),
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(400).send({
            status: "error",
            error: "Invalid user ID"
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const updateBody = req.body;
        const userId = req.params.uid;

        if (updateBody.email && !/^\S+@\S+\.\S+$/.test(updateBody.email)) {
            return res.status(400).send({
                status: "error",
                error: "Invalid email format"
            });
        }

        const updatedUser = await usersService.update(userId, updateBody);
        if (!updatedUser) return res.status(404).send({
            status: "error",
            error: "User not found"
        });

        res.status(200).send({
            status: "success",
            payload: {
                _id: updatedUser._id,
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                email: updatedUser.email,
                role: updatedUser.role
            }
        });
    } catch (error) {
        res.status(400).send({
            status: "error",
            error: error.message
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.uid;
        const user = await usersService.getUserById(userId);
        if (!user) {
            return res.status(404).send({
                status: "error",
                error: "User not found"
            });
        }

        await usersService.delete(userId);
        res.status(200).send({
            status: "success",
            message: "User deleted successfully"
        });
    } catch (error) {
        res.status(500).send({
            status: "error",
            error: error.message
        });
    }
};

export default {
    deleteUser,
    getAllUsers,
    getUser,
    updateUser
};