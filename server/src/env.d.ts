declare namespace NodeJS {
    export interface ProcessEnv {
        DATABASE_URL: string;
        COOKIE_SECRET: string;
        CORS_ORIGIN: string;
    }
}
