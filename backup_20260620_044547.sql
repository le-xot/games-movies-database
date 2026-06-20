--
-- PostgreSQL database dump
--

\restrict 3rNmyNDCIUEdjtVcqPUpO3fd2LglTzYozakoMJHhF6EA0zPKlPCA4UCloVYV0BP

-- Dumped from database version 17.8 (Debian 17.8-1.pgdg13+1)
-- Dumped by pg_dump version 17.8 (Debian 17.8-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: LimitType; Type: TYPE; Schema: public; Owner: le_xot
--

CREATE TYPE public."LimitType" AS ENUM (
    'SUGGESTION'
);


ALTER TYPE public."LimitType" OWNER TO le_xot;

--
-- Name: RecordGenre; Type: TYPE; Schema: public; Owner: le_xot
--

CREATE TYPE public."RecordGenre" AS ENUM (
    'GAME',
    'MOVIE',
    'ANIME',
    'CARTOON',
    'SERIES'
);


ALTER TYPE public."RecordGenre" OWNER TO le_xot;

--
-- Name: RecordGrade; Type: TYPE; Schema: public; Owner: le_xot
--

CREATE TYPE public."RecordGrade" AS ENUM (
    'DISLIKE',
    'BEER',
    'LIKE',
    'RECOMMEND'
);


ALTER TYPE public."RecordGrade" OWNER TO le_xot;

--
-- Name: RecordStatus; Type: TYPE; Schema: public; Owner: le_xot
--

CREATE TYPE public."RecordStatus" AS ENUM (
    'QUEUE',
    'PROGRESS',
    'DROP',
    'UNFINISHED',
    'DONE',
    'NOTINTERESTED'
);


ALTER TYPE public."RecordStatus" OWNER TO le_xot;

--
-- Name: RecordType; Type: TYPE; Schema: public; Owner: le_xot
--

CREATE TYPE public."RecordType" AS ENUM (
    'WRITTEN',
    'SUGGESTION',
    'AUCTION',
    'ORDER'
);


ALTER TYPE public."RecordType" OWNER TO le_xot;

--
-- Name: ThirdPartService; Type: TYPE; Schema: public; Owner: le_xot
--

CREATE TYPE public."ThirdPartService" AS ENUM (
    'SPOTIFY'
);


ALTER TYPE public."ThirdPartService" OWNER TO le_xot;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: le_xot
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO le_xot;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: le_xot
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO le_xot;

--
-- Name: auctions_history; Type: TABLE; Schema: public; Owner: le_xot
--

CREATE TABLE public.auctions_history (
    id integer NOT NULL,
    "winnerId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.auctions_history OWNER TO le_xot;

--
-- Name: auctions_history_id_seq; Type: SEQUENCE; Schema: public; Owner: le_xot
--

CREATE SEQUENCE public.auctions_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auctions_history_id_seq OWNER TO le_xot;

--
-- Name: auctions_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: le_xot
--

ALTER SEQUENCE public.auctions_history_id_seq OWNED BY public.auctions_history.id;


--
-- Name: likes; Type: TABLE; Schema: public; Owner: le_xot
--

CREATE TABLE public.likes (
    id text NOT NULL,
    "userId" text NOT NULL,
    "recordId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.likes OWNER TO le_xot;

--
-- Name: limits; Type: TABLE; Schema: public; Owner: le_xot
--

CREATE TABLE public.limits (
    name public."LimitType" NOT NULL,
    quantity integer DEFAULT 5 NOT NULL
);


ALTER TABLE public.limits OWNER TO le_xot;

--
-- Name: records; Type: TABLE; Schema: public; Owner: le_xot
--

CREATE TABLE public.records (
    id integer NOT NULL,
    title text NOT NULL,
    link text NOT NULL,
    "posterUrl" text NOT NULL,
    status public."RecordStatus" DEFAULT 'QUEUE'::public."RecordStatus",
    type public."RecordType" DEFAULT 'WRITTEN'::public."RecordType",
    genre public."RecordGenre",
    grade public."RecordGrade",
    episode text,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.records OWNER TO le_xot;

--
-- Name: records_id_seq; Type: SEQUENCE; Schema: public; Owner: le_xot
--

CREATE SEQUENCE public.records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.records_id_seq OWNER TO le_xot;

--
-- Name: records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: le_xot
--

ALTER SEQUENCE public.records_id_seq OWNED BY public.records.id;


--
-- Name: suggestion_rules; Type: TABLE; Schema: public; Owner: le_xot
--

CREATE TABLE public.suggestion_rules (
    genre public."RecordGenre" NOT NULL,
    permission boolean DEFAULT true NOT NULL
);


ALTER TABLE public.suggestion_rules OWNER TO le_xot;

--
-- Name: third_part_oauth_service_tokens; Type: TABLE; Schema: public; Owner: le_xot
--

CREATE TABLE public.third_part_oauth_service_tokens (
    id integer NOT NULL,
    service public."ThirdPartService" NOT NULL,
    "accessToken" text NOT NULL,
    "refreshToken" text NOT NULL,
    "obtainedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.third_part_oauth_service_tokens OWNER TO le_xot;

--
-- Name: third_part_oauth_service_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: le_xot
--

CREATE SEQUENCE public.third_part_oauth_service_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.third_part_oauth_service_tokens_id_seq OWNER TO le_xot;

--
-- Name: third_part_oauth_service_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: le_xot
--

ALTER SEQUENCE public.third_part_oauth_service_tokens_id_seq OWNED BY public.third_part_oauth_service_tokens.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: le_xot
--

CREATE TABLE public.users (
    id text NOT NULL,
    login text NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    "profileImageUrl" text NOT NULL,
    color text DEFAULT '#333333'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users OWNER TO le_xot;

--
-- Name: auctions_history id; Type: DEFAULT; Schema: public; Owner: le_xot
--

ALTER TABLE ONLY public.auctions_history ALTER COLUMN id SET DEFAULT nextval('public.auctions_history_id_seq'::regclass);


--
-- Name: records id; Type: DEFAULT; Schema: public; Owner: le_xot
--

ALTER TABLE ONLY public.records ALTER COLUMN id SET DEFAULT nextval('public.records_id_seq'::regclass);


--
-- Name: third_part_oauth_service_tokens id; Type: DEFAULT; Schema: public; Owner: le_xot
--

ALTER TABLE ONLY public.third_part_oauth_service_tokens ALTER COLUMN id SET DEFAULT nextval('public.third_part_oauth_service_tokens_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: le_xot
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
a33cbe7a-66d3-44a1-ae81-0d6ee089e040	5e9b6ab6145254667f61d0cd859e14abec5e66cf77b297503167b893f455575b	2025-12-11 23:37:24.138782+00	20250512085829_	\N	\N	2025-12-11 23:37:24.114997+00	1
e944a4f7-de16-41bb-a400-3b714560adfd	b466c304ee0246aa6f2bb15b85233d1d88c69dab575268a40bb32af927fcc416	2025-12-11 23:37:24.165729+00	20250519125407_	\N	\N	2025-12-11 23:37:24.14541+00	1
4f94a5ef-297b-41cd-b88d-4ae053ac2bc0	65a625d6e13569207e3d9019335e9b1fe41c4336f1a76cf9bef6df0f5bd0945e	2025-12-11 23:37:24.193388+00	20250519150422_	\N	\N	2025-12-11 23:37:24.172446+00	1
d810c084-4376-4573-b164-1cfe1dd71421	cb81920172370ed627524a8a5e1f612cfb716246521b3f85b59248ccb5a027b2	2025-12-11 23:37:24.221483+00	20250523140821_	\N	\N	2025-12-11 23:37:24.200172+00	1
414e924b-ea2a-4ce4-973d-fccc53d10627	535af1d89e2d6861cc53a228cb38d20e9bf9f8a06a935b89953e5e64ff3a176e	2025-12-11 23:37:24.24799+00	20250817152716_	\N	\N	2025-12-11 23:37:24.228122+00	1
cce10914-5631-4a5b-aaf9-cefc816ecb30	709341a5a8a178de484419310403e96c837022ac84a48ca20d9819601f08e0d5	2025-12-11 23:37:24.276357+00	20251112142208_add_likes_to_records	\N	\N	2025-12-11 23:37:24.254621+00	1
\.


--
-- Data for Name: auctions_history; Type: TABLE DATA; Schema: public; Owner: le_xot
--

COPY public.auctions_history (id, "winnerId", "createdAt") FROM stdin;
\.


--
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: le_xot
--

COPY public.likes (id, "userId", "recordId", "createdAt") FROM stdin;
\.


--
-- Data for Name: limits; Type: TABLE DATA; Schema: public; Owner: le_xot
--

COPY public.limits (name, quantity) FROM stdin;
SUGGESTION	3
\.


--
-- Data for Name: records; Type: TABLE DATA; Schema: public; Owner: le_xot
--

COPY public.records (id, title, link, "posterUrl", status, type, genre, grade, episode, "userId", "createdAt") FROM stdin;
1	Крутой парень	https://www.kinopoisk.ru/film/3885	https://kinopoiskapiunofficial.tech/images/posters/kp/3885.jpg	QUEUE	WRITTEN	MOVIE	\N	\N	1263747798	2025-12-16 11:49:24.981
14	Назови меня своим именем	https://www.kinopoisk.ru/film/979148	https://kinopoiskapiunofficial.tech/images/posters/kp/no-poster.png	QUEUE	SUGGESTION	MOVIE	\N	\N	803598403	2026-04-05 08:55:57.479
10	Сопрано	https://www.kinopoisk.ru/series/79848	https://kinopoiskapiunofficial.tech/images/posters/kp/79848.jpg	QUEUE	SUGGESTION	SERIES	\N	\N	1263747798	2026-02-21 10:44:55.576
9	Машина времени	https://www.kinopoisk.ru/film/8109	https://kinopoiskapiunofficial.tech/images/posters/kp/8109.jpg	QUEUE	WRITTEN	MOVIE	\N	\N	1263747798	2026-02-21 10:43:39.905
5	Достать ножи: Воскрешение покойника	https://www.imdb.com/title/tt14364480	https://image.tmdb.org/t/p/w500/sPHInA04JUQsv3wXW23fHPdvVC0.jpg	UNFINISHED	WRITTEN	MOVIE	\N	\N	1263747798	2025-12-16 12:52:12.079
13	Молодой Шерлок	https://www.kinopoisk.ru/series/5591410	https://kinopoiskapiunofficial.tech/images/posters/kp/5591410.jpg	DONE	WRITTEN	SERIES	BEER	\N	1263747798	2026-04-04 05:18:30.547
11	Бей эйс! Финальная стадия	https://shikimori.one/animes/312	https://shikimori.io/uploads/poster/animes/312/a791e24e3ab25905c2d1e641a0572766.jpeg	UNFINISHED	WRITTEN	ANIME	\N	\N	1263747798	2026-02-21 10:46:18.132
15	Копы в глубоком запасе	https://www.kinopoisk.ru/film/462466	https://kinopoiskapiunofficial.tech/images/posters/kp/462466.jpg	QUEUE	SUGGESTION	MOVIE	\N	\N	1263747798	2026-04-05 08:56:38.196
16	57 секунд	https://www.kinopoisk.ru/film/4946926	https://kinopoiskapiunofficial.tech/images/posters/kp/4946926.jpg	QUEUE	SUGGESTION	MOVIE	\N	\N	1263747798	2026-04-05 09:21:05.871
12	Никто	https://www.kinopoisk.ru/film/1309596	https://kinopoiskapiunofficial.tech/images/posters/kp/1309596.jpg	QUEUE	WRITTEN	MOVIE	LIKE	\N	1263747798	2026-04-04 05:16:55.198
\.


--
-- Data for Name: suggestion_rules; Type: TABLE DATA; Schema: public; Owner: le_xot
--

COPY public.suggestion_rules (genre, permission) FROM stdin;
GAME	t
MOVIE	t
ANIME	t
CARTOON	t
SERIES	t
\.


--
-- Data for Name: third_part_oauth_service_tokens; Type: TABLE DATA; Schema: public; Owner: le_xot
--

COPY public.third_part_oauth_service_tokens (id, service, "accessToken", "refreshToken", "obtainedAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: le_xot
--

COPY public.users (id, login, role, "profileImageUrl", color, "createdAt") FROM stdin;
803598403	JetBrainsNerdFont	ADMIN	https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png	#333333	2025-12-11 23:37:42.469
test-user-qa-001	qa_test_user	USER	https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png	#333333	2026-04-05 01:55:52.797
1263747798	etonelexot	ADMIN	https://static-cdn.jtvnw.net/jtv_user_pictures/9db47314-fffc-44e6-bd4f-48bd89b5f49e-profile_image-300x300.png	#333333	2025-12-16 11:46:38.639
\.


--
-- Name: auctions_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: le_xot
--

SELECT pg_catalog.setval('public.auctions_history_id_seq', 1, true);


--
-- Name: records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: le_xot
--

SELECT pg_catalog.setval('public.records_id_seq', 53, true);


--
-- Name: third_part_oauth_service_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: le_xot
--

SELECT pg_catalog.setval('public.third_part_oauth_service_tokens_id_seq', 1, false);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: le_xot
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: auctions_history auctions_history_pkey; Type: CONSTRAINT; Schema: public; Owner: le_xot
--

ALTER TABLE ONLY public.auctions_history
    ADD CONSTRAINT auctions_history_pkey PRIMARY KEY (id);


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: le_xot
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- Name: records records_pkey; Type: CONSTRAINT; Schema: public; Owner: le_xot
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT records_pkey PRIMARY KEY (id);


--
-- Name: third_part_oauth_service_tokens third_part_oauth_service_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: le_xot
--

ALTER TABLE ONLY public.third_part_oauth_service_tokens
    ADD CONSTRAINT third_part_oauth_service_tokens_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: le_xot
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: likes_userId_recordId_key; Type: INDEX; Schema: public; Owner: le_xot
--

CREATE UNIQUE INDEX "likes_userId_recordId_key" ON public.likes USING btree ("userId", "recordId");


--
-- Name: limits_name_key; Type: INDEX; Schema: public; Owner: le_xot
--

CREATE UNIQUE INDEX limits_name_key ON public.limits USING btree (name);


--
-- Name: records_title_idx; Type: INDEX; Schema: public; Owner: le_xot
--

CREATE INDEX records_title_idx ON public.records USING btree (title);


--
-- Name: suggestion_rules_genre_key; Type: INDEX; Schema: public; Owner: le_xot
--

CREATE UNIQUE INDEX suggestion_rules_genre_key ON public.suggestion_rules USING btree (genre);


--
-- Name: third_part_oauth_service_tokens_service_key; Type: INDEX; Schema: public; Owner: le_xot
--

CREATE UNIQUE INDEX third_part_oauth_service_tokens_service_key ON public.third_part_oauth_service_tokens USING btree (service);


--
-- Name: users_id_key; Type: INDEX; Schema: public; Owner: le_xot
--

CREATE UNIQUE INDEX users_id_key ON public.users USING btree (id);


--
-- Name: users_id_login_idx; Type: INDEX; Schema: public; Owner: le_xot
--

CREATE INDEX users_id_login_idx ON public.users USING btree (id, login);


--
-- Name: users_login_key; Type: INDEX; Schema: public; Owner: le_xot
--

CREATE UNIQUE INDEX users_login_key ON public.users USING btree (login);


--
-- Name: auctions_history auctions_history_winnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: le_xot
--

ALTER TABLE ONLY public.auctions_history
    ADD CONSTRAINT "auctions_history_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES public.records(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: likes likes_recordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: le_xot
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT "likes_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES public.records(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: likes likes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: le_xot
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: records records_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: le_xot
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT "records_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 3rNmyNDCIUEdjtVcqPUpO3fd2LglTzYozakoMJHhF6EA0zPKlPCA4UCloVYV0BP

