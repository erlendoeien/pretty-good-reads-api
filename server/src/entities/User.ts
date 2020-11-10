import { Field, ObjectType } from 'type-graphql';
import {
    Entity,
    BaseEntity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToMany,
    JoinTable
} from 'typeorm';
import { Book } from './Book';
import { Review } from './Review';

@ObjectType()
@Entity()
export class User extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column({ unique: true })
    email: string;

    @Field()
    @Column()
    firstName: string;

    @Field()
    @Column()
    lastName: string;

    @Column({ select: false })
    password!: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    nationality: string;

    @ManyToMany(() => Book)
    @JoinTable({ name: 'read_by' })
    booksRead: Book[];

    @Field(() => [Review])
    @OneToMany(() => Review, (review) => review.reviewedBy)
    reviews: Review[];

    @Field(() => String) // No basic date serialization for Graphql
    @UpdateDateColumn()
    updatedAt!: Date;

    @Field(() => String)
    @CreateDateColumn()
    createdAt!: Date;
}
