import { InputType, Field } from 'type-graphql';

@InputType()
export default class RegisterOptions {
    @Field()
    email: string;

    @Field()
    firstName: string;

    @Field()
    lastName: string;

    @Field()
    password: string;

    @Field({ nullable: true })
    nationality?: string;
}
