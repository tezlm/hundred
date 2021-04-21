const token = (type, value) => ({ type, value });
const isDigit = char => char >= '0' && char <= '9';
const isLowerAlpha = char => char >= 'a' && char <= 'z';
const isUpperAlpha = char => char >= 'A' && char <= 'Z';
const isAlpha = char => isLowerAlpha(char) || isUpperAlpha(char);
const isStarter = char => isAlpha(char) || char === "_";
const isQuote = char => char === "'" || char === '"';
const isWhitespace = char => /\s/.test(char);

function getEscape(eq) {
	const what = eq.next();
	switch(what) {
		case 'n': return '\n';
		case 't': return '\t';
		case 'r': return '\r';
		case 'b': return '\b';
		case '0': return '\0';
		case 'u':
			const raw = eq.next() + eq.next() + eq.next() + eq.next();
			const code = parseInt(raw, 16);
			if(!code) throw "invalid unicode";
			return String.fromCharCode(code);
	}
	return what;
}

function number(eq) {
	let buffer = "";
	let usedDecimal = false;
	if(eq.peek() === '0') buffer += eq.next() + eq.next();
	while(true) {
		const char = eq.peek();
		if(isDigit(char)) {
			buffer += eq.next();
		} else if(char === '.') {
			if(usedDecimal) throw "extra decimal point";
			buffer += eq.next();
			if(!isDigit(eq.peek())) throw "bad decimal point";
			usedDecimal = true;
		} else break;
	}
	if(isNaN(buffer)) throw "not a number";
	return token("number", Number(buffer));
}

function str(eq) {
	const type = eq.next();
	if(!isQuote(type)) throw "bad quote";
	let buffer = "";
	while(true) {
		const char = eq.next();
		if(!char) throw "unterminated string";
		if(char === type) break; 
		if(char === '\\') {
			buffer += getEscape(eq);
		} else {
			buffer += char;
		}
	}
	return token("string", buffer);
}

function word(eq) {
	let buffer = eq.next();
	if(!isStarter(buffer)) throw "invalid word";
	while(true) {
		const char = eq.peek();
		if(!isStarter(char) && !isDigit(char)) break;
		buffer += eq.next();
	}
	return token("word", buffer);
}

function tokenize(eq) {
	const tokens = [];
	const gen = {
		i: 0,
		next: () => eq[gen.i++],
		peek: () => eq[gen.i],
	};
	while(gen.i < eq.length) {
		const char = gen.peek();
		if(isDigit(char)) {
			tokens.push(number(gen));
		} else if(isStarter(char)) {
			tokens.push(word(gen));
		} else if(isQuote(char)) {
			tokens.push(str(gen));
		} else if(isWhitespace(char)) {
			gen.next();
		} else {
			tokens.push(token("symbol", gen.next()));
		};
	}
	return tokens;
}

module.exports = tokenize;
