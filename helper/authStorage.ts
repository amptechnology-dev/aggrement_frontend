export const AUTH_TOKEN_KEY = "login-token";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const saveAuth = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_TOKEN_KEY}=${token}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
};

export const clearAuth = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0`;
};