import { config } from 'dotenv';
import { join } from 'path';
import { z, ZodError } from 'zod';

enum Environment {
  DEVELOPMENT = 'development',
  TEST = 'test',
  PRODUCTION = 'production',
}

const envExtensions = {
  [Environment.DEVELOPMENT]: 'local',
  [Environment.TEST]: 'test',
  [Environment.PRODUCTION]: '',
};

export const environment =
  (process.env.NODE_ENV as Environment) || Environment.DEVELOPMENT;
export const isProductionEnvironment = environment === Environment.PRODUCTION;
export const isTestEnvironment = environment === Environment.TEST;
export const isDevelopmentEnvironment = environment === Environment.DEVELOPMENT;

if (!isProductionEnvironment) {
  config({
    path: join(__dirname, `../../../.env.${envExtensions[environment]}`),
  });
}

const ConfigZodSchema = z.object({
  PORT: z.coerce.number(),
  BASE_URL: z.string(),

  ALLOWED_ORIGINS: z.string(),

  API_NAME: z.string(),
  API_DESCRIPTION: z.string(),
  API_VERSION: z.string(),

  DOCUMENTATION_PATH: z.string(),
  DOCUMENTATION_USER: z.string(),
  DOCUMENTATION_PASSWORD: z.string(),

  DATABASE_URI: z.string(),
  DATABASE_NAME: z.string(),

  COOKIE_SECRET: z.string(),

  JWT_ACCESS_TOKEN_SECRET: z.string(),
  JWT_ACCESS_TOKEN_EXPIRATION: z.string().default('1h'),
  JWT_REFRESH_TOKEN_SECRET: z.string(),
  JWT_REFRESH_TOKEN_EXPIRATION: z.string().default('1d'),

  CAPTCHA_PRIVATE_KEY: z.string(),
  BYPASS_CAPTCHA: z.coerce.boolean(),

  SENDGRID_KEY: z.string(),

  MAILS_FROM_NAME: z.string(),
  MAILS_FROM_EMAIL: z.string().email(),

  CONTACT_REQUEST_INBOX: z.string().email(),
});

export type TConfig = z.infer<typeof ConfigZodSchema>;

export default () => {
  try {
    return ConfigZodSchema.parse(process.env);
  } catch (error) {
    const missingVars = (error as ZodError).errors.reduce(
      (missing: string[], error) => {
        return [...missing, error.path];
      },
      [],
    );
    throw new Error(`Missing env vars:\n  ${missingVars.join('\n  ')}`);
  }
};
