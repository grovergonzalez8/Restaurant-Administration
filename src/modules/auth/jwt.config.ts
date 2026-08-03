import { ConfigService } from '@nestjs/config';

const DEVELOPMENT_JWT_SECRET = 'change_this_secret';

export const getJwtSecret = (config: ConfigService) => {
  const secret = config.get<string>('JWT_SECRET');
  const environment = config
    .get<string>('NODE_ENV', 'development')
    .toLowerCase();
  if (!secret && environment === 'production') {
    throw new Error('JWT_SECRET es obligatorio en producción');
  }
  return secret ?? DEVELOPMENT_JWT_SECRET;
};
