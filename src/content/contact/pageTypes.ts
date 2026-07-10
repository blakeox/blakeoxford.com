import type { ContactChannels } from '../../components/features/contact/types';

export type ContactPageContent = {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    kicker: string;
    title: string;
    description: string;
    scenarios: string[];
    primaryCta: { href: string; label: string };
    secondaryCta: { href: string; label: string };
    sidebar: {
      heading: string;
      items: string[];
      note: string;
    };
  };
  channels: ContactChannels;
};
