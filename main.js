"use strict";

;(() => {
	localStorage.matchbox ??= 'e30=';
})();

let matchbox = JSON.parse(atob(localStorage.matchbox));

let computerMoves = {};

const computerMark = 'x';
const playerMark = 'o';

const transforms = [
	value,
	reflectX, reflectY,
	rotate90, rotate180, rotate270,
	flipTL, flipTR
];

let turn = 0;

const computerDelay = 800;

const boardElement = document.querySelector('.game');

const cellElements = (() => {
	const elements = Array();
	while (elements.length < 9) {
		const element = document.createElement('div');
		element.classList.add('cell');
		elements.push(element);
	}
	return elements;
})();

let playerTurn = false;

cellElements.forEach(element => {
	element.addEventListener('click', handleClick, { once: true });
});

;(() => {
	const cellElementsFragment = (() => {
		const fragment = new DocumentFragment();
		for (const cell of cellElements) {
			fragment.appendChild(cell);
		}
		return fragment;
	})();
	boardElement.appendChild(cellElementsFragment);
})();

async function handleClick(event) {
	const cellElement = event.target;
	if (!playerTurn) {
		cellElement.addEventListener('click', handleClick, { once: true });
		return;
	}
	if (cellElement.classList.contains('x')) {
		return;
	}
	playerTurn = false;
	cellElement.classList.add('o');
	
	if (checkWin()) {
		updateComputer('loss');
		displayEnd('win');
		return;
	}
	if (checkDraw()) {
		updateComputer('draw');
		displayEnd('draw');
		return;
	}
	
	await new Promise(resolve => {
		setTimeout(() => {
			resolve(computerMove(true));
		}, computerDelay);
	});
	
	if (checkWin()) {
		updateComputer('win');
		displayEnd('loss');
		return;
	}
	if (checkDraw()) {
		updateComputer('draw');
		displayEnd('draw');
		return;
	}
	
	playerTurn = true;
}

;(async () => {
	await new Promise(resolve => {
		setTimeout(() => {
			resolve(computerMove(true));
		}, computerDelay * 1.5);
	});
	
	playerTurn = true;
})();

function computerMove(fastLearning = false) {
	turn++;
	
	if (!stateInMatchbox(getBoardState())) {
		if (fastLearning) {
			matchbox[getBoardState()] = getMoves();
		} else {
			matchbox[getBoardState()] = (
				(turn == 1) ? getMoves(8) :
				(turn == 2) ? getMoves(4) :
				(turn == 3) ? getMoves(2) :
				getMoves()
			);
		}
	}
	
	const boardState = getBoardState();
	
	const state = getMatchingState(boardState);
	
	const transformation = (
		(value(state) == boardState) ? value :
		(reflectX(state) == boardState) ? reflectX :
		(reflectY(state) == boardState) ? reflectY :
		(rotate90(state) == boardState) ? rotate90 :
		(rotate180(state) == boardState) ? rotate180 :
		(rotate270(state) == boardState) ? rotate270 :
		(flipTL(state) == boardState) ? flipTL :
		(flipTR(state) == boardState) ? flipTR :
		null
	);
	
	let moves = matchbox[state];
	const possibleMoves = getPossible(moves);
	let move = possibleMoves[Math.floor(
		Math.random() * possibleMoves.length
	)];
	computerMoves[state] = move;
	move = replaceChar('---------', move, 'm');
	move = transformation(move);
	move = move.indexOf('m');
	cellElements[move].classList.add('x');
}

function replaceChar(string, index, character) {
	return (
		`${string.substring(0, index)}${character}`
		+ string.substring(index + 1)
	);
}

function getPossible(m) {
	let p = Array();
	for (let i = 0; i < 9; i++) {
		for (let j = 0; j < m[i]; j++) {
			p.push(i);
		}
	}
	return p;
}

function getMatchingState(s) {
	if (value(s) in matchbox) return value(s);
	if (reflectX(s) in matchbox) return reflectX(s);
	if (reflectY(s) in matchbox) return reflectY(s);
	if (rotate90(s) in matchbox) return rotate90(s);
	if (rotate180(s) in matchbox) return rotate180(s);
	if (rotate270(s) in matchbox) return rotate270(s);
	if (flipTL(s) in matchbox) return flipTL(s);
	if (flipTR(s) in matchbox) return flipTR(s);
}

function value(v) {
	return v;
}

