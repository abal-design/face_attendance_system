const INSTITUTION_DOMAIN = 'iic.edu.np';

export const normalizeInstitutionEmail = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';

  const emailPattern = /([a-z0-9._%+-]+)@([a-z0-9.-]+\.[a-z]{2,})/i;
  const extractedEmail = raw.match(emailPattern)?.[0] || raw;

  const fallbackLocalPart = extractedEmail.includes('@')
    ? extractedEmail.split('@')[0]
    : extractedEmail;

  const sanitizedLocalPart = fallbackLocalPart
    .replace(/^[^a-z0-9]+/i, '')
    .replace(/[^a-z0-9._%+-]/gi, '');

  if (!sanitizedLocalPart) return '';
  return `${sanitizedLocalPart}@${INSTITUTION_DOMAIN}`;
};
