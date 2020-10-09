export const  balance = (formulaStr) => {
	let eqn;
	try {
		eqn = parse(formulaStr);
	} catch (e) {
		if (typeof e === "string") {  // Simple error message string
			return ("Syntax error: " + e);
			
		} else if ("start" in e) {  // Error message object with start and possibly end character indices
			return ("Syntax error: " + e.message);
			
		} else {
			return ("Assertion error");
		}
	}
	
	try {
        console.log(eqn)
        let matrix = buildMatrix(eqn);                // Set up matrix
		solve(matrix);                                // Solve linear system
		let coefs = extractCoefficients(matrix);      // Get coefficients
        return eqn.toHtml(coefs).innerHTML;
	} catch (e) {
		return (e.toString());
	}
}

function buildMatrix(eqn) {
	let elems = eqn.getElements();
	let rows = elems.length + 1;
	let cols = eqn.getLeftSide().length + eqn.getRightSide().length + 1;
	let matrix = new Matrix(rows, cols);
	for (let i = 0; i < elems.length; i++) {
		let j = 0;
		for (let k = 0, lhs = eqn.getLeftSide() ; k < lhs.length; j++, k++)
			matrix.set(i, j,  lhs[k].countElement(elems[i]));
		for (let k = 0, rhs = eqn.getRightSide(); k < rhs.length; j++, k++)
			matrix.set(i, j, -rhs[k].countElement(elems[i]));
	}
	return matrix;
}


function solve(matrix) {
	matrix.gaussJordanEliminate();
	
	let i;
	for (i = 0; i < matrix.rowCount() - 1; i++) {
		if (countNonzeroCoeffs(matrix, i) > 1)
			break;
	}
	if (i === matrix.rowCount() - 1)
		throw new Error("All-zero solution");  // Unique solution with all coefficients zero
	
	// Add an inhomogeneous equation
	matrix.set(matrix.rowCount() - 1, i, 1);
	matrix.set(matrix.rowCount() - 1, matrix.columnCount() - 1, 1);
	
	matrix.gaussJordanEliminate();
}


function countNonzeroCoeffs(matrix, row) {
	let count = 0;
	for (let i = 0; i < matrix.columnCount(); i++) {
		if (matrix.get(row, i) !== 0)
			count++;
	}
	return count;
}


function extractCoefficients(matrix) {
	let rows = matrix.rowCount();
	let cols = matrix.columnCount();
	
	if (cols - 1 > rows || matrix.get(cols - 2, cols - 2) === 0)
		throw new Error("Multiple independent solutions");
	
	let lcm = 1;
	for (let i = 0; i < cols - 1; i++)
		lcm = checkedMultiply(lcm / gcd(lcm, matrix.get(i, i)), matrix.get(i, i));
	
	let coefs = [];
	let allzero = true;
	for (let i = 0; i < cols - 1; i++) {
		let coef = checkedMultiply(lcm / matrix.get(i, i), matrix.get(i, cols - 1));
		coefs.push(coef);
		allzero &= coef === 0;
	}
	if (allzero)
		throw new Error("Assertion error: All-zero solution");
	return coefs;
}


