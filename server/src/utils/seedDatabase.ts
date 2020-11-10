import { getConnection } from 'typeorm';
import seedData from '../../data/goodreads_cleaned.json';
import { Book } from '../entities/Book';
import { Author } from '../entities/Author';

/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Class for containing the pre-population methods
 * It assumes that the db doesn't already contain the data
 */
export class Seeder {
    authorMap: Map<string, Author>;

    isbn13Map: Map<string, Book>;

    constructor() {
        this.authorMap = new Map<string, Author>();
        this.isbn13Map = new Map<string, Book>();
    }

    /**
     * Iterates over the dataset and adds the authors, books and
     * the relations inbetween. Validates and updates against the sets
     * @param lastRow The number of rows (index) to include,
     * @param newSchema Boolean to determine if we should create a session table
     * -1 for the entire dataset
     */
    public async seedDatabase(lastRow = 1, newSchema = false) {
        if (newSchema) this.createSessionTable();

        for (const row of seedData.slice(0, lastRow)) {
            const { authors, ...bookProps } = row;
            const splittedAuthors: Author[] = [];

            // Create books and authors
            for (const author of authors.split('/')) {
                const newAuthor = await this.addOrGetAuthor(author);
                if (newAuthor) splittedAuthors.push(newAuthor);
            }
            this.createBook(bookProps, splittedAuthors);
        }

        // Batch insert books and book_authors - Split up because error on large queries
        for (let i = 0; i < 10000; i += 2500) {
            await Book.save([...this.isbn13Map.values()].slice(i, i + 2500))
                .then(() => console.log(`seeded ${i}-${i + 2500}`))
                .catch((err) => console.log('ERROR', err));
        }
        await Book.save([...this.isbn13Map.values()].slice(10000, -1))
            .then(() => console.log('Finished seeding the database.'))
            .catch((err) => console.log('ERROR', err));
    }

    /**
     * Creates the session table because the PG-simple does not automatically
     * create it if it's missing
     */
    private createSessionTable() {
        getConnection().createQueryRunner().query(`CREATE TABLE public.session (
            sid character varying PRIMARY KEY NOT NULL,
            sess json NOT NULL,
            expire timestamp(6) without time zone NOT NULL
            );`);
    }

    /**
     * Adds a book to the DB and returns the id, as well as adding it to the set
     * If the book is already inserted into the database, it returns null
     * @param bookProps The raw data to pre-populate the db with
     * @param authors Array of unsaved author objects
     */
    private createBook = (bookProps: Omit<typeof seedData[0], 'authors'>, authors: Author[]) => {
        const {
            title,
            isbn,
            isbn13,
            language_code,
            num_pages,
            publication_date,
            publisher,
            ratings_count
        } = bookProps;
        // Should not happen
        if (this.isbn13Map.has(`${isbn13}`)) return this.isbn13Map.get(`${isbn13}`) as Book;

        const newBook = Book.create({
            title: title.trim(),
            isbn: `${isbn}`,
            isbn13: `${isbn13}`,
            languageCode: language_code.trim(),
            numPages: num_pages,
            publicationDate: new Date(publication_date),
            publisher: publisher.trim(),
            goodreadsRatings: ratings_count,
            bookCoverUrl: `http://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
            authors
        });
        this.isbn13Map.set(`${isbn13}`, newBook);
        return newBook;
    };

    /**
     * Inserts an author into the database, returning the id and
     * adding the author to the validat/ignore set
     * @param author The name of the author
     * @returns null or number depending on successfull insert/retrieve of author
     */
    addOrGetAuthor = async (author: string) => {
        const firstName = author
            .split(' ')
            .slice(0, -1)
            .map((name) => name.trim())
            .join(' ');
        const lastName = author
            .split(' ')
            .slice(-1)
            .map((name) => name.trim())
            .join(' ')
            .trim();
        const trimmedName = `${firstName} ${lastName}`;
        if (this.authorMap.has(trimmedName)) {
            return this.authorMap.get(trimmedName) as Author;
        }
        // Save to db because need unique id
        const savedAuthor = await Author.create({ firstName, lastName }).save();
        this.authorMap.set(trimmedName, savedAuthor);
        return savedAuthor;
    };
}
