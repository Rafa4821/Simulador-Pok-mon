document.addEventListener("DOMContentLoaded", function() {
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
    let allPokemonData = [];
    let playerIndex = 0;
    let enemyIndex = 0;
    let playerTurn = true;
    let enemyTeam = [];
    let gameEnded = false;

    startButton.addEventListener("click", function() {
        startScreen.classList.remove("active");
        teamSelectionScreen.classList.add("active");
        loadPokemonData();
    });

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

    function selectPokemon(pokemon, pokemonItem) {
        if (selectedTeam.length < maxTeamSize && !selectedTeam.includes(pokemon)) {
            selectedTeam.push(pokemon);
            pokemonItem.classList.add("selected");
            updateSelectedTeam();
        }
    }

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

            pokemonItem.appendChild(pokemonImg);
            pokemonItem.appendChild(pokemonName);
            selectedTeamContainer.appendChild(pokemonItem);
        });

        confirmTeamButton.disabled = selectedTeam.length < maxTeamSize;
    }

    confirmTeamButton.addEventListener("click", function() {
        teamSelectionScreen.classList.remove("active");
        battleScreen.classList.add("active");
        displayPlayerTeam();
        startBattle();
    });

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

    function switchPokemon(index) {
        playerIndex = index;
        displayCurrentPokemon();
        playerTurn = false;
        nextTurn();
    }

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
    
        const enemyMove = enemyPokemon.moves[Math.floor(Math.random() * enemyPokemon.moves.length)];
        const effectiveness = enemyPokemon.getEffectiveness(enemyMove.type, playerPokemon.type);
        const enemyDamage = enemyPokemon.calculateDamage(enemyMove, playerPokemon) * effectiveness;
        playerPokemon.takeDamage(enemyDamage);
    
        let effectivenessMessage = "";
        if (effectiveness > 1) {
            effectivenessMessage = "¡Es súper efectivo!";
        } else if (effectiveness < 1) {
            effectivenessMessage = "No es muy efectivo...";
        }
    
        battleLog.innerHTML += "<p>" + enemyPokemon.name + " usa " + enemyMove.name + " y causa " + enemyDamage + " de daño a " + playerPokemon.name + ". " + effectivenessMessage + "</p>";
        updateHealthBars();
    
        if (playerPokemon.isFainted()) {
            battleLog.innerHTML += "<p>" + playerPokemon.name + " se ha debilitado</p>";
            playerIndex++;
            if (playerIndex >= selectedTeam.length) {
                battleLog.innerHTML += "<p>Has perdido la batalla.</p>";
                gameEnded = true;
                return;
            }
        }
    
        if (callback) {
            callback();
        }
    }
    

    function updateMoveButtons(playerPokemon, enemyPokemon) {
        moveButtons.innerHTML = "";
        playerPokemon.moves.forEach(function(move) {
            const btn = document.createElement("button");
            btn.textContent = move.name;
            btn.addEventListener("click", function() {
                console.log("Botón de movimiento " + move.name + " presionado");
                if (playerPokemon.speed >= enemyPokemon.speed) {
                    playerAttack(move, playerPokemon, enemyPokemon, function() {
                        if (!enemyPokemon.isFainted()) {
                            enemyAttack(playerPokemon, enemyPokemon, nextTurn);
                        } else {
                            enemyIndex++;
                            if (enemyIndex >= enemyTeam.length) {
                                battleLog.innerHTML += "<p>¡Has ganado la batalla!</p>";
                                gameEnded = true;
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
                                        gameEnded = true;
                                        return;
                                    }
                                }
                                nextTurn();
                            });
                        } else {
                            playerIndex++;
                            if (playerIndex >= selectedTeam.length) {
                                battleLog.innerHTML += "<p>Has perdido la batalla.</p>";
                                gameEnded = true;
                                return;
                            }
                            nextTurn();
                        }
                    });
                }
            });
            moveButtons.appendChild(btn);
        });
    }

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
                    return;
                }
            }
        }
    
        updateHealthBars();
        if (callback) callback();
    }
    
    
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
                    return;
                }
            }
        }
    
        updateHealthBars();
        if (callback) callback();
    }

        function generateRandomTeam() {
            const shuffled = allPokemonData.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, 6);
        }
    
        function startBattle() {
            enemyTeam = generateRandomTeam();
            playerIndex = 0;
            enemyIndex = 0;
            playerTurn = true;
            gameEnded = false;
            nextTurn();
        }
    
        function nextTurn() {
            if (gameEnded) return;

            if (playerIndex >= selectedTeam.length) {
                battleLog.innerHTML += "<p>Has perdido la batalla.</p>";
                gameEnded = true;
                return;
            }
            if (enemyIndex >= enemyTeam.length) {
                battleLog.innerHTML += "<p>¡Has ganado la batalla!</p>";
                gameEnded = true;
                return;
            }

            if (!playerTurn) {
                const playerPokemon = selectedTeam[playerIndex];
                const enemyPokemon = enemyTeam[enemyIndex];
                enemyAttack(playerPokemon, enemyPokemon, function() {
                    playerTurn = true;
                    displayCurrentPokemon();
                });
            } else {
                displayCurrentPokemon();
            }
        }

        function updateMoveButtons(playerPokemon, enemyPokemon) {
            moveButtons.innerHTML = "";
            playerPokemon.moves.forEach(function(move) {
                const btn = document.createElement("button");
                btn.textContent = move.name;
                btn.addEventListener("click", function() {
                    console.log("Botón de movimiento " + move.name + " presionado");
                    if (playerPokemon.speed >= enemyPokemon.speed) {
                        playerAttack(move, playerPokemon, enemyPokemon, function() {
                            if (!enemyPokemon.isFainted()) {
                                enemyAttack(playerPokemon, enemyPokemon, nextTurn);
                            } else {
                                enemyIndex++;
                                if (enemyIndex >= enemyTeam.length) {
                                    battleLog.innerHTML += "<p>¡Has ganado la batalla!</p>";
                                    gameEnded = true;
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
                                            gameEnded = true;
                                            return;
                                        }
                                    }
                                    nextTurn();
                                });
                            } else {
                                playerIndex++;
                                if (playerIndex >= selectedTeam.length) {
                                    battleLog.innerHTML += "<p>Has perdido la batalla.</p>";
                                    gameEnded = true;
                                    return;
                                }
                                nextTurn();
                            }
                        });
                    }
                });
                moveButtons.appendChild(btn);
            });
        }

        function playerAttack(move, playerPokemon, enemyPokemon, callback) {
            const effectiveness = playerPokemon.getEffectiveness(move.type, enemyPokemon.type);
            const damage = playerPokemon.calculateDamage(move, enemyPokemon) * effectiveness;
            enemyPokemon.takeDamage(damage);

            let effectivenessMessage = "";
            if (effectiveness > 1) {
                effectivenessMessage = "¡Es súper efectivo!";
            } else if (effectiveness < 1) {
                effectivenessMessage = "No es muy efectivo...";
            }

            battleLog.innerHTML += "<p>" + playerPokemon.name + " usa " + move.name + " y causa " + damage + " de daño a " + enemyPokemon.name + ". " + effectivenessMessage + "</p>";
            updateHealthBars();

            if (enemyPokemon.isFainted()) {
                battleLog.innerHTML += "<p>" + enemyPokemon.name + " se ha debilitado</p>";
            }

            if (callback) {
                callback();
            }
        }

        function enemyAttack(playerPokemon, enemyPokemon, callback) {
            const enemyMove = enemyPokemon.moves[Math.floor(Math.random() * enemyPokemon.moves.length)];
            const effectiveness = enemyPokemon.getEffectiveness(enemyMove.type, playerPokemon.type);
            const enemyDamage = enemyPokemon.calculateDamage(enemyMove, playerPokemon) * effectiveness;
            playerPokemon.takeDamage(enemyDamage);

            let effectivenessMessage = "";
            if (effectiveness > 1) {
                effectivenessMessage = "¡Es súper efectivo!";
            } else if (effectiveness < 1) {
                effectivenessMessage = "No es muy efectivo...";
            }

            battleLog.innerHTML += "<p>" + enemyPokemon.name + " usa " + enemyMove.name + " y causa " + enemyDamage + " de daño a " + playerPokemon.name + ". " + effectivenessMessage + "</p>";
            updateHealthBars();

            if (playerPokemon.isFainted()) {
                battleLog.innerHTML += "<p>" + playerPokemon.name + " se ha debilitado</p>";
                playerIndex++;
                if (playerIndex >= selectedTeam.length) {
                    battleLog.innerHTML += "<p>Has perdido la batalla.</p>";
                    gameEnded = true;
                    return;
                }
            }

            if (callback) {
                callback();
            }
        }

        function generateRandomTeam() {
            const shuffled = allPokemonData.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, 6);
        }

        function startBattle() {
            enemyTeam = generateRandomTeam();
            playerIndex = 0;
            enemyIndex = 0;
            playerTurn = true;
            gameEnded = false;
            nextTurn();
        }

        startButton.addEventListener("click", function() {
            startScreen.classList.remove("active");
            teamSelectionScreen.classList.add("active");
            loadPokemonData();
        });

        confirmTeamButton.addEventListener("click", function() {
            teamSelectionScreen.classList.remove("active");
            battleScreen.classList.add("active");
            displayPlayerTeam();
            startBattle();
        });
    });
