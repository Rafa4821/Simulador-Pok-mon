document.addEventListener("DOMContentLoaded", function() {
    // Referencias DOM
    const startButton = document.getElementById("start-button");
    const startScreen = document.getElementById("start-screen");
    const teamSelectionScreen = document.getElementById("team-selection-screen");
    const availablePokemonContainer = document.getElementById("available-pokemon");
    const selectedTeamContainer = document.getElementById("selected-team");
    const confirmTeamButton = document.getElementById("confirm-team-button");
    const battleScreen = document.getElementById("battle-screen");
    const enemyPokemonDisplay = document.getElementById("enemy-pokemon");
    const playerPokemonDisplay = document.getElementById("player-pokemon");
    const battleLog = document.getElementById("battle-log");
    const moveButtons = document.getElementById("move-buttons");
    const playerTeamContainer = document.getElementById("player-team");

    const maxTeamSize = 6;
    let selectedTeam = [];
    let playerIndex = 0;
    let enemyIndex = 0;
    let playerTurn = true;
    let enemyTeam = [];
    let gameEnded = false;

    const typeColors = {
        Normal: "#A8A878",
        Fire: "#F08030",
        Water: "#6890F0",
        Electric: "#F8D030",
        Grass: "#78C850",
        Ice: "#98D8D8",
        Fighting: "#C03028",
        Poison: "#A040A0",
        Ground: "#E0C068",
        Flying: "#A890F0",
        Psychic: "#F85888",
        Bug: "#A8B820",
        Rock: "#B8A038",
        Ghost: "#705898",
        Dragon: "#7038F8",
        Dark: "#705848",
        Steel: "#B8B8D0",
        Fairy: "#EE99AC"
    };

    // Función para desplazar el battle log hacia el último mensaje
    function scrollToBottom() {
        battleLog.scrollTop = battleLog.scrollHeight;
    }

    // Inicia el juego y muestra la pantalla de selección de equipo
    startButton.addEventListener("click", function() {
        startScreen.classList.remove("active");
        teamSelectionScreen.classList.add("active");
        loadPokemonData();
    });

    // Carga los datos de Pokémon desde un archivo JSON
    async function loadPokemonData() {
        const response = await fetch("temp/pokemonData.json");
        const pokemonData = await response.json();
        allPokemonData = pokemonData.map(function(data) {
            return new Pokemon(
                data.name,
                data.type,
                data.hp,
                data.attack,
                data.defense,
                data.spAttack,
                data.spDefense,
                data.speed,
                data.moves
            );
        });
        displayAvailablePokemon(allPokemonData);
    }

    // Muestra los Pokémon disponibles para seleccionar
    function displayAvailablePokemon(pokemonData) {
        availablePokemonContainer.innerHTML = "";
        pokemonData.forEach(function(pokemon) {
            const pokemonItem = document.createElement("div");
            pokemonItem.classList.add("pokemon-item");

            const pokemonImg = document.createElement("img");
            pokemonImg.src = "images/" + pokemon.name.toLowerCase() + ".png";
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

    // Selecciona o deselecciona un Pokémon y lo agrega o quita del equipo del jugador
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

    // Actualiza la pantalla de equipo seleccionado
    function updateSelectedTeam() {
        selectedTeamContainer.innerHTML = "<h3>Equipo Seleccionado</h3>";
        selectedTeam.forEach(function(pokemon) {
            const pokemonItem = document.createElement("div");
            pokemonItem.classList.add("pokemon-item");

            const pokemonImg = document.createElement("img");
            pokemonImg.src = "images/" + pokemon.name.toLowerCase() + ".png";
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
        });

        confirmTeamButton.disabled = selectedTeam.length < maxTeamSize;
    }

    // Quitar un Pokémon seleccionado
    function deselectPokemon(pokemon) {
        selectedTeam = selectedTeam.filter(p => p !== pokemon);
        updateSelectedTeam();
        const pokemonItems = document.querySelectorAll('.pokemon-item');
        pokemonItems.forEach(item => {
            const button = item.querySelector('button');
            if (button.textContent === pokemon.name) {
                item.classList.remove("selected");
            }
        });
    }

    // Confirma el equipo seleccionado y empieza la batalla
    confirmTeamButton.addEventListener("click", function() {
        teamSelectionScreen.classList.remove("active");
        battleScreen.classList.add("active");
        displayPlayerTeam();
        startBattle();
    });

    // Muestra el equipo del jugador en la pantalla de batalla
    function displayPlayerTeam() {
        playerTeamContainer.innerHTML = "";
        selectedTeam.forEach(function(pokemon, index) {
            const pokemonItem = document.createElement("div");
            pokemonItem.classList.add("pokemon-item");

            const pokemonImg = document.createElement("img");
            pokemonImg.src = "images/" + pokemon.name.toLowerCase() + ".png";
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

    // Cambia el Pokémon actual del jugador
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

    // Muestra el Pokémon actual del jugador y del enemigo
    function displayCurrentPokemon() {
        const playerPokemon = selectedTeam[playerIndex];
        const enemyPokemon = enemyTeam[enemyIndex];

        playerPokemonDisplay.innerHTML = `
            <img src="images/${playerPokemon.name.toLowerCase()}.png" alt="${playerPokemon.name}" style="width: 150px; height: 150px;">
            <p>${playerPokemon.name}</p>
            <div class="health-bar"><div id="player-health" style="width: ${(playerPokemon.currentHP / playerPokemon.hp) * 100}%;"></div></div>`;
        enemyPokemonDisplay.innerHTML = `
            <img src="images/${enemyPokemon.name.toLowerCase()}.png" alt="${enemyPokemon.name}" style="width: 150px; height: 150px;">
            <p>${enemyPokemon.name}</p>
            <div class="health-bar"><div id="enemy-health" style="width: ${(enemyPokemon.currentHP / enemyPokemon.hp) * 100}%;"></div></div>`;

        updateHealthBars();
        updateMoveButtons(playerPokemon, enemyPokemon);
        scrollToBottom(); // Desplazar el battle log hacia abajo después de mostrar el Pokémon actual
    }

    // Actualiza las barras de salud de los Pokémon
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

    // Maneja el ataque del enemigo
    function enemyAttack(playerPokemon, enemyPokemon, callback) {
        if (!playerPokemon || playerPokemon.currentHP === undefined) {
            console.error("El objeto playerPokemon o la propiedad currentHP no existen");
            return;
        }
        if (!enemyPokemon || enemyPokemon.currentHP === undefined) {
            console.error("El objeto enemyPokemon o la propiedad currentHP no existen");
            return;
        }

        const enemyMove = enemyPokemon.moves[Math.floor(Math.random() * enemyPokemon.moves.length)];
        const { damage, hit, message } = enemyPokemon.calculateDamage(enemyMove, playerPokemon);
        battleLog.innerHTML += `<p>${message}</p>`;
        scrollToBottom(); // Desplazar el battle log hacia abajo después de agregar el mensaje del ataque enemigo
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
            scrollToBottom(); // Desplazar el battle log hacia abajo después de agregar el mensaje de efectividad
            if (playerPokemon.isFainted()) {
                battleLog.innerHTML += `<p>${playerPokemon.name} se ha debilitado</p>`;
                scrollToBottom(); // Desplazar el battle log hacia abajo después de agregar el mensaje de debilitado
                playerIndex++;
                if (playerIndex >= selectedTeam.length) {
                    battleLog.innerHTML += "<p>Has perdido la batalla.</p>";
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

    // Actualiza los botones de movimientos disponibles para el jugador
    function updateMoveButtons(playerPokemon, enemyPokemon) {
        moveButtons.innerHTML = "";
        playerPokemon.moves.forEach(function(move) {
            const btn = document.createElement("button");
            btn.textContent = move.name;
            btn.style.backgroundColor = typeColors[move.type] || "#FFFFFF"; // Aplica el color según el tipo del movimiento
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
                                battleLog.innerHTML += "<p>¡Has ganado la batalla!</p>";
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
                                        battleLog.innerHTML += "<p>¡Has ganado la batalla!</p>";
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
                                battleLog.innerHTML += "<p>Has perdido la batalla.</p>";
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

    // Maneja el ataque del jugador
    function playerAttack(move, playerPokemon, enemyPokemon, callback) {
        const { damage, hit, message } = playerPokemon.calculateDamage(move, enemyPokemon);
        battleLog.innerHTML += `<p>${message}</p>`;
        scrollToBottom(); // Desplazar el battle log hacia abajo después de agregar el mensaje del ataque del jugador
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
            scrollToBottom(); // Desplazar el battle log hacia abajo después de agregar el mensaje de efectividad
            if (enemyPokemon.isFainted()) {
                battleLog.innerHTML += `<p>${enemyPokemon.name} se ha debilitado</p>`;
                scrollToBottom(); // Desplazar el battle log hacia abajo después de agregar el mensaje de debilitado
                enemyIndex++;
                if (enemyIndex >= enemyTeam.length) {
                    battleLog.innerHTML += "<p>¡Has ganado la batalla!</p>";
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

    // Genera un equipo aleatorio de Pokémon para el enemigo
    function generateRandomTeam() {
        const shuffled = allPokemonData.sort(() => 0.5 - Math.random());
        const team = shuffled.slice(0, 6);
        team.forEach(pokemon => pokemon.currentHP = pokemon.hp); // Reinicia el HP de cada Pokémon en el equipo
        return team;
    }

    // Inicia la batalla, genera equipos y controla los turnos
    function startBattle() {
        enemyTeam = generateRandomTeam();
        playerIndex = 0;
        enemyIndex = 0;
        playerTurn = true;
        gameEnded = false;
        selectedTeam.forEach(pokemon => pokemon.currentHP = pokemon.hp); // Reinicia el HP de cada Pokémon del jugador
        nextTurn();
    }

    // Controla el flujo de los turnos durante la batalla
    function nextTurn() {
        if (gameEnded) return;

        if (playerIndex >= selectedTeam.length) {
            battleLog.innerHTML += "<p>Has perdido la batalla.</p>";
            alert("Has perdido la batalla.");
            gameEnded = true;
            displayRestartButton();
            return;
        }
        if (enemyIndex >= enemyTeam.length) {
            battleLog.innerHTML += "<p>¡Has ganado la batalla!</p>";
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
                        battleLog.innerHTML += "<p>¡Has ganado la batalla!</p>";
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

    // Permite al jugador seleccionar un nuevo Pokémon cuando el actual se debilita
    function selectNewPokemon() {
        alert("Selecciona un nuevo Pokémon");
        displayPlayerTeam();
    }

    // Botón para reiniciar el juego
    function displayRestartButton() {
        const restartButton = document.createElement("button");
        restartButton.textContent = "Reiniciar Juego";
        restartButton.addEventListener("click", function() {
            location.reload();
        });
        battleScreen.appendChild(restartButton);
    }

    // Inicia el proceso de selección de equipo
    startButton.addEventListener("click", function() {
        startScreen.classList.remove("active");
        teamSelectionScreen.classList.add("active");
        loadPokemonData();
    });

    // Confirma el equipo seleccionado y empieza la batalla
    confirmTeamButton.addEventListener("click", function() {
        teamSelectionScreen.classList.remove("active");
        battleScreen.classList.add("active");
        displayPlayerTeam();
        startBattle();
    });
});
