import { InputType, Field } from 'type-graphql';
import { FindOperatorType } from 'typeorm';
import { ValidFilterField, ValidOrderField } from '../utils/filterAndSortUtils';

@InputType({ description: 'Possible array of sort options for books' })
export class SortInput {
    @Field(() => String, { description: 'Fields to sort on, must be fields on Book' })
    sortField: ValidOrderField;

    @Field(() => String)
    sortValue: 'ASC' | 'DESC';
}

@InputType({ description: 'Filter options to filter on books' })
export class FilterInput {
    @Field(() => String, {
        description: `Fields to sort on, must be either "id", 
                "numPages", "languageCode" or "publicationDate"`
    })
    filterField: ValidFilterField;

    @Field(() => String, { description: 'Predicates, e.g. "moreThan", "equal", "lessThanOrEqual"' })
    filterPredicate: FindOperatorType;

    @Field(() => String)
    filterValue: string;
}
