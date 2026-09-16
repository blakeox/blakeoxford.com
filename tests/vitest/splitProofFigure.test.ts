import { describe, expect, it } from 'vitest';
import { splitProofFigure } from '../../src/lib/content/splitProofFigure';

describe('splitProofFigure', () => {
  it('splits a leading count from the caption', () => {
    expect(splitProofFigure('200 teammates enabled across 10 departments')).toEqual({
      figure: '200',
      caption: 'teammates enabled across 10 departments',
    });
  });

  it('keeps percent and em-dash metrics intact', () => {
    expect(splitProofFigure('45% fewer audit findings in the first quarter')).toEqual({
      figure: '45%',
      caption: 'fewer audit findings in the first quarter',
    });
    expect(splitProofFigure('10 — Departments')).toEqual({
      figure: '10',
      caption: 'Departments',
    });
  });

  it('lifts figure-first money, percent, and throughput lines', () => {
    expect(splitProofFigure('$12M+ closed across lending programs')).toEqual({
      figure: '$12M+',
      caption: 'closed across lending programs',
    });
    expect(splitProofFigure('25% faster claims turnaround')).toEqual({
      figure: '25%',
      caption: 'faster claims turnaround',
    });
    expect(splitProofFigure('60% longer average sessions after automation')).toEqual({
      figure: '60%',
      caption: 'longer average sessions after automation',
    });
    expect(splitProofFigure('>10k requests per minute on edge APIs')).toEqual({
      figure: '>10k',
      caption: 'requests per minute on edge APIs',
    });
    expect(splitProofFigure('35% faster onboarding in the first quarter')).toEqual({
      figure: '35%',
      caption: 'faster onboarding in the first quarter',
    });
    expect(splitProofFigure('99.99% uptime through the remote cutover')).toEqual({
      figure: '99.99%',
      caption: 'uptime through the remote cutover',
    });
  });

  it('still lifts a figure buried in a prose sentence', () => {
    expect(splitProofFigure('Secured $12M+ across multiple lending programs.')).toEqual({
      figure: '$12M+',
      caption: 'across multiple lending programs',
    });
  });

  it('returns the whole line as caption when there is no figure', () => {
    expect(splitProofFigure('Shared operating cadence')).toEqual({
      figure: '',
      caption: 'Shared operating cadence',
    });
  });
});
