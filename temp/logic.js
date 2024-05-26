class Move {
    constructor(name, type, power, category, accuracy) {
        this.name = name;
        this.type = type;
        this.power = power;
        this.category = category; // "Physical" o "Special"
        this.accuracy = accuracy; // Probabilidad de acertar
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
        this.moves = moves.map(move => new Move(move.name, move.type, move.power, move.category, move.accuracy));
        this.currentHP = hp; // HP actual durante la batalla
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
        const accuracyCheck = Math.random() * 100;
        if (accuracyCheck > move.accuracy) {
            return { damage: 0, hit: false, message: `${this.name} usa ${move.name} pero falla.` }; // El ataque falla
        }

        const effectiveness = this.getEffectiveness(move.type, opponent.type);
        let damage;
        if (move.category === "Physical") {
            if (typeof this.attack !== 'number' || typeof opponent.defense !== 'number' || typeof move.power !== 'number') {
                console.error("Valores de ataque, defensa o poder del movimiento no son números", this, opponent);
                return { damage: 0, hit: false, message: `Error en los valores de ataque, defensa o poder del movimiento` };
            }
            damage = Math.floor((move.power * (this.attack / opponent.defense)) * effectiveness);
        } else if (move.category === "Special") {
            if (typeof this.spAttack !== 'number' || typeof opponent.spDefense !== 'number' || typeof move.power !== 'number') {
                console.error("Valores de ataque especial, defensa especial o poder del movimiento no son números", this, opponent);
                return { damage: 0, hit: false, message: `Error en los valores de ataque especial, defensa especial o poder del movimiento` };
            }
            damage = Math.floor((move.power * (this.spAttack / opponent.spDefense)) * effectiveness);
        } else {
            damage = 0; // Si el movimiento no tiene una categoría definida, no hace daño
        }

        return { damage: damage, hit: true, message: `${this.name} usa ${move.name} y causa ${damage} de daño a ${opponent.name}` };
    }

    getEffectiveness(moveType, opponentTypes) {
        const typeChart = {
            Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
            Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
            Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
            Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
            Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
            Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
            Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
            Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
            Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
            Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
            Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
            Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
            Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
            Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
            Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
            Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
            Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
            Fairy: { Fighting: 2, Poison: 0.5, Steel: 0.5, Fire: 0.5, Dragon: 2, Dark: 2 }
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

// Variables para los equipos y datos de Pokémon
let playerTeam = [];
let enemyTeam = [];
let allPokemonData = [];

// Carga de datos de Pokémon desde un archivo JSON
async function loadPokemonData() {
    const response = await fetch("temp/pokemonData.json"); // Cambia la ruta según la ubicación del archivo JSON
    const data = await response.json();
    return data;
}

// Inicialización de los objetos Pokémon con sus datos
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
        pokemonData.moves.map(move => new Move(move.name, move.type, move.power, move.category, move.accuracy))
    ));
}

// Generación de un equipo aleatorio de Pokémon
function generateRandomTeam() {
    const shuffled = allPokemonData.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 6);
}

// Evento que se ejecuta cuando el DOM se ha cargado completamente
document.addEventListener("DOMContentLoaded", async function() {
    allPokemonData = await loadPokemonData();
    allPokemonData = initializePokemon(allPokemonData);

    const startButton = document.getElementById("start-button");
    if (startButton) {
        startButton.addEventListener("click", function() {
            document.getElementById("start-screen").classList.remove("active");
            document.getElementById("team-selection-screen").classList.add("active");
            loadPokemonData();
        });
    } else {
        console.error("El elemento start-button no existe o no se ha cargado aún");
    }
});

// Mostrar opciones de Pokémon disponibles
function displayPokemonOptions() {
    const pokemonList = document.getElementById("pokemon-list");
    pokemonList.innerHTML = "";

    allPokemonData.forEach(function(pokemon, index) {
        const btn = document.createElement("button");
        btn.classList.add("pokemon-list-item");
        btn.textContent = pokemon.name;
        btn.addEventListener("click", function() {
            selectPokemon(index);
        });
        pokemonList.appendChild(btn);
    });
}

// Selección de un Pokémon
function selectPokemon(index) {
    if (playerTeam.length < 6 && !playerTeam.includes(allPokemonData[index])) {
        playerTeam.push(allPokemonData[index]);
        const selectedPokemon = document.querySelectorAll(".pokemon-list-item")[index];
        selectedPokemon.classList.add("selected");

        if (playerTeam.length === 6) {
            document.getElementById("fight-btn").style.display = "block";
        }
    } else {
        alert("Ya tienes 6 Pokémon en tu equipo o este Pokémon ya está seleccionado.");
    }
}

