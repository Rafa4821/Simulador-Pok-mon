const specificPokemonNames = [
    "charizard", "feraligatr", "venusaur", "blaziken", "tyranitar", "sceptile", 
    "aggron", "mewtwo", "dragonite", "gyarados", "lapras", "weavile", "alakazam", 
    "magmortar", "electivire", "salamence", "gardevoir", "sylveon", "azumarill", 
    "giratina-origin", "kingdra", "hydreigon", "rayquaza", "torterra"
];

const selectedTeam = [];  // Definir selectedTeam en el ámbito global
const maxTeamSize = 6;
let allPokemonData = [];

document.addEventListener("DOMContentLoaded", async function() {
    try {
        await loadTypeChart(); // Carga la tabla de tipos desde PokeAPI
        await loadPokemonData(); // Carga los datos de Pokémon
        initializeUI(); // Inicializa la interfaz de usuario
    } catch (error) {
        console.error("Error inicializando la aplicación:", error);
    }
});

async function loadPokemonData() {
    const pokemonPromises = specificPokemonNames.map(async (name) => {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
            if (!response.ok) throw new Error(`No se pudo cargar los datos de ${name}`);
            const pokemon = await response.json();

            // Verificar que los datos necesarios existen antes de retornar el objeto Pokémon
            if (!pokemon.name || !pokemon.types || !pokemon.stats || !pokemon.moves) {
                throw new Error(`Datos incompletos para ${name}`);
            }

            const stats = pokemon.stats.reduce((acc, stat) => {
                acc[stat.stat.name] = stat.base_stat;
                return acc;
            }, {});

            const moves = await Promise.all(
                pokemon.moves.map(async (moveInfo) => {
                    try {
                        const moveResponse = await fetch(moveInfo.move.url);
                        if (!moveResponse.ok) throw new Error(`No se pudo cargar los datos del movimiento ${moveInfo.move.name}`);
                        const moveData = await moveResponse.json();
                        return {
                            name: moveData.name,
                            type: moveData.type.name,
                            power: moveData.power || 50,
                            category: moveData.damage_class.name,
                            accuracy: moveData.accuracy || 100,
                            effect: moveData.effect_entries.find(entry => entry.language.name === "en")?.short_effect || "No effect"
                        };
                    } catch (error) {
                        console.error(`Error cargando los datos del movimiento ${moveInfo.move.name}:`, error);
                        return null; // Devolver null si hay un error cargando el movimiento
                    }
                })
            );

            const filteredMoves = moves.filter(move => move !== null); // Filtrar los movimientos que no se pudieron cargar

            const abilities = await Promise.all(
                pokemon.abilities.map(async (abilityInfo) => {
                    const abilityResponse = await fetch(abilityInfo.ability.url);
                    const abilityData = await abilityResponse.json();
                    return {
                        name: abilityData.name,
                        effect: abilityData.effect_entries.find(entry => entry.language.name === "en")?.short_effect || "No effect"
                    };
                })
            );

            return new Pokemon(
                pokemon.name,
                pokemon.types.map(typeInfo => typeInfo.type.name),
                stats.hp,
                stats.attack,
                stats.defense,
                stats["special-attack"],
                stats["special-defense"],
                stats.speed,
                filteredMoves,
                abilities,
                pokemon.sprites.front_default,
                pokemon.sprites.back_default
            );
        } catch (error) {
            console.error(`Error procesando los datos de ${name}:`, error);
            return null;
        }
    });

    const pokemonData = await Promise.all(pokemonPromises);
    allPokemonData = pokemonData.filter(pokemon => pokemon !== null && pokemon.name); // Filtra los Pokémon que no se pudieron cargar
    displayAvailablePokemon(allPokemonData);
}


function initializeUI() {
    const startButton = document.getElementById("start-button");
    if (startButton) {
        startButton.addEventListener("click", function() {
            document.getElementById("start-screen").classList.remove("active");
            document.getElementById("team-selection-screen").classList.add("active");
        });
    } else {
        console.error("El elemento start-button no existe o no se ha cargado aún");
    }
}

