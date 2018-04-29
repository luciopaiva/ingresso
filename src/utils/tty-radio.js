
const
    Writable = require("stream").Writable,
    chalk = require("chalk");

const
    CTRL_C = 0x03,
    RETURN = 0x0d,
    ESC = 0x1b,
    ESC_BRACKET = "[".charCodeAt(0),
    QUIT_CHAR1 = "q".charCodeAt(0),
    QUIT_CHAR2 = "Q".charCodeAt(0),
    CSI = Buffer.from([ESC, ESC_BRACKET]),
    SHOULD_HIGHLIGHT_SELECTED = false;

class TtyRadio {

    /**
     * @private
     * @param {Function} optionSelectedCallback
     * @param {String} promptMessage
     * @param {String[]} options
     */
    constructor (optionSelectedCallback, promptMessage, options) {
        this.optionSelectedCallback = optionSelectedCallback;
        this.promptMessage = promptMessage;
        this.options = options;

        this.selectedIndex = 0;

        this.initializeInterface();
        console.info(this.promptMessage);
        this.drawOptions();
    }

    initializeInterface() {
        this.writable = new Writable({
            write: (chunk, encoding, callback) => {
                if (chunk.length > 0) {
                    switch (chunk[0]) {
                        case QUIT_CHAR1:
                        case QUIT_CHAR2:
                        case ESC:
                            if (chunk.length === 1) {
                                this.cancel();
                                break;
                            }
                            if (chunk[1] === ESC_BRACKET && chunk.length === 3) {
                                switch (String.fromCharCode(chunk[2])) {
                                    case "A":
                                        this.selectPrevious();
                                        break;
                                    case "B":
                                        this.selectNext();
                                        break;
                                }
                            }
                            break;
                        case RETURN:
                            this.chooseSelectedOption();
                            break;
                        case CTRL_C:
                            this.cancel();
                            break;
                    }
                }

                callback();
            }
        });

        process.stdin.pipe(this.writable);
        process.stdin.setRawMode(true);  // cancel line mode and receive every key press

        process.on("exit", () => this.cancel());
        process.on("SIGINT", () => this.cancel());

        TtyRadio.hideCursor();
    }

    static moveCursorUp(count = 1) {
        TtyRadio.moveCursor(count, true);
    }

    static moveCursorDown(count = 1) {
        TtyRadio.moveCursor(count, false);
    }

    static clearScreenDown() {
        process.stdout.write(CSI);
        process.stdout.write("J");
    }

    static moveCursor(count = 1, isMovingUp) {
        if (count === 0) {
            return;
        } else if (count < 0) {
            throw new Error("Invalid negative count " + count);
        }
        process.stdout.write(CSI);
        process.stdout.write(count.toString() + (isMovingUp ? "A" : "B"));
    }

    drawOptions() {
        const labelLength = this.options.reduce((biggest, option) => Math.max(biggest, option.length), 0);
        this.options.forEach((option, index) => {
            const isSelected = index === this.selectedIndex;
            const marker = isSelected ? chalk.green("◉") : chalk.gray("◯");
            let label = option + (option.length < labelLength ? " ".repeat(labelLength - option.length) : "");
            if (SHOULD_HIGHLIGHT_SELECTED) {
                label = isSelected ? chalk.inverse(label) : label;
            }
            console.info(`  ${marker} ${label}`);
        });

        // move cursor to the line where the first option is, so we can clear everything down when something changes
        TtyRadio.moveCursorUp(this.options.length);
    }

    selectNext() {
        TtyRadio.clearScreenDown();

        if (this.selectedIndex < this.options.length - 1) {
            this.selectedIndex++;
        }

        this.drawOptions();
    }

    selectPrevious() {
        TtyRadio.clearScreenDown();

        if (this.selectedIndex > 0) {
            this.selectedIndex--;
        }

        this.drawOptions();
    }

    chooseSelectedOption() {
        this.close();
        this.optionSelectedCallback(this.selectedIndex);
    }

    cancel() {
        this.close();
        this.optionSelectedCallback(undefined);
    }

    close() {
        process.stdin.unpipe(this.writable);
        process.stdin.setRawMode(false);

        // move the cursor to the end of the list, so it stays fully rendered after we exit it
        TtyRadio.moveCursorDown(this.options.length);
        // process.stdout.write("\n");  // also leave a blank line after it

        TtyRadio.showCursor();
    }

    static escape(code) {
        return '\x1B[' + code;
    }

    static hideCursor() {
        process.stdout.write(TtyRadio.escape("?25l"));
    }

    static showCursor() {
        process.stdout.write(TtyRadio.escape("?25h"));
    }

    /**
     * Shows options and waits for an answer to be selected.
     *
     * @param {String} prompt message to show in the prompt, before options are rendered
     * @param {String[]} options array of option labels
     * @return {Promise<Number>} the index of the selected option
     */
    static show(prompt, options) {
        if (!process.stdout.isTTY) {
            throw new Error("Output is not TTY!");
        }
        if (!process.stdin.isTTY) {
            throw new Error("Input is not TTY!");
        }

        if (options.length === 0) {
            throw new Error("Options expected");
        }

        return new Promise((resolve) => new TtyRadio(resolve, prompt, options));
    }
}

module.exports = TtyRadio;

if (require.main === module) {
    // sample usage

    /** @return {void} */
    async function main() {
        const selectedIndex = await TtyRadio.show("Choose an option:", ["one", "two", "three"]);
        if (selectedIndex !== undefined) {
            console.info("\nSelected " + selectedIndex);
        } else {
            console.info("Canceled selection");
        }

        const selectedIndex2 = await TtyRadio.show("\nChoose another option:", ["foo", "bar"]);
        if (selectedIndex2 !== undefined) {
            console.info("\nSelected " + selectedIndex2);
        } else {
            console.info("Canceled selection");
        }

        // needed because stdin is still being referenced (see https://stackoverflow.com/q/26004519/778272)
        process.exit(0);
    }
    main();
}
