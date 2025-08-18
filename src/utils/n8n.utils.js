function mapUserRoleToN8nRole(role) {
  switch(role) {
    case 'Admin':
      return 'global:admin';
    case 'User':
    default:
      return 'global:member';
  }
}

module.exports = {
  mapUserRoleToN8nRole,
};
