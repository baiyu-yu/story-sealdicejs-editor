/**
 * 验证输入是否为合法的掷骰表达式或纯数值
 */

const PURE_NUMBER_REGEX = /^-?\d+(\.\d+)?$/;
const DICE_PATTERN = /\d*d\d+/i;
const VALID_EXPR_CHARS = /^[\d\s+\-*/().dD]+$/;

/**
 * 检查是否为纯数值
 */
export const isPureNumber = (value: string | number): boolean => {
    if (typeof value === 'number') return true;
    const str = String(value).trim();
    if (!str) return true; 
    return PURE_NUMBER_REGEX.test(str);
};

/**
 * 检查是否为合法的掷骰表达式
 */
export const isDiceExpression = (value: string | number): boolean => {
    if (typeof value === 'number') return false;
    const str = String(value).trim().toLowerCase();
    if (!str) return false;

    if (!DICE_PATTERN.test(str)) return false;

    if (!VALID_EXPR_CHARS.test(str)) return false;

    let parenCount = 0;
    for (const char of str) {
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
        if (parenCount < 0) return false;
    }
    if (parenCount !== 0) return false;

    return true;
};

/**
 * 检查输入是否可能成为合法表达式
 * 允许：空值、纯数字、包含d但还没输完的情况
 */
export const isPartiallyValid = (value: string | number): boolean => {
    if (typeof value === 'number') return true;
    const str = String(value).trim();
    if (!str) return true;

    return VALID_EXPR_CHARS.test(str);
};

/**
 * 验证数值/掷骰表达式输入是否合法
 *
 * @returns { valid: boolean, error?: string }
 */
export const validateValueExpression = (value: string | number): { valid: boolean; error?: string } => {
    if (typeof value === 'number') {
        return { valid: true };
    }

    const str = String(value).trim();

    // 空值或纯空格
    if (!str) {
        return { valid: true };
    }

    // 纯数值
    if (isPureNumber(str)) {
        return { valid: true };
    }

    // 掷骰表达式
    if (isDiceExpression(str)) {
        return { valid: true };
    }

    // 是否包含非法字符
    if (!VALID_EXPR_CHARS.test(str)) {
        return {
            valid: false,
            error: '包含非法字符'
        };
    }

    // 未完成的表达式
    return {
        valid: false,
        error: '格式不完整'
    };
};
