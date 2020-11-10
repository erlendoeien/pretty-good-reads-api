/* eslint-disable class-methods-use-this */
/* eslint-disable import/prefer-default-export */
/* eslint-disable max-classes-per-file */
import {
    Resolver,
    Query,
    Arg,
    Int,
    Mutation,
    InputType,
    Field,
    Ctx,
    UseMiddleware,
    ObjectType
} from 'type-graphql';
import { getConnection } from 'typeorm';
import { MyContext } from '../types';
import { Review } from '../entities/Review';
import isAuth from '../middleware/isAuth';

@InputType()
class ReviewInput {
    @Field()
    rating: number;

    @Field({ nullable: true })
    text: string;
}

@ObjectType()
class AllReviews {
    @Field(() => [Review])
    reviews: Review[];

    @Field()
    totalCount: number;
}

@Resolver(Review)
export class ReviewResolver {
    @Query(() => AllReviews)
    async reviews() {
        const [reviews, totalCount] = await Review.findAndCount({
            relations: ['reviewedBy']
        });
        return { reviews, totalCount };
    }

    @Query(() => Review, { nullable: true })
    async review(@Arg('id', () => Int) id: number) {
        return Review.findOne(id);
    }

    @Mutation(() => Review)
    @UseMiddleware(isAuth)
    async createReview(
        @Arg('bookId', () => Int) bookId: number,
        @Arg('input') input: ReviewInput,
        @Ctx() { req }: MyContext
    ) {
        console.log(input);
        await Review.create({
            ...input,
            reviewItemId: bookId,
            reviewedById: req.session.userId
        }).save();

        return Review.findOne(
            { reviewItemId: bookId, reviewedById: req.session.userId },
            { relations: ['reviewedBy'] }
        );
    }

    @Mutation(() => Review, {
        nullable: true,
        description: `Updates a review. Returns null if the user has not
            reviewed the book previously or authentication error`
    })
    @UseMiddleware(isAuth)
    async updateReview(
        @Arg('bookId', () => Int) bookId: number,
        @Arg('input') input: ReviewInput,
        @Ctx() { req }: MyContext
    ) {
        await getConnection()
            .createQueryBuilder()
            .update(Review)
            .set({ ...input })
            .where({ reviewItemId: bookId, reviewedById: req.session.userId })
            .execute();

        return Review.findOne(
            { reviewItemId: bookId, reviewedById: req.session.userId },
            { relations: ['reviewedBy'] }
        );
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deleteReview(@Arg('bookId', () => Int) bookId: number, @Ctx() { req }: MyContext) {
        return Review.delete({ reviewItemId: bookId, reviewedById: req.session.userId })
            .then(() => {
                return true;
            })
            .catch((err) => {
                console.log(err);
                return false;
            });
    }
}
