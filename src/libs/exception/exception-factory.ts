import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

interface ClassValidatorError {
  property: string;
  constraints: {
    [key: string]: string;
  };
}

export const exceptionFactory = (validationErrors: ValidationError[] = []) => {
  const errs = buildError(validationErrors);

  // const property = errs[0].property;
  const constraints = errs[0].constraints;
  return new BadRequestException(Object.values(constraints)[0]);
};

const buildError = (
  validationErrors: ValidationError[],
): ClassValidatorError[] => {
  const formattedErrors = [];
  const stack = validationErrors.map((err) => ({ error: err, parentPath: '' }));

  while (stack.length) {
    const { error, parentPath } = stack.pop();
    const propertyPath = parentPath
      ? `${parentPath}${isNaN(Number(error.property)) ? '.' + error.property : ''}`
      : error.property;

    if (error.constraints) {
      if (error.constraints.hasOwnProperty('isString')) {
        const message = error.constraints.isString.split(' ');
        if (message[0] === 'each' && message[1] === 'value') {
          error.constraints['isArrayString'] = error.constraints.isString;
          delete error.constraints.isString;
        }
      }
      formattedErrors.push({
        property: propertyPath,
        constraints: error.constraints,
      });
    }

    if (error.children && error.children.length > 0) {
      stack.push(
        ...error.children.map((child) => ({
          error: child,
          parentPath: propertyPath,
        })),
      );
    }
  }
  return formattedErrors;
};
