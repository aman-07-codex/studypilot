import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { MaterialService } from '../services/materialService';

export const uploadMaterials = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { subject_id, topic_id, material_type } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!subject_id || !material_type) {
      return res.status(400).json({ error: 'subject_id and material_type are required' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const tId = topic_id === 'null' || topic_id === 'undefined' || !topic_id ? null : topic_id;

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const material = await MaterialService.uploadMaterial(
          userId,
          subject_id,
          tId,
          material_type as 'note' | 'pyq',
          file.buffer,
          file.originalname,
          file.mimetype,
          file.size
        );
        results.push(material);
      } catch (err: any) {
        errors.push({ file: file.originalname, error: err.message });
      }
    }

    if (results.length === 0 && errors.length > 0) {
       return res.status(400).json({ error: 'All uploads failed', details: errors });
    }

    res.status(201).json({ results, errors });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getMaterials = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subjectId = req.query.subject_id as string;
    const topicId = req.query.topic_id as string | undefined;

    if (!subjectId) {
       return res.status(400).json({ error: 'subject_id is required' });
    }

    const materials = await MaterialService.getMaterials(userId, subjectId, topicId);
    res.json(materials);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const deleteMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    await MaterialService.deleteMaterial(userId, id);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const downloadMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const url = await MaterialService.getDownloadUrl(userId, id);
    res.json({ url });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};
