import express from 'express';
import {
    createBoard,
    getUserBoards,
    getBoardById,
    fetchAllPathsOfBoard,
    bulkUploadPaths,
    deleteBoardById
} from '../controllers/boardController.js';
import authenticateToken from '../middlewares/authMiddleware.js';

const router = express.Router();

// Register a board on publish (idempotent by boardId + owner).
router.post('/', authenticateToken, createBoard);

// Boards the logged-in user is a member of.
router.get('/mine', authenticateToken, getUserBoards);

// A single board and its paths.
router.get('/:boardId', authenticateToken, getBoardById);
router.get('/:boardId/paths', authenticateToken, fetchAllPathsOfBoard);

// Bulk upload paths (publish + offline flush).
router.post('/:boardId/paths', authenticateToken, bulkUploadPaths);

// Leave / delete a board.
router.delete('/:boardId', authenticateToken, deleteBoardById);

export default router;
