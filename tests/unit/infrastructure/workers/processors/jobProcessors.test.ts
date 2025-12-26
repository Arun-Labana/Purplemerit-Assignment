import {
  processJob,
  processCodeExecution,
  processFileProcessing,
  processExportProject,
} from '../../../../../src/infrastructure/workers/processors/jobProcessors';
import { JobType } from '../../../../../src/shared/constants/enums';
import logger from '../../../../../src/infrastructure/observability/logger';

jest.mock('../../../../../src/infrastructure/observability/logger');

describe('JobProcessors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processCodeExecution', () => {
    it('should process code execution job', async () => {
      const payload = { code: 'console.log("test")' };
      const result = await processCodeExecution(payload);

      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('exitCode');
      expect(result.output).toBe('Code executed successfully');
      expect(result.exitCode).toBe(0);
      expect(logger.info).toHaveBeenCalledWith('Processing code execution job', { payload });
    }, 15000);
  });

  describe('processFileProcessing', () => {
    it('should process file processing job', async () => {
      const payload = { fileId: 'file-123' };
      const result = await processFileProcessing(payload);

      expect(result).toHaveProperty('processed');
      expect(result).toHaveProperty('fileSize');
      expect(result).toHaveProperty('linesProcessed');
      expect(result.processed).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('Processing file processing job', { payload });
    }, 10000);
  });

  describe('processExportProject', () => {
    it('should process export project job', async () => {
      const payload = { projectId: 'project-123' };
      const result = await processExportProject(payload);

      expect(result).toHaveProperty('exportUrl');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('files');
      expect(result.exportUrl).toContain('https://exports.example.com/');
      expect(logger.info).toHaveBeenCalledWith('Processing export project job', { payload });
    }, 15000);
  });

  describe('processJob', () => {
    it('should process CODE_EXECUTION job type', async () => {
      const payload = { code: 'test' };
      const result = await processJob(JobType.CODE_EXECUTION, payload);

      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('exitCode');
    }, 15000);

    it('should process FILE_PROCESSING job type', async () => {
      const payload = { fileId: 'file-123' };
      const result = await processJob(JobType.FILE_PROCESSING, payload);

      expect(result).toHaveProperty('processed');
      expect(result).toHaveProperty('fileSize');
    }, 10000);

    it('should process EXPORT_PROJECT job type', async () => {
      const payload = { projectId: 'project-123' };
      const result = await processJob(JobType.EXPORT_PROJECT, payload);

      expect(result).toHaveProperty('exportUrl');
      expect(result).toHaveProperty('size');
    }, 15000);

    it('should throw error for unknown job type', async () => {
      const payload = {};
      const promise = processJob('UNKNOWN_TYPE' as any, payload);

      await expect(promise).rejects.toThrow('Unknown job type: UNKNOWN_TYPE');
    });
  });
});

