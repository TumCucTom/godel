// Gödel Prime Encoder - Main Script

// Generate prime numbers using Sieve of Eratosthenes
function generatePrimes(count) {
    const primes = [];
    let num = 2;
    
    while (primes.length < count) {
        let isPrime = true;
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) {
                isPrime = false;
                break;
            }
        }
        if (isPrime) {
            primes.push(BigInt(num));
        }
        num++;
    }
    
    return primes;
}

// Pre-generate enough primes for reasonable input lengths
const PRIMES = generatePrimes(1000);

// Get character value: A-Z = 1-26, 0-9 = 27-36
function getCharValue(char) {
    const upper = char.toUpperCase();
    if (upper >= 'A' && upper <= 'Z') {
        return upper.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
    } else if (char >= '0' && char <= '9') {
        return char.charCodeAt(0) - '0'.charCodeAt(0) + 27;
    }
    return null;
}

// Validate input - only allow alphanumeric characters
function validateInput(text) {
    const validChars = /^[a-zA-Z0-9]+$/;
    return validChars.test(text);
}

// Calculate Gödel number using BigInt for arbitrary precision
function calculateGodelNumber(text) {
    let result = 1n;
    const breakdown = [];
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charValue = getCharValue(char);
        const prime = PRIMES[i];
        
        // Calculate prime^charValue
        const term = prime ** BigInt(charValue);
        result *= term;
        
        breakdown.push({
            position: i + 1,
            char: char,
            prime: prime,
            exponent: charValue,
            term: term
        });
    }
    
    return { number: result, breakdown };
}

// Convert BigInt to binary string
function toBinary(bigIntNum) {
    return bigIntNum.toString(2);
}

// Create encoding breakdown HTML
function createBreakdownHTML(breakdown) {
    return breakdown.map(item => `
        <span class="encoding-item">
            '${item.char}' → ${item.prime}<sup>${item.exponent}</sup>
        </span>
    `).join('');
}

// Create binary display HTML
function createBinaryHTML(binary) {
    // Limit display to first 5000 characters for performance
    const displayBinary = binary.length > 5000 
        ? binary.substring(0, 5000) + '...' 
        : binary;
    
    return displayBinary;
}

// Draw pixel grid - Black & White mode (1 bit per pixel)
function drawBWGrid(binary, canvas, ctx) {
    const totalBits = binary.length;
    const width = Math.ceil(Math.sqrt(totalBits));
    const height = Math.ceil(totalBits / width);
    
    const maxCanvasSize = 400;
    const pixelSize = Math.max(1, Math.min(16, Math.floor(maxCanvasSize / width)));
    
    canvas.width = width * pixelSize;
    canvas.height = height * pixelSize;
    
    for (let i = 0; i < width * height; i++) {
        const x = (i % width) * pixelSize;
        const y = Math.floor(i / width) * pixelSize;
        const bit = i < binary.length ? binary[i] : '0';
        
        ctx.fillStyle = bit === '1' ? 'white' : 'black';
        ctx.fillRect(x, y, pixelSize, pixelSize);
    }
    
    return { width, height, pixelSize, totalPixels: totalBits, bitsUsed: totalBits };
}

// Draw pixel grid - Greyscale mode (8 bits per pixel, 256 shades)
function drawGreyscaleGrid(binary, canvas, ctx) {
    const bitsPerPixel = 8;
    const totalPixels = Math.floor(binary.length / bitsPerPixel);
    
    if (totalPixels === 0) {
        // Not enough bits, fall back to B&W
        return drawBWGrid(binary, canvas, ctx);
    }
    
    const width = Math.ceil(Math.sqrt(totalPixels));
    const height = Math.ceil(totalPixels / width);
    
    const maxCanvasSize = 400;
    const pixelSize = Math.max(1, Math.min(16, Math.floor(maxCanvasSize / width)));
    
    canvas.width = width * pixelSize;
    canvas.height = height * pixelSize;
    
    for (let i = 0; i < width * height; i++) {
        const x = (i % width) * pixelSize;
        const y = Math.floor(i / width) * pixelSize;
        
        let grey = 0;
        if (i < totalPixels) {
            const bitStart = i * bitsPerPixel;
            const byteBits = binary.substring(bitStart, bitStart + bitsPerPixel);
            grey = parseInt(byteBits.padEnd(bitsPerPixel, '0'), 2);
        }
        
        ctx.fillStyle = `rgb(${grey}, ${grey}, ${grey})`;
        ctx.fillRect(x, y, pixelSize, pixelSize);
    }
    
    return { 
        width, 
        height, 
        pixelSize, 
        totalPixels: Math.min(totalPixels, width * height),
        bitsUsed: Math.min(totalPixels, width * height) * bitsPerPixel
    };
}

