export type AppErrorOptions = {
  context?: unknown
  details?: unknown
}

export type AppError = Error & {
  isApplicationError: true
  errorCode: string
  context?: unknown
  details?: unknown
}

export type NormalizeErrorOptions = {
  internalMessage?: string
  invalidJsonMessage?: string
  invalidJsonDetails?: unknown
}

const DEFAULT_INTERNAL_MESSAGE = 'Internal server error'
const DEFAULT_INVALID_JSON_MESSAGE = 'Invalid request body'
const DEFAULT_INVALID_JSON_DETAILS = ['Malformed JSON body']

const attachOptionalProperties = (error: AppError, options: AppErrorOptions) => {
  if (options.context !== undefined) {
    error.context = options.context
  }

  if (options.details !== undefined) {
    error.details = options.details
  }
}

/**
 * Create an app error with a consistent shape.
 */
export const createAppError = (
  errorMessage: string,
  errorCode = 'ERR',
  options: AppErrorOptions = {},
): AppError => {
  const error = new Error(errorMessage) as AppError
  error.isApplicationError = true
  error.errorCode = errorCode

  attachOptionalProperties(error, options)

  return error
}

/**
 * Throw an app error with a consistent shape.
 */
export const throwAppError = (
  errorMessage: string,
  errorCode = 'ERR',
  options: AppErrorOptions = {},
): never => {
  const error = createAppError(errorMessage, errorCode, options)

  throw error
}

export const isAppError = (error: unknown): error is AppError =>
  Boolean(
    error &&
      typeof error === 'object' &&
      'isApplicationError' in error &&
      (error as { isApplicationError?: unknown }).isApplicationError === true &&
      'errorCode' in error &&
      typeof (error as { errorCode?: unknown }).errorCode === 'string',
  )

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isJsonParseError = (error: unknown) => {
  if (!(error instanceof SyntaxError) || !isRecord(error)) {
    return false
  }

  const status = error.status ?? error.statusCode
  return status === 400 && error.type === 'entity.parse.failed'
}

export const normalizeError = (
  error: unknown,
  options: NormalizeErrorOptions = {},
): AppError => {
  if (isAppError(error)) {
    return error
  }

  if (isJsonParseError(error)) {
    return createAppError(
      options.invalidJsonMessage ?? DEFAULT_INVALID_JSON_MESSAGE,
      'VALIDATION_ERROR',
      { details: options.invalidJsonDetails ?? DEFAULT_INVALID_JSON_DETAILS },
    )
  }

  return createAppError(
    options.internalMessage ?? DEFAULT_INTERNAL_MESSAGE,
    'INTERNAL_SERVER_ERROR',
  )
}

export default throwAppError
