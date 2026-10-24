// Small, muted variations of XiaoBa's original golden coat.
export const xiaobaLooks = {
  agents: { tips: '#735637', gold: '#BD914D', cream: '#EBD3A1', eyes: '#303D2D', pose: 'waiting' },
  hardware: { tips: '#794A35', gold: '#BB7952', cream: '#E9BE93', eyes: '#382B27', pose: 'running' },
  evals: { tips: '#4E6251', gold: '#8DA184', cream: '#CDD6B6', eyes: '#283A30', pose: 'review' },
  skills: { tips: '#425F79', gold: '#7F9EBA', cream: '#C5D8E2', eyes: '#233A4B', pose: 'waving' },
} as const
export type XiaobaLook = keyof typeof xiaobaLooks
export function articleCat(category: string): XiaobaLook {
  const key = category.toLowerCase()
  return key in xiaobaLooks ? key as XiaobaLook : 'agents'
}
