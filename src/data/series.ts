export const series = [
  {
    slug: "100-days-of-learning-ai",
    title: "100 Days of Learning AI",
    hashtag: "#100DaysOfLearningAI",
    description:
      "One new thing. One honest note. Every day. A learning-in-public journey through artificial intelligence, from the fundamentals to small experiments.",
    target: 100,
    category: "Learning",
    status: "Starting soon",
    introPost: "/posts/a-decade-in-tech-learning-ai/",
  },
] as const;

export const categories = [
  {
    name: "Learning",
    slug: "learning",
    description:
      "New ideas, small discoveries, and things that finally clicked.",
  },
  {
    name: "Building",
    slug: "building",
    description: "Experiments, projects, and notes from making things.",
  },
  {
    name: "Thoughts",
    slug: "thoughts",
    description: "Ideas I'm working through, out loud.",
  },
] as const;
