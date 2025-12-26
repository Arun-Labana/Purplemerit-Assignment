import { JobType } from '../../../shared/constants/enums';
import logger from '../../observability/logger';

// Simulate code execution
export async function processCodeExecution(payload: any): Promise<any> {
  logger.info('Processing code execution job', { payload });

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 5000 + Math.random() * 5000));

  // Simulate result
  return {
    output: 'Code executed successfully',
    executionTime: Math.random() * 10,
    exitCode: 0,
  };
}

// Simulate file processing
export async function processFileProcessing(payload: any): Promise<any> {
  logger.info('Processing file processing job', { payload });

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 3000 + Math.random() * 3000));

  return {
    processed: true,
    fileSize: Math.floor(Math.random() * 1000000),
    linesProcessed: Math.floor(Math.random() * 10000),
  };
}

// Simulate project export
export async function processExportProject(payload: any): Promise<any> {
  logger.info('Processing export project job', { payload });

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 7000 + Math.random() * 3000));

  return {
    exportUrl: `https://exports.example.com/${Date.now()}.zip`,
    size: Math.floor(Math.random() * 50000000),
    files: Math.floor(Math.random() * 1000),
  };
}

export async function processJob(type: string, payload: any): Promise<any> {
  switch (type) {
    case JobType.CODE_EXECUTION:
      return await processCodeExecution(payload);
    case JobType.FILE_PROCESSING:
      return await processFileProcessing(payload);
    case JobType.EXPORT_PROJECT:
      return await processExportProject(payload);
    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

