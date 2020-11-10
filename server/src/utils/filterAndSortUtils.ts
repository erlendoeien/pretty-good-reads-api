import { getConnection } from 'typeorm';
import { Book } from '../entities/Book';
import { FilterInput, SortInput } from '../resolvers/SortAndFilterOptions';
import { FindOperatorWithExtras, FindOperatorWithExtrasType } from './FindOperatorWithExtras';

export type ValidFilterField =
    | keyof Pick<Book, 'numPages'>
    | keyof Pick<Book, 'publicationDate'>
    | keyof Pick<Book, 'languageCode'>;

export type ValidOrderField =
    | ValidFilterField
    | keyof Pick<Book, 'createdAt'>
    | keyof Pick<Book, 'updatedAt'>
    | keyof Pick<Book, 'publicationDate'>;

export type OrderByOption = Record<ValidOrderField, 'ASC' | 'DESC'>; // Not concrete validation
// type WhereOption = Record<string, FindOperatorWithExtras<string | number | Date>>;
export interface FilterQueryI {
    filterStatement: string;
    filterParameters: Record<string, string | number | Date>;
}

/*
 * Hacky method to validate and return a FindOperator for the filter
 */
function _convertFilterValueType(field: ValidFilterField, value: string) {
    // Gets the properties of book
    // Must be an easier way
    const filterColumnType = getConnection()
        .getMetadata(Book)
        .columns.find(({ propertyName }) => propertyName === field)?.type;
    if (!filterColumnType) return null;

    let realValue;
    // Hardcoded switch case based on valid filter fields
    switch (filterColumnType) {
        case Number:
            console.log('NUMBER');
            realValue = parseInt(value);
            break;
        case 'date':
            console.log('DATE');
            realValue = new Date(value);
            break;
        case String:
            console.log('STRING');
            realValue = value;
            break;
        default:
            console.log('Not matching type,', filterColumnType);
            return null;
    }
    return realValue;
}

/**
 * Maps filter option to a valid findCondition, including ILIKE
 * @param predicate Filter predicate
 * @param field Field to filter on, e.g. 'moreThan' or 'lessThanOrEqual'
 * @param value Value to use in the predicate
 */
function _mapFilterOperators(
    predicate: FindOperatorWithExtrasType,
    field: ValidFilterField,
    value: string
) {
    const convertedValue = _convertFilterValueType(field, value);

    // Throw "error"
    if (convertedValue === null) return null;

    return new FindOperatorWithExtras(predicate, convertedValue);
}

/**
 * Assuming we only want between, not two mutually exclusive ranges
 * @param filterA One of the endpoints
 * @param filterB The other filter endpoint
 */
function handleRangeFilter(filterA: FilterInput, filterB: FilterInput) {
    const validFilterValueA = _convertFilterValueType(filterA.filterField, filterA.filterValue);
    const validFilterValueB = _convertFilterValueType(filterB.filterField, filterB.filterValue);

    let from;
    let to;
    // invalid fields if not same or not valid filter options
    if (!validFilterValueA === null || validFilterValueB === null) return null;

    // From-field
    if (filterA.filterPredicate === 'moreThan' || filterA.filterPredicate === 'moreThanOrEqual') {
        from = validFilterValueA;
        // Validate that other is to-field
        if (
            filterB.filterPredicate === 'lessThan' ||
            filterB.filterPredicate === 'lessThanOrEqual'
        ) {
            to = validFilterValueB;
        }
        // Symmetric check
    } else if (
        filterB.filterPredicate === 'moreThan' ||
        filterB.filterPredicate === 'moreThanOrEqual'
    ) {
        from = validFilterValueB;
        if (
            filterA.filterPredicate === 'lessThan' ||
            filterA.filterPredicate === 'lessThanOrEqual'
        ) {
            to = validFilterValueA;
        }
    } else return null;

    return new FindOperatorWithExtras('between', [from, to] as any, true, true);
}

/**
 * Comparison operator to PSQL-symbols
 * @param comparisonOperator comparisonOperator in text
 */
function _convertOperatorToSymbol(comparisonOperator: FindOperatorWithExtrasType) {
    switch (comparisonOperator) {
        case 'moreThan':
            return '>';
        case 'lessThan':
            return '<';
        case 'moreThanOrEqual':
            return '>=';
        case 'lessThanOrEqual':
            return '>';
        default:
            return comparisonOperator.toUpperCase();
    }
}

