import { Router } from 'express';
import { 
  createTask, 
  getTasks, 
  getTaskById, 
  getTaskEvents,
  confirmFunding,
  claimTask,
  getTaskPayload,
  submitResult,
  acceptResult,
  rejectResult,
  refundTask
} from '../controllers/taskController';

const router = Router();

router.post('/', createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.get('/:id/events', getTaskEvents);
router.get('/:id/payload', getTaskPayload);
router.post('/:id/confirm-funding', confirmFunding);
router.post('/:id/claim', claimTask);
router.post('/:id/submit', submitResult);
router.post('/:id/accept', acceptResult);
router.post('/:id/reject', rejectResult);
router.post('/:id/refund', refundTask);

export default router;
