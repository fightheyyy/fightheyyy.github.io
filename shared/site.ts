export const site = {
  name: 'Fightheyyy',
  wordmark: 'fightheyyy.dev',
  description:
    'I build Agent Runtime, evaluation, and continuous evolution infrastructure.',
  author: 'Fightheyyy',
  mainProject: {
    name: 'XIAOBA',
    url: 'https://github.com/fightheyyy/XIAOBA',
    description: '有记忆、会跟进、能做事的开源 Personal Agent。',
  },
  featuredPath: '/blog/voice-agent-embodied-harness',
  navigation: [
    { label: 'Home', key: 'H', to: '/' },
    { label: 'Blog', key: 'B', to: '/#blog' },
    { label: 'Projects', key: 'P', to: '/#projects' },
    { label: 'Terminal', key: 'T', to: '/terminal' },
  ],
  categories: ['Agents', 'Hardware', 'Evals', 'Skills'],
  showWorkbench: true,
  showSpaceFooter: true,
} as const
