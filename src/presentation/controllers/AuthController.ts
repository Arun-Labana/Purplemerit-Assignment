import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import RegisterUser from '../../application/use-cases/auth/RegisterUser';
import LoginUser from '../../application/use-cases/auth/LoginUser';
import RefreshToken from '../../application/use-cases/auth/RefreshToken';
import LogoutUser from '../../application/use-cases/auth/LogoutUser';
import UserRepository from '../../infrastructure/database/postgresql/UserRepository';
import { HttpStatus } from '../../shared/constants/enums';
import { SUCCESS_MESSAGES } from '../../shared/constants';

export class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = await RegisterUser.execute(req.body);

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.USER_REGISTERED,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = await LoginUser.execute(req.body);

      res.status(HttpStatus.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.USER_LOGGED_IN,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const tokens = await RefreshToken.execute(refreshToken);

      res.status(HttpStatus.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.TOKEN_REFRESHED,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      await LogoutUser.execute(refreshToken);

      res.status(HttpStatus.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.USER_LOGGED_OUT,
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserRepository.findById(req.user!.userId);

      res.status(HttpStatus.OK).json({
        success: true,
        data: {
          id: user!.id,
          email: user!.email,
          name: user!.name,
          createdAt: user!.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();

