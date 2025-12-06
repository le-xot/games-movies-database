import { Buffer } from "node:buffer"
import { stat } from "node:fs/promises"
import { Controller, Get, Query, Res } from "@nestjs/common"
import { ImgService } from "./img.service"
import type { Response } from "express"

@Controller("img")
export class ImgController {
  constructor(private readonly imgService: ImgService) {}

  @Get()
  async getImageContent(@Query("urlEncoded") urlEncoded: string, @Res() res: Response) {
    const { fileDiskPath, contentType } = await this.imgService.getImageContent(urlEncoded)

    const fileStats = await stat(fileDiskPath)

    res.setHeader("Content-Type", contentType)
    res.setHeader("Content-Length", fileStats.size.toString())
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
    res.setHeader("ETag", `"${urlEncoded}"`)

    const file = Bun.file(fileDiskPath)

    const bunStream = file.stream()
    const response = new Response(bunStream)

    const buffer = await response.arrayBuffer()
    res.end(Buffer.from(buffer))
  }
}
