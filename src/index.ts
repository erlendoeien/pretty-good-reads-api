import 'dotenv-safe/config';
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import { Seeder } from './utils/seedDatabase';
import { Author } from './entities/Author';
import { Book } from './entities/Book';
import UserResolver from './resolvers/user';
import { BookResolver } from './resolvers/book';
import { ReviewResolver } from './resolvers/review';
import { __prod__ } from './constants';

const main = async (prePopulate = false) => {
    await createConnection({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        logging: !__prod__,
        //synchronize: true,
        entities: [`${__dirname}/entities/**/*.js`]
    });
    if (prePopulate) {
        await Book.delete({})
            .then(() => Author.delete({}))
            .then(() => {
                const seeder = new Seeder();
                seeder.seedDatabase(-1);
            });
    }

    var app = express();
    if (__prod__) {
        const { default: helmet } = await import('helmet');
        const { default: compression } = await import('compression');
        app.use(helmet());
        app.use(compression());
    }

    app.use(
        cors({
            // If in production, cors dynamically based on origin
            origin: __prod__ || process.env.CORS_ORIGIN,
            credentials: true
        })
    );

    const PGSession = connectPgSimple(session);
    app.use(
        session({
            store: new PGSession(),
            secret: process.env.COOKIE_SECRET,
            resave: false,
            cookie: {
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                httpOnly: !__prod__,
                sameSite: 'lax', // csrf
                secure: __prod__ // cookie only works in https
            },
            saveUninitialized: false
        })
    );

    const server = new ApolloServer({
        schema: await buildSchema({
            resolvers: [BookResolver, UserResolver, ReviewResolver],
            validate: false
        }),
        context: ({ req, res }) => ({
            req,
            res
        })
    });

    server.applyMiddleware({
        app,
        cors: false
    });
    const port = __prod__ ? 3000 : 4000;
    app.listen(port, () => {
        console.log(`🚀  Server ready at http://localhost:${port}`);
    });
};

main().catch((err) => {
    console.error(err);
});
