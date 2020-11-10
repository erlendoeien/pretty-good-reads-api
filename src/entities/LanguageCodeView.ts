import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
    expression: `
    SELECT DISTINCT "languageCode" 
    FROM book ORDER BY "languageCode"
`
})
export class LanguageCode {
    @ViewColumn()
    id: number;

    @ViewColumn()
    languageCode: string;
}
