export const jwtConfig = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-access-token-secret-key',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-key',
  accessTokenExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  issuer: process.env.JWT_ISSUER || 'nutrition-tracker-api',
  audience: process.env.JWT_AUDIENCE || 'nutrition-tracker-client',
};

export const tokenConfig = {
  access: {
    secret: jwtConfig.accessTokenSecret,
    expiresIn: jwtConfig.accessTokenExpiration,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  },
  refresh: {
    secret: jwtConfig.refreshTokenSecret,
    expiresIn: jwtConfig.refreshTokenExpiration,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  },
};