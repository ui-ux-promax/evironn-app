export type AdminActionErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'SLUG_TAKEN'
  | 'ARTICLE_NUMBER_TAKEN'
  | 'OPTION_GROUP_IN_USE'
  | 'OPTION_VALUE_IN_USE'
  | 'ROOM_HAS_PRODUCTS'
  | 'MIGRATION_INCOMPLETE'
  | 'MEDIA_OWNERSHIP_REJECTED'
  | 'PRODUCT_HAS_REFERENCES'
  | 'TURNTABLE_BINDING_CONFLICT'
  | 'TURNTABLE_MEDIA_REQUIRED'
  | 'TURNTABLE_BOUND_PRODUCT_LOCKED'
  | 'ORDER_CANCELLATION_BLOCKED'
  | 'STALE_VALUE'
  | 'UNEXPECTED';

export type AdminActionErrorDetails = Record<string, string | number | boolean | string[]>;

export type AdminActionOk<T> = { ok: true; data: T; warnings?: string[] };

export type AdminActionError = {
  ok: false;
  code: AdminActionErrorCode;
  message: string;
  error: string;
  details?: AdminActionErrorDetails;
};

export type AdminActionResult<T = null> = AdminActionOk<T> | AdminActionError;

export function adminOk<T>(data: T, warnings?: string[]): AdminActionOk<T> {
  return warnings?.length ? { ok: true, data, warnings } : { ok: true, data };
}

export function adminError(
  code: AdminActionErrorCode,
  message: string,
  details?: AdminActionErrorDetails,
): AdminActionError {
  return { ok: false, code, message, error: message, ...(details ? { details } : {}) };
}
