// by ZestyLemonade
const size = 3;

function generateBoard() {
	const board = [];
	for(let i = 0; i < size; i++) {
		const row = [];
		for(let j = 0; j < size; j++) row.push(null);
		board.push(row);
	}
	return board;
}

function check(board, who, getSquare) {
	if(!who) return null;
	for(let i = 1; i < board.length; i++) {
		if(getSquare(i) !== who) return null;
	}
	return who;
}

function checkRow(board, row) {
	return check(board, board[row][0], i => board[row][i]);
}

function checkColumn(board, column) {
	return check(board, board[0][column], i => board[i][column]);
}

function checkDiagonals(board, x, y) {
	return check(board, board[0][0], (i) => board[i][i])
		|| check(board, board[0][board.length - 1], (i) => board[i][board.length - i - 1]);
}

function printBoard(board) {
	const numsize = Math.floor(Math.log10(board.length ** 2));
	const seperator = "-".repeat(size * (2 + numsize) - 1);
	for(let i = 0; i < size; i++) {
		if(i !== 0) console.log(seperator);
		let row = "";
		for(let j = 0; j < size; j++) {
			if(j !== 0) row += "|";
			if(board[i][j] === null) {
				row += (i * size + j + 1)
					.toString(10)
					.padStart(numsize + 1, '0');
			} else {
				row += board[i][j].padEnd(numsize + 1, ' ')
			}
		}
		console.log(row);
	}
}

const board = generateBoard();
let turn = "x";

while(true) {
	printBoard(board);

	const input = parseInt(prompt(`[${turn}] where?`), 10) - 1;
	console.log("\n\n");
	
	if((!input && input !== 0) || input < 0 || input > (size ** 2) - 1) {
		console.log("invalid square!");
		continue;
	}

	const x = input % size; 
	const y = Math.floor(input / size);
	
	if(board[y][x] !== null) {
		console.log("square already used!");
		continue;		
	}
	
	board[y][x] = turn;
	
	const win = checkRow(board, y)
		|| checkColumn(board, x)
		|| checkDiagonals(board);
	
	if(win) {
		console.log(win + " wins!");
		printBoard(board);
		break;
	}
	
	turn = turn === "x" ? "o" : "x";
}
