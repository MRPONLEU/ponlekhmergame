const wordInput = 'ផ្គត់ផ្គង់';
const chars = Array.from(wordInput.trim());
const splitChars = [];
for (let i = 0; i < chars.length; i++) {
  if (chars[i] === '\u17D2' && i + 1 < chars.length) {
    splitChars.push(chars[i] + chars[i+1]);
    i++;
  } else {
    splitChars.push(chars[i]);
  }
}
console.log(splitChars.join(', '));
