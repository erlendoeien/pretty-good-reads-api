import {
    Resolver,
    Query,
    Arg,
    Int,
    ObjectType,
    Field,
    InputType,
    FieldResolver,
    Root,
    Ctx,
    Float
} from 'type-graphql';
import { MyContext } from '../types';
import { Review } from '../entities/Review';
import { Book } from '../entities/Book';
import { mapOptionsToFindOptions } from '../utils/filterAndSortUtils';
import { FilterInput, SortInput } from './SortAndFilterOptions';
import { getRepository, SelectQueryBuilder } from 'typeorm';

@ObjectType()
class PaginatedBooks {
    @Field(() => [Book])
    books: Book[];

    @Field()
    totalCount: number;
}

@InputType()
class PaginatedBooksInput {
    @Field()
    limit: number;

    @Field({ defaultValue: 0 })
    offset: number;

    @Field(() => [SortInput])
    sort: SortInput[];

    @Field({ nullable: true })
    searchQuery: string;

    @Field(() => [FilterInput])
    filter: FilterInput[];
}

@Resolver(Book)
export class BookResolver {
    @FieldResolver(() => Review, { nullable: true })
    yourReview(@Root() book: Book, @Ctx() { req }: MyContext) {
        if (req.session.userId == null) {
            return null;
        }

        const yourReview: Review = book.reviews.filter(
            (review) => review.reviewedById === req.session.userId
        )[0];
        return yourReview;
    }

    @FieldResolver(() => Float, { nullable: true })
    averageRating(@Root() book: Book) {
        const ratingSum = book.reviews.reduce(
            (currentValue, review) => currentValue + review.rating,
            0
        );

        return book.reviews.length ? ratingSum / book.reviews.length : null;
    }

    @Query(() => PaginatedBooks)
    async books(
        @Arg('options', () => PaginatedBooksInput) options: PaginatedBooksInput
    ): Promise<PaginatedBooks> {
        const { limit, offset, filter, sort, searchQuery } = options;
        const [sortOptions, { filterStatement, filterParameters }] = mapOptionsToFindOptions(
            sort,
            filter
        );

        // Custom SQL to match for search
        // Could be included in filterOptions
        const searchMatchString = `"Book"."title" ~ :searchQuery OR
                            Book_authors.firstName ~ :searchQuery OR
                            "Book"."isbn" ~ :searchQuery OR
                            "Book"."isbn13" ~ :searchQuery OR Book_authors.lastName ~ :searchQuery`;
        const searchMatchParameters = { searchQuery };

        // Concatenate search + filter
        const isFilter = filterStatement.length > 0;
        const completeWhereStatement = isFilter
            ? `${searchMatchString} AND ${filterStatement}`
            : searchMatchString;

        const completeWhereParameters = isFilter
            ? Object.assign(searchMatchParameters, filterParameters)
            : searchMatchParameters;

        const [books, totalCount] = await getRepository(Book).findAndCount({
            skip: offset,
            take: limit,
            where: (qb: SelectQueryBuilder<Book>) => {
                qb.where(completeWhereStatement, completeWhereParameters);
            },
            order: sortOptions
        });

        // Old query

        // const [books, totalCount] = await Book.findAndCount({
        //     skip: offset,
        //     take: limit,
        //     relations: ['authors'],
        //     // where:{filterOptions},
        //     // where: [
        //     //     { '"Book__authors_firstName"': ILike(`%${searchQuery}%`) },
        //     //     { '"Book__authors_lastName"': ILike(`%${searchQuery}%`) },
        //     //     { title: ILike(`%${searchQuery}%`) },
        //     //     { isbn: ILike(`%${searchQuery}%`) },
        //     //     { isbn13: ILike(`%${searchQuery}%`) }
        //     // ],
        //     where: `"title" ILike '%${searchQuery}%' OR
        //     "Book__authors"."firstName" ILIKE '%${searchQuery}%' OR
        //     "Book__authors"."lastName" ILIKE '%${searchQuery}%' OR
        //     "Book"."isbn" ILIKE '%${searchQuery}%' OR
        //     "Book"."isbn13" ILIKE '%${searchQuery}%'`,
        //     order: sortOptions
        // });
        return { books, totalCount };
    }

    @Query(() => Book, { nullable: true })
    async book(@Arg('id', () => Int) id: number) {
        return await Book.findOne(id, { relations: ['authors', 'reviews', 'reviews.reviewedBy'] });
    }
}
