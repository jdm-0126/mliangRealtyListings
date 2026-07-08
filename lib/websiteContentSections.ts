export const WEBSITE_SECTIONS = {
  brandColor: 'public_brand_color',
  homeHero: 'home_hero',
  homeServices: 'home_services',
  aboutHero: 'about_hero',
  aboutOverview: 'about_overview',
  brokers: 'broker_profiles',
  developerProfiles: 'developer_profiles',
  advantages: 'advantages',
  featuredStories: 'featured_stories',
  clientStories: 'client_stories',
  captions: 'captions',
} as const

export type WebsiteSectionKey = (typeof WEBSITE_SECTIONS)[keyof typeof WEBSITE_SECTIONS]
