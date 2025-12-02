import { Injectable } from "@nestjs/common";
import path from 'node:path'
import { stat } from 'node:fs/promises'
import sharp from 'sharp'


@Injectable()
export class ImgService {
  async getImageContent(urlBase64: string) {
    const originalurl = Buffer.from(urlBase64, 'base64').toString('utf-8');

    const fileDiskPath = path.resolve(process.cwd(), 'images', urlBase64)

    const isFileExists = await stat(fileDiskPath).then(() => true).catch(() => false);
    if (isFileExists) {
      return {
        fileDiskPath,
        contentType: "image/webp",
      }
    }

    const fileContent = await fetch(originalurl).then(res => res.arrayBuffer());

    const imageBuffer = await sharp(fileContent)
      .resize(360, 540)
      .webp()
      .toBuffer();

    await Bun.write(fileDiskPath, imageBuffer);


    return {
      fileDiskPath,
      contentType: "image/webp",
    }
  }
}
