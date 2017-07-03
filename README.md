# Ingresso.com Seat Map Viewer

![Screenshot](https://raw.githubusercontent.com/luciopaiva/ingresso/master/screenshots/ingresso.png)

Ingresso is a simple application that can be used to view seatmaps for a given ingresso.com movie session. It allows you to search among available sessions and, once a session is chosen, it shows you its seat map and information about current seat occupancy.

How to install:

    git clone git@github.com:luciopaiva/ingresso.git
    cd ingresso
    npm install

To use it, start by running:

    ./ingresso

It will show you the list of available movies. Then continue narrowing down the search, by choosing a specific *movie*, then a certain *date*, a given *theater* and finally a movie *session*. After selecting a session, the application will dump the current seat occupancy.

For matching movies, theaters, etc, the application uses a relaxed matching algorithm that allows you to skip characters and still match strings. For instance, if you search for `dagil`, the movie `David Gilmour Live At Pompeii` will appears in the results. Needless to say, the search is also case-insensitive. Moreover, any form of diacritics (e.g., character accentuation) will be ignored.

A sample run:

    ><((°> ./ingresso                                                                                                                                                17:44:52
    List of movies found (60):
    ↪ A Cabana (#14337)
    ↪ Meu Malvado Favorito 3 (#19387)
    ↪ Mulher-Maravilha (#19119)
    ...

Movie is chosen:

    ><((°> ./ingresso malvado                                                                                                                                        18:00:06
    Selected movie: Meu Malvado Favorito 3 (#19387)
    List of dates available (4):
    ↪ 20170702
    ↪ 20170703
    ↪ 20170704
    ↪ 20170705

Date is chosen:

    ><((°> ./ingresso malvado 0703                                                                                                                                   18:02:15
    Selected movie: Meu Malvado Favorito 3 (#19387)
    Selected date: 20170703
    List of sessions found (81):
    ↪ Cine 10 Carrefour Sulacap (Sulacap)
        Sala 1: 17:00 (DUB), 19:00 (DUB), 21:00 (DUB), 21:01 (DUB)
        Sala 2: 16:00 (DUB), 18:00 (DUB), 20:00 (DUB)
    ↪ Cine Araújo Jardim Guadalupe (Guadalupe)
        Sala 2: 14:45 (DUB), 16:30 (DUB), 18:15 (DUB), 20:00 (DUB)
        Sala 4: 14:15 (DUB), 16:00 (DUB), 17:45 (DUB), 19:30 (DUB), 21:15 (DUB)
        Sala 5: 15:00 (DUB - 3D), 17:00 (DUB - 3D), 19:00 (DUB - 3D), 21:00 (DUB - 3D)
    ...

Theater is chosen, among with session info. Seat map is revealed:

![Screenshot](https://raw.githubusercontent.com/luciopaiva/ingresso/master/screenshots/ingresso-sample.png)

## Seat map symbols

New symbols may appear over time, but here are a few common ones:

    ❎ regular seat
    ♿ seat for people with disabilities
    H seat for people accompanying a disabled person
    ❤ seat with lift up armrest

## Ingresso.com API

This application accesses ingresso.com's mobile API, which is not officially released (AFAIK); use it at your own risk.

## Cronjob

In case you want to periodically query for a certain session, there's a script for that in the root directory: `seatmap-task`.

First use `ingresso` to figure the `session-id` and `sector-id` of the session you're interested in. It will appear in gray right next to the session information line. Then configure your crontab:

    crontab -e

And add a line to, say, query for seat maps each and every minute:

    * * * * * cd path/to/ingresso && ./seatmap-task <session-id> <sector-id>

Remember to replace `<session-id>` and `<sector-id>` properly.

A folder named `seatmap-<session-id>` will appear (within a minute) inside ingresso's folder. It will contain a log file (which will be appended to on each job run) and a TSV file as well, containing the initial seat map. As the job runs, new TSV files will appear, but only if something changed since the last run.

In case no folder appears after one minute, make sure to add a PATH variable to your crontab. For more info, see [this](https://askubuntu.com/a/23438/204815).
