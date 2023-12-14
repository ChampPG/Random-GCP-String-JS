const puppeteer = require('puppeteer');
const { createCanvas } = require('canvas');

class GcpDot {
    constructor() {
        this.stats = [];
    }

    async _runHeadlessDriver() {
        let high = 0;
        // const delay = 3;

        console.log(this.driveExecutable);
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://gcpdot.com/gcpchart.php', { waitUntil: 'networkidle2' });

        try {
            // await page.waitForTimeout(1000); // Equivalent to time.sleep(1)

            const chartHeight = await page.$eval('#gcpChartShadow', e => e.getAttribute('height'));
            const dots = await page.$$('div');
            const dot = dots[dots.length - 1];
            const dotId = await dot.evaluate(e => e.getAttribute('id'));
            // await page.waitForTimeout(1000);

            let dotHeight = await page.$eval(`#${dotId}`, e => e.style.top);
            dotHeight = dotHeight.replace('px', '');

            console.log(`Chart height: ${chartHeight}`);
            console.log(`Dot height: ${dotHeight}`);

            if (parseInt(dotHeight) > parseInt(chartHeight)) {
                await browser.close();
                return this._runHeadlessDriver();
            }

            high = this._interp(parseFloat(dotHeight), [0, parseFloat(chartHeight)], [0.0, 1.0]);

            let shift = high;
            if (high.toString().length > 3) {
                shift = parseFloat(`0.${high.toString().slice(3)}`);
            }

            const statDict = {
                dot_height_raw: parseFloat(dotHeight),
                gcp_index: high,
                ts: new Date().getTime(),
                color: this._colorSwitch(high),
                gcp_index_shifted: shift
            };
            this.stats.push(statDict);
        } catch (e) {
            console.error(`Exception: ${e}`);
            throw e;
        } finally {
            await browser.close();
        }

        return high;
    }

    async _generateGradient(colour1, colour2, width, height) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Create gradient
        const grd = ctx.createLinearGradient(0, 0, 0, height);
        grd.addColorStop(0, `rgb(${colour1.join(',')})`);
        grd.addColorStop(1, `rgb(${colour2.join(',')})`);

        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, width, height);

        return canvas; // Returns the canvas object
    }


    async _interp(value, rangeA, rangeB) {
        const [a1, a2] = rangeA;
        const [b1, b2] = rangeB;
        return b1 + ((value - a1) * (b2 - b1)) / (a2 - a1);
    }

    async _colorSwitch(high) {
        if (high === 0) return "gray";
        if (high < 0.05) return "red";
        if (high < 0.10) return "orange";
        if (high < 0.40) return "yellow";
        if (high < 0.90) return "green";
        if (high <= 0.95) return "teal";
        if (high <= 1.0) return "blue";
        return "gray";
    }

    async sample() {
        const high = await this._runHeadlessDriver();
        return this.stats[this.stats.length - 1];
    }

    async random(newFlag = true) {
        if (newFlag) {
            return await this.sample();
        } else {
            if (this.stats.length < 1) {
                return await this.random(true);
            }
            const randomIndex = Math.floor(Math.random() * this.stats.length);
            console.log(`gcp index: ${this.stats[randomIndex].gcp_index}`)
            return this.stats[randomIndex].gcp_index;
        }
    }

    async gather(limit = 420, mod = 5, sleep = 3000, output = true) {
        for (let i = 0; i < limit; i++) {
            await this.sample();

            // Sleep for the specified duration
            await new Promise(resolve => setTimeout(resolve, sleep));

            // Print output every 'mod' samples
            if (output && i % mod === 0) {
                this.stats.slice(-mod).forEach(item => {
                    console.log(item.gcp_index_shifted);
                });
            }
        }
    }
}

// Usage
const gcpDot = new GcpDot();
// Call methods of gcpDot as needed
gcpDot.random().then(async (result) => {
    const gcpIndex = await result.gcp_index; // Await the resolution of the Promise
    console.log(gcpIndex); // This should log only the number
});

module.exports = GcpDot;