// A complete chemical equation. It has a left-hand side list of terms and a right-hand side list of terms.
// For example: H2 + O2 -> H2O.
function Equation(lhs, rhs) {
	// Make defensive copies
	lhs = cloneArray(lhs);
	rhs = cloneArray(rhs);
	
	this.getLeftSide  = function() { return cloneArray(lhs); }
	this.getRightSide = function() { return cloneArray(rhs); }
	
	// Returns an array of the names all of the elements used in this equation.
	// The array represents a set, so the items are in an arbitrary order and no item is repeated.
	this.getElements = function() {
		let result = new Set();
		for (let i = 0; i < lhs.length; i++)
			lhs[i].getElements(result);
		for (let i = 0; i < rhs.length; i++)
			rhs[i].getElements(result);
		return result.toArray();
	}
	
	// Returns an HTML element representing this equation.
	// 'coefs' is an optional argument, which is an array of coefficients to match with the terms.
	this.toHtml = function(coefs) {
		if (coefs !== undefined && coefs.length !== lhs.length + rhs.length)
			throw new Error("Mismatched number of coefficients");
		
		// Creates this kind of DOM node: <span class="className">text</span>
		function createSpan(text, className) {
			let span = document.createElement("span");
			appendText(text, span);
			span.className = className;
			return span;
		}
		
		let node = document.createElement("span");
		
		let j = 0;
		function termsToHtml(terms) {
			let head = true;
			for (let i = 0; i < terms.length; i++, j++) {
				let coef = coefs !== undefined ? coefs[j] : 1;
				if (coef !== 0) {
					if (head) head = false;
					else node.appendChild(createSpan(" + ", "plus"));
					if (coef !== 1)
						node.appendChild(createSpan(coef.toString().replace(/-/, MINUS), "coefficient"));
					node.appendChild(terms[i].toHtml());
				}
			}
		}
		
		termsToHtml(lhs);
		node.appendChild(createSpan(" " + RIGHT_ARROW + " ", "rightarrow"));
		termsToHtml(rhs);
		
		return node;
    }
    this.toHtml1 = function() {
		function createSpan(text, className) {
			let span = document.createElement("span");
			appendText(text, span);
			span.className = className;
			return span;
		}
		
		let node = document.createElement("span");
		
		let j = 0;
		function termsToHtml(terms) {
			let head = true;
			for (let i = 0; i < terms.length; i++, j++) {
				let coef = 1;
				if (coef !== 0) {
					if (head) head = false;
					else node.appendChild(createSpan(" + ", "plus"));
					if (coef !== 1)
						node.appendChild(createSpan(coef.toString().replace(/-/, MINUS), "coefficient"));
					node.appendChild(terms[i].toHtml());
				}
			}
		}
		
		termsToHtml(lhs);
		node.appendChild(createSpan(" " + RIGHT_ARROW + " ", "rightarrow"));
		termsToHtml(rhs);
		
		return node.innerHTML;
	}
}


// A term in a chemical equation. It has a list of groups or elements, and a charge.
// For example: H3O^+, or e^-.
function Term(items, charge) {
	if (items.length === 0 && charge !== -1)
		throw new Error("Invalid term");  // Electron case
	
	items = cloneArray(items);
	
	this.getItems = function() { return cloneArray(items); }
	
	this.getElements = function(resultSet) {
		resultSet.add("e");
		for (let i = 0; i < items.length; i++)
			items[i].getElements(resultSet);
	}
	
	// Counts the number of times the given element (specified as a string) occurs in this term, taking groups and counts into account, returning an integer.
	this.countElement = function(name) {
		if (name === "e") {
			return -charge;
		} else {
			let sum = 0;
			for (let i = 0; i < items.length; i++)
				sum = checkedAdd(sum, items[i].countElement(name));
			return sum;
		}
	}
	
	// Returns an HTML element representing this term.
	this.toHtml = function() {
		let node = document.createElement("span");
		if (items.length === 0 && charge === -1) {
			appendText("e", node);
			let sup = document.createElement("sup");
			appendText(MINUS, sup);
			node.appendChild(sup);
		} else {
			for (let i = 0; i < items.length; i++)
				node.appendChild(items[i].toHtml());
			if (charge !== 0) {
				let sup = document.createElement("sup");
				let s;
				if (Math.abs(charge) === 1) s = "";
				else s = Math.abs(charge).toString();
				if (charge > 0) s += "+";
				else s += MINUS;
				appendText(s, sup);
				node.appendChild(sup);
			}
		}
		return node;
	}
}


// A group in a term. It has a list of groups or elements.
// For example: (OH)3
function Group(items, count) {
	if (count < 1)
		throw new Error("Assertion error: Count must be a positive integer");
	items = cloneArray(items);
	
	this.getItems = function() { return cloneArray(items); }
	
	this.getCount = function() { return count; }
	
	this.getElements = function(resultSet) {
		for (let i = 0; i < items.length; i++)
			items[i].getElements(resultSet);
	}
	
	this.countElement = function(name) {
		let sum = 0;
		for (let i = 0; i < items.length; i++)
			sum = checkedAdd(sum, checkedMultiply(items[i].countElement(name), count));
		return sum;
	}
	
	// Returns an HTML element representing this group.
	this.toHtml = function() {
		let node = document.createElement("span");
		appendText("(", node);
		for (let i = 0; i < items.length; i++)
			node.appendChild(items[i].toHtml());
		appendText(")", node);
		if (count !== 1) {
			let sub = document.createElement("sub");
			appendText(count.toString(), sub);
			node.appendChild(sub);
		}
		return node;
	}
}


// A chemical element.
// For example: Na, F2, Ace, Uuq6
function Element(name, count) {
	if (count < 1)
		throw new Error("Assertion error: Count must be a positive integer");
	
	this.getName = function() { return name; }
	
	this.getCount = function() { return count; }
	
	this.getElements = function(resultSet) { resultSet.add(name); }
	
	this.countElement = function(n) { return n === name ? count : 0; }
	
	// Returns an HTML element representing this element.
	this.toHtml = function() {
		let node = document.createElement("span");
		appendText(name, node);
		if (count !== 1) {
			let sub = document.createElement("sub");
			appendText(count.toString(), sub);
			node.appendChild(sub);
		}
		return node;
	}
}


