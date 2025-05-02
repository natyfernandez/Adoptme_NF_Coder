import path from "path";
import cors from "cors";
import morgan from "morgan";
import express from "express";
import Handlebars from "handlebars";
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import handlebars from 'express-handlebars';
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";

import { CONFIG } from "./config/config.js";
import { routes } from "./routes/index.routes.js";
import { __dirname } from "./dirname.js";

const app = express();

// Middleware
app.use(cors({}))
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(CONFIG.SECRET_KEY));
app.use(express.static(path.resolve(__dirname, "../public")));

// Handlebars config
app.engine(
    "hbs",
    handlebars.engine({
        extname: ".hbs",
        defaultLayout: "main",
        handlebars: allowInsecurePrototypeAccess(Handlebars),
    })
);
app.set("view engine", "hbs");
app.set("views", path.resolve(__dirname, "./views"));

// Routes
app.use("/", routes);

// Connect to MongoDB
mongoose.set('strictQuery', true);
mongoose
    .connect(CONFIG.MONGO_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch((err) => console.error('Error al conectar a MongoDB', err));

app.listen(CONFIG.PORT, async () => {
    console.log(`Server running on http://localhost:${CONFIG.PORT}`);
});