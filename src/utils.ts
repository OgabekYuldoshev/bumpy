export function generateCuid(): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    // Generate timestamp part
    const timestamp = Date.now().toString(36);
    // Generate a random string part
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map((num) => alphabet[num % alphabet.length])
        .join('');
    // Combine the parts into a final cuid-like identifier
    return `c${timestamp}${randomPart}`;
}