/* Parser functions */

// Parses the given formula string and returns an equation object, or throws an exception.
function parse(formulaStr) {
	let tokenizer = new Tokenizer(formulaStr);
	return parseEquation(tokenizer);
}


// Parses and returns an equation.
function parseEquation(tok) {
	let lhs = [];
	let rhs = [];
	
	lhs.push(parseTerm(tok));
	while (true) {
		let next = tok.peek();
		if (next === "=") {
			tok.consume("=");
			break;
		} else if (next === null) {
			throw new Error({message: "Plus or equal sign expected", start: tok.position()})
		} else if (next === "+") {
			tok.consume("+");
			lhs.push(parseTerm(tok));
		} else
			throw new Error({message: "Plus expected", start: tok.position()})
	}
	
	rhs.push(parseTerm(tok));
	while (true) {
		let next = tok.peek();
		if (next === null)
			break;
		else if (next === "+") {
			tok.consume("+");
			rhs.push(parseTerm(tok));
		} else
			throw new Error({message: "Plus or end expected", start: tok.position()})
	}
	
	return new Equation(lhs, rhs);
}


// Parses and returns a term.
function parseTerm(tok) {
	let startPosition = tok.position();
	
	// Parse groups and elements
	let items = [];
	while (true) {
		let next = tok.peek();
		if (next === null)
			break;
		else if (next === "(")
			items.push(parseGroup(tok));
		else if (/^[A-Za-z][a-z]*$/.test(next))
			items.push(parseElement(tok));
		else
			break;
	}
	
	// Parse optional charge
	let charge = 0;
	let next = tok.peek();
	if (next != null && next === "^") {
		tok.consume("^");
		next = tok.peek();
		if (next === null)
			throw new Error({message: "Number or sign expected", start: tok.position()});
		else
			charge = parseOptionalNumber(tok);
		
		next = tok.peek();
		if (next === "+")
			charge = +charge;  // No-op
		else if (next === "-")
			charge = -charge;
		else
			throw new Error({message: "Sign expected", start: tok.position()});
		tok.take();  // Consume the sign
	}
	
	// Check if term is valid
	let elems = new Set();
	for (let i = 0; i < items.length; i++)
		items[i].getElements(elems);
	elems = elems.toArray();  // List of all elements used in this term, with no repeats
	if (items.length === 0) {
		throw new Error({message: "Invalid term - empty", start: startPosition, end: tok.position()});
	} else if (elems.indexOf("e") !== -1) {  // If it's the special electron element
		if (items.length > 1)
			throw new Error({message: "Invalid term - electron needs to stand alone", start: startPosition, end: tok.position()})
		else if (charge !== 0 && charge !== -1)
			throw new Error({message: "Invalid term - invalid charge for electron", start: startPosition, end: tok.position()})
		// Tweak data
		items = [];
		charge = -1;
	} else {  // Otherwise, a term must not contain an element that starts with lowercase
		for (let i = 0; i < elems.length; i++) {
			if (/^[a-z]+$/.test(elems[i]))
				throw new Error({message: 'Invalid element name "' + elems[i] + '"', start: startPosition, end: tok.position()});
		}
	}
	
	return new Term(items, charge);
}


// Parses and returns a group.
function parseGroup(tok) {
	let startPosition = tok.position();
	tok.consume("(");
	let items = [];
	while (true) {
		let next = tok.peek();
		if (next === null)
			throw new Error({message: "Element, group, or closing parenthesis expected", start: tok.position()});
		else if (next === "(")
			items.push(parseGroup(tok));
		else if (/^[A-Za-z][a-z]*$/.test(next))
			items.push(parseElement(tok));
		else if (next === ")") {
			tok.consume(")");
			if (items.length === 0)
				throw new Error({message: "Empty group", start: startPosition, end: tok.position()});
			break;
		} else
			throw new Error({message: "Element, group, or closing parenthesis expected", start: tok.position()});
	}
	
	return new Group(items, parseOptionalNumber(tok));
}


// Parses and returns an element.
function parseElement(tok) {
	let name = tok.take();
	if (!/^[A-Za-z][a-z]*$/.test(name))
		throw new Error("Assertion error");
	return new Element(name, parseOptionalNumber(tok));
}


