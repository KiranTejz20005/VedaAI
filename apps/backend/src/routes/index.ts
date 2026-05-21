import { Router } from 'express';
import assignmentRoutes from './assignment.routes';
import paperRoutes from './paper.routes';

const apiRouter = Router();

// Versioned API routes
apiRouter.use('/v1/assignments', assignmentRoutes);
apiRouter.use('/v1/papers', paperRoutes);

// Backward compatible legacy aliases
apiRouter.use('/assignments', assignmentRoutes);
apiRouter.use('/papers', paperRoutes);

export default apiRouter;
