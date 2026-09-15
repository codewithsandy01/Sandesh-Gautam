import { ModelOption, PersonaOption } from '../types';

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'SandY Flash Lite',
    description: 'High availability, instant latency, and resilient precision',
    tag: 'Recommended',
    icon: 'zap',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'SandY Flash 3.8',
    description: 'Advanced reasoning, deep math, and complex code logic',
    tag: 'Deep Reasoning',
    icon: 'sparkles',
  },
];

export const PERSONAS: PersonaOption[] = [
  {
    id: 'default',
    name: 'SandY Default',
    description: 'Direct, question-focused, accurate and deeply insightful',
    instruction:
      'You are SandY Intelligence. Deliver high-precision, question-based answers. Analyze the user\'s exact question and give the direct conclusion or solution immediately, followed by structured, step-by-step clarity. Answer in the same language as the user (Hindi, Hinglish, or English) without repeated self-introductions or conversational fluff.',
    icon: 'Sparkles',
  },
  {
    id: 'software-engineer',
    name: 'Lead Architect & Coder',
    description: 'Clean code, design patterns, debugging & architectures',
    instruction:
      'You are SandY Intelligence acting as a Principal Software Engineer. Provide exact, working code solutions directly addressing the programming question or bug, complete with edge cases and best practices.',
    icon: 'Code2',
  },
  {
    id: 'creative-writer',
    name: 'Creative Storyteller & Copywriter',
    description: 'Engaging narratives, captivating copywriting & brainstorming',
    instruction:
      'You are SandY Intelligence acting as a creative writer and copywriter. Jump directly into compelling prose, stories, and copywriting tailored precisely to the user\'s creative prompt.',
    icon: 'PenTool',
  },
  {
    id: 'concise-analyst',
    name: 'Executive & Concise',
    description: 'Bullet-point summaries, zero fluff, straight to the point',
    instruction:
      'You are SandY Intelligence acting as an executive analyst. Answer the question in crisp, high-impact bullet points with zero preamble or conversational filler.',
    icon: 'Zap',
  },
  {
    id: 'tutor',
    name: 'Socratic Tutor',
    description: 'Step-by-step conceptual mastery and intuitive mental models',
    instruction:
      'You are SandY Intelligence acting as an intuitive academic tutor. Break down the user\'s question with crystal-clear explanations, real-world analogies, and step-by-step mastery.',
    icon: 'GraduationCap',
  },
];

export const PROMPT_SUGGESTIONS = [
  {
    title: 'Explain Quantum Computing',
    subtitle: 'in simple terms with real-world analogies',
    prompt: 'Explain quantum computing and superposition to a curious beginner using real-world analogies.',
    category: 'Learn',
  },
  {
    title: 'Write a Custom React Hook',
    subtitle: 'useLocalStorage with TypeScript and type safety',
    prompt: 'Write a robust, production-ready useLocalStorage custom React hook with TypeScript, window storage event sync, and error handling.',
    category: 'Code',
  },
  {
    title: 'Brainstorm Brand Names',
    subtitle: 'for an eco-friendly smart home device',
    prompt: 'Brainstorm 10 catchy, modern brand names and matching taglines for an eco-friendly smart home IoT device. Explain the vibe for each.',
    category: 'Creative',
  },
  {
    title: 'Analyze Business Strategy',
    subtitle: 'SWOT analysis for launching a subscription SaaS',
    prompt: 'Conduct a thorough SWOT analysis for launching an AI-powered micro-SaaS productivity tool in 2026. Include distribution strategies.',
    category: 'Plan',
  },
];
