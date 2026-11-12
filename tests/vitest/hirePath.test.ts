import { describe, expect, it } from 'vitest';
import type { CollectionEntry } from 'astro:content';
import { leadStudies, WORK_PROOF_LABELS } from '../../src/content/projects/hirePath';

function project(id: string, impact: string[]): CollectionEntry<'projects'> {
  return {
    id,
    data: {
      title: id,
      impact,
    },
  } as CollectionEntry<'projects'>;
}

describe('leadStudies', () => {
  it('copies each hire group figure from that study’s first impact line', () => {
    const studies = leadStudies([
      project('google-workspace-migration', ['99.99% uptime through the remote cutover']),
      project('microsoft-fabric', ['200 teammates enabled across 10 departments']),
      project('bank-projections-modeling', ['$12M+ closed across lending programs']),
      project('ferment-app', ['60% longer average sessions after automation']),
    ]);

    expect(studies.map((study) => study.line)).toEqual([
      '99.99% uptime through the remote cutover',
      '200 teammates enabled across 10 departments',
      '$12M+ closed across lending programs',
    ]);
    expect(studies.map((study) => study.linkLabel)).toEqual([
      'Cutover with recovery built in',
      'Shared ops data teams can run',
      'Lending calls on clear inputs',
    ]);
    expect(studies.map((study) => study.href)).toEqual([
      '/projects/google-workspace-migration/',
      '/projects/microsoft-fabric/',
      '/projects/bank-projections-modeling/',
    ]);
  });

  it('keeps hire-facing labels for every published study slug', () => {
    expect(WORK_PROOF_LABELS['llm-note-coaching']).toMatch(/coaching/i);
    expect(WORK_PROOF_LABELS['ferment-app']).toMatch(/offline/i);
    expect(WORK_PROOF_LABELS['fanalyx-deterministic-finance-platform']).toMatch(/finance/i);
    expect(WORK_PROOF_LABELS['adp-workforcenow']).toMatch(/payroll|headcount/i);
    expect(WORK_PROOF_LABELS['advancedmd-implementation']).toMatch(/claims|EHR/i);
  });
});
