import { describe, expect, it } from 'vitest';
import { cleanAssistantResponse } from '../../src/lib/string-utils';

describe('cleanAssistantResponse', () => {
  it('strips markdown bold markers that look broken in plain chat', () => {
    const input =
      '**Automation and Efficiency**: Blake automates finance and ops with Power BI.\n\n**Enterprise systems**: He leads Microsoft 365 migrations.';
    expect(cleanAssistantResponse(input)).toBe(
      'Automation and Efficiency: Blake automates finance and ops with Power BI.\n\nEnterprise systems: He leads Microsoft 365 migrations.'
    );
  });

  it('keeps simple bullet lines without leaving asterisk noise', () => {
    const input = '- Healthcare IT\n- Cloud platforms';
    expect(cleanAssistantResponse(input)).toBe('- Healthcare IT\n- Cloud platforms');
  });

  it('unwraps links and inline code', () => {
    expect(
      cleanAssistantResponse('See [Microsoft Fabric](/projects/microsoft-fabric/) and `Power BI`.')
    ).toBe('See Microsoft Fabric and Power BI.');
  });

  it('strips fenced code blocks without changing their inner text', () => {
    expect(cleanAssistantResponse('```ts\nconst value = 1;\n```')).toBe('const value = 1;');
  });

  it('leaves an unterminated fenced block unchanged', () => {
    const input = '```ts\nconst value = 1;';
    expect(cleanAssistantResponse(input)).toBe(input);
  });
});
