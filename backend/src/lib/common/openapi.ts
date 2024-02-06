type OpenApiHeaderDescription = {
  headers: Record<string, { schema: { example: string } }>;
};

export const mergeHeaders = (...headers: OpenApiHeaderDescription[]) =>
  headers.reduce(
    (combinedHeaders, header) => ({
      headers: {
        ...combinedHeaders.headers,
        ...header.headers,
      },
    }),
    { headers: {} },
  );

export const setCookieHeader = {
  headers: {
    'set-cookie': {
      schema: {
        example:
          'authorization=Bearer <jwt>; Path=/; HttpOnly; SameSite=Strict',
      },
    },
  },
};

export const setAuthorizationHeader = {
  headers: {
    autorization: {
      schema: {
        example: 'Bearer <jwt>',
      },
    },
  },
};

export const clearCookieHeader = {
  headers: {
    'set-cookie': {
      schema: {
        example:
          'authorization= ; Path=/; HttpOnly; SameSite=Strict; expires Thu, 01 Jan 1970 00:00:00 GMT',
      },
    },
  },
};
