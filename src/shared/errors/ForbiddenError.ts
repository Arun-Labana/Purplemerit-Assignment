import AppError from './AppError';
import { HttpStatus } from '../constants/enums';

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export default ForbiddenError;

