import path from "path";
import cors from "cors";
import morgan from "morgan";
import express from "express";
import Handlebars from "handlebars";
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import handlebars from 'express-handlebars';
import swaggerUI from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";

import { info } from './docs/info.js'
import { CONFIG } from "./config/config.js";
import { routes } from "./routes/index.routes.js";
import { __dirname } from "./dirname.js";

const app = express();
export default app;

const specs = swaggerJSDoc(info)

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
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs));
app.use("/", routes);

// Conexión optimizada para múltiples entornos
export const connectDB = async () => {
    try {
        mongoose.set('strictQuery', true);

        await mongoose.connect(CONFIG.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: true,
            w: 'majority'
        });

        console.log(`✅ MongoDB Connected [${CONFIG.NODE_ENV}]`);
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

// Iniciar servidor solo si no estamos en entorno de test
if (CONFIG.NODE_ENV !== 'test') {
    connectDB().then(() => {
        app.listen(CONFIG.PORT, () => {
            console.log(`Server running on http://localhost:${CONFIG.PORT}`);
        });
    });
}