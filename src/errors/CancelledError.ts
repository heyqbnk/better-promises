import { errorClass } from 'error-kid';

export const [CancelledError, isCancelledError] =
  errorClass('CancelledError', 'Promise was canceled');