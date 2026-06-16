import { Request, Response } from 'express';

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
      firstName: 'Demo',
      lastName: 'Faculty',
      institutionName: 'Delhi Public School, Bokaro Steel City',
    },
  });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  const { firstName, lastName } = req.body;
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: firstName || 'Demo',
      lastName: lastName || 'Faculty',
    },
    message: 'Profile updated successfully',
  });
};

export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  const { preferences } = req.body;
  res.json({
    success: true,
    data: { preferences },
    message: 'Preferences updated successfully',
  });
};
