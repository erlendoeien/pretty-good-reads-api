import { Connection, FindOperator, FindOperatorType } from 'typeorm';

/**
 * FindOperator with support for ILIKE
 * https://github.com/typeorm/typeorm/issues/4418#issuecomment-535803238
 */
export class FindOperatorWithExtras<T> extends FindOperator<T> {
    constructor(
        type: FindOperatorType | 'ilike',
        value: FindOperator<T> | T,
        useParameter?: boolean,
        multipleParameters?: boolean
    ) {
        // @ts-ignore
        super(type, value, useParameter, multipleParameters);
    }

    public toSql(connection: Connection, aliasPath: string, parameters: string[]): string {
        // @ts-ignore
        if (this._type === 'ilike') {
            return `${aliasPath} ILIKE ${parameters[0]}`;
        }

        // @ts-ignore
        return super.toSql(connection, aliasPath, parameters);
    }
}

export type FindOperatorWithExtrasType = FindOperatorType | 'ilike';

/**
 * Find Options Operator.
 * Example: { someField: Like("%some sting%") }
 */
export function ILike<T>(value: T | FindOperator<T>): FindOperatorWithExtras<T> {
    return new FindOperatorWithExtras('ilike', value);
}
