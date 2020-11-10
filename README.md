# Pretty good reads

For live demo of the app, checkout ##HEROKU URL

As a part of the course IT280 Web development, I and two others created this book review app. The main focus of this project was creating a
full stack app. Additionally, some of the goals were to learn searching, sorting, pagination and filtering larger datasets. In our database, we
have about 11k books and 9000 authors. The search is based on book title, authors and ISBNs (regular and ISBN-13). Though the UI does not include methods to filter the dataset, there are backend resolvers for it. There is also backend support for ordered sort options (e.g. sorting on title, the publication date), which is not part of the UI. The Pagination is offset/limit based as the book-dataset is static (as of now).

Another key point was understanding state management. As we wanted to keep our dependencies few, we tried using Apollo for that as well, (over)using the [Reactive variables](https://www.google.com/search?q=apollo+reactive+varibles&oq=apollo+reactive+&aqs=chrome.1.69i57j69i59l3j35i39j69i60l3.2891j0j7&sourceid=chrome&ie=UTF-8). We also explored some of Mobx, though the usecase for the mobx store was not implemeted completely.

For an app more focused on RWD, checkout [github.com/erlend.oeien](https://github.com/erlend.oeien) ## INSERT ON FIXX

## Technologies

In general, this is an Express.js backend, with a CRA-frontend - all written with Typescript.
The app is deployed to Heroku. For creating the resolvers and setup of the graphql-server,
we thought the combination of [Type-Graphql](https://www.google.com/search?q=type-graphql&oq=type-gr&aqs=chrome.0.0j69i57j0l3j69i60l3.3206j0j7&sourceid=chrome&ie=UTF-8), [TypeOrm](https://typeorm.io/#/) was really great and made the schema quite readable. Even though it would probably have been easier (and more efficient) writing sql directly or using e.g. [pg-promise](https://github.com/vitaly-t/pg-promise), it was fun trying to keep the backend "Typeorm-only".

When creating the queries and mutations for the Apollo client, the power of [graphql-code-generator](https://graphql-code-generator.com/) in combination with the
ones mentioned above, really made the typesafe workflow much easier.

### Backend

-   Postgresql
-   Typeorm
-   Graphql (Apollo server)

### Frontend

-   Apollo-client
-   Create React App
-   Mobx

# Setup

-   Clone repo
-   Install client and server dependencies respectively
-   Check the .env.example for needed env variables

## Local development

-   **Backend**
    -   We wanted to simulate the production environment to keep development as realistic as possible. In addition, some point to that [ts-node](https://www.npmjs.com/package/ts-node) is rather slow and we therefore chose using `tsc` to compile the code continously and run the backend from the compiled code.
    -   If all dependencies are installed and environmental variables set:
        -   Run `$ npm run watch` and `$ npm run start-dev` in separate terminals. Make sure you are in the `./server`-folder.
    -   To initialize a new database with data, one must set the synchronize flag to true for Typeorm in [`./server/src/index.ts`](./server/src/index.ts), as well as running the server with the `prepopulate`-flag (see same file). As the migration-logic for typeorm was not perfect with our config, we did not have time to configure it without bugs.
-   **Frontend**
    -   Make sure you have configured the correct API_endpoint - For local development it should be `http://localhost:4000/graphql`
    -   Run `$ npm start` to start the frontend client

## Testing

Cypress is configured, but not utilized as of now. Jest is setup for unit tests in the backend and Enzyme for the frontend.
