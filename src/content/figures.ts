/**
 * Public figures whose work is in the public domain.
 * Cutoff: died before 1955 (UK life+70 puts them in PD as of 2026).
 * source_url is the canonical Wikipedia/Wikiquote reference.
 */

export type Figure = {
  slug: string;
  name: string;
  era: string;
  domains: string[];
  bio: string;
  source_url: string;
};

export const FIGURES: Figure[] = [
  {
    slug: 'marcus-aurelius',
    name: 'Marcus Aurelius',
    era: 'Roman, 121–180 CE',
    domains: ['philosopher', 'emperor', 'stoic'],
    bio: 'Roman emperor and Stoic philosopher whose private journal Meditations remains the definitive working manual for clear thinking under pressure.',
    source_url: 'https://en.wikiquote.org/wiki/Marcus_Aurelius',
  },
  {
    slug: 'seneca',
    name: 'Seneca',
    era: 'Roman, c. 4 BCE – 65 CE',
    domains: ['philosopher', 'statesman', 'stoic'],
    bio: 'Stoic philosopher, dramatist, and adviser to Nero. His letters to Lucilius are practical philosophy at its most readable.',
    source_url: 'https://en.wikiquote.org/wiki/Seneca_the_Younger',
  },
  {
    slug: 'epictetus',
    name: 'Epictetus',
    era: 'Greek, c. 50–135 CE',
    domains: ['philosopher', 'stoic'],
    bio: 'Greek Stoic philosopher born into slavery. Taught that we suffer from our judgements about events, not events themselves.',
    source_url: 'https://en.wikiquote.org/wiki/Epictetus',
  },
  {
    slug: 'heraclitus',
    name: 'Heraclitus',
    era: 'Greek, c. 535–475 BCE',
    domains: ['philosopher', 'pre-socratic'],
    bio: 'Pre-Socratic philosopher remembered for the doctrine of constant change — "everything flows."',
    source_url: 'https://en.wikiquote.org/wiki/Heraclitus',
  },
  {
    slug: 'lao-tzu',
    name: 'Lao Tzu',
    era: 'Chinese, c. 6th century BCE',
    domains: ['philosopher', 'taoist'],
    bio: 'Semi-legendary author of the Tao Te Ching, foundational text of philosophical Taoism.',
    source_url: 'https://en.wikiquote.org/wiki/Laozi',
  },
  {
    slug: 'confucius',
    name: 'Confucius',
    era: 'Chinese, 551–479 BCE',
    domains: ['philosopher', 'teacher'],
    bio: 'Chinese philosopher and teacher whose ideas about ethics, family, and statecraft shaped East Asian thought for two millennia.',
    source_url: 'https://en.wikiquote.org/wiki/Confucius',
  },
  {
    slug: 'aristotle',
    name: 'Aristotle',
    era: 'Greek, 384–322 BCE',
    domains: ['philosopher', 'scientist'],
    bio: 'Student of Plato, tutor of Alexander the Great. Founded systematic logic, biology, ethics — a working method for thinking.',
    source_url: 'https://en.wikiquote.org/wiki/Aristotle',
  },
  {
    slug: 'socrates',
    name: 'Socrates',
    era: 'Greek, 470–399 BCE',
    domains: ['philosopher'],
    bio: 'Wrote nothing himself; survives through Plato. His method of relentless, honest questioning is the entire Western philosophical tradition\'s root.',
    source_url: 'https://en.wikiquote.org/wiki/Socrates',
  },
  {
    slug: 'oscar-wilde',
    name: 'Oscar Wilde',
    era: 'Irish, 1854–1900',
    domains: ['writer', 'playwright', 'wit'],
    bio: 'Irish poet and playwright. Master of paradox, aesthete, and the most quotable man of the late nineteenth century.',
    source_url: 'https://en.wikiquote.org/wiki/Oscar_Wilde',
  },
  {
    slug: 'mark-twain',
    name: 'Mark Twain',
    era: 'American, 1835–1910',
    domains: ['writer', 'humorist'],
    bio: 'Pen name of Samuel Clemens. American novelist whose voice — direct, sceptical, generous — defined a national literature.',
    source_url: 'https://en.wikiquote.org/wiki/Mark_Twain',
  },
  {
    slug: 'henry-david-thoreau',
    name: 'Henry David Thoreau',
    era: 'American, 1817–1862',
    domains: ['writer', 'philosopher', 'naturalist'],
    bio: 'Author of Walden. Lived two years by a Massachusetts pond to discover what was essential in life. The original lifestyle minimalist.',
    source_url: 'https://en.wikiquote.org/wiki/Henry_David_Thoreau',
  },
  {
    slug: 'ralph-waldo-emerson',
    name: 'Ralph Waldo Emerson',
    era: 'American, 1803–1882',
    domains: ['essayist', 'philosopher', 'transcendentalist'],
    bio: 'Father of the American essay. Believed each person carried a private divine source — and ought to act on it.',
    source_url: 'https://en.wikiquote.org/wiki/Ralph_Waldo_Emerson',
  },
  {
    slug: 'walt-whitman',
    name: 'Walt Whitman',
    era: 'American, 1819–1892',
    domains: ['poet'],
    bio: 'Author of Leaves of Grass. Wrote America back to itself in long, generous lines — celebrating the body, the city, and the self.',
    source_url: 'https://en.wikiquote.org/wiki/Walt_Whitman',
  },
  {
    slug: 'friedrich-nietzsche',
    name: 'Friedrich Nietzsche',
    era: 'German, 1844–1900',
    domains: ['philosopher', 'philologist'],
    bio: 'German philosopher who interrogated values themselves — from morality to truth — and challenged readers to live without flinching.',
    source_url: 'https://en.wikiquote.org/wiki/Friedrich_Nietzsche',
  },
  {
    slug: 'vincent-van-gogh',
    name: 'Vincent van Gogh',
    era: 'Dutch, 1853–1890',
    domains: ['painter'],
    bio: 'Dutch post-impressionist painter. Sold one painting in his lifetime, made 2,100 of them, and changed how the world sees colour and light.',
    source_url: 'https://en.wikiquote.org/wiki/Vincent_van_Gogh',
  },
  {
    slug: 'leonardo-da-vinci',
    name: 'Leonardo da Vinci',
    era: 'Italian, 1452–1519',
    domains: ['polymath', 'painter', 'inventor'],
    bio: 'Italian Renaissance polymath. Painter, scientist, engineer, anatomist — a working argument for the worth of relentless curiosity.',
    source_url: 'https://en.wikiquote.org/wiki/Leonardo_da_Vinci',
  },
  {
    slug: 'william-shakespeare',
    name: 'William Shakespeare',
    era: 'English, 1564–1616',
    domains: ['playwright', 'poet'],
    bio: 'Wrote 39 plays and 154 sonnets and shaped the English language more than any single writer before or since.',
    source_url: 'https://en.wikiquote.org/wiki/William_Shakespeare',
  },
  {
    slug: 'rumi',
    name: 'Rumi',
    era: 'Persian, 1207–1273',
    domains: ['poet', 'mystic', 'sufi'],
    bio: 'Thirteenth-century Persian Sufi poet whose verses on love, longing, and the divine remain — eight centuries on — the world\'s most-read poetry.',
    source_url: 'https://en.wikiquote.org/wiki/Jalal_ad-Din_Muhammad_Rumi',
  },
  {
    slug: 'einstein',
    name: 'Albert Einstein',
    era: 'German-American, 1879–1955',
    domains: ['physicist'],
    bio: 'Theoretical physicist who reshaped our understanding of space, time, and gravity. His public letters reveal a humanist to match the scientist.',
    source_url: 'https://en.wikiquote.org/wiki/Albert_Einstein',
  },
  {
    slug: 'jane-austen',
    name: 'Jane Austen',
    era: 'English, 1775–1817',
    domains: ['novelist'],
    bio: 'English novelist of manners whose six novels are a masterclass in observing what people actually do, dressed as romantic comedies.',
    source_url: 'https://en.wikiquote.org/wiki/Jane_Austen',
  },
];

export const figureBySlug = (slug: string) => FIGURES.find((f) => f.slug === slug);
