export type SignUpMode = "waitlist" | "invite" | "open";

export function getSignUpMode(): SignUpMode {
  const configured = process.env.AUTH_SIGNUP_MODE;

  if (configured === "invite" || configured === "open") {
    return configured;
  }

  return "waitlist";
}

export function isPublicSignUpOpen() {
  return getSignUpMode() === "open";
}

export function isSocialAuthEnabled() {
  return process.env.NEXT_PUBLIC_AUTH_SOCIAL_ENABLED === "true" && isPublicSignUpOpen();
}
