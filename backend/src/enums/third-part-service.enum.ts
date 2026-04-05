export const ThirdPartService = {
  SPOTIFY: 'SPOTIFY',
} as const

export type ThirdPartService = (typeof ThirdPartService)[keyof typeof ThirdPartService]
