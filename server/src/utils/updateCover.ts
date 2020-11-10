import { Book } from '../entities/Book';

/**
 * Method to store the book cover urls using the OpenLibrary API
 * @param books Array of books
 * @param size The specified size of the image
 */
const updateCover = (books: Book[], size = 'S') => {
    books.forEach(async (book) => {
        if (!book.bookCoverUrl)
            await Book.update(
                { isbn: book.isbn },
                { bookCoverUrl: `http://covers.openlibrary.org/b/isbn/${book.isbn}-${size}.jpg` }
            );
    });
    console.log('Updated all');
};

export default updateCover;
