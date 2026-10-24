const projectEntries = [
  { createdAt: '2026-05-05', title: 'XIAOBA', category: 'Personal Agent', label: 'PERSONAL AGENT', path: '/blog/xiaoba-cli-agent-os', text: '有记忆、会跟进、能做事的开源 Personal Agent。通过 CLI、飞书、微信或桌面持续对话，由专业角色接手代码、浏览器、桌面与文档工作，把结果带回原来的对话。', github: 'https://github.com/fightheyyy/XIAOBA', stack: 'Local-first · Memory · Role Agents · Agentic Eval', nodes: ['Conversation', 'Role Agents', 'Delivery'] },
  { createdAt: '2026-08-03', title: 'Catena', category: 'Agent Evolution Platform', label: 'AGENT EVOLUTION', path: '/blog/catena-edge-cloud-evolution', text: '把 Agent 进化拆成端和云：端侧运行并积累现场反馈，云侧组织评测与迭代，让真实任务里的经验进入下一轮改进。', github: 'https://github.com/fightheyyy/CATENA', stack: 'Edge / Cloud · Runtime · Evolution', nodes: ['Edge', 'Runtime', 'Cloud'] },
  { createdAt: '2025-11-05', title: 'GauzMem', category: 'Long-term Memory', label: 'LONG-TERM MEMORY', path: '/blog/gauzmem-three-path-memory', text: '给 Agent 检索到的记忆补上原文和上下文。沿着检索结果回到来源，让片段、原文与关联信息一起参与后续判断。', github: 'https://github.com/fightheyyy/gauzmem', stack: 'Memory · Retrieval · Context', nodes: ['Retrieve', 'Source', 'Context'] },
  { createdAt: '2026-07-09', title: 'Barena', category: 'Agentic Eval', label: 'RELEASE ENGINEERING', path: '/blog/barena-agent-release-ci', text: '让 Agent 的每次变更都带着旧版本一起接受评测。比较任务结果、行为轨迹和产物，判断改动是否有效、稳定，以及有没有引入回归。', github: 'https://github.com/fightheyyy/barena', stack: 'Evaluation · Evidence · Release CI', nodes: ['Change', 'Evaluate', 'Release'] },
  { createdAt: '2025-07-11', title: 'Vibe Writing Platform', category: 'Multi-agent Writing', label: 'WRITING WITH AGENTS', path: '', text: '围绕文档写作组织多个 Agent 的协作，把材料、写作过程和文档产物串起来。', github: 'https://github.com/buildsense-ai/GauzDocument-Agent', stack: 'Documents · Multi-agent · Writing', nodes: ['Sources', 'Agents', 'Document'] },
]

// Repository creation dates, newest first. All project views share this order.
export const projects = projectEntries
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  .map((project, index) => ({
    ...project,
    label: `${String(index + 1).padStart(2, '0')} / ${project.label}`,
  }))