function displayAvailablePokemon(pokemonData) {
    const availablePokemonContainer = document.getElementById("available-pokemon");
    availablePokemonContainer.innerHTML = "";
    pokemonData.forEach(function(pokemon) {
        const pokemonItem = document.createElement("div");
        pokemonItem.classList.add("pokemon-item");

        const pokemonImg = document.createElement("img");
        pokemonImg.src = pokemon.frontImage;
        pokemonImg.alt = pokemon.name;

        const pokemonButton = document.createElement("button");
        pokemonButton.textContent = pokemon.name;
        pokemonButton.addEventListener("click", function() {
            selectPokemon(pokemon, pokemonItem);
        });

        pokemonItem.appendChild(pokemonImg);
        pokemonItem.appendChild(pokemonButton);
        availablePokemonContainer.appendChild(pokemonItem);
    });
}

function selectPokemon(pokemon, pokemonItem) {
    const index = selectedTeam.indexOf(pokemon);
    if (index !== -1) {
        selectedTeam.splice(index, 1);
        pokemonItem.classList.remove("selected");
    } else if (selectedTeam.length < maxTeamSize) {
        selectedTeam.push(pokemon);
        pokemonItem.classList.add("selected");
    }
    updateSelectedTeam();
}

function updateSelectedTeam() {
    const selectedTeamContainer = document.getElementById("selected-team");
    selectedTeamContainer.innerHTML = "<h3>Equipo Seleccionado</h3>";
    selectedTeam.forEach(function(pokemon) {
        const pokemonItem = document.createElement("div");
        pokemonItem.classList.add("pokemon-item");

        const pokemonImg = document.createElement("img");
        pokemonImg.src = pokemon.frontImage;
        pokemonImg.alt = pokemon.name;

        const pokemonName = document.createElement("div");
        pokemonName.textContent = pokemon.name;

        const removeButton = document.createElement("button");
        removeButton.textContent = "Quitar";
        removeButton.addEventListener("click", function() {
            deselectPokemon(pokemon);
        });

        pokemonItem.appendChild(pokemonImg);
        pokemonItem.appendChild(pokemonName);
        pokemonItem.appendChild(removeButton);
        selectedTeamContainer.appendChild(pokemonItem);

        // Display moves and abilities
        displayPokemonDetails(pokemon);
    });

    const teamSize = parseInt(document.getElementById("team-size-selector").value);
    const confirmTeamButton = document.getElementById("confirm-team-button");
    confirmTeamButton.disabled = selectedTeam.length < teamSize;
}


function displayPokemonDetails(pokemon) {
    const movesContainer = document.getElementById("pokemon-moves");
    const abilitiesContainer = document.getElementById("pokemon-abilities");

    movesContainer.innerHTML = "<h4>Movimientos Disponibles</h4>";
    abilitiesContainer.innerHTML = "<h4>Habilidades</h4>";

    pokemon.moves.forEach(move => {
        const moveButton = document.createElement("button");
        moveButton.textContent = move.name;
        moveButton.addEventListener("click", function() {
            selectMove(pokemon, move);
        });
        movesContainer.appendChild(moveButton);
    });

    pokemon.abilities.forEach(ability => {
        const abilityButton = document.createElement("button");
        abilityButton.textContent = ability.name;
        abilityButton.addEventListener("click", function() {
            selectAbility(pokemon, ability);
        });
        abilitiesContainer.appendChild(abilityButton);
    });
}

function selectMove(pokemon, move) {
    if (pokemon.selectedMoves.length < 4) {
        pokemon.selectedMoves.push(move);
        updateSelectedTeam();
    } else {
        alert("Ya has seleccionado 4 movimientos.");
    }
}


function selectAbility(pokemon, ability) {
    pokemon.selectedAbility = ability;
    updateSelectedTeam();
}

