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

export enum RolesEnum {
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface UserEntity {
  id: string;
  login: string;
  role: RolesEnum;
  profileImageUrl: string;
  /** @format date-time */
  createdAt: string;
}

export interface UpsertUserDTO {
  /** @example "le_xot" */
  login: string;
  /** @example "155644238" */
  id: string;
  /** @example "USER" */
  role: string;
  /** @example "le_xot" */
  profileImageUrl: string;
}

export interface CreatePersonDTO {
  /** @example "le_xot" */
  name: string;
  /** @example "#333333" */
  color?: string;
}

export interface PersonEntity {
  name: string;
  id: number;
  color: string;
}

export interface PatchPersonDTO {
  /** @example "le_xot" */
  name?: string;
  /** @example "#333333" */
  color?: string;
}

export interface CreateVideoDTO {
  /** @example "Мадагаскар" */
  title?: string;
  /** @example 1 */
  personId?: number;
  /** @example "FREE" */
  type?: string;
  /** @example "PROGRESS" */
  status?: string;
  /** @example "CARTOON" */
  genre?: string;
  /** @example "DISLIKE" */
  grade?: string;
}

export enum TypesEnum {
  PAID = "PAID",
  FREE = "FREE",
}

export enum StatusesEnum {
  QUEUE = "QUEUE",
  DONE = "DONE",
  PROGRESS = "PROGRESS",
  UNFINISHED = "UNFINISHED",
  DROP = "DROP",
}

export enum GenresEnum {
  ANIME = "ANIME",
  MOVIE = "MOVIE",
  CARTOON = "CARTOON",
  SERIES = "SERIES",
}

export enum GradeEnum {
  RECOMMEND = "RECOMMEND",
  LIKE = "LIKE",
  BEER = "BEER",
  DISLIKE = "DISLIKE",
}

export interface VideoEntity {
  id: number;
  title: string;
  person: PersonEntity;
  personId: number;
  type: TypesEnum;
  status: StatusesEnum;
  genre: GenresEnum;
  grade: GradeEnum;
}

export interface PatchVideoDTO {
  /** @example "Боб строитель" */
  title?: string;
  /** @example 1 */
  personId?: number;
  /** @example "FREE" */
  type?: string;
  /** @example "DONE" */
  status?: string;
  /** @example "MOVIE" */
  genre?: string;
  /** @example "DISLIKE" */
  grade?: string;
}

export interface GetAllVideosResponse {
  videos: VideoEntity[];
  total: number;
}

export interface CreateGameDTO {
  /** @example "minecraft" */
  title?: string;
  /** @example 1 */
  personId?: number;
  /** @example "FREE" */
  type?: string;
  /** @example "PROGRESS" */
  status?: string;
  /** @example "LIKE" */
  grade?: string;
}

export interface GameEntity {
  id: number;
  title: string;
  person: PersonEntity;
  personId: number;
  type: TypesEnum;
  status: StatusesEnum;
  grade: GradeEnum;
}

export interface PatchGameDTO {
  /** @example "Dota 2" */
  title?: string;
  /** @example 1 */
  personId?: number;
  /** @example "FREE" */
  type?: string;
  /** @example "DONE" */
  status?: string;
  /** @example "DISLIKE" */
  grade?: string;
}

export interface GetAllGamesResponse {
  games: GameEntity[];
  total: number;
}

export interface QueueItemDto {
  title: string;
  type: string;
  personName: string | null;
  genre: QueueItemDtoGenreEnum;
}

export interface QueueDto {
  games: QueueItemDto[];
  videos: QueueItemDto[];
}

export enum QueueItemDtoGenreEnum {
  ANIME = "ANIME",
  MOVIE = "MOVIE",
  CARTOON = "CARTOON",
  SERIES = "SERIES",
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
    userControllerCreateOrUpdateUser: (data: UpsertUserDTO, params: RequestParams = {}) =>
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
  };
  persons = {
    /**
     * No description
     *
     * @tags persons
     * @name PersonControllerCreatePerson
     * @request POST:/persons
     */
    personControllerCreatePerson: (data: CreatePersonDTO, params: RequestParams = {}) =>
      this.http.request<PersonEntity, any>({
        path: `/persons`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags persons
     * @name PersonControllerGetAllPersons
     * @request GET:/persons
     */
    personControllerGetAllPersons: (params: RequestParams = {}) =>
      this.http.request<PersonEntity[], any>({
        path: `/persons`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags persons
     * @name PersonControllerDeletePersonById
     * @request DELETE:/persons/{id}
     */
    personControllerDeletePersonById: (id: number, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/persons/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags persons
     * @name PersonControllerPatchPerson
     * @request PATCH:/persons/{id}
     */
    personControllerPatchPerson: (id: number, data: PatchPersonDTO, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/persons/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags persons
     * @name PersonControllerFindPersonById
     * @request GET:/persons/{id}
     */
    personControllerFindPersonById: (id: number, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/persons/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags persons
     * @name PersonControllerDeletePersonByName
     * @request DELETE:/persons/{name}
     */
    personControllerDeletePersonByName: (name: string, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/persons/${name}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags persons
     * @name PersonControllerFindPersonByName
     * @request GET:/persons/{name}
     */
    personControllerFindPersonByName: (name: string, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/persons/${name}`,
        method: "GET",
        ...params,
      }),
  };
  videos = {
    /**
     * No description
     *
     * @tags videos
     * @name VideoControllerCreateVideo
     * @request POST:/videos
     */
    videoControllerCreateVideo: (data: CreateVideoDTO, params: RequestParams = {}) =>
      this.http.request<VideoEntity, any>({
        path: `/videos`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags videos
     * @name VideoControllerGetAllVideos
     * @request GET:/videos
     */
    videoControllerGetAllVideos: (
      query?: {
        /** @example 1 */
        page?: number;
        /** @example 10 */
        limit?: number;
        /** @example "Мадагаскар" */
        search?: string;
        /** @example 1 */
        personId?: number;
        /** @example "FREE" */
        type?: string;
        /** @example "PROGRESS" */
        status?: string;
        /** @example "CARTOON" */
        genre?: string;
        /** @example "LIKE" */
        grade?: string;
        /** @example "id" */
        orderBy?: string;
        /** @example "asc" */
        direction?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<GetAllVideosResponse, any>({
        path: `/videos`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags videos
     * @name VideoControllerFindVideoById
     * @request GET:/videos/{id}
     */
    videoControllerFindVideoById: (id: number, params: RequestParams = {}) =>
      this.http.request<VideoEntity, void>({
        path: `/videos/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags videos
     * @name VideoControllerPatchVideo
     * @request PATCH:/videos/{id}
     */
    videoControllerPatchVideo: (id: number, data: PatchVideoDTO, params: RequestParams = {}) =>
      this.http.request<VideoEntity, any>({
        path: `/videos/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags videos
     * @name VideoControllerDeleteVideo
     * @request DELETE:/videos/{id}
     */
    videoControllerDeleteVideo: (id: number, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/videos/${id}`,
        method: "DELETE",
        ...params,
      }),
  };
  games = {
    /**
     * No description
     *
     * @tags games
     * @name GameControllerCreateGame
     * @request POST:/games
     */
    gameControllerCreateGame: (data: CreateGameDTO, params: RequestParams = {}) =>
      this.http.request<GameEntity, any>({
        path: `/games`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags games
     * @name GameControllerGetAllGames
     * @request GET:/games
     */
    gameControllerGetAllGames: (
      query?: {
        /** @example 1 */
        page?: number;
        /** @example 10 */
        limit?: number;
        /** @example "minecraft" */
        search?: string;
        /** @example 1 */
        personId?: number;
        /** @example "FREE" */
        type?: string;
        /** @example "PROGRESS" */
        status?: string;
        /** @example "LIKE" */
        grade?: string;
        /** @example "id" */
        orderBy?: string;
        /** @example "asc" */
        direction?: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<GetAllGamesResponse, any>({
        path: `/games`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags games
     * @name GameControllerFindGameById
     * @request GET:/games/{id}
     */
    gameControllerFindGameById: (id: number, params: RequestParams = {}) =>
      this.http.request<GameEntity, void>({
        path: `/games/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags games
     * @name GameControllerPatchGame
     * @request PATCH:/games/{id}
     */
    gameControllerPatchGame: (id: number, data: PatchGameDTO, params: RequestParams = {}) =>
      this.http.request<GameEntity, any>({
        path: `/games/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags games
     * @name GameControllerDeleteGame
     * @request DELETE:/games/{id}
     */
    gameControllerDeleteGame: (id: number, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/games/${id}`,
        method: "DELETE",
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
