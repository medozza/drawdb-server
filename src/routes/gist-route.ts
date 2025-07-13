import express from 'express';
import { create, del, get, getCommits, update } from '../controllers/gist-controller';

const gistRouter = express.Router();

gistRouter.post('/', create);
gistRouter.get('/:id', get);
gistRouter.delete('/:id', del);
gistRouter.patch('/:id', update);
gistRouter.get('/:id/commits', getCommits);

export { gistRouter };
