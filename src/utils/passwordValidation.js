const PASSWORD_MIN_LENGTH = 6;
const UPPERCASE_REGEX = /[A-Z]/;
const NUMBER_REGEX = /[0-9]/;

export const PASSWORD_REQUIRED_MESSAGE = "Ingresa una contraseña";
export const PASSWORD_RULES_MESSAGE =
  "La contraseña debe tener al menos 6 caracteres, una mayúscula y un número";

export function validatePasswordRules(password) {
  const value = String(password ?? "");

  if (!value) {
    return PASSWORD_REQUIRED_MESSAGE;
  }

  if (
    value.length < PASSWORD_MIN_LENGTH ||
    !UPPERCASE_REGEX.test(value) ||
    !NUMBER_REGEX.test(value)
  ) {
    return PASSWORD_RULES_MESSAGE;
  }

  return null;
}
