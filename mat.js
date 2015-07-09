
	/*
		// States
		//  0: Open portrait
		//  1: Closed portrait
		//  2: Open landscape
		//  3: Closed landscape

		// Field Numbers
		//  0/15: Field Card Zone
		//  1/16: Monster Slot 1
		//  2/17: Monster Slot 2
		//  3/18: Monster Slot 3
		//  4/19: Monster Slot 4
		//  5/20: Monster Slot 5
		//  6/21: Graveyard
		//  7/22: Extra Deck
		//  8/23: Spell/Trap Slot 1
		//  9/24: Spell/Trap Slot 2
		// 10/25: Spell/Trap Slot 3
		// 11/26: Spell/Trap Slot 4
		// 12/27: Spell/Trap Slot 5
		// 13/28: Deck
		// 14/29: Hand
	*/

	var body = document.body, userCode = 0;

	function isViewField ( fieldNumber ) {
		return (isMyField(fieldNumber) && (
			handSlots.indexOf(fieldNumber) !== -1 ||
			spellSlots.indexOf(fieldNumber) !== -1 ||
			monsterSlots.indexOf(fieldNumber) !== -1
		)) || model.fields[fieldNumber].state === 0 || model.fields[fieldNumber].state === 2;
	}

	function isMyField ( fieldNumber ) {
		return userCode ? (fieldNumber >= 15) : (fieldNumber < 15);
	}

	function isValidState ( state, fieldNumber ) {

		if ( handSlots.indexOf(fieldNumber) !== -1 ) {
			return state === 0;
		}
		if ( spellSlots.indexOf(fieldNumber) !== -1 ) {
			return state === 0 || state === 1;
		}
		if ( monsterSlots.indexOf(fieldNumber) !== -1 ) {
			return true;//state === 0 || state === 2 || state === 3;
		}
		if ( fieldSlots.indexOf(fieldNumber) !== -1 ) {
			return state === 0;
		}
		if ( graveSlots.indexOf(fieldNumber) !== -1 ) {
			return state === 0;
		}
		if ( deckSlots.indexOf(fieldNumber) !== -1 ) {
			return state === 0 || state === 1;
		}
	}

	function bindDroppingEvents ( fieldNumber ) {

		var dropLocation = model.fields[fieldNumber].element;

		// Event Listener for when the dragged element is over the drop zone.
		dropLocation.addEventListener('dragover', function(e) {
			if ( e.preventDefault ) e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
			return false;
		});

		// Event Listener for when the dragged element dropped in the drop zone.
		dropLocation.addEventListener('drop', function(e) {
			if ( e.preventDefault ) e.preventDefault();
			if ( e.stopPropagation ) e.stopPropagation();

			var cardID = Number(e.dataTransfer.getData('cardID'));
			moveCard(cardID, fieldNumber);

			return false;
		});
	}

	function bindFlyoutEvents ( fieldNumber ) {

		var field = model.fields[fieldNumber].element;

		field.addEventListener('click', function( e ){

			if ( !isViewField(fieldNumber) ) return;
			if ( e.buttons !== 0 ) return;

			var target, isOpen = field.classList.contains('js-waved-open');

			if ( field.children.length < 3 && !isOpen ) return;

			if ( isOpen ) {
				field.classList.remove('js-waved-open');
				body.classList.remove('js-waved-open');
				target = field;
			} else {
				field.classList.add('js-waved-open');
				body.classList.add('js-waved-open');
				target = field.parentNode.nextElementSibling;
			}

			model.fields[fieldNumber].cards.forEach(function(cardID){
				target.appendChild(cardElements[cardID])
			});
		});
	}

	function bindZoomingEvents ( cardID ) {

		var cardElement = cardElements[cardID];

		cardElement.addEventListener('mousedown', function( e ){
			
			if ( !isViewField(cardElements[cardID]['data-at-field']) ) return;
			if ( e.buttons !== 2 ) return true;
			
			var x = window.open(model.cards[cardID][1], 'cardViewer', 'height=500,width=400');
			return false;
		});

		cardElement.addEventListener('contextmenu', function( e ){
			e.preventDefault();
		});
	}

	function shuffleArray ( o ) {
		for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	}

	function shuffleCards ( fieldNumber ) {
		shuffleArray(model.fields[fieldNumber].cards);
		registerFieldChange([fieldNumber]);
	}

	function moveCard ( cardID, fieldNumber ) {

		var originalFieldNumber = cardElements[cardID]['data-at-field'];
			index = model.fields[originalFieldNumber].cards.indexOf(cardID);

		model.fields[fieldNumber].cards.push(cardID);
		model.fields[cardElements[cardID]['data-at-field']].cards.splice(index, 1);

		// When moving the first card, also move the state
		if ( model.fields[fieldNumber].cards.length === 1 ) {
			setState(model.fields[originalFieldNumber].state, fieldNumber);
			setTokens(model.fields[originalFieldNumber].tokens, fieldNumber);
		}

		// When removing the last card from a position, set it's state to closed,
		// So cards aren't revealed.
		if ( model.fields[originalFieldNumber].cards.length === 0 ) {
			setState(1, originalFieldNumber);
			setTokens('', originalFieldNumber);
		}

		cardElements[cardID]['data-at-field'] = fieldNumber;

		registerFieldChange([originalFieldNumber, fieldNumber]);
	}

	function setTokens ( tokens, fieldNumber ) {
		model.fields[fieldNumber].tokens = tokens;
		if ( model.fields[fieldNumber].fieldElement ) {
			model.fields[fieldNumber].fieldElement.value = tokens;
		}
	}

	function setState ( state, fieldNumber ) {

		if ( !isValidState(state, fieldNumber) ) {
			return false;
		}

		model.fields[fieldNumber].state = state;
	}

	function placeCards ( fieldNumber ) {

		var show = isViewField( fieldNumber );

		model.fields[fieldNumber].cards.forEach(function( cardID ) {
			model.fields[fieldNumber].element.appendChild(cardElements[cardID]);
			cardElements[cardID]['data-at-field'] = fieldNumber;
			cardElements[cardID].style.backgroundImage = show ? 'url(' + model.cards[cardID][1] + ')' : '';
		});
	}

	function updateFieldState ( fieldNumber ) {

		var element = model.fields[fieldNumber].element;

		placeCards(fieldNumber);

		element.setAttribute('state', model.fields[fieldNumber].state);
		element.classList.remove('js-waved-open');
	}

	function updatePointsState ( ) {
		pointsOneInput.value = model.points[0];
		pointsTwoInput.value = model.points[1];
	}

	function registerFieldChange ( fieldNumbers ) {

		var data = {};

		fieldNumbers.forEach(function(fieldNumber){
			updateFieldState(fieldNumber);
			data[fieldNumber] = model.fields[fieldNumber];
		});

		remotePeerConnection.send(JSON.stringify(data));

		body.classList.remove('js-waved-open');
	}

	function processIncomingChanges ( son ) {

		son = JSON.parse(son);

		console.log(son);

		Object.keys(son).forEach(function( fieldNumber ) {

			if ( fieldNumber === 'deck' ) {

				var i = 0;

				if ( userCode === 1 ) {
					model.cards = son[fieldNumber].concat(myCards);
					for ( i; i < son[fieldNumber].length; i++ ) {
						model.fields[13].cards.push(i);
					}
				} else {
					model.cards = myCards.concat(son[fieldNumber]);
					for ( i; i < myCards.length; i++ ) {
						model.fields[13].cards.push(i);
					}
				}

				for ( i; i < model.cards.length; i++ ) {
					model.fields[28].cards.push(i);
				}

				loadDecks();

				updateFieldState(13);
				updateFieldState(28);
				updatePointsState();

				return;
			}

			if ( fieldNumber === 'points' ) {
				model.points = son[fieldNumber];
				updatePointsState();
				return;
			}

			fieldNumber = Number(fieldNumber);

			if ( deckSlots.indexOf(fieldNumber) !== -1 &&
				model.fields[fieldNumber].state !== son[fieldNumber].state) {
				alert('Other played changed deck state');
			}

			// Ignore 'element';
			model.fields[fieldNumber].cards = son[fieldNumber].cards;
			model.fields[fieldNumber].state = son[fieldNumber].state;
			setTokens(son[fieldNumber].tokens, fieldNumber);

			updateFieldState(fieldNumber);
		});
	}

	function createFieldData ( element, state ) {
		return {
			cards: [],
			state: state,
			tokens: 0,
			element: element
		};
	}

	function createFieldElement ( fieldNumber ) {
		var ri = Math.floor((fieldNumber >= 15 ? fieldNumber - 15 : fieldNumber)/7) + (fieldNumber >= 15 ? 3 : 0),
			r = rowElements[ri],
			c = document.createElement('div'),
			initState = 1;

		//c.innerHTML = fieldNumber; // debug
		c.className = 'box field';

		if ( handSlots.indexOf(fieldNumber) !== -1 ) {
			c.className += ' hand type-hand';
		}
		if ( spellSlots.indexOf(fieldNumber) !== -1 ) {
			c.className += ' type-spell';
		}
		if ( monsterSlots.indexOf(fieldNumber) !== -1 ) {
			c.className += ' type-monster';
		}
		if ( fieldSlots.indexOf(fieldNumber) !== -1 ) {
			c.className += ' type-field';
			initState = 0;
		}
		if ( graveSlots.indexOf(fieldNumber) !== -1 ) {
			c.className += ' type-graveyard';
			initState = 0;
		}
		if ( deckSlots.indexOf(fieldNumber) !== -1 ) {
			c.className += ' type-deck';
		}

		c.setAttribute('state', initState);
		r.appendChild(c);

		model.fields[fieldNumber] = createFieldData(c, initState);
		c.appendChild(createStateUI(fieldNumber));
		createCounterUI(c, fieldNumber);

		bindDroppingEvents(fieldNumber);

		// Add overview feature to all fields,
		// Except for the hands, which are always open.
		if ( handSlots.indexOf(fieldNumber) === -1 ) {
			bindFlyoutEvents(fieldNumber);
		}
	}

	function createStateChanger ( xc, p, fieldNumber ) {
		var c = document.createElement('div');
		c.className = 'tool';
		c.innerHTML = ['&#x25B2;', '&#x25BC;', '&#x25C0;', '&#x25B6;'][p];

		c.addEventListener('click', function(e){
			setState(p, fieldNumber);
			registerFieldChange([fieldNumber]);

			// Don't propagate to clicking the field.
			e.stopPropagation();
		});

		xc.appendChild(c);
	}

	function createShuffleButton ( xc, fieldNumber ) {
		var c = document.createElement('div');
		c.innerHTML = '&#8635;';
		c.className = 'tool';

		c.addEventListener('click', function(e){
			shuffleCards(fieldNumber);
			e.stopPropagation();
		});

		xc.appendChild(c);
	}

	function createTokenField ( xc, fieldNumber ) {
		var c = document.createElement('input');
		c.className = 'token-field tool';

		c.addEventListener('click', function(e){
			e.stopPropagation();
		});

		c.addEventListener('change', function(e){
			model.fields[fieldNumber].tokens = this.value;
			registerFieldChange([fieldNumber]);
			e.stopPropagation();
		});

		model.fields[fieldNumber].fieldElement = c;

		xc.appendChild(c);
	}

	function createStateUI ( fieldNumber ) {

		var c = document.createElement('div');
		c.className = 'tools';

		if ( monsterSlots.indexOf(fieldNumber) !== -1 ) {
			createStateChanger(c, 0, fieldNumber);
			createStateChanger(c, 2, fieldNumber);
			createStateChanger(c, 3, fieldNumber);
		} else if ( spellSlots.indexOf(fieldNumber) !== -1 ) {
			createStateChanger(c, 0, fieldNumber);
			createStateChanger(c, 1, fieldNumber);
		} else if ( deckSlots.indexOf(fieldNumber) !== -1 ) {
			createShuffleButton(c, fieldNumber);
			createStateChanger(c, 0, fieldNumber);
			createStateChanger(c, 1, fieldNumber);
		}

		if ( deckSlots.indexOf(fieldNumber) === -1 &&
				handSlots.indexOf(fieldNumber) === -1 &&
				graveSlots.indexOf(fieldNumber) === -1 ) {
			createTokenField(c, fieldNumber);
		}

		return c;
	}

	function createCounterUI ( ) {
		var c = document.createElement('div');
		c.innerHTML = 'counter';
		return c;
	}

	function createCard ( cardID ) {
		var c = document.createElement('div');
		c.className = 'card';
		c.draggable = true;
		//c.innerHTML = i; // debug

		cardsRoot.appendChild(c);
		cardElements[cardID] = c;

		bindZoomingEvents(cardID);
	}

	function setup ( ) {

		remotePeerConnection.on('data', processIncomingChanges);

		setTimeout(function(){
			remotePeerConnection.send(JSON.stringify({ deck: myCards }));
		}, 3000); // TODO this isn't really working

		if ( userCode === 1 ) {
			flipOpponent(0);
		} else {
			deckRoot.appendChild(deckRoot.children[0]);
			flipOpponent(2);
		}

		if ( userCode ) {
			deckRoot.children[0].insertBefore(pointsOne, deckRoot.children[0].firstChild);
			deckRoot.children[1].appendChild(pointsTwo);
		} else {
			deckRoot.children[0].insertBefore(pointsTwo, deckRoot.children[0].firstChild);
			deckRoot.children[1].appendChild(pointsOne);
		}

		deckRoot.classList.add('show');
	}

	function flipOpponent ( offset ) {

		var element = deckRoot.children[0];

		// Rotate the other deck
		for ( i = 0; i < 6; i++ ) {
			element.appendChild(element.children[(i < 4 ? 0 : 1)]);
		}

		// Rotate cards in other deck
		for ( i = offset; i < offset + 3; i++ ) {
			var j = rowElements[i].childNodes.length;
			while (j--) {
				rowElements[i].appendChild(rowElements[i].childNodes[j]);
			}
		}
	}

	function sendPoints ( ) {
		remotePeerConnection.send(JSON.stringify({points: model.points}));
	}

	function loadDecks ( ) {

		for ( i = 0; i < model.cards.length; i++ ) {
			createCard(i);
		}

		cardElements.forEach(function(element, cardID) {
			element.addEventListener('dragstart', function(e) {
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('cardID', cardID);
			});
		});
	}

	function connect ( target_id ) {
		remotePeerConnection = peer.connect(target_id);
		remotePeerConnection.on('open', setup);
	}

	var model = {
		fields: [],
		points: [8000, 8000],
		cards: []
	};

	var monsterSlots = [1,2,3,4,5,16,17,18,19,20],
		spellSlots = [8,9,10,11,12,23,24,25,26,27],
		handSlots = [14,29],
		fieldSlots = [0,15],
		deckSlots = [13,28],
		graveSlots = [6,21];

	var i, creation, remotePeerConnection = { on: function(){}, send: function(a){console.log(a);} }, // temp
		cardsRoot = document.getElementById('cards'),
		deckRoot = document.getElementById('deck'),
		deck, cardElements = [], rowElements = [];

	for ( i = 0; i < 6; i++ ) {

		if ( i == 0 || i == 3 ) {
			deck = document.createElement('div');
			deck.className = 'deck';
			deckRoot.appendChild(deck);
		}

		creation = document.createElement('div');
		creation.className = 'row';
		deck.appendChild(creation);
		rowElements[i] = creation;

		if ( i !== 2 && i !== 5 ) {
			creation = document.createElement('div');
			creation.className = 'row sub';
			deck.appendChild(creation);
		}
	}

	for ( i = 0; i < 30; i++ ) {
		createFieldElement(i);
	}

	var pointsOne = document.getElementById('player_one'),
		pointsTwo = document.getElementById('player_two'),
		pointsOneInput = document.getElementById('player_one_points'),
		pointsTwoInput = document.getElementById('player_two_points');

	pointsOneInput.addEventListener('change', function(){
		model.points[0] = Number(this.value);
		sendPoints();
	});

	pointsTwoInput.addEventListener('change', function(){
		model.points[1] = Number(this.value);
		sendPoints();
	});

	var myCards = JSON.parse(prompt('Card code, please.'));

	var peer = new Peer({key: 'q5t1pekpgkuzncdi'});

	peer.on('open', function(id) {
		var data = prompt('Give your ID to another player, or paste the one you received.', id);
		if ( data !== id ) {
			connect(data);
		}
	});

	peer.on('connection', function ( conn ) {
		remotePeerConnection = conn;
		userCode = 1;
		setup();
	});
