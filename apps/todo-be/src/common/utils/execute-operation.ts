import { OperationException } from '../errors/operation.exception';

export async function executeOperation<T>(
  message: string,
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new OperationException(message, error);
  }
}
