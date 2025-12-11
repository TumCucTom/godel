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

// Color schemes for pixel grid
const colorSchemes = {
    bw: {
        zero: [20, 20, 30],
        one: [255, 255, 255]
    },
    green: {
        zero: [10, 20, 10],
        one: [0, 255, 100]
    },
    blue: {
        zero: [10, 20, 40],
        one: [100, 200, 255]
    },
    fire: {
        zero: [30, 10, 10],
        one: [255, 100, 50]
    },
    rainbow: null // Special handling for position-based rainbow
};

// Get rainbow color based on position
function getRainbowColor(index, total) {
    const hue = (index / total) * 360;
    const h = hue / 60;
    const c = 255;
    const x = c * (1 - Math.abs(h % 2 - 1));
    
    let r, g, b;
    if (h < 1) { r = c; g = x; b = 0; }
    else if (h < 2) { r = x; g = c; b = 0; }
    else if (h < 3) { r = 0; g = c; b = x; }
    else if (h < 4) { r = 0; g = x; b = c; }
    else if (h < 5) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    return [Math.round(r), Math.round(g), Math.round(b)];
}

// Draw pixel grid on canvas
function drawPixelGrid(binary, scheme) {
    const canvas = document.getElementById('pixel-grid');
    const ctx = canvas.getContext('2d');
    
    // Calculate grid dimensions (aim for roughly square)
    const totalBits = binary.length;
    const width = Math.ceil(Math.sqrt(totalBits));
    const height = Math.ceil(totalBits / width);
    
    // Set pixel size based on grid dimensions
    const maxCanvasSize = 500;
    const pixelSize = Math.max(1, Math.min(20, Math.floor(maxCanvasSize / width)));
    
    canvas.width = width * pixelSize;
    canvas.height = height * pixelSize;
    
    // Get color scheme
    const colors = colorSchemes[scheme];
    
    // Draw pixels
    for (let i = 0; i < totalBits; i++) {
        const x = (i % width) * pixelSize;
        const y = Math.floor(i / width) * pixelSize;
        const bit = binary[i];
        
        let color;
        if (scheme === 'rainbow') {
            if (bit === '1') {
                color = getRainbowColor(i, totalBits);
            } else {
                color = [20, 20, 30];
            }
        } else {
            color = bit === '1' ? colors.one : colors.zero;
        }
        
        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        ctx.fillRect(x, y, pixelSize, pixelSize);
    }
    
    // Pad remaining cells with zero color
    const remainingCells = width * height - totalBits;
    for (let i = 0; i < remainingCells; i++) {
        const index = totalBits + i;
        const x = (index % width) * pixelSize;
        const y = Math.floor(index / width) * pixelSize;
        
        const zeroColor = scheme === 'rainbow' ? [20, 20, 30] : colors.zero;
        ctx.fillStyle = `rgb(${zeroColor[0]}, ${zeroColor[1]}, ${zeroColor[2]})`;
        ctx.fillRect(x, y, pixelSize, pixelSize);
    }
    
    // Update dimensions display
    document.getElementById('grid-dimensions').textContent = 
        `Grid: ${width} × ${height} pixels (${totalBits} bits, pixel size: ${pixelSize}px)`;
    
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
