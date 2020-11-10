import { Field, ObjectType } from 'type-graphql';
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import { Category } from './Category';
import { Review } from './Review';
import { Author } from './Author';

@ObjectType()
@Entity()
export class Book extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    title: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    bookCoverUrl: string;

    @Field()
    @Column({ unique: true })
    isbn: string;

    @Field()
    @Column({ unique: true })
    isbn13: string;

    @Field()
    @Column()
    languageCode: string;

    @Field()
    @Column()
    numPages: number;

    @Field(() => String)
    @Column('date')
    publicationDate: Date;

    @Field(() => String)
    @Column()
    publisher: string;

    @Field()
    @Column({ default: 0 })
    goodreadsRatings: number;

    // Must explicitely create the FK-column so Graphql has access to it
    @Field({ nullable: true })
    @Column({ nullable: true })
    categoryId: number;

    @ManyToOne(() => Category, (category) => category.books)
    category: Category;

    @Field(() => [Review])
    @OneToMany(() => Review, (review) => review.reviewItem)
    reviews: Review[];

    @Field(() => [Author])
    @ManyToMany(() => Author, (author) => author.books, { cascade: ['insert'], eager: true })
    @JoinTable({ name: 'book_authors' })
    authors: Author[];

    @Field(() => String) // No basic date serialization for Graphql
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;
}
