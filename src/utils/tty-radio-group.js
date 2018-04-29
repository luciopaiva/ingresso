
const
    Writable = require("stream").Writable,
    chalk = require("chalk");

const
    MAX_HEIGHT_IN_LINES = 10,
    RADIO_GROUP_MIN_WIDTH = 30,
    CTRL_C = 0x03,
    RETURN = 0x0d,
    ESC = 0x1b,
    ESC_BRACKET = "[".charCodeAt(0),
    QUIT_CHAR1 = "q".charCodeAt(0),
    QUIT_CHAR2 = "Q".charCodeAt(0),
    CSI = Buffer.from([ESC, ESC_BRACKET]),
    SHOW_SCROLLING_HELP = false,
    SHOULD_HIGHLIGHT_SELECTED = false;

class TtyRadioGroup {

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
        this.topIndex = 0;
        this.radioGroupHeight = Math.min(this.options.length, MAX_HEIGHT_IN_LINES);
        this.showScrollBar = this.radioGroupHeight < this.options.length;

        this.initializeStreams();
        console.info(this.promptMessage);
        this.drawOptions();
    }

    initializeStreams() {
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

        TtyRadioGroup.hideCursor();
    }

    static moveCursorUp(count = 1) {
        TtyRadioGroup.moveCursorRelative(count, true);
    }

    static moveCursorDown(count = 1) {
        TtyRadioGroup.moveCursorRelative(count, false);
    }

    static clearLine() {
        process.stdout.write(CSI);
        process.stdout.write("2K");
    }

    static clearScreen() {
        process.stdout.write(CSI);
        process.stdout.write("2J");
    }

    static clearScreenDown() {
        process.stdout.write(CSI);
        process.stdout.write("J");
    }

    static moveCursor(x, y) {
        if (x < 1 || y < 1) {
            throw new Error("Coordinates are 1-based");
        }
        process.stdout.write(CSI);
        process.stdout.write(`${x};${y}H`);
    }

    static moveCursorRelative(count = 1, isMovingUp) {
        if (count === 0) {
            return;
        } else if (count < 0) {
            throw new Error("Invalid negative count " + count);
        }
        process.stdout.write(CSI);
        process.stdout.write(count.toString() + (isMovingUp ? "A" : "B"));
    }

    drawOptions() {
        /** @type {String[]} */
        const visibleOptions = this.options.slice(this.topIndex, this.topIndex + this.radioGroupHeight);

        // must compute label length based on all options, otherwise width may vary as user scrolls
        const labelLength = Math.max(RADIO_GROUP_MIN_WIDTH,
            this.options.reduce((biggest, option) => Math.max(biggest, option.length), 0));

        let scrollBarTop = 0;
        let scrollBarHeight = 0;
        if (this.showScrollBar) {
            scrollBarTop = Math.round(this.radioGroupHeight * this.topIndex / this.options.length);
            scrollBarHeight = Math.round(this.radioGroupHeight * (visibleOptions.length / this.options.length));
        }

        visibleOptions.forEach((option, index) => {
            const isSelected = (index + this.topIndex) === this.selectedIndex;
            const marker = isSelected ? chalk.green("◉") : chalk.gray("◯");
            let label = option + (option.length < labelLength ? " ".repeat(labelLength - option.length) : "");
            if (SHOULD_HIGHLIGHT_SELECTED) {
                label = isSelected ? chalk.inverse(label) : label;
            }

            if (this.showScrollBar) {
                const scrollBarPart = (index >= scrollBarTop && index < scrollBarTop + scrollBarHeight) ? "▒" : "░";

                let message = "";
                if (SHOW_SCROLLING_HELP) {
                    if (index === 0 && this.topIndex > 0) {
                        message = "(scroll up for more)";
                    } else if (index === (this.radioGroupHeight - 1) &&
                        this.topIndex + this.radioGroupHeight < (this.options.length)) {
                        message = "(scroll down for more)";
                    }
                    message = chalk.gray(message);
                }
                console.info(`  ${marker} ${label} ${scrollBarPart} ${message}`);
            } else {
                console.info(`  ${marker} ${label}`);
            }
        });

        // move cursor to the line where the first option is, so we can clear everything down when something changes
        TtyRadioGroup.moveCursorUp(this.radioGroupHeight);
    }

    selectNext() {
        TtyRadioGroup.clearScreenDown();

        if (this.selectedIndex < this.options.length - 1) {
            this.selectedIndex++;
            if (this.selectedIndex >= this.topIndex + this.radioGroupHeight) {
                this.topIndex++;
            }
        }

        this.drawOptions();
    }

    selectPrevious() {
        TtyRadioGroup.clearScreenDown();

        if (this.selectedIndex > 0) {
            this.selectedIndex--;
            if (this.selectedIndex < this.topIndex) {
                this.topIndex--;
            }
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
        TtyRadioGroup.moveCursorDown(this.options.length);
        // process.stdout.write("\n");  // also leave a blank line after it

        TtyRadioGroup.showCursor();
    }

    static escape(code) {
        return '\x1B[' + code;
    }

    static hideCursor() {
        process.stdout.write(TtyRadioGroup.escape("?25l"));
    }

    static showCursor() {
        process.stdout.write(TtyRadioGroup.escape("?25h"));
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

        return new Promise((resolve) => new TtyRadioGroup(resolve, prompt, options));
    }
}

module.exports = TtyRadioGroup;

if (require.main === module) {
    // sample usage

    /** @return {void} */
    async function main() {
        const selectedIndex = await TtyRadioGroup.show("Choose an option:",
            Array.from(Array(20), (e,i) => "Option " + (i+1)));
        if (selectedIndex !== undefined) {
            console.info("\nSelected " + selectedIndex);
        } else {
            console.info("Canceled selection");
        }

        // const selectedIndex2 = await TtyRadioGroup.show("\nChoose another option:", ["foo", "bar"]);
        // if (selectedIndex2 !== undefined) {
        //     console.info("\nSelected " + selectedIndex2);
        // } else {
        //     console.info("Canceled selection");
        // }

        // needed because stdin is still being referenced (see https://stackoverflow.com/q/26004519/778272)
        process.exit(0);
    }
    main();
}
