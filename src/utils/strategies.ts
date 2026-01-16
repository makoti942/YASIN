export const runTop5Consensus = (ticks) => {
    // Basic frequency analysis for digits
    const digits = Array(10).fill(0).map((_, i) => ({ digit: i, count: 0 }));
    ticks.forEach(tick => {
        const lastDigit = parseInt(tick.quote.toString().slice(-1));
        if (!isNaN(lastDigit)) digits[lastDigit].count++;
    });
    return {
        digits: digits.sort((a, b) => b.count - a.count).map(d => d.digit),
        confidence: 0.85
    };
};
