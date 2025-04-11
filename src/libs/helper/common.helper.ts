import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as bcrypt from 'bcrypt';

export const randomString = (
  length: number,
  options: {
    type?:
      | 'alpha'
      | 'alpha_upper'
      | 'alpha_lower'
      | 'alpha_upper_numeric'
      | 'alpha_lower_numeric'
      | 'numeric'
      | 'all';
  } = {},
) => {
  const type = options.type || 'all';
  let result = '';
  let characters = '';

  const typeAlphaLower = ['all', 'alpha', 'alpha_lower', 'alpha_lower_numeric'];
  const typeAlphaUpper = ['all', 'alpha', 'alpha_upper', 'alpha_upper_numeric'];
  const typeNumerics = [
    'all',
    'alpha_upper_numeric',
    'alpha_lower_numeric',
    'numeric',
  ];

  if (typeAlphaLower.includes(type)) {
    characters += 'abcdefghijklmnopqrstuvwxyz';
  } else if (typeAlphaUpper.includes(type)) {
    characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  } else if (typeNumerics.includes(type)) {
    characters += '0123456789';
  }

  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const hashPassword = async (password: string) => {
  const saltOrRounds = 10;
  return bcrypt.hash(password, saltOrRounds);
};

export const multerOptions: MulterOptions = {
  fileFilter: (
    req: Request,
    file: { mimetype: string },
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new BadRequestException('Only JPEG, PNG, and GIF files are allowed!'),
        false,
      );
    }

    cb(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // Max 2MB
  },
};

export const orderNumberGenerator = (prefix: string = 'DNS'): string => {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  // generate random 4 digit number
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  const order_number = `${prefix}${day}${hours}${minutes}${seconds}${milliseconds}${random}`;

  return order_number;
};

/**
 * Set amount from 10000.00 to 10000
 * @returns {string} a string.
 */
export const handleFloat = (payload: string | number): string => {
  if (typeof payload === 'number') {
    payload = payload.toString();
  }
  const value = parseFloat(payload);
  if (value === 0) return '0';
  return parseFloat(value.toFixed(2)).toString();
};
