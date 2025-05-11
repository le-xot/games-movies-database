/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface CallbackDto {
  code: string;
}

export interface UserEntity {
  id: string;
  login: string;
  role: string;
  profileImageUrl: string;
  color: string;
  /** @format date-time */
  createdAt: string;
}

export interface UserUpsertDto {
  /**
   * Unique login of the user
   * @example "john_doe"
   */
  login: string;
  /**
   * Role of the user
   * @default "USER"
   */
  role?: UserUpsertDtoRoleEnum;
  /**
   * URL of the user profile image
   * @example "https://example.com/image.jpg"
   */
  profileImageUrl: string;
  /**
   * Hex color code for user profile
   * @example "#333333"
   */
  color?: string;
}

export interface RecordUpsertDTO {
  /**
   * Title of the record
   * @example "My Record"
   */
  title: string;
  /**
   * URL of the record
   * @example "https://example.com/record"
   */
  link: string;
  /**
   * URL of the record poster
   * @example "https://example.com/poster.jpg"
   */
  posterUrl: string;
  /**
   * Status of the record
   * @default "QUEUE"
   */
  status?: RecordUpsertDtoStatusEnum;
  /**
   * Type of the record
   * @default "HANDWRITTEN"
   */
  type?: RecordUpsertDtoTypeEnum;
  /** Genre of the record */
  genre?: RecordUpsertDtoGenreEnum;
  /** Grade of the record */
  grade?: RecordUpsertDtoGradeEnum;
  /**
   * Episode identifier
   * @example "S01E01"
   */
  episode?: string;
  /**
   * ID of the associated user
   * @example "user123"
   */
  userId?: string;
}

export interface RecordEntity {
  id: number;
  title: string;
  link: string;
  posterUrl: string;
  status: string;
  type: string;
  genre: string;
  grade: string;
  episode: string;
  userId: string;
  /** @format date-time */
  createdAt: string;
}

export interface GetAllRecordsDTO {
  records: RecordEntity[];
  total: number;
}

export enum LimitType {
  SUGGESTION = "SUGGESTION",
}

export interface ChangeLimitDTO {
  name: LimitType;
  /**
   * Limit quantity
   * @example 5
   */
  quantity: number;
}

export interface LimitEntity {
  name: LimitType;
  quantity: number;
}

/**
 * Role of the user
 * @default "USER"
 */
export enum UserUpsertDtoRoleEnum {
  USER = "USER",
  ADMIN = "ADMIN",
}

/**
 * Status of the record
 * @default "QUEUE"
 */
export enum RecordUpsertDtoStatusEnum {
  QUEUE = "QUEUE",
  PROGRESS = "PROGRESS",
  DROP = "DROP",
  UNFINISHED = "UNFINISHED",
  DONE = "DONE",
}

/**
 * Type of the record
 * @default "HANDWRITTEN"
 */
export enum RecordUpsertDtoTypeEnum {
  HANDWRITTEN = "HANDWRITTEN",
  SUGGESTION = "SUGGESTION",
  AUCTION = "AUCTION",
  ORDER = "ORDER",
}

/** Genre of the record */
export enum RecordUpsertDtoGenreEnum {
  GAME = "GAME",
  MOVIE = "MOVIE",
  ANIME = "ANIME",
  CARTOON = "CARTOON",
  SERIES = "SERIES",
}

/** Grade of the record */
export enum RecordUpsertDtoGradeEnum {
  DISLIKE = "DISLIKE",
  BEER = "BEER",
  LIKE = "LIKE",
  RECOMMEND = "RECOMMEND",
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (securityData: SecurityDataType | null) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter((key) => "undefined" !== typeof query[key]);
    return keys
      .map((key) => (Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key)))
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string") ? JSON.stringify(input) : input,
    [ContentType.Text]: (input: any) => (input !== null && typeof input !== "string" ? JSON.stringify(input) : input),
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(`${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`, {
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
      },
      signal: (cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal) || null,
      body: typeof body === "undefined" || body === null ? null : payloadFormatter(body),
    }).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title games-movies-database
 * @version 1.0.0
 * @contact
 */
export class Api<SecurityDataType extends unknown> {
  http: HttpClient<SecurityDataType>;