function deselectPokemon(pokemon) {
    const index = selectedTeam.indexOf(pokemon);
    if (index !== -1) {
        selectedTeam.splice(index, 1);
        updateSelectedTeam();
    }
    const pokemonItems = document.querySelectorAll('.pokemon-item');
    pokemonItems.forEach(item => {
        const button = item.querySelector('button');
        if (button.textContent === pokemon.name) {
            item.classList.remove("selected");
        }
    });
}

document.getElementById("confirm-team-button").addEventListener("click", function() {
    const teamSize = parseInt(document.getElementById("team-size-selector").value);
    if (selectedTeam.length === teamSize) {
        saveSelectedTeam(); // Guardar el equipo en localStorage
        document.getElementById("team-selection-screen").classList.remove("active");
        document.getElementById("battle-screen").classList.add("active");
        displayPlayerTeam();
        startBattle();
    } else {
        alert(`Seleccione un equipo de ${teamSize} Pokémon antes de iniciar la batalla.`);
    }
});


function displayPlayerTeam() {
    const playerTeamContainer = document.getElementById("player-team");
    playerTeamContainer.innerHTML = "";
    selectedTeam.forEach(function(pokemon, index) {
        const pokemonItem = document.createElement("div");
        pokemonItem.classList.add("pokemon-item");

        const pokemonImg = document.createElement("img");
        pokemonImg.src = pokemon.backImage;
        pokemonImg.alt = pokemon.name;

        const pokemonName = document.createElement("div");
        pokemonName.textContent = pokemon.name;

        const switchButton = document.createElement("button");
        switchButton.textContent = "Cambiar";
        switchButton.addEventListener("click", function() {
            switchPokemon(index);
        });

        pokemonItem.appendChild(pokemonImg);
        pokemonItem.appendChild(pokemonName);
        pokemonItem.appendChild(switchButton);
        playerTeamContainer.appendChild(pokemonItem);
    });
}

function switchPokemon(index) {
    if (index !== playerIndex && selectedTeam[index] && !selectedTeam[index].isFainted()) {
        playerIndex = index;
        displayCurrentPokemon();
        playerTurn = false;
        nextTurn();
    } else {
        alert("No puedes seleccionar un Pokémon debilitado o el mismo Pokémon actual.");
    }
}

function displayCurrentPokemon() {
    const playerPokemon = selectedTeam[playerIndex];
    const enemyPokemon = enemyTeam[enemyIndex];

    document.getElementById("player-pokemon").innerHTML = `
        <img src="${playerPokemon.backImage}" alt="${playerPokemon.name}" style="width: 150px; height: 150px;">
        <p>${playerPokemon.name}</p>
        <div class="health-bar"><div id="player-health" style="width: ${(playerPokemon.currentHP / playerPokemon.hp) * 100}%;"></div></div>`;
    document.getElementById("enemy-pokemon").innerHTML = `
        <img src="${enemyPokemon.frontImage}" alt="${enemyPokemon.name}" style="width: 150px; height: 150px;">
        <p>${enemyPokemon.name}</p>
        <div class="health-bar"><div id="enemy-health" style="width: ${(enemyPokemon.currentHP / enemyPokemon.hp) * 100}%;"></div></div>`;

    updateHealthBars();
    updateMoveButtons(playerPokemon, enemyPokemon);
    scrollToBottom(); // Desplazar el battle log hacia abajo después de mostrar el Pokémon actual
}


function updateHealthBars() {
    const playerPokemon = selectedTeam[playerIndex];
    const enemyPokemon = enemyTeam[enemyIndex];

    const playerHealthBar = document.getElementById("player-health");
    const enemyHealthBar = document.getElementById("enemy-health");

    if (playerHealthBar && playerPokemon) {
        playerHealthBar.style.width = (playerPokemon.currentHP / playerPokemon.hp) * 100 + "%";
    } else {
        console.error("El objeto playerPokemon o la propiedad currentHP no existen");
    }

    if (enemyHealthBar && enemyPokemon) {
        enemyHealthBar.style.width = (enemyPokemon.currentHP / enemyPokemon.hp) * 100 + "%";
    } else {
        console.error("El objeto enemyPokemon o la propiedad currentHP no existen");
    }
    scrollToBottom(); // Desplazar el battle log hacia abajo después de actualizar las barras de salud
}

