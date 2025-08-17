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

export interface UserEntity {
  id: string;
  login: string;
  role: string;
  profileImageUrl: string;
  color: string;
  /** @format date-time */
  createdAt: string;
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
  user?: UserEntity | null;
  /** @format date-time */
  createdAt: string;
}

export interface UserCreateByLoginDTO {
  /**
   * Unique login of the user
   * @example "john_doe"
   */
  login: string;
}

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export interface UserUpdateDTO {
  /** @example "john_doe" */
  login?: string;
  /**
   * @default "USER"
   * @example "USER"
   */
  role?: UserRole;
  /** @example "https://example.com/image.jpg" */
  profileImageUrl?: string;
  /** @example "#333333" */
  color?: string;
}

export interface SuggestionCreateByTwirDTO {
  /** @example "12345" */
  userId: string;
  /** @example "https://shikimori.one/animes/1943-paprika" */
  link: string;
}

export interface UserSuggestionDTO {
  /** @example "https://shikimori.one/animes/1943-paprika" */
  link: string;
}

export interface CallbackDto {
  code: string;
}

export enum RecordStatus {
  QUEUE = "QUEUE",
  PROGRESS = "PROGRESS",
  DROP = "DROP",
  NOTINTERESTED = "NOTINTERESTED",
  UNFINISHED = "UNFINISHED",
  DONE = "DONE",
}

export enum RecordType {
  WRITTEN = "WRITTEN",
  SUGGESTION = "SUGGESTION",
  AUCTION = "AUCTION",
  ORDER = "ORDER",
}

export interface RecordCreateFromLinkDTO {
  /** @example "https://example.com/record" */
  link: string;
  /** @example "QUEUE" */
  status?: RecordStatus;
  /** @example "WRITTEN" */
  type?: RecordType;
}

export enum RecordGrade {
  DISLIKE = "DISLIKE",
  BEER = "BEER",
  LIKE = "LIKE",
  RECOMMEND = "RECOMMEND",
}

export interface RecordUpdateDTO {
  /** @example "PROGRESS" */
  status?: RecordStatus;
  /** @example "LIKE" */
  grade?: RecordGrade;
  /** @example "S01E01" */
  episode?: string;
  /** @example "WRITTEN" */
  type?: RecordType;
  /** @example "1" */
  userId?: string;
}

export enum RecordGenre {
  GAME = "GAME",
  MOVIE = "MOVIE",
  ANIME = "ANIME",
  CARTOON = "CARTOON",
  SERIES = "SERIES",
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

export interface QueueItemDto {
  title: string;
  login: string | null;
  link: string;
  type: RecordType | null;
  genre: RecordGenre | null;
}

export interface QueueDto {
  games: QueueItemDto[];
  videos: QueueItemDto[];
}

/** @example "id" */
export enum RecordControllerGetAllRecordsParamsOrderByEnum {
  Id = "id",
  Title = "title",
}

/** @example "asc" */
export enum RecordControllerGetAllRecordsParamsDirectionEnum {
  Asc = "asc",
  Desc = "desc",
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

