export const localCreators = [
  {
    id: "lauryncrl",
    slug: "lauryncrl",
    username: "lauryncrl",
    name: "Lauryn",
    price: 5.97,
    photos: [],
    avatar: "/lau.png",
    coverImage: "/lau.png",
    bio: "Créatrice de contenu…",
    personality: "Chaleureuse et spontanée, j'aime discuter de tout avec toi 😊",
    tags: ["Lifestyle", "Mode"],
    subscribers: 2500,
    messagesCount: 15000,
    mymLink: "https://mym.fans/Lauwyn?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAQ0xDSwOmoTVleHRuA2FlbQIxMQBzcnRjBmFwcF9pZA8xMjQwMjQ1NzQyODc0MTQAAaeuFZ5U6-NuaAP7UBrHFEUzC3HG2-vE1_ki3rmyKfRxzkMxhf59_Ah5XNAuXQ_aem_9gSnJ17LaEjmqW1nTmyNKg",
    onlyfansLink: null,
    imageY: "15%"
  },
  {
    id: "toomuclucile",
    slug: "toomuclucile",
    username: "toomuclucile",
    name: "Lucile",
    price: 6.97,
    photos: [],
    avatar: "/mon-avatar.png",
    coverImage: "/mon-chat.jpg",
    bio: "Fitness & lifestyle…",
    personality: "Motivante et énergique, je partage mes passions avec toi 💪",
    tags: ["Fitness", "Lifestyle"],
    subscribers: 3200,
    messagesCount: 18000,
    mymLink: null,
    onlyfansLink: null,
    imageY: "20%"
  },
  {
    id: "tootatis",
    slug: "tootatis",
    username: "tootatis",
    name: "Tootatis",
    price: 6.97,
    photos: [],
    avatar: "/toota_1.jpg",
    coverImage: "/toota_2.jpg",
    bio: "Influenceuse…",
    personality: "Complice et taquine, j'adore échanger avec toi 😏",
    tags: ["Influence", "Beauté"],
    subscribers: 3800,
    messagesCount: 22000,
    mymLink: null,
    onlyfansLink: null,
    imageY: "15%"
  }
];

export function getCreatorById(id: string) {
  return localCreators.find(c => c.id === id || c.slug === id);
}

export function getCreatorByUsername(username: string) {
  return localCreators.find(c => c.username === username || c.slug === username);
}

export const creators = localCreators;