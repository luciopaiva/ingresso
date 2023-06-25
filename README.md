# Ingresso.com Seat Map Viewer

![Screenshot](https://raw.githubusercontent.com/luciopaiva/ingresso/master/assets/ingresso.gif)

Check live movie session seat maps right from you terminal window with this cool app.

**Note: it's been a long time since this code base was last maintained and the script is breaking after selecting the movie date. I don't plan on fixing this any time soon, but please feel free to read and learn from it (and maybe fix it? 😛).**

## How to install

Since this is a Node.js application, you need it installed before continuing. Refer to https://nodejs.org for details. This has been tested with Node.js v9 and v10, but it should work just fine with v7.6 or higher (which brought async/await support), although I'm not totally sure.

    git clone git@github.com:luciopaiva/ingresso.git
    cd ingresso
    npm install

## How to use it

To use it, just run:

    ./ingresso.sh

It will interactively guide you through the steps involved in finding your movie session. Use the arrow keys to choose among options and press return key to select it.

After a session is selected, the seat map will be shown:

![Screenshot](https://raw.githubusercontent.com/luciopaiva/ingresso/master/assets/ingresso.png)

## Development

This application accesses Ingresso.com's API, which is not officially released (AFAIK); use it at your own risk. Be sure to check Ingresso.com's Swagger if you want to play with it: https://api-content.ingresso.com/v0/swagger/ui/index
