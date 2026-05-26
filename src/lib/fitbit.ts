// Fitbit API は廃止されました。google-health.ts を使用してください。
export class FitbitAuthError extends Error {
  constructor(message = "Fitbit API is deprecated") {
    super(message);
    this.name = "FitbitAuthError";
  }
}

export async function fetchTodayFitbit(): Promise<never> {
  throw new FitbitAuthError("Fitbit API is deprecated. Use Google Health API.");
}
