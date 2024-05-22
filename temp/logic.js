class Move {
    constructor(name, type, power, category) {
        this.name = name;
        this.type = type;
        this.power = power;
        this.category = category;
    }
}

class Pokemon {
    constructor(name, type, hp, attack, defense, spAttack, spDefense, speed, moves) {
        this.name = name;
        this.type = type;
        this.hp = hp;
        this.attack = attack;
        this.defense = defense;
        this.spAttack = spAttack;
        this.spDefense = spDefense;
        this.speed = speed;
        this.moves = moves.map(move => new Move(move.name, move.type, move.power, move.category));
        this.currentHP = hp;
    }

    takeDamage(damage) {
        this.currentHP -= damage;
        if (this.currentHP < 0) {
            this.currentHP = 0;
        }
    }

    isFainted() {
        return this.currentHP <= 0;
    }

    calculateDamage(move, opponent) {
        const attackStat = move.category === "Physical" ? this.attack : this.spAttack;
        const defenseStat = move.category === "Physical" ? opponent.defense : opponent.spDefense;
        const effectiveness = this.getEffectiveness(move.type, opponent.type);
        return Math.floor((move.power * (attackStat / defenseStat)) * effectiveness);
    }

    getEffectiveness(moveType, opponentTypes) {
        const typeChart = {
            normal: { rock: 0.5, ghost: 0, steel: 0.5 },
            fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
            water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
            electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
            grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
            ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
            fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
            poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
            ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
            flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
            psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
            bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
            rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
            ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
            dragon: { dragon: 2, steel: 0.5, fairy: 0 },
            dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
            steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
            fairy: { fighting: 2, poison: 0.5, steel: 0.5, fire: 0.5, dragon: 2, dark: 2 }
        };

        let effectiveness = 1;
        opponentTypes.forEach(type => {
            if (typeChart[moveType] && typeChart[moveType][type] !== undefined) {
                effectiveness *= typeChart[moveType][type];
            }
        });

        return effectiveness;
    }
}


let playerTeam = [];
let enemyTeam = [];
let allPokemonData = [];

async function loadPokemonData() {
    const response = await fetch('temp/pokemonData.json');
    const data = await response.json();
    return data;
}

function initializePokemon(data) {
    return data.map(pokemonData => new Pokemon(
        pokemonData.name,
        pokemonData.type,
        pokemonData.hp,
        pokemonData.attack,
        pokemonData.defense,
        pokemonData.spAttack,
        pokemonData.spDefense,
        pokemonData.speed,
        pokemonData.moves
    ));
}

function generateRandomTeam() {
    const shuffled = allPokemonData.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 6);
}

document.addEventListener('DOMContentLoaded', async () => {
    allPokemonData = await loadPokemonData();
    allPokemonData = initializePokemon(allPokemonData);

    document.getElementById('start-button').addEventListener('click', () => {
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('team-selection-screen').classList.add('active');
        displayPokemonOptions();
    });

    document.getElementById('confirm-team-button').addEventListener('click', () => {
        if (playerTeam.length === 6) {
            enemyTeam = generateRandomTeam();
            document.getElementById('team-selection-screen').classList.remove('active');
            document.getElementById('battle-screen').classList.add('active');
            startBattle();
        } else {
            alert('Selecciona 6 Pokémon para tu equipo.');
        }
    });
});

function displayPokemonOptions() {
    const pokemonList = document.getElementById('available-pokemon');
    pokemonList.innerHTML = '';

    allPokemonData.forEach((pokemon, index) => {
        const btn = document.createElement('button');
        btn.classList.add('pokemon-list-item');
        btn.textContent = pokemon.name;
        btn.addEventListener('click', () => {
            selectPokemon(index);
        });
        pokemonList.appendChild(btn);
    });
}

function selectPokemon(index) {
    if (playerTeam.length < 6 && !playerTeam.includes(allPokemonData[index])) {
        playerTeam.push(allPokemonData[index]);
        const selectedPokemon = document.querySelectorAll('.pokemon-list-item')[index];
        selectedPokemon.classList.add('selected');

        if (playerTeam.length === 6) {
            document.getElementById('confirm-team-button').disabled = false;
        }
    } else {
        alert('Ya tienes 6 Pokémon en tu equipo o este Pokémon ya está seleccionado.');
    }
}

