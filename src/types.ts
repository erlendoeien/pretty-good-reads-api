import { Request, Response } from 'express';

export type MyContext = {
    req: Request & { session: Express.Session };
    res: Response;
};

/**
 * Type validates that the object contains at least one of the given
 * properties
 */
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];
