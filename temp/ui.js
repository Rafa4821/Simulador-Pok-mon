document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const startScreen = document.getElementById('start-screen');
    const teamSelectionScreen = document.getElementById('team-selection-screen');
    const availablePokemonContainer = document.getElementById('available-pokemon');
    const selectedTeamContainer = document.getElementById('selected-team');
    const confirmTeamButton = document.getElementById('confirm-team-button');
    const battleScreen = document.getElementById('battle-screen');
    const enemyPokemonDisplay = document.getElementById('enemy-pokemon');
    const playerPokemonDisplay = document.getElementById('player-pokemon');
    const battleLog = document.getElementById('battle-log');
    const moveButtons = document.getElementById('move-buttons');

    const maxTeamSize = 6;
    let selectedTeam = [];
    let allPokemonData = [];

    startButton.addEventListener('click', () => {
        startScreen.classList.remove('active');
        teamSelectionScreen.classList.add('active');
        loadPokemonData();
    });

    function loadPokemonData() {
        fetch('temp/pokemonData.json')
            .then(response => response.json())
            .then(pokemonData => {
                allPokemonData = pokemonData.map(data => new Pokemon(
                    data.name,
                    data.type,
                    data.hp,
                    data.attack,
                    data.defense,
                    data.spAttack,
                    data.spDefense,
                    data.speed,
                    data.moves
                ));
                displayAvailablePokemon(allPokemonData);
            })
            .catch(error => console.error('Error al cargar los datos de Pokémon:', error));
    }

    function displayAvailablePokemon(pokemonData) {
        availablePokemonContainer.innerHTML = '';
        pokemonData.forEach(pokemon => {
            const pokemonItem = document.createElement('div');
            pokemonItem.classList.add('pokemon-item');
            
            const pokemonImg = document.createElement('img');
            pokemonImg.src = `images/${pokemon.name.toLowerCase()}.png`;
            pokemonImg.alt = pokemon.name;
            
            const pokemonButton = document.createElement('button');
            pokemonButton.textContent = pokemon.name;
            pokemonButton.addEventListener('click', () => selectPokemon(pokemon, pokemonItem));
            
            pokemonItem.appendChild(pokemonImg);
            pokemonItem.appendChild(pokemonButton);
            availablePokemonContainer.appendChild(pokemonItem);
        });
    }

    function selectPokemon(pokemon, pokemonItem) {
        if (selectedTeam.length < maxTeamSize && !selectedTeam.includes(pokemon)) {
            selectedTeam.push(pokemon);
            pokemonItem.classList.add('selected');
            updateSelectedTeam();
        }
    }

    function updateSelectedTeam() {
        selectedTeamContainer.innerHTML = '<h3>Equipo Seleccionado</h3>';
        selectedTeam.forEach(pokemon => {
            const pokemonItem = document.createElement('div');
            pokemonItem.classList.add('pokemon-item');
            
            const pokemonImg = document.createElement('img');
            pokemonImg.src = `images/${pokemon.name.toLowerCase()}.png`;
            pokemonImg.alt = pokemon.name;
            
            const pokemonName = document.createElement('div');
            pokemonName.textContent = pokemon.name;
            
            pokemonItem.appendChild(pokemonImg);
            pokemonItem.appendChild(pokemonName);
            selectedTeamContainer.appendChild(pokemonItem);
        });

        confirmTeamButton.disabled = selectedTeam.length < maxTeamSize;
    }

    confirmTeamButton.addEventListener('click', () => {
        teamSelectionScreen.classList.remove('active');
        battleScreen.classList.add('active');
        startBattle();
    });

    function startBattle() {
        const enemyTeam = generateRandomTeam();
        let playerIndex = 0;
        let enemyIndex = 0;

        function nextTurn() {
            const playerPokemon = selectedTeam[playerIndex];
            const enemyPokemon = enemyTeam[enemyIndex];

            // Mostrar los Pokémon que están luchando actualmente
            playerPokemonDisplay.innerHTML = `<img src="images/${playerPokemon.name.toLowerCase()}.png" alt="${playerPokemon.name}" style="width: 150px; height: 150px;"><p>${playerPokemon.name}</p>`;
            enemyPokemonDisplay.innerHTML = `<img src="images/${enemyPokemon.name.toLowerCase()}.png" alt="${enemyPokemon.name}" style="width: 150px; height: 150px;"><p>${enemyPokemon.name}</p>`;

            // Limpiar los botones de movimientos anteriores
            moveButtons.innerHTML = '';
            battleLog.innerHTML += `<p>${playerPokemon.name} vs ${enemyPokemon.name}</p>`;

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
                moveButtons.appendChild(btn);
            });
        }

        function playerAttack(move, playerPokemon, enemyPokemon, callback) {
            const damage = playerPokemon.calculateDamage(move, enemyPokemon);
            enemyPokemon.takeDamage(damage);
            battleLog.innerHTML += `<p>${playerPokemon.name} usa ${move.name} y causa ${damage} de daño a ${enemyPokemon.name}</p>`;

            if (enemyPokemon.isFainted()) {
                battleLog.innerHTML += `<p>${enemyPokemon.name} se ha debilitado</p>`;
                enemyIndex++;
                if (enemyIndex >= enemyTeam.length) {
                    battleLog.innerHTML += `<p>¡Has ganado la batalla!</p>`;
                    return;
                }
            }
            if (callback) callback();
        }

        function enemyAttack(playerPokemon, enemyPokemon, callback) {
            const enemyMove = enemyPokemon.moves[Math.floor(Math.random() * enemyPokemon.moves.length)];
            const enemyDamage = enemyPokemon.calculateDamage(enemyMove, playerPokemon);
            playerPokemon.takeDamage(enemyDamage);
            battleLog.innerHTML += `<p>${enemyPokemon.name} usa ${enemyMove.name} y causa ${enemyDamage} de daño a ${playerPokemon.name}</p>`;

            if (playerPokemon.isFainted()) {
                battleLog.innerHTML += `<p>${playerPokemon.name} se ha debilitado</p>`;
                playerIndex++;
                if (playerIndex >= selectedTeam.length) {
                    battleLog.innerHTML += `<p>Has perdido la batalla.</p>`;
                    return;
                }
            }
            if (callback) callback();
        }

        nextTurn();
    }

    function generateRandomTeam() {
        const shuffled = allPokemonData.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 6);
    }
});
