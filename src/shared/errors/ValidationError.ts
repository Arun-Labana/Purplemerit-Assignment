import AppError from './AppError';
import { HttpStatus } from '../constants/enums';

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export default ValidationError;

