import { ThirdPartService } from '@/enums';

export interface SpotifyTokenDomain {
  id: number;
  service: ThirdPartService;
  accessToken: string;
  refreshToken: string;
  obtainedAt: Date;
  expiresAt: Date;
}
