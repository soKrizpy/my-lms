/**
 * Returns a safe URL from a topic attachment.
 *
 * Admins can attach either a direct URL or a provider's iframe embed snippet
 * (for example Canva). Students should always open the resource itself rather
 * than render arbitrary HTML from the admin field.
 */
export function getTopicAttachmentUrl(topicLink?: string | null): string | null {
  const value = topicLink?.trim();
  if (!value) return null;

  const iframeSource = value.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
  const candidate = iframeSource ?? value;

  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}
