import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
import { Validators } from '../../shared/utils';

export const validate = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = Validators.validate(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;

