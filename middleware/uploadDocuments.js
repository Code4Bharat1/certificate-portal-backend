import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads-data/student-documents');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Invalid file type'), false);
  }
  cb(null, true);
}

const uploadDocuments = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB max
}).fields([
  { name: 'aadhaarFront', maxCount: 1 },
  { name: 'aadhaarBack', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'bankPassbook', maxCount: 1 },
]);

export default uploadDocuments;
