import { describe, expect, it } from 'vitest';
import type { CollectionEntry } from 'astro:content';
import { leadStudies } from '../../src/content/projects/hirePath';

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
    expect(studies.map((study) => study.href)).toEqual([
      '/projects/google-workspace-migration/',
      '/projects/microsoft-fabric/',
      '/projects/bank-projections-modeling/',
    ]);
  });
});
