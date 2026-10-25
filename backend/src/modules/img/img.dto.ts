export enum ImgVariant {
  POSTER = 'poster',
  AVATAR = 'avatar',
}

export class GetImageQueryDTO {
  urlEncoded!: string

  variant?: ImgVariant
}