function scrollToBottom() {
    const battleLog = document.getElementById("battle-log");
    battleLog.scrollTop = battleLog.scrollHeight;
}

function saveSelectedTeam() {
    localStorage.setItem('selectedTeam', JSON.stringify(selectedTeam.map(pokemon => pokemon.name)));
}

function saveFavoriteTeam(teamName) {
    const favoriteTeams = JSON.parse(localStorage.getItem('favoriteTeams')) || [];
    const team = selectedTeam.map(pokemon => pokemon.name);
    favoriteTeams.push({ name: teamName, team });
    localStorage.setItem('favoriteTeams', JSON.stringify(favoriteTeams));
    loadFavoriteTeams(); // Reload the favorite teams to show the new one
}

function loadFavoriteTeams() {
    const favoriteTeamsContainer = document.getElementById("favorite-teams-container");
    favoriteTeamsContainer.innerHTML = '';
    const favoriteTeams = JSON.parse(localStorage.getItem('favoriteTeams')) || [];
    favoriteTeams.forEach(favorite => {
        const teamButton = document.createElement('button');
        teamButton.textContent = favorite.name;
        teamButton.addEventListener('click', function() {
            selectedTeam = allPokemonData.filter(pokemon => favorite.team.includes(pokemon.name));
            updateFavoriteTeamPreview();
            document.getElementById("start-battle-favorite-button").disabled = false; // Enable the start battle button
        });
        favoriteTeamsContainer.appendChild(teamButton);
    });
}

function updateFavoriteTeamPreview() {
    const favoriteTeamPreviewContainer = document.getElementById("favorite-team-preview");
    favoriteTeamPreviewContainer.innerHTML = "<h3>Vista Previa del Equipo</h3>";
    selectedTeam.forEach(function(pokemon) {
        const pokemonItem = document.createElement("div");
        pokemonItem.classList.add("pokemon-item");

        const pokemonImg = document.createElement("img");
        pokemonImg.src = pokemon.frontImage;
        pokemonImg.alt = pokemon.name;

        const pokemonName = document.createElement("div");
        pokemonName.textContent = pokemon.name;

        pokemonItem.appendChild(pokemonImg);
        pokemonItem.appendChild(pokemonName);
        favoriteTeamPreviewContainer.appendChild(pokemonItem);
    });
}

function deleteFavoriteTeam(teamName) {
    let favoriteTeams = JSON.parse(localStorage.getItem('favoriteTeams')) || [];
    favoriteTeams = favoriteTeams.filter(favorite => favorite.name !== teamName);
    localStorage.setItem('favoriteTeams', JSON.stringify(favoriteTeams));
    loadFavoriteTeams();
}

document.getElementById("save-favorite-team-button").addEventListener("click", function() {
    const teamName = prompt("Ingrese el nombre para su equipo favorito:");
    if (teamName) {
        saveFavoriteTeam(teamName);
    }
});

document.getElementById("start-battle-favorite-button").addEventListener("click", function() {
    if (selectedTeam.length === maxTeamSize) {
        document.getElementById("favorite-teams-screen").classList.remove('active');
        document.getElementById("battle-screen").classList.add('active');
        displayPlayerTeam();
        startBattle();
    } else {
        alert("Seleccione un equipo de 6 Pokémon antes de iniciar la batalla.");
    }
});

document.getElementById("back-button").addEventListener("click", function() {
    document.getElementById("favorite-teams-screen").classList.remove("active");
    document.getElementById("start-screen").classList.add("active");
});

document.getElementById("back-to-start-button").addEventListener("click", function() {
    document.getElementById("team-selection-screen").classList.remove("active");
    document.getElementById("start-screen").classList.add("active");
});

