import { Resolver, Arg, Field, Mutation, ObjectType, Query, Ctx } from 'type-graphql';
import argon2 from 'argon2';
import { getConnection } from 'typeorm';
import { User } from '../entities/User';
import RegisterOptions from './RegisterOptions';
import validateRegister from '../utils/validateRegister';
import { MyContext } from '../types';

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export default class UserResolver {
    @Query(() => User, { nullable: true })
    me(@Ctx() { req }: MyContext) {
        if (!req.session.userId) {
            // You are not logged in
            return null;
        }

        return User.findOne(req.session.userId, {
            relations: ['reviews', 'reviews.reviewItem', 'reviews.reviewedBy']
        });
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: RegisterOptions,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        // Catch errors specified in validateRegister
        const errors = validateRegister(options);
        if (errors) {
            return { errors };
        }

        const hashedPassword = await argon2.hash(options.password);

        let user;
        try {
            user = await User.create({
                email: options.email,
                firstName: options.firstName,
                lastName: options.lastName,
                nationality: options.nationality,
                password: hashedPassword
            }).save();
        } catch (err) {
            // Email already taken
            if (err.code === '23505') {
                return {
                    errors: [
                        {
                            field: 'email',
                            message: 'email address already taken'
                        }
                    ]
                };
            }
            return err;
        }

        // Store user id session so that the user stays logged in
        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('email') email: string,
        @Arg('password') password: string,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        // Get user with hidden column password
        const user: User | undefined = await getConnection()
            .getRepository(User)
            .createQueryBuilder()
            .select('*')
            .addSelect(`"User".password`)
            .where('"User".email = :email', { email })
            .getRawOne();

        if (!user) {
            return {
                errors: [
                    {
                        field: 'email',
                        message: "a user with that email doesn't exist"
                    }
                ]
            };
        }

        // Check if password matches
        const valid: boolean = await argon2.verify(user.password, password);

        if (!valid) {
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'incorrect password'
                    }
                ]
            };
        }

        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext) {
        return new Promise((resolve) =>
            req.session.destroy((err) => {
                res.clearCookie('connect.sid'); // Default cookie name used
                if (err) {
                    console.log(err);
                    resolve(false);
                    return;
                }
                resolve(true);
            })
        );
    }
}
