export type AboutSocialLink = {
  name: string;
  url: string;
  icon: 'linkedin' | 'github' | 'microsoft-learn';
};

export type AboutTimelineItem = {
  year: string;
  icon: '🔄' | '☁️' | '💡' | '🤖';
  title: string;
  achievements: string[];
  color: string;
};

export type AboutAchievementCard = {
  icon: 'home' | 'chart' | 'lightbulb';
  title: string;
  description: string;
  achievements: string[];
  achievementIcons?: Array<'grid' | 'clock' | 'users' | 'dollar' | 'trending'>;
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
    description: string;
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