function generateRandomTeam() {
    const shuffled = allPokemonData.sort(() => 0.5 - Math.random());
    const team = shuffled.slice(0, maxTeamSize);
    team.forEach(pokemon => pokemon.currentHP = pokemon.hp); // Reinicia el HP de cada Pokémon en el equipo
    return team;
}

function startBattle() {
    enemyTeam = generateRandomTeam();
    playerIndex = 0;
    enemyIndex = 0;
    playerTurn = true;
    gameEnded = false;
    selectedTeam.forEach(pokemon => pokemon.currentHP = pokemon.hp); // Reinicia el HP de cada Pokémon del jugador
    nextTurn();
}

function nextTurn() {
    if (gameEnded) return;

    if (playerIndex >= selectedTeam.length) {
        document.getElementById("battle-log").innerHTML += "<p>Has perdido la batalla.</p>";
        alert("Has perdido la batalla.");
        gameEnded = true;
        displayRestartButton();
        return;
    }
    if (enemyIndex >= enemyTeam.length) {
        document.getElementById("battle-log").innerHTML += "<p>¡Has ganado la batalla!</p>";
        alert("¡Has ganado la batalla!");
        gameEnded = true;
        displayRestartButton();
        return;
    }

    if (!playerTurn) {
        const playerPokemon = selectedTeam[playerIndex];
        const enemyPokemon = enemyTeam[enemyIndex];
        enemyAttack(playerPokemon, enemyPokemon, function() {
            if (enemyPokemon.isFainted()) {
                enemyIndex++;
                if (enemyIndex >= enemyTeam.length) {
                    document.getElementById("battle-log").innerHTML += "<p>¡Has ganado la batalla!</p>";
                    alert("¡Has ganado la batalla!");
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

function selectNewPokemon() {
    alert("Selecciona un nuevo Pokémon");
    displayPlayerTeam();
}

function displayRestartButton() {
    const restartButton = document.createElement("button");
    restartButton.textContent = "Reiniciar Juego";
    restartButton.addEventListener("click", function() {
        location.reload();
    });
    document.getElementById("battle-screen").appendChild(restartButton);
}

function updateMoveButtons(playerPokemon, enemyPokemon) {
    const moveButtons = document.getElementById("move-buttons");
    moveButtons.innerHTML = "";
    playerPokemon.selectedMoves.forEach(function(move) {
        const btn = document.createElement("button");
        btn.textContent = move.name;
        btn.classList.add('move-button', move.type);
        btn.disabled = gameEnded; // Deshabilita el botón si el juego ha terminado
        btn.addEventListener("click", function() {
            if (gameEnded) return; // Si el juego ha terminado, no hacer nada
            console.log("Botón de movimiento " + move.name + " presionado");
            if (playerPokemon.speed >= enemyPokemon.speed) {
                playerAttack(move, playerPokemon, enemyPokemon, function() {
                    if (!enemyPokemon.isFainted()) {
                        enemyAttack(playerPokemon, enemyPokemon, nextTurn);
                    } else {
                        enemyIndex++;
                        if (enemyIndex >= enemyTeam.length) {
                            document.getElementById("battle-log").innerHTML += "<p>¡Has ganado la batalla!</p>";
                            alert("¡Has ganado la batalla!");
                            gameEnded = true;
                            displayRestartButton();
                            return;
                        }
                        nextTurn();
                    }
                });
            } else {
                enemyAttack(playerPokemon, enemyPokemon, function() {
                    if (!playerPokemon.isFainted()) {
                        playerAttack(move, playerPokemon, enemyPokemon, function() {
                            if (enemyPokemon.isFainted()) {
                                enemyIndex++;
                                if (enemyIndex >= enemyTeam.length) {
                                    document.getElementById("battle-log").innerHTML += "<p>¡Has ganado la batalla!</p>";
                                    alert("¡Has ganado la batalla!");
                                    gameEnded = true;
                                    displayRestartButton();
                                    return;
                                }
                            }
                            nextTurn();
                        });
                    } else {
                        playerIndex++;
                        if (playerIndex >= selectedTeam.length) {
                            document.getElementById("battle-log").innerHTML += "<p>Has perdido la batalla.</p>";
                            alert("Has perdido la batalla.");
                            gameEnded = true;
                            displayRestartButton();
                            return;
                        }
                        selectNewPokemon();
                    }
                });
            }
        });
        moveButtons.appendChild(btn);
    });
}


function playerAttack(move, playerPokemon, enemyPokemon, callback) {
    const { damage, hit, message } = playerPokemon.calculateDamage(move, enemyPokemon);
    document.getElementById("battle-log").innerHTML += `<p>${message}</p>`;
    scrollToBottom(); // Desplazar el battle log hacia abajo después de agregar el mensaje del ataque del jugador
    if (hit) {
        enemyPokemon.takeDamage(damage);
        const effectiveness = getEffectiveness(move.type, enemyPokemon.types);
        let effectivenessMessage = "";
        if (effectiveness > 1) {
            effectivenessMessage = "¡Es súper efectivo!";
        } else if (effectiveness < 1) {
            effectivenessMessage = "No es muy efectivo...";
        }
        document.getElementById("battle-log").innerHTML += `<p>${effectivenessMessage}</p>`;
        scrollToBottom(); // Desplazar el battle log hacia abajo después de agregar el mensaje de efectividad
        if (enemyPokemon.isFainted()) {
            document.getElementById("battle-log").innerHTML += `<p>${enemyPokemon.name} se ha debilitado</p>`;
            scrollToBottom(); // Desplazar el battle log hacia abajo después de agregar el mensaje de debilitado
            enemyIndex++;
            if (enemyIndex >= enemyTeam.length) {
                document.getElementById("battle-log").innerHTML += "<p>¡Has ganado la batalla!</p>";
                alert("¡Has ganado la batalla!");
                gameEnded = true;
                displayRestartButton();
                return;
            }
        }
    }

    updateHealthBars();
    if (callback) callback();
}

function enemyAttack(playerPokemon, enemyPokemon, callback) {
    if (!playerPokemon || playerPokemon.currentHP === undefined) {
        console.error("El objeto playerPokemon o la propiedad currentHP no existen");
        return;
    }
    if (!enemyPokemon || enemyPokemon.currentHP === undefined) {
        console.error("El objeto enemyPokemon o la propiedad currentHP no existen");
        return;
    }

    const enemyMove = enemyPokemon.selectedMoves[Math.floor(Math.random() * enemyPokemon.selectedMoves.length)];
    const { damage, hit, message } = enemyPokemon.calculateDamage(enemyMove, playerPokemon);
    document.getElementById("battle-log").innerHTML += `<p>${message}</p>`;
    scrollToBottom(); // Desplazar el battle log hacia abajo después de agregar el mensaje del ataque enemigo
    if (hit) {
        playerPokemon.takeDamage(damage);
        const effectiveness = getEffectiveness(enemyMove.type, playerPokemon.types);
        let effectivenessMessage = "";
        if (effectiveness > 1) {
            effectivenessMessage = "¡Es súper efectivo!";
        } else if (effectiveness < 1) {
            effectivenessMessage = "No es muy efectivo...";
        }
        document.getElementById("battle-log").innerHTML += `<p>${effectivenessMessage}</p>`;
        scrollToBottom(); // Desplazar el battle log hacia abajo después de agregar el mensaje de efectividad
        if (playerPokemon.isFainted()) {
            document.getElementById("battle-log").innerHTML += `<p>${playerPokemon.name} se ha debilitado</p>`;
            scrollToBottom(); // Desplazar el battle log hacia abajo después de agregar el mensaje de debilitado
            playerIndex++;
            if (playerIndex >= selectedTeam.length) {
                document.getElementById("battle-log").innerHTML += "<p>Has perdido la batalla.</p>";
                alert("Has perdido la batalla.");
                gameEnded = true;
                displayRestartButton();
                return;
            }
            selectNewPokemon();
        }
    }

    updateHealthBars();
    if (callback) callback();
}
