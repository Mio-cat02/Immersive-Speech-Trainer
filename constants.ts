import { Persona, Topic } from './types';

export const PERSONAS: Persona[] = [
  {
    id: 'chloe',
    name: 'Chloe',
    avatar: 'https://picsum.photos/id/64/150/150',
    traits: ['Cheerful', 'Encouraging', 'Patient'],
    voiceName: 'Kore',
    color: 'from-pink-400 to-rose-500',
    systemPrompt: "You are Chloe, a cheerful and encouraging English tutor. You love to help beginners. You speak clearly and use simple CET-4 vocabulary. You are patient with mistakes.",
    minLevel: 1
  },
  {
    id: 'liam',
    name: 'Liam',
    avatar: 'https://picsum.photos/id/91/150/150',
    traits: ['Professional', 'Direct', 'Business-savvy'],
    voiceName: 'Fenrir',
    color: 'from-blue-500 to-indigo-600',
    systemPrompt: "You are Liam, a professional business English coach. You are polite but direct. You focus on efficiency and workplace communication. Keep vocabulary professional but accessible (CET-4/6).",
    minLevel: 3 // Unlocked at level 3
  },
  {
    id: 'maya',
    name: 'Maya',
    avatar: 'https://picsum.photos/id/338/150/150',
    traits: ['Witty', 'Curious', 'Fun'],
    voiceName: 'Puck',
    color: 'from-purple-400 to-fuchsia-600',
    systemPrompt: "You are Maya, a witty and curious friend. You like to make jokes and play word games. You are casual and use trendy but simple English idioms appropriate for CET-4 learners.",
    minLevel: 5 // Unlocked at level 5
  }
];

export const TOPICS: Topic[] = [
  // --- Daily ---
  {
    id: 'cafe_order',
    title: 'Ordering Coffee',
    category: 'Daily',
    emoji: '☕',
    description: 'Practice ordering your favorite drink and specific customizations.',
    initialPrompt: "Let's roleplay! I am the barista at a busy cafe. You are next in line. Ask me for a coffee.",
    minLevel: 1
  },
  {
    id: 'travel_help',
    title: 'Asking Directions',
    category: 'Daily',
    emoji: '🗺️',
    description: 'You are lost in a new city. Ask a stranger for help.',
    initialPrompt: "Excuse me! I see you looking at a map. I'm a local here, do you need help finding something?",
    minLevel: 1
  },

  // --- Social Media ---
  {
    id: 'social_trends',
    title: 'Viral Trends',
    category: 'Social Media',
    emoji: '🔥',
    description: 'Discuss the latest viral videos, challenges, and news.',
    initialPrompt: "Have you seen that new viral video everyone is talking about today? It's crazy!",
    minLevel: 2
  },
  {
    id: 'internet_slang',
    title: 'Internet Slang',
    category: 'Social Media',
    emoji: '📱',
    description: 'Learn to use words like "Rizz", "Cap", "Ghosting" in context.',
    initialPrompt: "I feel like internet slang changes every week. Do you know what 'Rizz' means? Can you explain it to me?",
    minLevel: 2
  },

  // --- Professional ---
  {
    id: 'job_interview',
    title: 'Self Introduction',
    category: 'Professional',
    emoji: '💼',
    description: 'Master the art of introducing yourself in a professional setting.',
    initialPrompt: "Let's start a mock interview. I am the hiring manager. Please briefly introduce yourself.",
    minLevel: 3
  },
  {
    id: 'content_creation',
    title: 'Being an Influencer',
    category: 'Social Media',
    emoji: '🤳',
    description: 'Roleplay as a content creator planning your next post.',
    initialPrompt: "We need to plan our next Instagram post to get more followers. Do you have any creative ideas?",
    minLevel: 3
  },

  // --- Books & Stories ---
  {
    id: 'collab_story',
    title: 'Story Relay',
    category: 'Books & Stories',
    emoji: '📖',
    description: 'We write a story together. One sentence each!',
    initialPrompt: "Let's write a story together! I'll start, then you add the next sentence. 'Once upon a time, in a floating city above the clouds, a young pilot found a mysterious key...'",
    minLevel: 4
  },
  
  // --- Academic / Learning ---
  {
    id: 'japanese_culture',
    title: 'Japanese Culture',
    category: 'Academic',
    emoji: '⛩️',
    description: 'Discuss language learning, anime, and cultural differences.',
    initialPrompt: "I'm interested in learning Japanese. Do you watch anime? That's how I started learning about the culture.",
    minLevel: 4
  },
  {
    id: 'psychology_101',
    title: 'Psychology',
    category: 'Academic',
    emoji: '🧠',
    description: 'Talk about human behavior, habits, and the mind.',
    initialPrompt: "I was reading about 'confirmation bias' today. It's fascinating how we only look for info that agrees with us. What do you think about that?",
    minLevel: 5
  },
  {
    id: 'logic_puzzles',
    title: 'Logic & Reason',
    category: 'Academic',
    emoji: '🧩',
    description: 'Solve riddles and discuss logical fallacies.',
    initialPrompt: "Let's test your logic. If all roses are flowers, and some flowers fade quickly, does it mean all roses fade quickly?",
    minLevel: 6
  },
  
  // --- Game ---
  {
    id: 'would_you_rather',
    title: 'Would You Rather?',
    category: 'Game',
    emoji: '🤔',
    description: 'A fun game of difficult choices to practice comparative sentences.',
    initialPrompt: "Let's play 'Would You Rather'! I'll give you two options, and you tell me which one you prefer and why. Ready?",
    minLevel: 1
  },
    {
    id: 'genre_wars',
    title: 'Genre Wars',
    category: 'Books & Stories',
    emoji: '⚔️',
    description: 'Sci-Fi vs Fantasy? Mystery vs Romance? Let\'s debate.',
    initialPrompt: "I personally love Science Fiction because it explores the future. But many people prefer Fantasy. Which do you prefer?",
    minLevel: 2
  },
  {
    id: 'cs_basics',
    title: 'Computer Science',
    category: 'Academic',
    emoji: '💻',
    description: 'Discuss algorithms, coding bugs, and tech stacks.',
    initialPrompt: "I'm stuck on this coding bug. Do you prefer Python or JavaScript for building web apps? Why?",
    minLevel: 5
  },
  {
    id: 'ai_tech',
    title: 'AI & Future',
    category: 'Academic',
    emoji: '🤖',
    description: 'Debate the impact of LLMs and Artificial Intelligence.',
    initialPrompt: "Do you think Artificial Intelligence will replace creative jobs in the future, or just help us be more productive?",
    minLevel: 6
  },
  {
    id: 'book_club',
    title: 'Book Club',
    category: 'Books & Stories',
    emoji: '📚',
    description: 'Discuss your favorite books, genres, and authors.',
    initialPrompt: "Welcome to the Book Club! What is the best book you've read recently, and why did you like it?",
    minLevel: 2
  },
];
