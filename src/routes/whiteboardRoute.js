import express from 'express';
import {deleteWhiteboardById, fetchAllPathsOfAWhiteboard, getUserWhiteboards,getWhiteboardById} from '../controllers/whiteboardController.js';

import authenticateToken from '../middlewares/authMiddleware.js';

const router = express.Router();

//Get all whiteboards of the logged-in user
router.get('/my', authenticateToken, getUserWhiteboards);

//Get a specific whiteboard by whiteboardId ( name as roomId in Frontend)
router.get('/:whiteboardId', authenticateToken, getWhiteboardById);


router.delete('/:whiteboardId', authenticateToken, deleteWhiteboardById)

router.get('/:whiteboardId/paths', authenticateToken, fetchAllPathsOfAWhiteboard)


export default router;
