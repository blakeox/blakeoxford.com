import { describe, expect, it } from 'vitest';
import {
  handleLegacyProjectRedirect,
  legacyProjectRedirectTarget,
} from '../../../functions/routes/legacy-project-redirect';

function context(pathname: string, method = 'GET') {
  return {
    request: new Request(`https://blakeoxford.com${pathname}`, { method }),
    url: new URL(`https://blakeoxford.com${pathname}`),
    reqId: 'test-project-redirect',
  } as never;
}

describe('legacy project redirects', () => {
  it('maps the known mixed-case Microsoft Fabric URL to the canonical route', () => {
    expect(legacyProjectRedirectTarget('/projects/Microsoft-Fabric/')).toBe(
      '/projects/microsoft-fabric/'
    );
  });

  it('preserves query parameters on the permanent redirect', async () => {
    const response = await handleLegacyProjectRedirect(
      context('/projects/Microsoft-Fabric/?source=legacy')
    );

    expect(response?.status).toBe(301);
    expect(response?.headers.get('location')).toBe(
      'https://blakeoxford.com/projects/microsoft-fabric/?source=legacy'
    );
  });

  it('does not broaden the redirect to unrelated casing or routes', async () => {
    expect(legacyProjectRedirectTarget('/projects/microsoft-fabric/')).toBeNull();
    expect(legacyProjectRedirectTarget('/projects/Other-Project/')).toBeNull();
    expect(await handleLegacyProjectRedirect(context('/projects/Other-Project/'))).toBeNull();
  });

  it('rejects non-read methods', async () => {
    const response = await handleLegacyProjectRedirect(
      context('/projects/Microsoft-Fabric/', 'POST')
    );

    expect(response?.status).toBe(405);
    expect(response?.headers.get('allow')).toBe('GET, HEAD');
  });
});