  constructor(http: HttpClient<SecurityDataType>) {
    this.http = http;
  }

  auth = {
    /**
     * No description
     *
     * @tags Auth
     * @name AuthControllerTwitchAuth
     * @request GET:/auth/twitch
     */
    authControllerTwitchAuth: (params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/auth/twitch`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthControllerTwitchAuthCallback
     * @request POST:/auth/twitch/callback
     */
    authControllerTwitchAuthCallback: (data: CallbackDto, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/auth/twitch/callback`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthControllerMe
     * @request GET:/auth/me
     */
    authControllerMe: (params: RequestParams = {}) =>
      this.http.request<UserEntity, any>({
        path: `/auth/me`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthControllerLogout
     * @request POST:/auth/logout
     */
    authControllerLogout: (params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/auth/logout`,
        method: "POST",
        ...params,
      }),
  };
  users = {
    /**
     * No description
     *
     * @tags users
     * @name UserControllerCreateOrUpdateUser
     * @request POST:/users
     */
    userControllerCreateOrUpdateUser: (data: string, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/users`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UserControllerGetAllUsers
     * @request GET:/users
     */
    userControllerGetAllUsers: (params: RequestParams = {}) =>
      this.http.request<UserEntity[], any>({
        path: `/users`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UserControllerGetUserByTwitchId
     * @request GET:/users/{id}
     */
    userControllerGetUserByTwitchId: (id: string, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/users/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UserControllerDeleteUser
     * @request DELETE:/users/{id}
     */
    userControllerDeleteUser: (id: string, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/users/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UserControllerGetUserByLogin
     * @request GET:/users/{login}
     */
    userControllerGetUserByLogin: (login: string, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/users/${login}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UserControllerDeleteUserByLogin
     * @request DELETE:/users/{login}
     */
    userControllerDeleteUserByLogin: (login: string, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/users/${login}`,
        method: "DELETE",
        ...params,
      }),
  };
  records = {
    /**
     * No description
     *
     * @tags records
     * @name RecordControllerCreateRecord
     * @request POST:/records
     */
    recordControllerCreateRecord: (data: RecordUpsertDTO, params: RequestParams = {}) =>
      this.http.request<RecordEntity, any>({
        path: `/records`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags records
     * @name RecordControllerGetAllRecords
     * @request GET:/records
     */
    recordControllerGetAllRecords: (
      query: {
        id: number;
        title: string;
        link: string;
        posterUrl: string;
        /** @example "PROGRESS" */
        status: string;
        /** @example "HANDWRITTEN" */
        type: string;
        /** @example "GAME" */
        genre: string;
        /** @example "LIKE" */
        grade: string;
        episode: string;
        /** @example 1 */
        userId: string;
        /** @format date-time */
        createdAt: string;
        /** @example "minecraft" */
        search?: string;
        /** @example 1 */
        page?: number;
        /** @example 10 */
        limit?: number;
        /** @example "id" */
        orderBy?: string;
        /** @example "asc" */
        direction?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<GetAllRecordsDTO, any>({
        path: `/records`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags records
     * @name RecordControllerFindRecordById
     * @request GET:/records/{id}
     */
    recordControllerFindRecordById: (id: number, params: RequestParams = {}) =>
      this.http.request<RecordEntity, void>({
        path: `/records/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags records
     * @name RecordControllerPatchRecord
     * @request PATCH:/records/{id}
     */
    recordControllerPatchRecord: (id: number, data: RecordUpsertDTO, params: RequestParams = {}) =>
      this.http.request<RecordEntity, any>({
        path: `/records/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags records
     * @name RecordControllerDeleteRecord
     * @request DELETE:/records/{id}
     */
    recordControllerDeleteRecord: (id: number, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/records/${id}`,
        method: "DELETE",
        ...params,
      }),
  };
  limits = {
    /**
     * No description
     *
     * @tags limits
     * @name LimitControllerChangeLimit
     * @request POST:/limits
     */
    limitControllerChangeLimit: (data: ChangeLimitDTO, params: RequestParams = {}) =>
      this.http.request<LimitEntity, any>({
        path: `/limits`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
