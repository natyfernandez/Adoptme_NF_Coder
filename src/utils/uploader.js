import __dirname from "./index.js";
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder = '';

        if (file.fieldname === 'petImage') {
            folder = 'public/img/pets';
        } else if (file.fieldname === 'documents') {
            folder = 'public/img/documents';
        } else {
            folder = 'public/img/others';
        }

        const dirPath = path.join(__dirname, '..', folder);

        // Crear carpeta si no existe
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        cb(null, dirPath);
    },

    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const uploader = multer({ storage });

export default uploader;
