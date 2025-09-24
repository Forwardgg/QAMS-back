--
-- PostgreSQL database dump
--

\restrict cF1IhiT3QHWaU9XgjLyutpuIenfg5cynVJSx0dhGcJUytzLcZs0mNOt8RBQFcRn

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-09-23 19:06:28

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16653)
-- Name: course_outcomes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_outcomes (
    co_id integer NOT NULL,
    course_id integer,
    co_number character varying(10) NOT NULL,
    description text NOT NULL
);


ALTER TABLE public.course_outcomes OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16652)
-- Name: course_outcomes_co_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_outcomes_co_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_outcomes_co_id_seq OWNER TO postgres;

--
-- TOC entry 4984 (class 0 OID 0)
-- Dependencies: 221
-- Name: course_outcomes_co_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_outcomes_co_id_seq OWNED BY public.course_outcomes.co_id;


--
-- TOC entry 220 (class 1259 OID 16638)
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    course_id integer NOT NULL,
    code character varying(20) NOT NULL,
    title character varying(150) NOT NULL,
    ltp_structure character varying(10) NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16637)
-- Name: courses_course_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.courses_course_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_course_id_seq OWNER TO postgres;

--
-- TOC entry 4985 (class 0 OID 0)
-- Dependencies: 219
-- Name: courses_course_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.courses_course_id_seq OWNED BY public.courses.course_id;


--
-- TOC entry 230 (class 1259 OID 16734)
-- Name: logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logs (
    log_id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    details text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.logs OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16733)
-- Name: logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logs_log_id_seq OWNER TO postgres;

--
-- TOC entry 4986 (class 0 OID 0)
-- Dependencies: 229
-- Name: logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.logs_log_id_seq OWNED BY public.logs.log_id;


--
-- TOC entry 228 (class 1259 OID 16711)
-- Name: moderation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.moderation (
    moderation_id integer NOT NULL,
    question_id integer,
    moderator_id integer,
    status character varying(20) DEFAULT 'pending'::character varying,
    comments text,
    version integer DEFAULT 1,
    reviewed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT moderation_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.moderation OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16710)
-- Name: moderation_moderation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.moderation_moderation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.moderation_moderation_id_seq OWNER TO postgres;

--
-- TOC entry 4987 (class 0 OID 0)
-- Dependencies: 227
-- Name: moderation_moderation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.moderation_moderation_id_seq OWNED BY public.moderation.moderation_id;


--
-- TOC entry 226 (class 1259 OID 16696)
-- Name: options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.options (
    option_id integer NOT NULL,
    question_id integer,
    option_text text NOT NULL,
    is_correct boolean DEFAULT false
);


ALTER TABLE public.options OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16695)
-- Name: options_option_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.options_option_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.options_option_id_seq OWNER TO postgres;

--
-- TOC entry 4988 (class 0 OID 0)
-- Dependencies: 225
-- Name: options_option_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.options_option_id_seq OWNED BY public.options.option_id;


--
-- TOC entry 224 (class 1259 OID 16669)
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    question_id integer NOT NULL,
    course_id integer,
    author_id integer,
    question_type character varying(20) NOT NULL,
    content text NOT NULL,
    co_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT questions_question_type_check CHECK (((question_type)::text = ANY ((ARRAY['mcq'::character varying, 'subjective'::character varying])::text[])))
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16668)
-- Name: questions_question_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.questions_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.questions_question_id_seq OWNER TO postgres;

--
-- TOC entry 4989 (class 0 OID 0)
-- Dependencies: 223
-- Name: questions_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.questions_question_id_seq OWNED BY public.questions.question_id;


--
-- TOC entry 218 (class 1259 OID 16625)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'instructor'::character varying, 'moderator'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16624)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 4990 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4776 (class 2604 OID 16656)
-- Name: course_outcomes co_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_outcomes ALTER COLUMN co_id SET DEFAULT nextval('public.course_outcomes_co_id_seq'::regclass);


--
-- TOC entry 4774 (class 2604 OID 16641)
-- Name: courses course_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses ALTER COLUMN course_id SET DEFAULT nextval('public.courses_course_id_seq'::regclass);


--
-- TOC entry 4786 (class 2604 OID 16737)
-- Name: logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs ALTER COLUMN log_id SET DEFAULT nextval('public.logs_log_id_seq'::regclass);


