import AppError from './AppError';
import { HttpStatus } from '../constants/enums';

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export default NotFoundError;

