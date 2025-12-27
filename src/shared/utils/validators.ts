import Joi from 'joi';
import { ValidationError } from '../errors';

export class Validators {
  /**
   * User registration validator
   */
  static registerUser = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required',
    }),
  });

  /**
   * User login validator
   */
  static loginUser = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  });

  /**
   * Project creation validator
   */
  static createProject = Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
      'string.min': 'Project name must be at least 3 characters long',
      'string.max': 'Project name must not exceed 100 characters',
      'any.required': 'Project name is required',
    }),
    description: Joi.string().max(500).optional().allow('', null).messages({
      'string.max': 'Description must not exceed 500 characters',
    }),
  });

  /**
   * Project update validator
   */
  static updateProject = Joi.object({
    name: Joi.string().min(3).max(100).optional().messages({
      'string.min': 'Project name must be at least 3 characters long',
      'string.max': 'Project name must not exceed 100 characters',
    }),
    description: Joi.string().max(500).optional().allow('', null).messages({
      'string.max': 'Description must not exceed 500 characters',
    }),
  }).min(1);

  /**
   * Workspace creation validator
   */
  static createWorkspace = Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
      'string.min': 'Workspace name must be at least 3 characters long',
      'string.max': 'Workspace name must not exceed 100 characters',
      'any.required': 'Workspace name is required',
    }),
    settings: Joi.object().optional().default({}),
  });

  /**
   * Workspace update validator
   */
  static updateWorkspace = Joi.object({
    name: Joi.string().min(3).max(100).optional().messages({
      'string.min': 'Workspace name must be at least 3 characters long',
      'string.max': 'Workspace name must not exceed 100 characters',
    }),
    settings: Joi.object().optional(),
  }).min(1);

  /**
   * Invite member validator
   */
  static inviteMember = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    role: Joi.string().valid('owner', 'collaborator', 'viewer').required().messages({
      'any.only': 'Role must be one of: owner, collaborator, viewer',
      'any.required': 'Role is required',
    }),
  });

  /**
   * Update member role validator
   */
  static updateMemberRole = Joi.object({
    role: Joi.string().valid('owner', 'collaborator', 'viewer').required().messages({
      'any.only': 'Role must be one of: owner, collaborator, viewer',
      'any.required': 'Role is required',
    }),
  });

  /**
   * Job submission validator
   */
  static submitJob = Joi.object({
    workspaceId: Joi.string().uuid().required().messages({
      'string.guid': 'Invalid workspace ID format',
      'any.required': 'Workspace ID is required',
    }),
    type: Joi.string()
      .valid('code_execution', 'file_processing', 'export_project')
      .required()
      .messages({
        'any.only': 'Job type must be one of: code_execution, file_processing, export_project',
        'any.required': 'Job type is required',
      }),
    payload: Joi.object().required().messages({
      'any.required': 'Job payload is required',
    }),
    idempotencyKey: Joi.string().max(255).optional().messages({
      'string.max': 'Idempotency key must not exceed 255 characters',
    }),
  });

  /**
   * Pagination validator
   */
  static pagination = Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.min': 'Page must be at least 1',
    }),
    limit: Joi.number().integer().min(1).max(100).default(20).messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),
  });

  /**
   * UUID validator
   */
  static uuid = Joi.string().uuid().required().messages({
    'string.guid': 'Invalid ID format',
    'any.required': 'ID is required',
  });

  /**
   * Validate data against schema
   */
  static validate<T>(schema: Joi.ObjectSchema, data: any): T {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message).join(', ');
      throw new ValidationError(errors);
    }

    return value as T;
  }
}

export default Validators;

