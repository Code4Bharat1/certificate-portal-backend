import multer from "multer";

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
    const allowed = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
    ];

    if (!allowed.includes(file.mimetype)) {
        return cb(new Error("Invalid file type"), false);
    }

    cb(null, true);
}

const uploadSingleDocument = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
}).single("document");   //  only one file

export default uploadSingleDocument;