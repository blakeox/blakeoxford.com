export type HomeCtaLink = {
  href: string;
  label: string;
};

export type HomeResumeHighlightItem = {
  icon:
    | 'migrate'
    | 'money'
    | 'cloud-plus'
    | 'chat'
    | 'azure-opt'
    | 'chart'
    | 'lightbulb'
    | 'consolidate'
    | 'grid'
    | 'predictive'
    | 'shield'
    | 'trend';
  text: string;
};

export type HomeResumeHighlightCard = {
  icon: 'cloud' | 'automation' | 'analytics';
  title: string;
  description: string;
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
    strengths: string[];
    primaryCta: HomeCtaLink;
    secondaryCta: HomeCtaLink;
    portrait: {
      frontSrc: string;
      backSrc: string;
      alt: string;
      altBack: string;
    };
  };
  technologies: {
    kicker: string;
    title: string;
    description: string;
  };
  resumeHighlights: {
    kicker: string;
    title: string;
    description: string;
    cards: HomeResumeHighlightCard[];
  };
  recentProjects: {
    kicker: string;
    title: string;
    description: string;
    cta: HomeCtaLink;
  };
  latestPosts: {
    kicker: string;
    title: string;
    description: string;
    emptyMessage: string;
    cta: HomeCtaLink;
  };
  cta: {
    kicker: string;
    title: string;
    description: string;
    button: HomeCtaLink;
  };
};
