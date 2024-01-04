const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure the upload directory exists
const uploadDir = 'util/cache/uploads/';
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // You can adjust the filename logic here if needed
        // For example, include chunk index if it's part of the request
        const chunkIndex = req.body.chunkIndex || '';
        const filename = `${Date.now()}-${chunkIndex}-${file.originalname}`;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });
module.exports = upload;
