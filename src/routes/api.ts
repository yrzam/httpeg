import { Router } from 'express';
import Live from '@controllers/api/live';
import LongRunning from '@controllers/api/long-running';
import Multer from '@middlewares/multer';

const lr = Router();
lr.post('/', LongRunning.queue);
lr.delete('/:id', LongRunning.delete);

const router = Router();
router.use('/live', Multer.liveSaveFile, Live.process);
router.use('/long-running', lr);

export default router;