// Iniciar la batalla
function startBattle() {
    console.log("La batalla ha comenzado");

    let playerIndex = 0;
    let enemyIndex = 0;
    let playerTurn = true;
    let gameEnded = false;

    function nextTurn() {
        if (gameEnded) return;

        if (playerIndex >= playerTeam.length) {
            battleLog.innerHTML += "<p>Has perdido la batalla.</p>";
            gameEnded = true;
            displayRestartButton();
            return;
        }
        if (enemyIndex >= enemyTeam.length) {
            battleLog.innerHTML += "<p>¡Has ganado la batalla!</p>";
            gameEnded = true;
            displayRestartButton();
            return;
        }

        if (!playerTurn) {
            const playerPokemon = playerTeam[playerIndex];
            const enemyPokemon = enemyTeam[enemyIndex];
            enemyAttack(playerPokemon, enemyPokemon, function() {
                if (enemyPokemon.isFainted()) {
                    enemyIndex++;
                    if (enemyIndex >= enemyTeam.length) {
                        battleLog.innerHTML += "<p>¡Has ganado la batalla!</p>";
                        gameEnded = true;
                        displayRestartButton();
                        return;
                    }
                }
                playerTurn = true;
                displayCurrentPokemon();
            });
        } else {
            displayCurrentPokemon();
        }
    }

    // Maneja el ataque del enemigo
    function enemyAttack(playerPokemon, enemyPokemon, callback) {
        const enemyMove = enemyPokemon.moves[Math.floor(Math.random() * enemyPokemon.moves.length)];
        const { damage, hit, message } = enemyPokemon.calculateDamage(enemyMove, playerPokemon);
        battleLog.innerHTML += `<p>${message}</p>`;
        if (hit) {
            playerPokemon.takeDamage(damage);
            const effectiveness = enemyPokemon.getEffectiveness(enemyMove.type, playerPokemon.type);
            let effectivenessMessage = "";
            if (effectiveness > 1) {
                effectivenessMessage = "¡Es súper efectivo!";
            } else if (effectiveness < 1) {
                effectivenessMessage = "No es muy efectivo...";
            }
            battleLog.innerHTML += `<p>${effectivenessMessage}</p>`;
            if (playerPokemon.isFainted()) {
                battleLog.innerHTML += `<p>${playerPokemon.name} se ha debilitado</p>`;
                playerIndex++;
                if (playerIndex >= playerTeam.length) {
                    battleLog.innerHTML += "<p>Has perdido la batalla.</p>";
                    gameEnded = true;
                    displayRestartButton();
                    return;
                }
            }
        }

        updateHealthBars();
        if (callback) callback();
    }

    // Maneja el ataque del jugador
    function playerAttack(move, playerPokemon, enemyPokemon, callback) {
        const { damage, hit, message } = playerPokemon.calculateDamage(move, enemyPokemon);
        battleLog.innerHTML += `<p>${message}</p>`;
        if (hit) {
            enemyPokemon.takeDamage(damage);
            const effectiveness = playerPokemon.getEffectiveness(move.type, enemyPokemon.type);
            let effectivenessMessage = "";
            if (effectiveness > 1) {
                effectivenessMessage = "¡Es súper efectivo!";
            } else if (effectiveness < 1) {
                effectivenessMessage = "No es muy efectivo...";
            }
            battleLog.innerHTML += `<p>${effectivenessMessage}</p>`;
            if (enemyPokemon.isFainted()) {
                battleLog.innerHTML += `<p>${enemyPokemon.name} se ha debilitado</p>`;
                enemyIndex++;
                if (enemyIndex >= enemyTeam.length) {
                    battleLog.innerHTML += "<p>¡Has ganado la batalla!</p>";
                    gameEnded = true;
                    displayRestartButton();
                    return;
                }
            }
        }

        updateHealthBars();
        if (callback) callback();
    }

    nextTurn();
}

// Muestra el botón para reiniciar el juego
function displayRestartButton() {
    const restartButton = document.createElement("button");
    restartButton.textContent = "Reiniciar Juego";
    restartButton.addEventListener("click", function() {
        location.reload(); // Recarga la página para reiniciar el juego
    });
    document.getElementById("battle-screen").appendChild(restartButton);
}
