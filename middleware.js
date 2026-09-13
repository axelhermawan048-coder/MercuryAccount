export function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';

  // Regex untuk mendeteksi bot / crawler
  const botPattern = /Googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyouhop|outbrain|pinterest\/0\.|bingpreview|slackbot|vkShare|W3C_Validator/i;

  // Jika yang datang adalah BOT, rewrite URL ke konten_bot.html
  if (botPattern.test(userAgent)) {
    return Response.rewrite(new URL('/konten_bot.html', request.url));
  }

  // Jika MANUSIA, lanjutkan akses normal
  return fetch(request);
}

export const config = {
  matcher: ['/', '/index.html'],
};
