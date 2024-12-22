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

export interface CreateUserDTO {
  /** @example "Joe" */
  username: string;
  /** @example "Doe" */
  password: string;
  /** @example "USER" */
  role: string;
}

export interface LoginDTO {
  /** @example "Joe" */
  username: string;
  /** @example "Doe" */
  password: string;
}

export interface UpdateUserDTO {
  /** @example 1 */
  id: number;
  /** @example "NotJoe" */
  username: string;
  /** @example "NotDoe" */
  password: string;
  /** @example "ADMIN" */
  role: string;
}

export enum RolesEnum {
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface UserEntity {
  id: number;
  username: string;
  password: string;
  role: RolesEnum;
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

export interface GameEntity {
  id: number;
  title: string;
  person: PersonEntity;
  personId: number;
  type: TypesEnum;
  status: StatusesEnum;
  grade: GradeEnum;
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
 * @title le_xot`s lists
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
     * @tags auth
     * @name AuthControllerRegisterUser
     * @request POST:/auth/register
     */
    authControllerRegisterUser: (data: CreateUserDTO, params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/auth/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerLogin
     * @request POST:/auth/login
     */
    authControllerLogin: (data: LoginDTO, params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
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
     * @name UserControllerUpdateUser
     * @request PATCH:/users
     */
    userControllerUpdateUser: (data: UpdateUserDTO, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/users`,
        method: "PATCH",
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
     * @name UserControllerDeleteUser
     * @request DELETE:/users/{id}
     */
    userControllerDeleteUser: (id: number, params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/users/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UserControllerGetInfo
     * @request GET:/users/info
     */
    userControllerGetInfo: (params: RequestParams = {}) =>
      this.http.request<UserEntity, any>({
        path: `/users/info`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  admin = {
    /**
     * No description
     *
     * @tags admin
     * @name AdminControllerFindAll
     * @request GET:/admin/users
     */
    adminControllerFindAll: (params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/admin/users`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin
     * @name AdminControllerDeleteAll
     * @request DELETE:/admin/users
     */
    adminControllerDeleteAll: (params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/admin/users`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin
     * @name AdminControllerFindOne
     * @request GET:/admin/users/{username}
     */
    adminControllerFindOne: (username: string, params: RequestParams = {}) =>
      this.http.request<void, void>({
        path: `/admin/users/${username}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin
     * @name AdminControllerDeleteUser
     * @request DELETE:/admin/users/{username}
     */
    adminControllerDeleteUser: (
      username: string,
      query: {
        username: string;
      },
      params: RequestParams = {},
    ) =>
      this.http.request<void, void>({
        path: `/admin/users/${username}`,
        method: "DELETE",
        query: query,
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
      this.http.request<void, any>({
        path: `/videos`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags videos
     * @name VideoControllerGetAllVideos
     * @request GET:/videos
     */
    videoControllerGetAllVideos: (params: RequestParams = {}) =>
      this.http.request<VideoEntity[], any>({
        path: `/videos`,
        method: "GET",
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
      this.http.request<void, any>({
        path: `/videos/${id}`,
        method: "GET",
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
      this.http.request<void, any>({
        path: `/videos/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
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
      this.http.request<void, any>({
        path: `/games`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags games
     * @name GameControllerGetAllGames
     * @request GET:/games
     */
    gameControllerGetAllGames: (params: RequestParams = {}) =>
      this.http.request<GameEntity[], any>({
        path: `/games`,
        method: "GET",
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
      this.http.request<void, any>({
        path: `/games/${id}`,
        method: "GET",
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
      this.http.request<void, any>({
        path: `/games/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
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
}
