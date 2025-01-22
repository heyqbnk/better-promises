import { errorClass } from 'error-kid';

export const [CanceledError, isCanceledError] =
  errorClass('CanceledError', 'Promise was canceled');