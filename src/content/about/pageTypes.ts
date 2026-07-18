export type AboutSocialLink = {
  name: string;
  url: string;
};

export type AboutTimelineItem = {
  year: string;
  title: string;
  achievements: string[];
};

export type AboutAchievementCard = {
  title: string;
  description: string;
  achievements: string[];
};

export type AboutPageContent = {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    kicker: string;
    title: string;
    description: string;
    proofPoints: string[];
  };
  achievements: {
    kicker: string;
    title: string;
    description: string;
    cards: AboutAchievementCard[];
  };
  social: {
    title: string;
    links: AboutSocialLink[];
  };
  education: {
    kicker: string;
    title: string;
    description: string;
    institution: string;
    degree: string;
    educationDescription: string;
    skillsIntro: string;
    skills: string[];
  };
  timeline: {
    kicker: string;
    title: string;
    description: string;
    items: AboutTimelineItem[];
  };
  closing: {
    kicker: string;
    title: string;
    description: string;
  };
};