/**
 * Maps a where condition to the SQL
 * @param field Column/alias to compare on
 * @param operator Compare operator
 * @param alias String without quotes which matches alias
 * @return [string, {field: value}] The SQL-string + the prepared statement param and value
 */
export function _filterConditionToSql(
    field: string,
    operator: FindOperatorWithExtras<string | number | Date>,
    alias: string
): [string, Record<string, string | number | Date>] {
    const symbolOperator = _convertOperatorToSymbol(operator.type as FindOperatorWithExtrasType);
    const returnParams: Record<string, string | number | Date> = {};
    if (symbolOperator === 'BETWEEN' && operator.multipleParameters) {
        //@ts-ignore
        const [value1, value2] = operator.value as OperatorValue;
        const otherField = field + '2';
        returnParams[field] = value1;
        returnParams[otherField] = value2;
        console.log(returnParams);
        return [
            `"${alias}"."${field}" ${symbolOperator} :${field} AND :${otherField} `,
            returnParams
        ];
    }
    returnParams[field] = operator.value;
    return [`"${alias}"."${field}" ${symbolOperator} :${field}`, returnParams];
}

/**
 * Checks if the filter value is a part of a range filter
 * If so, create the range filter and return it
 * @param filters Array of filters
 * @param current Current filter to check
 * @param index The index of the current filter
 */
function _getRangeFilter(
    filters: FilterInput[],
    current: FilterInput,
    index: number
): [FindOperatorWithExtras<any>, number] | null {
    // Check if it is a part of between filter
    for (let i = index + 1; i < filters.length; i++) {
        if (filters[i].filterField === current.filterField) {
            const otherFilter = filters[i];
            const betweenFilter = handleRangeFilter(current, otherFilter);
            if (!betweenFilter) return null;
            return [betweenFilter, i];
        }
    }
    return null;
}

/**
 * Maps the filters, skips invalid fields, handles between condition too
 * Assumes max 2 filters on same field
 * @param filters Array of filters with field, predicate and value
 */
function _mapFiltersToWhere(filters: FilterInput[]) {
    const finishedIndices = new Set<number>();

    // For the prepared query
    const filterQueryList: string[] = [];
    let filterParameters: Record<string, string | number | Date> = {};

    filters.forEach(({ filterField, filterPredicate, filterValue }, index) => {
        // Skip if it was part of between/range filter
        if (finishedIndices.has(index)) return;

        let filterCondition;
        // Get the possible between-filter
        // Allows range for all filterFields, incl. languageCode
        const betweenFilter = _getRangeFilter(
            filters,
            { filterField, filterPredicate, filterValue },
            index
        );

        // Skip the other indice if between filter
        if (betweenFilter) {
            filterCondition = betweenFilter[0];
            finishedIndices.add(betweenFilter[1]);
        }

        if (filterCondition === undefined)
            // Regular filter condition
            filterCondition = _mapFilterOperators(filterPredicate, filterField, filterValue);
        if (filterCondition === null) {
            console.log(
                `Invalid filter field '${filterField}' or value '${filterValue}' -- Not Included`
            );
            return;
        }

        const [sqlString, parameters] = _filterConditionToSql(filterField, filterCondition, 'Book');
        // Append new filter option to query with parameters
        filterQueryList.push(sqlString);
        filterParameters = { ...filterParameters, ...parameters };

        // Not actually necessary because only interrested in future fields
        finishedIndices.add(index);
    });

    // Join seperate filters to one query
    const filterStatement: string = filterQueryList.join(' AND ');

    // Return the prepared statment with its parameters
    return { filterStatement, filterParameters };
}

/**
 * Array of sort fields with direction mapped to orderBy-clauses
 * Must be a property of Book
 * @param sorts Array of fields to sort on
 */
function _mapSortsToOrderBy(sorts: SortInput[]) {
    // Maps it to an object while maintaining order, without using a Mao
    const sortsWithOrder = Object.fromEntries(
        sorts.map(({ sortField, sortValue }) => [sortField, sortValue])
    );
    return sortsWithOrder;
}

/**
 * Maps arrays of sort-fields and filter-objects to readable clauses
 * for the orderBy- and where-arguments, e.g. FindOperators
 * @param sorts Array of fields to sort data on
 * @param filters Array of filters to filter data on
 */
export function mapOptionsToFindOptions(
    sorts: SortInput[],
    filters: FilterInput[]
): [OrderByOption, FilterQueryI] {
    const orderByClauses = _mapSortsToOrderBy(sorts);
    const filterOption = _mapFiltersToWhere(filters);

    return [orderByClauses, filterOption];
}
