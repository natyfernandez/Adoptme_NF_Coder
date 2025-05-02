import { Router } from "express";

import { usersRouter } from "./users.routes.js";
import { petsRouter } from "./pets.routes.js";
import { adoptionsRouter } from "./adoption.routes.js";
import { sessionsRouter } from "./sessions.routes.js";
import { mocksRouter } from './mock.routes.js';

export const routes = Router();

routes.use('/api/users',usersRouter);
routes.use('/api/pets',petsRouter);
routes.use('/api/adoptions',adoptionsRouter);
routes.use('/api/sessions',sessionsRouter);
routes.use('/api/mocks', mocksRouter);


routes.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
});