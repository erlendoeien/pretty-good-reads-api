import { Field, ObjectType } from 'type-graphql';
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToMany,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn
} from 'typeorm';
import { Book } from './Book';

@ObjectType()
@Entity()
@Unique('uniqueAuthor', ['firstName', 'lastName'])
@Index('idx_author_search', { synchronize: false })
export class Author extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    firstName: string;

    @Field()
    @Column()
    lastName: string;

    @Field(() => [Book])
    @ManyToMany(() => Book, (book) => book.authors)
    books: Book[];

    @Field(() => String) // No basic date serialization for Graphql
    @UpdateDateColumn()
    updatedAt!: Date;

    @Field(() => String)
    @CreateDateColumn()
    createdAt!: Date;
}