--
-- TOC entry 4782 (class 2604 OID 16714)
-- Name: moderation moderation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderation ALTER COLUMN moderation_id SET DEFAULT nextval('public.moderation_moderation_id_seq'::regclass);


--
-- TOC entry 4780 (class 2604 OID 16699)
-- Name: options option_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.options ALTER COLUMN option_id SET DEFAULT nextval('public.options_option_id_seq'::regclass);


--
-- TOC entry 4777 (class 2604 OID 16672)
-- Name: questions question_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions ALTER COLUMN question_id SET DEFAULT nextval('public.questions_question_id_seq'::regclass);


--
-- TOC entry 4772 (class 2604 OID 16628)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 4970 (class 0 OID 16653)
-- Dependencies: 222
-- Data for Name: course_outcomes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_outcomes (co_id, course_id, co_number, description) FROM stdin;
1	1	CO1	Updated description for CO1
\.


--
-- TOC entry 4968 (class 0 OID 16638)
-- Dependencies: 220
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (course_id, code, title, ltp_structure, created_by, created_at) FROM stdin;
1	CSE101	Introduction to Programming	3-1-0	1	2025-09-22 20:57:13.135395
\.


--
-- TOC entry 4978 (class 0 OID 16734)
-- Dependencies: 230
-- Data for Name: logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logs (log_id, user_id, action, details, created_at) FROM stdin;
1	1	LOGIN	instructor 1 logged in	2025-09-22 20:50:55.792848
2	1	ADD_COURSE	instructor 1 created course CSE101	2025-09-22 20:57:13.135395
3	1	ADD_COURSE	instructor 1 created course CSE201	2025-09-22 20:58:00.22868
4	1	LOGIN	instructor 1 logged in	2025-09-22 21:07:55.372627
5	1	ADD_CO	Added CO1 to course 1	2025-09-22 21:08:53.782772
6	1	ADD_CO	Added CO2 to course 1	2025-09-22 21:50:26.020097
7	1	UPDATE_CO	Updated CO 1	2025-09-22 21:56:09.750064
8	1	DELETE_CO	Deleted CO 10	2025-09-22 21:56:46.054619
9	1	LOGIN	instructor 1 logged in	2025-09-22 22:09:50.232298
10	1	LOGIN	instructor 1 logged in	2025-09-22 22:18:42.186482
11	1	UPDATE_COURSE	Updated course 2	2025-09-22 22:19:36.681123
12	1	DELETE_COURSE	Deleted course 2	2025-09-22 22:20:29.510207
13	1	LOGIN	instructor 1 logged in	2025-09-22 23:02:16.322783
14	1	ADD_QUESTION	instructor 1 added subjective Q1	2025-09-22 23:06:45.587882
15	1	ADD_QUESTION	instructor 1 added MCQ Q2	2025-09-22 23:07:07.799307
16	1	LOGIN	instructor 1 logged in	2025-09-22 23:19:46.22792
17	2	LOGIN	moderator 2 logged in	2025-09-22 23:19:56.000819
18	2	MODERATION	Reviewed question 1 → approved	2025-09-22 23:20:14.393374
19	2	LOGIN	moderator 2 logged in	2025-09-23 14:56:16.55923
20	1	LOGIN	instructor 1 logged in	2025-09-23 14:58:10.627977
\.


--
-- TOC entry 4976 (class 0 OID 16711)
-- Dependencies: 228
-- Data for Name: moderation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.moderation (moderation_id, question_id, moderator_id, status, comments, version, reviewed_at) FROM stdin;
1	1	2	approved	Looks good	1	2025-09-22 23:20:14.387368
\.


--
-- TOC entry 4974 (class 0 OID 16696)
-- Dependencies: 226
-- Data for Name: options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.options (option_id, question_id, option_text, is_correct) FROM stdin;
1	2	Stack	f
2	2	Queue	t
3	2	Tree	f
\.


--
-- TOC entry 4972 (class 0 OID 16669)
-- Dependencies: 224
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.questions (question_id, course_id, author_id, question_type, content, co_id, created_at, updated_at) FROM stdin;
1	1	1	subjective	Explain the concept of normalization in databases.	1	2025-09-22 23:06:45.587882	2025-09-22 23:06:45.587882
2	1	1	mcq	Which of the following data structures uses FIFO?	1	2025-09-22 23:07:07.799307	2025-09-22 23:07:07.799307
\.


