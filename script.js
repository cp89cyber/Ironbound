class Card {
    constructor(suit, rank, value) {
        this.suit = suit;
        this.rank = rank;
        this.value = value;
    }

    getColor() {
        return (this.suit === '♥' || this.suit === '♦') ? 'red' : 'black';
    }

    getDisplay() {
        return {
            rank: this.rank,
            suit: this.suit,
            color: this.getColor()
        };
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.initializeDeck();
        this.shuffle();
    }

    initializeDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

        for (let suit of suits) {
            for (let i = 0; i < ranks.length; i++) {
                this.cards.push(new Card(suit, ranks[i], values[i]));
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        const half = Math.floor(this.cards.length / 2);
        return [
            this.cards.slice(0, half),
            this.cards.slice(half)
        ];
    }
}

class WarGame {
    constructor() {
        this.player1Deck = [];
        this.player2Deck = [];
        this.player1Card = null;
        this.player2Card = null;
        this.warPile = [];
        this.gameOver = false;
        this.isWar = false;
        this.timeoutIds = new Set();
        
        this.initializeElements();
        this.initializeEventListeners();
        this.startNewGame();
    }

    initializeElements() {
        this.playButton = document.getElementById('play-button');
        this.newGameButton = document.getElementById('new-game-button');
        this.player1DeckElement = document.getElementById('player1-deck');
        this.player2DeckElement = document.getElementById('player2-deck');
        this.player1CardsElement = document.getElementById('player1-cards');
        this.player2CardsElement = document.getElementById('player2-cards');
        this.player1CardElement = document.getElementById('player1-card');
        this.player2CardElement = document.getElementById('player2-card');
        this.gameMessageElement = document.getElementById('game-message');
        this.warZoneElement = document.getElementById('war-zone');
        this.warCardsElement = document.getElementById('war-cards');
    }

    addActivateListener(element, handler) {
        if (!element) return;

        const activateEvent = window.PointerEvent ? 'pointerup' : 'click';
        element.addEventListener(activateEvent, (e) => {
            if (window.PointerEvent && e instanceof PointerEvent) {
                if (e.pointerType === 'mouse' && e.button !== 0) return;
            }
            handler();
        }, { passive: true });
    }

    initializeEventListeners() {
        this.addActivateListener(this.playButton, () => this.playRound());
        this.addActivateListener(this.newGameButton, () => this.startNewGame());

        this.addActivateListener(this.player1DeckElement, () => this.playRound());
        this.addActivateListener(this.player2DeckElement, () => this.playRound());
    }

    setTrackedTimeout(callback, delay) {
        const id = setTimeout(() => {
            this.timeoutIds.delete(id);
            callback();
        }, delay);

        this.timeoutIds.add(id);
        return id;
    }

    clearTrackedTimeouts() {
        for (const id of this.timeoutIds) {
            clearTimeout(id);
        }

        this.timeoutIds.clear();
    }

    startNewGame() {
        this.clearTrackedTimeouts();
        const deck = new Deck();
        [this.player1Deck, this.player2Deck] = deck.deal();
        
        this.player1Card = null;
        this.player2Card = null;
        this.warPile = [];
        this.gameOver = false;
        this.isWar = false;
        
        this.updateDisplay();
        this.player1CardElement.classList.remove('card-flip', 'pulse', 'shake');
        this.player2CardElement.classList.remove('card-flip', 'pulse', 'shake');
        this.clearCards();
        this.gameMessageElement.textContent = 'Click "Play Card" to start!';
        this.warZoneElement.style.display = 'none';
        this.playButton.disabled = false;
        this.player1DeckElement.classList.remove('is-disabled');
        this.player2DeckElement.classList.remove('is-disabled');
    }

    playRound() {
        if (this.gameOver || this.player1Deck.length === 0 || this.player2Deck.length === 0) {
            this.endGame();
            return;
        }

        this.player1CardElement.classList.remove('card-flip', 'pulse', 'shake');
        this.player2CardElement.classList.remove('card-flip', 'pulse', 'shake');
        this.clearCards();
        this.playButton.disabled = true;
        this.player1DeckElement.classList.add('is-disabled');
        this.player2DeckElement.classList.add('is-disabled');
        
        this.player1Card = this.player1Deck.shift();
        this.player2Card = this.player2Deck.shift();
        
        this.displayCard(this.player1CardElement, this.player1Card);
        this.displayCard(this.player2CardElement, this.player2Card);
        
        this.setTrackedTimeout(() => {
            this.resolveRound();
        }, 1000);
    }

    displayCard(element, card) {
        element.classList.add('card-flip');
        const display = card.getDisplay();
        element.innerHTML = `
            <div class="card ${display.color}">
                <div class="card-value">${display.rank}</div>
                <div class="card-suit">${display.suit}</div>
            </div>
        `;
        
        this.setTrackedTimeout(() => {
            element.classList.remove('card-flip');
        }, 600);
    }

    resolveRound() {
        if (this.player1Card.value > this.player2Card.value) {
            this.player1WinsRound();
        } else if (this.player2Card.value > this.player1Card.value) {
            this.player2WinsRound();
        } else {
            this.initiateWar();
        }
    }

    player1WinsRound() {
        const cardsWon = [this.player1Card, this.player2Card, ...this.warPile];
        this.player1Deck.push(...cardsWon);
        this.warPile = [];
        this.isWar = false;
        
        this.player1CardElement.classList.add('pulse');
        this.gameMessageElement.textContent = 'Player 1 wins this round!';
        this.warZoneElement.style.display = 'none';
        
        this.setTrackedTimeout(() => {
            this.player1CardElement.classList.remove('pulse');
        }, 500);
        
        this.endRound();
    }

    player2WinsRound() {
        const cardsWon = [this.player1Card, this.player2Card, ...this.warPile];
        this.player2Deck.push(...cardsWon);
        this.warPile = [];
        this.isWar = false;
        
        this.player2CardElement.classList.add('pulse');
        this.gameMessageElement.textContent = 'Player 2 wins this round!';
        this.warZoneElement.style.display = 'none';
        
        this.setTrackedTimeout(() => {
            this.player2CardElement.classList.remove('pulse');
        }, 500);
        
        this.endRound();
    }

    initiateWar() {
        this.isWar = true;
        this.warPile.push(this.player1Card, this.player2Card);
        
        this.player1CardElement.classList.add('shake');
        this.player2CardElement.classList.add('shake');
        this.gameMessageElement.textContent = 'WAR! Both cards are equal!';
        this.warZoneElement.style.display = 'block';
        
        const warCardsNeeded = Math.min(3, this.player1Deck.length - 1, this.player2Deck.length - 1);
        
        if (warCardsNeeded <= 0) {
            this.endGame();
            return;
        }
        
        for (let i = 0; i < warCardsNeeded; i++) {
            if (this.player1Deck.length > 0 && this.player2Deck.length > 0) {
                this.warPile.push(this.player1Deck.shift(), this.player2Deck.shift());
            }
        }
        
        this.displayWarCards();
        
        this.setTrackedTimeout(() => {
            this.player1CardElement.classList.remove('shake');
            this.player2CardElement.classList.remove('shake');
            
            if (this.player1Deck.length > 0 && this.player2Deck.length > 0) {
                this.playRound();
            } else {
                this.endGame();
            }
        }, 2000);
    }

    displayWarCards() {
        this.warCardsElement.innerHTML = '';
        const faceDownCards = Math.min(this.warPile.length, 8);
        
        for (let i = 0; i < faceDownCards; i++) {
            const cardElement = document.createElement('div');
            cardElement.className = 'played-card';
            cardElement.innerHTML = '<div class="card-back"></div>';
            this.warCardsElement.appendChild(cardElement);
        }
    }

    endRound() {
        this.updateDisplay();
        
        if (this.player1Deck.length === 0 || this.player2Deck.length === 0) {
            this.endGame();
        } else {
            this.playButton.disabled = false;
            this.player1DeckElement.classList.remove('is-disabled');
            this.player2DeckElement.classList.remove('is-disabled');
            this.gameMessageElement.textContent = 'Click "Play Card" for next round';
        }
    }

    clearCards() {
        this.player1CardElement.innerHTML = '<div class="card-back"></div>';
        this.player2CardElement.innerHTML = '<div class="card-back"></div>';
    }

    updateDisplay() {
        this.player1CardsElement.textContent = this.player1Deck.length;
        this.player2CardsElement.textContent = this.player2Deck.length;
    }

    endGame() {
        this.clearTrackedTimeouts();
        this.gameOver = true;
        this.playButton.disabled = true;
        this.player1DeckElement.classList.add('is-disabled');
        this.player2DeckElement.classList.add('is-disabled');
        
        let winner;
        if (this.player1Deck.length > this.player2Deck.length) {
            winner = 'Player 1';
        } else if (this.player2Deck.length > this.player1Deck.length) {
            winner = 'Player 2';
        } else {
            winner = 'Nobody (Tie)';
        }
        
        this.gameMessageElement.textContent = `Game Over! ${winner} wins!`;
        this.warZoneElement.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WarGame();
});
