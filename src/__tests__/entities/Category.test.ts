import { createConnection, getConnection } from 'typeorm';
import { Author } from '../../entities/Author';
import { Book } from '../../entities/Book';
import { Review } from '../../entities/Review';
import { User } from '../../entities/User';
import { Category } from '../../entities/Category';

beforeEach(() => {
    console.log(__dirname);
    return createConnection({
        type: 'sqlite',
        database: ':memory:',
        dropSchema: true,
        entities: [Category, User, Review, Author, Book],
        // entities: ['../../entities/*.ts'],
        synchronize: true,
        logging: false
    });
});

afterEach(() => {
    const conn = getConnection();
    return conn.close();
});

test('Validate connection', () => {
    const conn = getConnection();
    expect(conn.isConnected).toBeTruthy();
});

describe('Fetching category', () => {
    test('should store and fetch category', async () => {
        expect.assertions(1);
        Category.insert({ categoryName: 'storedCategory' });
        Category.findOneOrFail({
            where: {
                id: 1
            }
        })
            .then((category) => expect(category!.categoryName).toBe('storedCategory'))
            .catch((err) => fail(err));
    });

    test('should not find category', () => {
        expect.assertions(1);
        Category.findOneOrFail({
            where: {
                id: 1
            }
        }).catch((err) => {
            expect(err).toBeInstanceOf(Error);
        });
    });
});