--
-- TOC entry 4966 (class 0 OID 16625)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, name, email, password_hash, role, created_at) FROM stdin;
1	Rohit1	rohit1@gmail.com	$2b$10$Q.tW333l6OjvCUhQiNENhupXNyHiXgjNJrGYZxTWGIVR9GQjXjjWy	instructor	2025-09-22 20:48:10.868088
2	Rohit2	rohit2@gmail.com	$2b$10$B3yWmaR7ZmADW0dSHWIFI.n2i7peVAJXDONg05ZFTURGdAZSXgYtu	moderator	2025-09-22 20:49:13.004008
3	Rohit3	rohit3@gmail.com	$2b$10$T4Dn5dTCQCyzIAq8YEV19./Irro9te1nfXnrsTIVojrK8o1ZfePJW	admin	2025-09-22 20:49:27.511265
\.


--
-- TOC entry 4991 (class 0 OID 0)
-- Dependencies: 221
-- Name: course_outcomes_co_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_outcomes_co_id_seq', 10, true);


--
-- TOC entry 4992 (class 0 OID 0)
-- Dependencies: 219
-- Name: courses_course_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.courses_course_id_seq', 2, true);


--
-- TOC entry 4993 (class 0 OID 0)
-- Dependencies: 229
-- Name: logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.logs_log_id_seq', 20, true);


--
-- TOC entry 4994 (class 0 OID 0)
-- Dependencies: 227
-- Name: moderation_moderation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.moderation_moderation_id_seq', 1, true);


--
-- TOC entry 4995 (class 0 OID 0)
-- Dependencies: 225
-- Name: options_option_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.options_option_id_seq', 3, true);


--
-- TOC entry 4996 (class 0 OID 0)
-- Dependencies: 223
-- Name: questions_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.questions_question_id_seq', 2, true);


--
-- TOC entry 4997 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 3, true);


--
-- TOC entry 4800 (class 2606 OID 16662)
-- Name: course_outcomes course_outcomes_course_id_co_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_outcomes
    ADD CONSTRAINT course_outcomes_course_id_co_number_key UNIQUE (course_id, co_number);


--
-- TOC entry 4802 (class 2606 OID 16660)
-- Name: course_outcomes course_outcomes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_outcomes
    ADD CONSTRAINT course_outcomes_pkey PRIMARY KEY (co_id);


--
-- TOC entry 4796 (class 2606 OID 16646)
-- Name: courses courses_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_code_key UNIQUE (code);


--
-- TOC entry 4798 (class 2606 OID 16644)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (course_id);


--
-- TOC entry 4810 (class 2606 OID 16742)
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 4808 (class 2606 OID 16722)
-- Name: moderation moderation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderation
    ADD CONSTRAINT moderation_pkey PRIMARY KEY (moderation_id);


--
-- TOC entry 4806 (class 2606 OID 16704)
-- Name: options options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.options
    ADD CONSTRAINT options_pkey PRIMARY KEY (option_id);


--
-- TOC entry 4804 (class 2606 OID 16679)
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (question_id);


--
-- TOC entry 4792 (class 2606 OID 16636)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4794 (class 2606 OID 16634)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4812 (class 2606 OID 16663)
-- Name: course_outcomes course_outcomes_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_outcomes
    ADD CONSTRAINT course_outcomes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- TOC entry 4811 (class 2606 OID 16647)
-- Name: courses courses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 4819 (class 2606 OID 16743)
-- Name: logs logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 4817 (class 2606 OID 16728)
-- Name: moderation moderation_moderator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderation
    ADD CONSTRAINT moderation_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4818 (class 2606 OID 16723)
-- Name: moderation moderation_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderation
    ADD CONSTRAINT moderation_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 4816 (class 2606 OID 16705)
-- Name: options options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.options
    ADD CONSTRAINT options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 4813 (class 2606 OID 16685)
-- Name: questions questions_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 4814 (class 2606 OID 16690)
-- Name: questions questions_co_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_co_id_fkey FOREIGN KEY (co_id) REFERENCES public.course_outcomes(co_id) ON DELETE SET NULL;


--
-- TOC entry 4815 (class 2606 OID 16680)
-- Name: questions questions_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


-- Completed on 2025-09-23 19:06:28

--
-- PostgreSQL database dump complete
--

\unrestrict cF1IhiT3QHWaU9XgjLyutpuIenfg5cynVJSx0dhGcJUytzLcZs0mNOt8RBQFcRn