function stateInMatchbox(s) {
	if (value(s) in matchbox) return true;
	if (reflectX(s) in matchbox) return true;
	if (reflectY(s) in matchbox) return true;
	if (rotate90(s) in matchbox) return true;
	if (rotate180(s) in matchbox) return true;
	if (rotate270(s) in matchbox) return true;
	if (flipTL(s) in matchbox) return true;
	if (flipTR(s) in matchbox) return true;
	return false;
}

function getMoves(n = 1) {
	let state = getBoardState();
	let possible = Array();
	for (let i = 0; i < state.length; i++) {
		if (state[i] == 'e') {
			possible.push(i);
		}
	}
	let moves = Array();
	for (let i = 0; i < possible.length; i++) {
		let move = possible[i];
		let included = false;
		for (let j = 0; j < transforms.length; j++) {
			let transform = transforms[j];
			let m = move;
			m = replaceChar('---------', m, 'm');
			m = transform(m);
			m = m.indexOf('m');
			if (transform(getBoardState()) != getBoardState()) {
				continue;
			}
			if (moves.includes(m)) {
				included = true;
			}
		}
		if (!included) {
			moves.push(move);
		}
	}
	let positioned = Array(9);
	for (let i = 0; i < 9; i++) {
		if (moves.includes(i)) {
			positioned[i] = n;
			continue;
		}
		positioned[i] = 0;
	}
	return positioned;
}

function updateComputer(t) {
	if (t == 'win') {
		for (const state in computerMoves) {
			matchbox[state][computerMoves[state]] += 3;
		}
	}
	if (t == 'draw') {
		for (const state in computerMoves) {
			matchbox[state][computerMoves[state]]++;
		}
	}
	if (t == 'loss') {
		for (const state in computerMoves) {
			matchbox[state][computerMoves[state]]--;
		}
	}
	for (const state in matchbox) {
		if (matchbox[state][0] != 0) continue;
		if (!equals(...matchbox[state])) continue;
		delete matchbox[state];
	}
	localStorage.matchbox = btoa(JSON.stringify(matchbox));
}

function checkWin() {
	const b = getBoardState();
	
	if (b[4] != 'e') {
		if (equals(b[0], b[4], b[8])) return true;
		if (equals(b[1], b[4], b[7])) return true;
		if (equals(b[2], b[4], b[6])) return true;
		if (equals(b[3], b[4], b[5])) return true;
	}
	
	if (b[0] != 'e') {
		if (equals(b[0], b[1], b[2])) return true;
		if (equals(b[0], b[3], b[6])) return true;
	}
	
	if (b[8] != 'e') {
		if (equals(b[2], b[5], b[8])) return true;
		if (equals(b[6], b[7], b[8])) return true;
	}
	
	return false;
}

function equals(...values) {
	for (const value of values) {
		if (values[0] != value) return false;
	}
	return true;
}

function checkDraw() {
	if (getBoardState().includes('e')) {
		return false;
	}
	if (checkWin()) {
		return false;
	}
	return true;
}

function getBoardState() {
	const cells = document.querySelectorAll('.cell');
	let a = Array();
	for (const cell of cells) {
		if (cell.classList.contains('x')) {
			a.push('x');
			continue;
		}
		if (cell.classList.contains('o')) {
			a.push('o');
			continue;
		}
		a.push('e');
	}
	return getString(a);
}

function getString(a) {
	let s = String();
	for (const i of a) {
		s += i;
	}
	return s;
}

function displayEnd(t) {
	const text = document.querySelector('.game-end-text');
	const display = document.querySelector('.game-end-popup');
	text.innerText = (
		t == 'win' ? 'You Won!' :
		t == 'loss' ? 'You Lost!' :
		'The game has ended in a Draw.'
	);
	display.classList.add('visible');
}

function reflectX(s) {
	return (
		s[6] + s[7] + s[8] +
		s[3] + s[4] + s[5] +
		s[0] + s[1] + s[2]
	);
}

function reflectY(s) {
	return (
		s[2] + s[1] + s[0] +
		s[5] + s[4] + s[3] +
		s[8] + s[7] + s[6]
	);
}

function rotate90(s) {
	return (
		s[6] + s[3] + s[0] +
		s[7] + s[4] + s[1] +
		s[8] + s[5] + s[2]
	);
}

function rotate180(s) {
	return reflectX(reflectY(s));
}

function rotate270(s) {
	return rotate90(rotate180(s));
}

function flipTL(s) {
	return reflectX(rotate90(s));
}

function flipTR(s) {
	return reflectY(rotate90(s));
}



