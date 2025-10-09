export interface SocialSection {
  heading: string;
  title: string;
  description: string;
  links: SocialLink[];
}

export interface SocialLink {
  href: string;
  label: string;
  icon: string;
}

export interface TimelineSection {
  heading: string;
  title: string;
  description: string;
  items: TimelineItem[];
}

export interface TimelineItem {
  period: string;
  year: string;
  title: string;
  description: string;
  icon: string;
  achievements: string[];
}