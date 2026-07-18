export interface ContactChannels {
  heading: string;
  title: string;
  description: string;
  items: ContactChannel[];
}

export interface ContactChannel {
  icon: string;
  title: string;
  description: string;
  href: string;
  label: string;
}