// Parses a number if it's the next token, returning a non-negative integer, with a default of 1.
function parseOptionalNumber(tok) {
	let next = tok.peek();
	if (next != null && /^[0-9]+$/.test(next))
		return checkedParseInt(tok.take());
	else
		return 1;
}


/* Tokenizer object */

// Tokenizes a formula into a stream of token strings.
function Tokenizer(str) {
	let i = 0;
	
	// Returns the index of the next character to tokenize.
	this.position = function() {
		return i;
	}
	
	// Returns the next token as a string, or null if the end of the token stream is reached.
	this.peek = function() {
		if (i === str.length)  // End of stream
			return null;
		
		let match = /^([A-Za-z][a-z]*|[0-9]+|[+\-^=()])/.exec(str.substring(i));
		if (match === null)
			throw new Error({message: "Invalid symbol", start: i});
		return match[0];
	}
	
	// Returns the next token as a string and advances this tokenizer past the token.
	this.take = function() {
		let result = this.peek();
		if (result === null)
			throw new Error("Advancing beyond last token")
		i += result.length;
		skipSpaces();
		return result;
	}
	
	// Takes the next token and checks that it matches the given string, or throws an exception.
	this.consume = function(s) {
		if (this.take() !== s)
			throw new Error("Token mismatch");
	}
	
	function skipSpaces() {
		let match = /^[ \t]*/.exec(str.substring(i));
		i += match[0].length;
	}
	
	str = str.replace(/\u2212/g, "-");
	skipSpaces();
}


/* Matrix object */

// A matrix of integers.
function Matrix(rows, cols) {
	if (rows < 0 || cols < 0)
		throw new Error("Illegal argument");
	
	// Initialize with zeros
	let row = [];
	for (let j = 0; j < cols; j++)
		row.push(0);
	let cells = [];  // Main data (the matrix)
	for (let i = 0; i < rows; i++)
		cells.push(cloneArray(row));
	row = null;
	
	/* Accessor functions */
	
	this.rowCount = function() { return rows; }
	this.columnCount = function() { return cols; }
	
	// Returns the value of the given cell in the matrix, where r is the row and c is the column.
	this.get = function(r, c) {
		if (r < 0 || r >= rows || c < 0 || c >= cols)
			throw new Error("Index out of bounds");
		return cells[r][c];
	}
	
	// Sets the given cell in the matrix to the given value, where r is the row and c is the column.
	this.set = function(r, c, val) {
		if (r < 0 || r >= rows || c < 0 || c >= cols)
			throw new Error("Index out of bounds");
		cells[r][c] = val;
	}
	
	/* Private helper functions for gaussJordanEliminate() */
	
	// Swaps the two rows of the given indices in this matrix. The degenerate case of i == j is allowed.
	function swapRows(i, j) {
		if (i < 0 || i >= rows || j < 0 || j >= rows)
			throw new Error("Index out of bounds");
		let temp = cells[i];
		cells[i] = cells[j];
		cells[j] = temp;
	}
	
	// Returns a new row that is the sum of the two given rows. The rows are not indices. This object's data is unused.
	// For example, addRow([3, 1, 4], [1, 5, 6]) = [4, 6, 10].
	function addRows(x, y) {
		let z = cloneArray(x);
		for (let i = 0; i < z.length; i++)
			z[i] = checkedAdd(x[i], y[i]);
		return z;
	}
	
	// Returns a new row that is the product of the given row with the given scalar. The row is is not an index. This object's data is unused.
	// For example, multiplyRow([0, 1, 3], 4) = [0, 4, 12].
	function multiplyRow(x, c) {
		let y = cloneArray(x);
		for (let i = 0; i < y.length; i++)
			y[i] = checkedMultiply(x[i], c);
		return y;
	}
	
	// Returns the GCD of all the numbers in the given row. The row is is not an index. This object's data is unused.
	// For example, gcdRow([3, 6, 9, 12]) = 3.
	function gcdRow(x) {
		let result = 0;
		for (let i = 0; i < x.length; i++)
			result = gcd(x[i], result);
		return result;
	}
	
	// Returns a new row where the leading non-zero number (if any) is positive, and the GCD of the row is 0 or 1. This object's data is unused.
	// For example, simplifyRow([0, -2, 2, 4]) = [0, 1, -1, -2].
	function simplifyRow(x) {
		let sign = 0;
		for (let i = 0; i < x.length; i++) {
			if (x[i] > 0) {
				sign = 1;
				break;
			} else if (x[i] < 0) {
				sign = -1;
				break;
			}
		}
		let y = cloneArray(x);
		if (sign === 0)
			return y;
		let g = gcdRow(x) * sign;
		for (let i = 0; i < y.length; i++)
			y[i] /= g;
		return y;
	}
	
	// Changes this matrix to reduced row echelon form (RREF), except that each leading coefficient is not necessarily 1. Each row is simplified.
	this.gaussJordanEliminate = function() {
		// Simplify all rows
		for (let i = 0; i < rows; i++)
			cells[i] = simplifyRow(cells[i]);
		
		// Compute row echelon form (REF)
		let numPivots = 0;
		for (let i = 0; i < cols; i++) {
			// Find pivot
			let pivotRow = numPivots;
			while (pivotRow < rows && cells[pivotRow][i] === 0)
				pivotRow++;
			if (pivotRow === rows)
				continue;
			let pivot = cells[pivotRow][i];
			swapRows(numPivots, pivotRow);
			numPivots++;
			
			// Eliminate below
			for (let j = numPivots; j < rows; j++) {
				let g = gcd(pivot, cells[j][i]);
				cells[j] = simplifyRow(addRows(multiplyRow(cells[j], pivot / g), multiplyRow(cells[i], -cells[j][i] / g)));
			}
		}
		
		// Compute reduced row echelon form (RREF), but the leading coefficient need not be 1
		for (let i = rows - 1; i >= 0; i--) {
			// Find pivot
			let pivotCol = 0;
			while (pivotCol < cols && cells[i][pivotCol] === 0)
				pivotCol++;
			if (pivotCol === cols)
				continue;
			let pivot = cells[i][pivotCol];
			
			// Eliminate above
			for (let j = i - 1; j >= 0; j--) {
				let g = gcd(pivot, cells[j][pivotCol]);
				cells[j] = simplifyRow(addRows(multiplyRow(cells[j], pivot / g), multiplyRow(cells[i], -cells[j][pivotCol] / g)));
			}
		}
	}
	
	// Returns a string representation of this matrix, for debugging purposes.
	this.toString = function() {
		let result = "[";
		for (let i = 0; i < rows; i++) {
			if (i !== 0) result += "],\n";
			result += "[";
			for (let j = 0; j < cols; j++) {
				if (j !== 0) result += ", ";
				result += cells[i][j];
			}
			result += "]";
		}
		return result + "]";
	}
}


