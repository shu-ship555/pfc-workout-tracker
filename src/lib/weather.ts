export async function fetchTodayWeather(city: string, apiKey: string) {
  const geoRes = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`
  );
  const geoData = await geoRes.json();
  const geo = geoData[0];
  if (!geo) throw new Error(`City not found: ${city}`);

  const { lat, lon } = geo;

  const jstNow = new Date(Date.now() + 9 * 3600_000);
  const todayStr = jstNow.toISOString().slice(0, 10); // YYYY-MM-DD

  const [summaryRes, currentRes] = await Promise.all([
    fetch(
      `https://api.openweathermap.org/data/3.0/onecall/day_summary?lat=${lat}&lon=${lon}&date=${todayStr}&appid=${apiKey}&units=metric&tz=+09:00`
    ),
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&lang=ja&units=metric`
    ),
  ]);

  const summary = await summaryRes.json();
  const current = await currentRes.json();

  return {
    tempMax: (summary.temperature?.max as number) ?? null,
    tempMin: (summary.temperature?.min as number) ?? null,
    humidity: (summary.humidity?.afternoon as number) ?? (current.main?.humidity as number) ?? null,
    weather: (current.weather?.[0]?.description as string) ?? "",
  };
}
