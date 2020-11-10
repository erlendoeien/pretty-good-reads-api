import { ObjectType, Field } from 'type-graphql';
import {
    Entity,
    BaseEntity,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryColumn
} from 'typeorm';
import { Book } from './Book';
import { User } from './User';

@ObjectType()
@Entity()
export class Review extends BaseEntity {
    @Field()
    @PrimaryColumn()
    reviewItemId!: number;

    @Field(() => Book)
    @ManyToOne(() => Book, (book) => book.reviews, { onDelete: 'CASCADE' })
    reviewItem: Book;

    @Field()
    @PrimaryColumn()
    reviewedById!: number;

    @Field(() => User)
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    reviewedBy: User;

    @Field()
    @Column('float')
    rating!: number;

    @Field({ nullable: true })
    @Column({ nullable: true })
    text: string;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt!: Date;

    @Field(() => String)
    @CreateDateColumn()
    createdAt!: Date;
}