  auction = {
    /**
     * No description
     *
     * @tags auction
     * @name AuctionControllerGetAuctions
     * @request GET:/auction
     */
    auctionControllerGetAuctions: (params: RequestParams = {}) =>
      this.http.request<RecordEntity[], any>({
        path: `/auction`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags auction
     * @name AuctionControllerGetWinner
     * @request GET:/auction/winner
     */
    auctionControllerGetWinner: (
      query: {
        id: number;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<RecordEntity, any>({
        path: `/auction/winner`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
  users = {
    /**
     * No description
     *
     * @tags users
     * @name UserControllerCreateUserByLogin
     * @request POST:/users/login
     */
    userControllerCreateUserByLogin: (data: UserCreateByLoginDTO, params: RequestParams = {}) =>
      this.http.request<UserEntity, any>({
        path: `/users/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UserControllerGetAllUsers
     * @request GET:/users/users
     */
    userControllerGetAllUsers: (params: RequestParams = {}) =>
      this.http.request<UserEntity[], any>({
        path: `/users/users`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UserControllerGetUserRecords
     * @request GET:/users/user-records
     */
    userControllerGetUserRecords: (
      query: {
        login: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<RecordEntity[], any>({
        path: `/users/user-records`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UserControllerPatchUser
     * @request POST:/users/{id}
     */
    userControllerPatchUser: (id: string, data: UserUpdateDTO, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/users/${id}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
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
  twir = {
    /**
     * No description
     *
     * @tags Twir
     * @name TwirControllerCreateSuggestionWithTwir
     * @request POST:/twir/suggestion
     */
    twirControllerCreateSuggestionWithTwir: (data: SuggestionCreateByTwirDTO, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/twir/suggestion`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),
  };
  suggestions = {
    /**
     * No description
     *
     * @tags suggestions
     * @name SuggestionControllerGetSuggestions
     * @request GET:/suggestions
     */
    suggestionControllerGetSuggestions: (params: RequestParams = {}) =>
      this.http.request<RecordEntity[], any>({
        path: `/suggestions`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags suggestions
     * @name SuggestionControllerUserSuggest
     * @request POST:/suggestions
     */
    suggestionControllerUserSuggest: (data: UserSuggestionDTO, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/suggestions`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags suggestions
     * @name SuggestionControllerDeleteUserSuggestion
     * @request DELETE:/suggestions/{id}
     */
    suggestionControllerDeleteUserSuggestion: (id: number, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/suggestions/${id}`,
        method: "DELETE",
        ...params,
      }),
  };
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

    /**
     * No description
     *
     * @tags Spotify
     * @name SpotifyControllerGetAuthLink
     * @request GET:/auth/spotify
     */
    spotifyControllerGetAuthLink: (params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/auth/spotify`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Spotify
     * @name SpotifyControllerPerformAuthorization
     * @request POST:/auth/spotify
     */
    spotifyControllerPerformAuthorization: (
      query: {
        code: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<void, any>({
        path: `/auth/spotify`,
        method: "POST",
        query: query,
        ...params,
      }),
  };
  records = {
    /**
     * No description
     *
     * @tags records
     * @name RecordControllerCreateRecordFromLink
     * @request POST:/records/link
     */
    recordControllerCreateRecordFromLink: (data: RecordCreateFromLinkDTO, params: RequestParams = {}) =>
      this.http.request<RecordEntity, any>({
        path: `/records/link`,
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
     * @name RecordControllerCreateRecord
     * @request POST:/records
     */
    recordControllerCreateRecord: (data: number, params: RequestParams = {}) =>
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
      query?: {
        /** @example 1 */
        id?: number;
        /** @example "My Record" */
        title?: string;
        /** @example "https://example.com/record" */
        link?: string;
        /** @example "https://example.com/poster.jpg" */
        posterUrl?: string;
        status?: RecordStatus;
        type?: RecordType;
        genre?: RecordGenre;
        grade?: RecordGrade;
        /** @example "S01E01" */
        episode?: string;
        /** @example "1" */
        userId?: string;
        /** @example "minecraft" */
        search?: string;
        /** @example 1 */
        page?: number;
        /** @example 10 */
        limit?: number;
        /** @example "id" */
        orderBy?: RecordControllerGetAllRecordsParamsOrderByEnum;
        /** @example "asc" */
        direction?: RecordControllerGetAllRecordsParamsDirectionEnum;
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
    recordControllerPatchRecord: (id: number, data: RecordUpdateDTO, params: RequestParams = {}) =>
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
  queue = {
    /**
     * No description
     *
     * @tags Queue
     * @name QueueControllerGetQueue
     * @request GET:/queue
     */
    queueControllerGetQueue: (params: RequestParams = {}) =>
      this.http.request<QueueDto, any>({
        path: `/queue`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  weather = {
    /**
     * No description
     *
     * @tags weather
     * @name WeatherControllerGetWeather
     * @request GET:/weather
     */
    weatherControllerGetWeather: (params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/weather`,
        method: "GET",
        ...params,
      }),
  };
}
