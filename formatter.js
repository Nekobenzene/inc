// formatter.js

function formatDecimal(x) {
    x = new Decimal(x).normalize();
    if (x.sign === 0 || (x.mag === 0 && x.layer === 0)) return "0";
    if (Object.is(x.sign, -0) || x.sign === -0) return "0";
    if (x.isNan()) return "NaN";
    if (!isFinite(x.layer) || !isFinite(x.mag)) {
        if (x.layer === Infinity || x.mag === Infinity) return x.sign === 1 ? "Infinity" : "-Infinity";
        return "NaN";
    }
    
    function toPrecision3(num) {
        // num 可能是 Decimal 或 number
        if (num instanceof Decimal) {
            // 用 Decimal 的方法处理
            if (num.layer === 0) {
                const n = num.toNumber();
                if (!isFinite(n)) return "Infinity";
                let s = n.toPrecision(3);
                return s.replace(/e\+/g, 'e');
            }
            // 如果 num 是 Decimal 且 layer > 0，递归调用
            return formatDecimal(num);
        }
        let s = num.toPrecision(3);
        return s.replace(/e\+/g, 'e');
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
        return parts.join(' ');
    }
    
    let result = '';
    if (x.layer === 0) {
        const mag = x.mag; // mag 是 number (layer=0 时)
        if (mag < 0.001 && mag !== 0) {
            const exponent = Math.floor(Math.log10(mag));
            const mantissa = mag * Math.pow(10, -exponent);
            result = toPrecision3(mantissa) + 'e' + exponent;
        } else if (mag < 1000) {
            result = toPrecision3(mag);
        } else if (mag < 1e9) {
            result = groupDigits(mag);
        } else {
            const exponent = Math.floor(Math.log10(mag));
            const mantissa = mag / Math.pow(10, exponent);
            result = toPrecision3(mantissa) + 'e' + exponent;
        }
    } else {
        // 🔥 关键修改：这里用 Decimal 的方法处理 mag
        let magVal = x.mag;
        
        // 如果 mag 是 Decimal，用 Decimal 方法提取整数部分
        if (magVal instanceof Decimal) {
            // 用 Decimal.floor() 获取整数部分
            const intPartDecimal = magVal.floor();
            // 用 Decimal.sub() 获取小数部分
            const fracPartDecimal = magVal.sub(intPartDecimal);
            
            // 转为 number（这里 safe，因为 mag 在 layer>=1 时通常在 0-16 之间）
            const intPart = intPartDecimal.toNumber();
            const fracPart = fracPartDecimal.toNumber();
            
            // 用 Decimal.pow10() 计算系数
            const coefficientDecimal = Decimal.pow10(fracPart);
            const coefficient = coefficientDecimal.toNumber();
            
            const absMag = Math.abs(magVal.toNumber());
            let coefficientStr, intPartStr;
            if (absMag < 1e6) {
                coefficientStr = toPrecision3(coefficient);
                intPartStr = groupDigits(intPart);
            } else if (absMag < 1e9) {
                coefficientStr = coefficient.toPrecision(1).replace(/e\+/g, 'e');
                intPartStr = groupDigits(intPart);
            } else {
                coefficientStr = toPrecision3(coefficient);
                intPartStr = groupDigits(intPart);
            }
            const ePrefix = 'e'.repeat(x.layer - 1);
            result = ePrefix + coefficientStr + 'e' + intPartStr;
        } else {
            // mag 是 number（原来的逻辑）
            const intPart = Math.floor(magVal);
            const fracPart = magVal - intPart;
            const coefficient = Math.pow(10, fracPart);
            const absMag = Math.abs(magVal);
            let coefficientStr, intPartStr;
            if (absMag < 1e6) {
                coefficientStr = toPrecision3(coefficient);
                intPartStr = groupDigits(intPart);
            } else if (absMag < 1e9) {
                coefficientStr = coefficient.toPrecision(1).replace(/e\+/g, 'e');
                intPartStr = groupDigits(intPart);
            } else {
                coefficientStr = toPrecision3(coefficient);
                intPartStr = groupDigits(intPart);
            }
            const ePrefix = 'e'.repeat(x.layer - 1);
            result = ePrefix + coefficientStr + 'e' + intPartStr;
        }
    }
    
    const match = result.match(/^(e+)/);
    if (match) {
        const n = match[1].length;
        if (n > 4) {
            const suffix = result.substring(n);
            result = '(e^' + n + ')' + suffix;
        }
    }
    if (x.sign === -1 && !(x.mag === 0 && x.layer === 0)) result = '-' + result;
    return result;
}