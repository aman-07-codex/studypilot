import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { 
  uploadMaterials, 
  getMaterials, 
  deleteMaterial, 
  downloadMaterial 
} from '../controllers/materialController';

const router = Router();

// Configure multer for memory storage (buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
    files: 5 // Max 5 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only PDF, TXT, and DOCX are allowed.'));
    }
  }
});

// Protect all material routes
router.use(requireAuth);

router.post('/', upload.array('files', 5), uploadMaterials);
router.get('/', getMaterials);
router.delete('/:id', deleteMaterial);
router.get('/:id/download', downloadMaterial);

export default router;
