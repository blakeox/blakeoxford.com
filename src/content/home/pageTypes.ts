export type HomeCtaLink = {
  href: string;
  label: string;
};

export type HomeResumeHighlightItem = {
  text: string;
};

export type HomeResumeHighlightSide = {
  side: 'work' | 'daring';
  label: string;
  metric: string;
  title: string;
  items: HomeResumeHighlightItem[];
};

export type HomePageContent = {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    kicker: string;
    defaultTagline: string;
    primaryCta: HomeCtaLink;
    secondaryCta: HomeCtaLink;
    portrait: {
      frontSrc: string;
      backSrc: string;
      alt: string;
      altBack: string;
    };
  };
  resumeHighlights: {
    kicker: string;
    title: string;
    description: string;
    sides: HomeResumeHighlightSide[];
  };
  recentProjects: {
    kicker?: string;
    title: string;
    description: string;
    cta: HomeCtaLink;
  };
  latestPosts: {
    kicker?: string;
    title: string;
    description: string;
    emptyMessage: string;
    cta: HomeCtaLink;
  };
  cta: {
    kicker?: string;
    title: string;
    description: string;
    button: HomeCtaLink;
  };
};