// Draw pixel grid - RGB mode (24 bits per pixel, 256^3 colors)
function drawRGBGrid(binary, canvas, ctx) {
    const bitsPerPixel = 24;
    const totalPixels = Math.floor(binary.length / bitsPerPixel);
    
    if (totalPixels === 0) {
        // Not enough bits, fall back to greyscale or B&W
        if (binary.length >= 8) {
            return drawGreyscaleGrid(binary, canvas, ctx);
        }
        return drawBWGrid(binary, canvas, ctx);
    }
    
    const width = Math.ceil(Math.sqrt(totalPixels));
    const height = Math.ceil(totalPixels / width);
    
    const maxCanvasSize = 400;
    const pixelSize = Math.max(1, Math.min(16, Math.floor(maxCanvasSize / width)));
    
    canvas.width = width * pixelSize;
    canvas.height = height * pixelSize;
    
    for (let i = 0; i < width * height; i++) {
        const x = (i % width) * pixelSize;
        const y = Math.floor(i / width) * pixelSize;
        
        let r = 0, g = 0, b = 0;
        if (i < totalPixels) {
            const bitStart = i * bitsPerPixel;
            const rBits = binary.substring(bitStart, bitStart + 8);
            const gBits = binary.substring(bitStart + 8, bitStart + 16);
            const bBits = binary.substring(bitStart + 16, bitStart + 24);
            
            r = parseInt(rBits.padEnd(8, '0'), 2);
            g = parseInt(gBits.padEnd(8, '0'), 2);
            b = parseInt(bBits.padEnd(8, '0'), 2);
        }
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y, pixelSize, pixelSize);
    }
    
    return { 
        width, 
        height, 
        pixelSize, 
        totalPixels: Math.min(totalPixels, width * height),
        bitsUsed: Math.min(totalPixels, width * height) * bitsPerPixel
    };
}

// Draw pixel grid based on selected mode
function drawPixelGrid(binary, mode) {
    const canvas = document.getElementById('pixel-grid');
    const ctx = canvas.getContext('2d');
    
    let result;
    let modeDescription;
    
    switch (mode) {
        case 'greyscale':
            result = drawGreyscaleGrid(binary, canvas, ctx);
            modeDescription = '8 bits/pixel, 256 shades';
            break;
        case 'rgb':
            result = drawRGBGrid(binary, canvas, ctx);
            modeDescription = '24 bits/pixel, 16.7M colors';
            break;
        case 'bw':
        default:
            result = drawBWGrid(binary, canvas, ctx);
            modeDescription = '1 bit/pixel';
            break;
    }
    
    document.getElementById('grid-dimensions').textContent = 
        `Grid: ${result.width} × ${result.height} pixels | ${result.totalPixels} pixels | ${result.bitsUsed} bits used | ${modeDescription}`;
}

// Main encode function
function encode() {
    const input = document.getElementById('text-input').value;
    const errorEl = document.getElementById('error-message');
    const resultSection = document.getElementById('result-section');
    
    // Clear previous error
    errorEl.textContent = '';
    
    // Validate input
    if (!input) {
        errorEl.textContent = 'Please enter some text.';
        resultSection.classList.add('hidden');
        return;
    }
    
    if (!validateInput(input)) {
        errorEl.textContent = 'Invalid characters! Only letters (A-Z, a-z) and numbers (0-9) are allowed.';
        resultSection.classList.add('hidden');
        return;
    }
    
    if (input.length > 100) {
        errorEl.textContent = 'Text too long! Maximum 100 characters for performance reasons.';
        resultSection.classList.add('hidden');
        return;
    }
    
    // Calculate Gödel number
    const { number, breakdown } = calculateGodelNumber(input);
    const numberStr = number.toString();
    const binary = toBinary(number);
    
    // Update breakdown
    document.getElementById('encoding-breakdown').innerHTML = createBreakdownHTML(breakdown);
    
    // Update Gödel number display
    document.getElementById('godel-number').textContent = numberStr;
    document.getElementById('digit-count').textContent = numberStr.length.toLocaleString();
    
    // Update binary display
    document.getElementById('binary-info').textContent = 
        `${binary.length.toLocaleString()} bits in binary representation`;
    document.getElementById('binary-display').textContent = createBinaryHTML(binary);
    
    // Draw pixel grid
    const colorMode = document.getElementById('color-mode').value;
    drawPixelGrid(binary, colorMode);
    
    // Show results
    resultSection.classList.remove('hidden');
    
    // Scroll to results
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const encodeBtn = document.getElementById('encode-btn');
    const textInput = document.getElementById('text-input');
    const colorMode = document.getElementById('color-mode');
    
    // Encode on button click
    encodeBtn.addEventListener('click', encode);
    
    // Encode on Enter key
    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            encode();
        }
    });
    
    // Filter input to only allow valid characters
    textInput.addEventListener('input', (e) => {
        const filtered = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
        if (filtered !== e.target.value) {
            e.target.value = filtered;
        }
    });
    
    // Re-render grid on color mode change
    colorMode.addEventListener('change', () => {
        const input = textInput.value;
        if (input && validateInput(input)) {
            const { number } = calculateGodelNumber(input);
            const binary = toBinary(number);
            drawPixelGrid(binary, colorMode.value);
        }
    });
});
