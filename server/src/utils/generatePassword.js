const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';

export const generatePassword = (length = 10) => {
  let password = '';

  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }

  return password;
};
