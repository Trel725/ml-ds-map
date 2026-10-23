/** Hosts a resource may link to. Book sites may link to their home page. */
export const RESOURCE_HOSTS = [
  'statquest.org',
  'www.youtube.com',
  'www.3blue1brown.com',
  'www.statlearning.com',
  'scikit-learn.org',
  'www.khanacademy.org',
  'numpy.org',
  'pandas.pydata.org',
  'www.statsmodels.org',
  'pytorch.org',
  'mlu-explain.github.io',
  'seeing-theory.brown.edu',
] as const;
const BOOK_HOSTS = new Set(['www.statlearning.com']);
const YOUTUBE_CHANNELS = ['/@statquest', '/@3blue1brown'];

/** Pure allow-list check for a resource URL: https, a known host, and a specific page. */
export function checkResourceUrl(url: string): { ok: true } | { ok: false; reason: string } {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { ok: false, reason: 'not a URL' };
  }
  if (u.protocol !== 'https:') return { ok: false, reason: 'not https' };
  if (!(RESOURCE_HOSTS as readonly string[]).includes(u.hostname)) return { ok: false, reason: `host ${u.hostname} is not allowed` };
  const path = u.pathname.replace(/\/+$/, '');
  if (u.hostname === 'www.youtube.com') {
    // Videos on the allowed channels are linked as /watch?v=…; a bare channel page is a home page.
    const channelPage = YOUTUBE_CHANNELS.some((c) => path === c || path.startsWith(`${c}/`));
    const video = path === '/watch' && u.searchParams.has('v');
    if (!video && !channelPage) return { ok: false, reason: 'only StatQuest and 3Blue1Brown videos are allowed on YouTube' };
    if (channelPage && YOUTUBE_CHANNELS.includes(path)) return { ok: false, reason: 'channel home page, not a specific video' };
    return { ok: true };
  }
  if (path === '' && !BOOK_HOSTS.has(u.hostname)) return { ok: false, reason: 'home page, not a specific page' };
  return { ok: true };
}
