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
            <span class="char">'${item.char}'</span> → 
            <span class="prime">${item.prime}</span><sup class="exp">${item.exponent}</sup>
        </span>
    `).join('');
}

// Create binary display HTML with colored digits
function createBinaryHTML(binary) {
    // Limit display to first 10000 characters for performance
    const displayBinary = binary.length > 10000 
        ? binary.substring(0, 10000) + '...' 
        : binary;
    
    return displayBinary.split('').map(bit => 
        `<span class="${bit === '1' ? 'one' : 'zero'}">${bit}</span>`
    ).join('');
}

// Convert binary string chunk to integer value
function binaryToInt(binaryStr) {
    let value = 0;
    for (let i = 0; i < binaryStr.length; i++) {
        value = value * 2 + (binaryStr[i] === '1' ? 1 : 0);
    }
    return value;
}

// Draw pixel grid on canvas
function drawPixelGrid(binary, mode) {
    const canvas = document.getElementById('pixel-grid');
    const ctx = canvas.getContext('2d');
    
    let pixels = [];
    let bitsPerPixel;
    let modeDescription;
    
    if (mode === 'bw') {
        // Black & White (1-bit): each bit is a pixel
        bitsPerPixel = 1;
        modeDescription = '1-bit Black & White';
        for (let i = 0; i < binary.length; i++) {
            const value = binary[i] === '1' ? 255 : 0;
            pixels.push([value, value, value]);
        }
    } else if (mode === 'greyscale') {
        // Greyscale (8-bit): every 8 bits = one grey level (0-255)
        bitsPerPixel = 8;
        modeDescription = '8-bit Greyscale (256 levels)';
        for (let i = 0; i < binary.length; i += 8) {
            const chunk = binary.substring(i, Math.min(i + 8, binary.length));
            // Pad with zeros if needed
            const paddedChunk = chunk.padEnd(8, '0');
            const greyValue = binaryToInt(paddedChunk);
            pixels.push([greyValue, greyValue, greyValue]);
        }
    } else if (mode === 'rgb') {
        // Full RGB (24-bit): every 24 bits = one RGB pixel
        bitsPerPixel = 24;
        modeDescription = '24-bit RGB (16.7M colours)';
        for (let i = 0; i < binary.length; i += 24) {
            const chunk = binary.substring(i, Math.min(i + 24, binary.length));
            // Pad with zeros if needed
            const paddedChunk = chunk.padEnd(24, '0');
            const r = binaryToInt(paddedChunk.substring(0, 8));
            const g = binaryToInt(paddedChunk.substring(8, 16));
            const b = binaryToInt(paddedChunk.substring(16, 24));
            pixels.push([r, g, b]);
        }
    }
    
    const totalPixels = pixels.length;
    
    // Calculate grid dimensions (aim for roughly square)
    const width = Math.ceil(Math.sqrt(totalPixels));
    const height = Math.ceil(totalPixels / width);
    
    // Set pixel size based on grid dimensions
    const maxCanvasSize = 500;
    const pixelSize = Math.max(1, Math.min(20, Math.floor(maxCanvasSize / width)));
    
    canvas.width = width * pixelSize;
    canvas.height = height * pixelSize;
    
    // Draw pixels
    for (let i = 0; i < totalPixels; i++) {
        const x = (i % width) * pixelSize;
        const y = Math.floor(i / width) * pixelSize;
        const color = pixels[i];
        
        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        ctx.fillRect(x, y, pixelSize, pixelSize);
    }
    
    // Pad remaining cells with black
    const remainingCells = width * height - totalPixels;
    for (let i = 0; i < remainingCells; i++) {
        const index = totalPixels + i;
        const x = (index % width) * pixelSize;
        const y = Math.floor(index / width) * pixelSize;
        
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(x, y, pixelSize, pixelSize);
    }
    
    // Update dimensions display
    document.getElementById('grid-dimensions').textContent = 
        `${modeDescription} | Grid: ${width} × ${height} pixels (${totalPixels} pixels from ${binary.length} bits)`;
    
    return { width, height, pixelSize };
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
    document.getElementById('binary-display').innerHTML = createBinaryHTML(binary);
    
    // Draw pixel grid
    const colorScheme = document.getElementById('color-scheme').value;
    drawPixelGrid(binary, colorScheme);
    
    // Show results
    resultSection.classList.remove('hidden');
    
    // Scroll to results
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const encodeBtn = document.getElementById('encode-btn');
    const textInput = document.getElementById('text-input');
    const colorScheme = document.getElementById('color-scheme');
    
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
    
    // Re-render grid on color scheme change
    colorScheme.addEventListener('change', () => {
        const input = textInput.value;
        if (input && validateInput(input)) {
            const { number } = calculateGodelNumber(input);
            const binary = toBinary(number);
            drawPixelGrid(binary, colorScheme.value);
        }
    });
});
