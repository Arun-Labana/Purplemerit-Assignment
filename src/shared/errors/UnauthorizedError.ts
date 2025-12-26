import AppError from './AppError';
import { HttpStatus } from '../constants/enums';

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export default UnauthorizedError;

