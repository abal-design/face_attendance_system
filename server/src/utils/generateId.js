const randomChunk = () => Math.random().toString(36).slice(2, 6).toUpperCase();

export const generateEntityId = (prefix) => {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${randomChunk()}`;
};