/* Set object */

function Set() {
	// Storage for the set
	let items = [];
	
	// Adds the given object to the set. Returns nothing.
	this.add = function(obj) {
		if (items.indexOf(obj) === -1)
			items.push(obj);
	}
	
	// Tests if the given object is in the set, returning a Boolean.
	this.contains = function(obj) {
		return items.indexOf(obj) !== -1;
	}
	
	// Returns an array containing the elements of this set in an arbitrary order, with no duplicates.
	this.toArray = function() {
		return cloneArray(items);
	}
}


/* Math functions (especially checked integer operations) */

let INT_MAX = 9007199254740992;  // 2^53

// Returns the given string parsed into a number, or throws an exception if the result is too large.
function checkedParseInt(str) {
	let result = parseInt(str, 10);
	if (isNaN(result))
		throw new Error("Not a number")
	if (result <= -INT_MAX || result >= INT_MAX)
		throw new Error("Arithmetic overflow");
	return result;
}

// Returns the sum of the given integers, or throws an exception if the result is too large.
function checkedAdd(x, y) {
	let z = x + y;
	if (z <= -INT_MAX || z >= INT_MAX)
		throw new Error("Arithmetic overflow");
	return z;
}

// Returns the product of the given integers, or throws an exception if the result is too large.
function checkedMultiply(x, y) {
	let z = x * y;
	if (z <= -INT_MAX || z >= INT_MAX)
		throw new Error("Arithmetic overflow");
	return z;
}


// Returns the greatest common divisor of the given integers.
function gcd(x, y) {
	if (typeof x != "number" || typeof y != "number" || isNaN(x) || isNaN(y))
		throw new Error("Invalid argument");
	x = Math.abs(x);
	y = Math.abs(y);
	while (y !== 0) {
		let z = x % y;
		x = y;
		y = z;
	}
	return x;
}


/* Miscellaneous */

// Unicode character constants (because this script file's character encoding is unspecified)
let MINUS = "\u2212";        // Minus sign
let RIGHT_ARROW = "\u2192";  // Right arrow

// Returns a shallow copy of the given array. Usually used for making defensive copies.
function cloneArray(array) {
	return array.slice(0);
}

// Creates a new text node with the given text and appends it to the given DOM node. Returns nothing.
function appendText(text, node) {
	node.appendChild(document.createTextNode(text));
}