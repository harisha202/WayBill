// Re-export canonical navigation and routing configurations from the single source of truth
export {
  ROLE_LINKS,
  PATH_BY_ROLE_LINK,
  SOCKET_USER_BY_ROLE,
  DEFAULT_PATH_BY_ROLE,
  normalizeRole,
  findRoute,
  getRoutesForRole,
  getDefaultPathForRole,
  getNavLinksForRole,
  getPathForRoleLink,
  getLinkForRolePath,
} from '../../config/routes'
