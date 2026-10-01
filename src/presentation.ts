export function presentationFromQuery(search: string) {
  const query = new URLSearchParams(search);
  const language = query.get('portfolio_lang');
  const theme = query.get('portfolio_theme');
  return {
    language: language === 'en' || language === 'ar' ? language : undefined,
    theme: theme === 'light' || theme === 'dark' ? theme : undefined,
  } as { language?: 'en' | 'ar'; theme?: 'light' | 'dark' };
}