function startBattle() {
    console.log('La batalla ha comenzado');
    
    let playerIndex = 0;
    let enemyIndex = 0;

    function nextTurn() {
        const playerPokemon = playerTeam[playerIndex];
        const enemyPokemon = enemyTeam[enemyIndex];

        // Mostrar los Pokémon que están luchando actualmente
        document.getElementById('player-pokemon').innerHTML = `<img src="images/${playerPokemon.name.toLowerCase()}.png" alt="${playerPokemon.name}" style="width: 150px; height: 150px;"><p>${playerPokemon.name}</p>`;
        document.getElementById('enemy-pokemon').innerHTML = `<img src="images/${enemyPokemon.name.toLowerCase()}.png" alt="${enemyPokemon.name}" style="width: 150px; height: 150px;"><p>${enemyPokemon.name}</p>`;

        // Limpiar los botones de movimientos anteriores
        document.getElementById('move-buttons').innerHTML = '';
        document.getElementById('battle-log').innerHTML += `<p>${playerPokemon.name} vs ${enemyPokemon.name}</p>`;
                // Limpiar los botones de movimientos anteriores
                document.getElementById('move-buttons').innerHTML = '';
                document.getElementById('battle-log').innerHTML += `<p>${playerPokemon.name} vs ${enemyPokemon.name}</p>`;
        
                // Crear botones de movimientos para el Pokémon del jugador
                playerPokemon.moves.forEach((move, index) => {
                    const btn = document.createElement('button');
                    btn.textContent = move.name;
                    btn.addEventListener('click', () => {
                        console.log(`Botón de movimiento ${move.name} presionado`);
                        // Decidir quién ataca primero en función de la velocidad
                        if (playerPokemon.speed >= enemyPokemon.speed) {
                            playerAttack(move, playerPokemon, enemyPokemon, () => {
                                if (!enemyPokemon.isFainted()) {
                                    enemyAttack(playerPokemon, enemyPokemon, nextTurn);
                                }
                            });
                        } else {
                            enemyAttack(playerPokemon, enemyPokemon, () => {
                                if (!playerPokemon.isFainted()) {
                                    playerAttack(move, playerPokemon, enemyPokemon, nextTurn);
                                }
                            });
                        }
                    });
                    document.getElementById('move-buttons').appendChild(btn);
                });
            }
        
            function playerAttack(move, playerPokemon, enemyPokemon, callback) {
                const damage = playerPokemon.calculateDamage(move, enemyPokemon);
                enemyPokemon.takeDamage(damage);
                document.getElementById('battle-log').innerHTML += `<p>${playerPokemon.name} usa ${move.name} y causa ${damage} de daño a ${enemyPokemon.name}</p>`;
        
                if (enemyPokemon.isFainted()) {
                    document.getElementById('battle-log').innerHTML += `<p>${enemyPokemon.name} se ha debilitado</p>`;
                    enemyIndex++;
                    if (enemyIndex >= enemyTeam.length) {
                        document.getElementById('battle-log').innerHTML += `<p>¡Has ganado la batalla!</p>`;
                        return;
                    }
                }
                if (callback) callback();
            }
        
            function enemyAttack(playerPokemon, enemyPokemon, callback) {
                const enemyMove = enemyPokemon.moves[Math.floor(Math.random() * enemyPokemon.moves.length)];
                const enemyDamage = enemyPokemon.calculateDamage(enemyMove, playerPokemon);
                playerPokemon.takeDamage(enemyDamage);
                document.getElementById('battle-log').innerHTML += `<p>${enemyPokemon.name} usa ${enemyMove.name} y causa ${enemyDamage} de daño a ${playerPokemon.name}</p>`;
        
                if (playerPokemon.isFainted()) {
                    document.getElementById('battle-log').innerHTML += `<p>${playerPokemon.name} se ha debilitado</p>`;
                    playerIndex++;
                    if (playerIndex >= selectedTeam.length) {
                        document.getElementById('battle-log').innerHTML += `<p>Has perdido la batalla.</p>`;
                        return;
                    }
                }
                if (callback) callback();
            }
        
            nextTurn();
        }
        