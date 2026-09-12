import { describe, expect, it } from 'vitest';
import { getTopicAttachmentUrl } from './topicLink';

describe('getTopicAttachmentUrl', () => {
  it('accepts a direct HTTP(S) topic link', () => {
    expect(getTopicAttachmentUrl('https://www.canva.com/design/example/view')).toBe(
      'https://www.canva.com/design/example/view'
    );
  });

  it('extracts an iframe source from an admin embed snippet', () => {
    expect(getTopicAttachmentUrl('<iframe src="https://www.canva.com/design/example/view?embed"></iframe>')).toBe(
      'https://www.canva.com/design/example/view?embed'
    );
  });

  it('rejects unsafe or malformed links', () => {
    expect(getTopicAttachmentUrl('javascript:alert(1)')).toBeNull();
    expect(getTopicAttachmentUrl('<iframe src="javascript:alert(1)"></iframe>')).toBeNull();
    expect(getTopicAttachmentUrl('not a URL')).toBeNull();
  });
});
