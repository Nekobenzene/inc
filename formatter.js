// formatter.js

function formatDecimal(x) {
    x = new Decimal(x).normalize();

    if (x.sign === 0 || (x.mag === 0 && x.layer === 0)) return "0";
    if (Object.is(x.sign, -0) || x.sign === -0) return "0";
    if (x.isNan()) return "NaN";
    if (!isFinite(x.layer) || !isFinite(x.mag)) {
        if (x.layer === Infinity || x.mag === Infinity) {
            return x.sign === 1 ? "Infinity" : "-Infinity";
        }
        return "NaN";
    }

    function stripTrailingZeros(str) {
        if (typeof str !== "string") str = String(str);

        // 处理科学计数法，如 1.230e5 -> 1.23e5
        if (str.includes("e")) {
            let [mantissa, exponent] = str.split("e");

            mantissa = mantissa.replace(/(\.\d*?[1-9])0+$/, "$1");
            mantissa = mantissa.replace(/\.0+$/, "");

            exponent = exponent.replace(/(\.\d*?[1-9])0+$/, "$1");
            exponent = exponent.replace(/\.0+$/, "");

            return mantissa + "e" + exponent;
        }

        // 处理普通小数，如 1.2300 -> 1.23, 1.000 -> 1
        str = str.replace(/(\.\d*?[1-9])0+$/, "$1");
        str = str.replace(/\.0+$/, "");
        return str;
    }

    function toPrecision3(num) {
        // num 可能是 Decimal 或 number
        if (num instanceof Decimal) {
            if (num.layer === 0) {
                const n = num.toNumber();
                if (!isFinite(n)) return "Infinity";
                let s = n.toPrecision(3).replace(/e\+/g, "e");
                return stripTrailingZeros(s);
            }
            return formatDecimal(num);
        }

        let s = num.toPrecision(3).replace(/e\+/g, "e");
        return stripTrailingZeros(s);
    }

    function cleanNumberString(str) {
        return stripTrailingZeros(String(str).replace(/e\+/g, "e"));
    }

    function groupDigits(num) {
        if (num instanceof Decimal) num = num.toNumber();
        if (!isFinite(num)) return "Infinity";

        let intNum = Math.round(num);
        let s = intNum.toString();
        let parts = [];

        for (let i = s.length; i > 0; i -= 3) {
            let start = Math.max(0, i - 3);
            parts.unshift(s.substring(start, i));
        }

        return parts.join(" ");
    }

    let result = "";

    if (x.layer === 0) {
        const mag = x.mag;

        if (mag < 0.001 && mag !== 0) {
            const exponent = Math.floor(Math.log10(mag));
            const mantissa = mag * Math.pow(10, -exponent);
            result = toPrecision3(mantissa) + "e" + cleanNumberString(exponent);
        } else if (mag < 1000) {
            result = toPrecision3(mag);
        } else if (mag < 1e9) {
            result = groupDigits(mag);
        } else {
            const exponent = Math.floor(Math.log10(mag));
            const mantissa = mag / Math.pow(10, exponent);
            result = toPrecision3(mantissa) + "e" + cleanNumberString(exponent);
        }
    } else {
        let magVal = x.mag;

        if (magVal instanceof Decimal) {
            const intPartDecimal = magVal.floor();
            const fracPartDecimal = magVal.sub(intPartDecimal);

            const intPart = intPartDecimal.toNumber();
            const fracPart = fracPartDecimal.toNumber();

            const coefficientDecimal = Decimal.pow10(fracPart);
            const coefficient = coefficientDecimal.toNumber();

            const absMag = Math.abs(magVal.toNumber());
            let coefficientStr, intPartStr;

            if (absMag < 1e6) {
                coefficientStr = toPrecision3(coefficient);
                intPartStr = groupDigits(intPart);
            } else if (absMag < 1e9) {
                coefficientStr = cleanNumberString(
                    coefficient.toPrecision(1).replace(/e\+/g, "e")
                );
                intPartStr = groupDigits(intPart);
            } else {
                coefficientStr = toPrecision3(coefficient);
                intPartStr = groupDigits(intPart);
            }

            const ePrefix = "e".repeat(x.layer - 1);
            result = ePrefix + coefficientStr + "e" + cleanNumberString(intPartStr);
        } else {
            const intPart = Math.floor(magVal);
            const fracPart = magVal - intPart;
            const coefficient = Math.pow(10, fracPart);
            const absMag = Math.abs(magVal);

            let coefficientStr, intPartStr;

            if (absMag < 1e6) {
                coefficientStr = toPrecision3(coefficient);
                intPartStr = groupDigits(intPart);
            } else if (absMag < 1e9) {
                coefficientStr = cleanNumberString(
                    coefficient.toPrecision(1).replace(/e\+/g, "e")
                );
                intPartStr = groupDigits(intPart);
            } else {
                coefficientStr = toPrecision3(coefficient);
                intPartStr = groupDigits(intPart);
            }

            const ePrefix = "e".repeat(x.layer - 1);
            result = ePrefix + coefficientStr + "e" + cleanNumberString(intPartStr);
        }
    }

    const match = result.match(/^(e+)/);
    if (match) {
        const n = match[1].length;
        if (n > 4) {
            const suffix = result.substring(n);
            result = "(e^" + n + ")" + suffix;
        }
    }

    if (x.sign === -1 && !(x.mag === 0 && x.layer === 0)) {
        result = "-" + result;
    }

    return result;
}
