[Čeština](README_CZ.md) | [English](README.md)

# Think different Academy

> Warning: this code was written in 7 hours, and this is noticeable in the quality of the code. Since this project was part of a competition, and I am in charge of other projects, this project is not supported.
> I hereby indicate that all bugs found in this application are features.

App for the grand finals of the [Tour de App](https://tourde.app/) competition.

## Created by

- mldchan - [Web](https://mldchan.dev/), [GitHub](https://github.com/mldchan), [code.mldchan.dev](https://code.mldchan.dev/mld), [Fedi](https://social.mldchan.dev/@mld)
- Krystof - [code.mldchan.dev](https://code.mldchan.dev/Krysunka), [Fedi](https://social.mldchan.dev/@Krysunka)

## About the application

The application is built using NextJS and TailwindCSS. We use Prism for database design and SQLite to store the data on
disk.

## Development

If you want to run this application in development, you can use the following commands:

1. `git clone https://code.mldchan.dev/mld/tda25_grandfinale.git` - clone the repository (or use GitHub)
2. `cd tda25_grandfinale` - move to the project folder
3. `yarn install` - download the libraries
4. `yarn dev` - start the development server

## Building to production

If you want to build the application into production, you can use the following commands:

1. `git clone https://code.mldchan.dev/mld/tda25_grandfinale.git` - clone the repository (or use GitHub)
2. `cd tda25_grandfinale` - move to the project folder
3. `yarn install` - download the libraries
4. `yarn build` - build the application

Our application can also be built as a Docker image. For this you need to have Docker installed. If you have it, you can
use the following commands:

1. `git clone https://code.mldchan.dev/mld/tda25_grandfinale.git` - clone the repository (or use GitHub)
2. `cd tda25_grandfinale` - move to the project folder
3. `docker build -t tda25_grandfinale:latest .` - build Docker image

The application runs on port 80, use `docker run -p 80:80 tda25_grandfinale:latest` to run the application.

## License

The entire application is licensed under the GNU AGPL v3. This license is intended for web applications. Any application using our
code must be under the same license. See the `LICENSE` file for more information.
