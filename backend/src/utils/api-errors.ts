import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiResponse } from '@nestjs/swagger'

export class ApiErrorDto {
  @ApiProperty({ example: 400 })
  statusCode: number

  @ApiProperty({
    example: 'Bad Request',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[]

  @ApiProperty({ required: false, example: 'Bad Request' })
  error?: string
}

/** Declares the standard Nest error responses for every route of a controller. */
export function ApiErrors() {
  return applyDecorators(
    ApiResponse({ status: 400, description: 'Bad Request', type: ApiErrorDto }),
    ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorDto }),
    ApiResponse({ status: 403, description: 'Forbidden', type: ApiErrorDto }),
    ApiResponse({ status: 404, description: 'Not Found', type: ApiErrorDto }),
    ApiResponse({ status: 409, description: 'Conflict', type: ApiErrorDto }),
    ApiResponse({ status: 429, description: 'Too Many Requests', type: ApiErrorDto }),
    ApiResponse({ status: 500, description: 'Internal Server Error', type: ApiErrorDto }),
  )
}
