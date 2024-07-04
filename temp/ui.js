const specificPokemonNames = [
    "charizard", "feraligatr", "venusaur", "blaziken", "tyranitar", "sceptile",
    "aggron", "mewtwo", "dragonite", "gyarados", "lapras", "weavile", "alakazam",
    "magmortar", "electivire", "salamence", "gardevoir", "sylveon", "azumarill",
    "giratina-origin", "kingdra", "hydreigon", "rayquaza", "torterra"
];

let selectedTeam = [];
const maxTeamSize = 6;
let allPokemonData = [];
let enemyTeam = [];
let playerIndex = 0;
let enemyIndex = 0;
let playerTurn = true;
let gameEnded = false;

document.addEventListener("DOMContentLoaded", async function() {
    try {
        await loadPokemonData();
        initializeUI();
    } catch (error) {
        console.error("Error inicializando la aplicación:", error);
    }
});

async function loadPokemonData() {
    const response = await fetch('temp/pokemonData.json');
    const pokemonData = await response.json();

    const pokemonPromises = specificPokemonNames.map(async (name) => {
        const pokemonInfo = pokemonData.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (!pokemonInfo) return null;

        const pokemon = {
            ...pokemonInfo,
            frontImage: null,
            backImage: null,
            abilities: []
        };

        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
            const pokemonApiData = await response.json();

            pokemon.frontImage = pokemonApiData.sprites.front_default;
            pokemon.backImage = pokemonApiData.sprites.back_default;

            pokemon.abilities = pokemonInfo.abilities;
            pokemon.selectedMoves = [];
        } catch (error) {
            console.error(`Error cargando datos del API para ${name}:`, error);
        }

        return new Pokemon(
            pokemon.name,
            pokemon.type,
            pokemon.hp,
            pokemon.attack,
            pokemon.defense,
            pokemon.spAttack,
            pokemon.spDefense,
            pokemon.speed,
            pokemon.moves,
            pokemon.abilities,
            pokemon.frontImage,
            pokemon.backImage
        );
    });

    allPokemonData = (await Promise.all(pokemonPromises)).filter(pokemon => pokemon !== null);
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
    const availablePokemonContainer = $("#available-pokemon");
    availablePokemonContainer.html("");
    pokemonData.forEach(function(pokemon) {
        const pokemonItem = $("<div>").addClass("pokemon-item");

        const pokemonImg = $("<img>").attr("src", pokemon.frontImage).attr("alt", pokemon.name).click(function() {
            selectPokemon(pokemon, pokemonItem);
        });

        const pokemonButton = $("<button>").text(pokemon.name).click(function() {
            selectPokemon(pokemon, pokemonItem);
        });

        pokemonItem.append(pokemonImg, pokemonButton);
        availablePokemonContainer.append(pokemonItem);
    });
}

function selectPokemon(pokemon, pokemonItem) {
    const index = selectedTeam.indexOf(pokemon);
    if (index !== -1) {
        selectedTeam.splice(index, 1);
        pokemonItem.removeClass("selected");
    } else if (selectedTeam.length < maxTeamSize) {
        selectedTeam.push(pokemon);
        pokemonItem.addClass("selected");
    }
    updateSelectedTeam();
}

function showMessage(message) {
    Swal.fire({
        text: message,
        icon: 'info',
        confirmButtonText: 'OK'
    });
}

function updateSelectedTeam() {
    const selectedTeamContainer = $("#selected-team").html("<h3>Equipo Seleccionado</h3>");
    selectedTeam.forEach(function(pokemon) {
        const pokemonItem = $("<div>").addClass("pokemon-item");

        const pokemonImg = $("<img>").attr("src", pokemon.frontImage).attr("alt", pokemon.name);

        const pokemonName = $("<div>").text(pokemon.name);

        const removeButton = $("<button>").text("Quitar").click(function() {
            deselectPokemon(pokemon);
        });

        pokemonItem.append(pokemonImg, pokemonName, removeButton);
        selectedTeamContainer.append(pokemonItem);

        displayPokemonDetails(pokemon);
    });

    const teamSize = parseInt($("#team-size-selector").val());
    const confirmTeamButton = $("#confirm-team-button").prop('disabled', selectedTeam.length < teamSize);

    if (selectedTeam.length < teamSize) {
        showMessage(`Seleccione ${teamSize} Pokémon para continuar.`);
    } else {
        showMessage("Equipo completo. Presione 'Confirmar Equipo' para iniciar la batalla.");
    }
}

function displayPokemonDetails(pokemon) {
    const movesContainer = $("#pokemon-moves").html("<h4>Movimientos Disponibles</h4>");
    const abilitiesContainer = $("#pokemon-abilities").html("<h4>Habilidades</h4>");

    pokemon.moves.forEach(move => {
        const moveButton = $("<button>").text(move.name).addClass('move-button').addClass(move.type.toLowerCase());
        if (pokemon.selectedMoves.includes(move)) {
            moveButton.addClass('selected');
        }
        moveButton.click(function() {
            selectMove(pokemon, move, moveButton);
        });
        movesContainer.append(moveButton);
    });

    pokemon.abilities.forEach(ability => {
        const abilityButton = $("<button>").text(ability.name);
        if (pokemon.selectedAbility === ability) {
            abilityButton.addClass('selected');
        }
        abilityButton.click(function() {
            selectAbility(pokemon, ability, abilityButton);
        });
        abilitiesContainer.append(abilityButton);
    });
}

function selectMove(pokemon, move, moveButton) {
    const index = pokemon.selectedMoves.indexOf(move);
    if (index !== -1) {
        pokemon.selectedMoves.splice(index, 1);
        moveButton.removeClass('selected');
    } else if (pokemon.selectedMoves.length < 4) {
        pokemon.selectedMoves.push(move);
        moveButton.addClass('selected');
    } else {
        Swal.fire({
            text: "Ya has seleccionado 4 movimientos.",
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    }
}

function selectAbility(pokemon, ability, abilityButton) {
    if (pokemon.selectedAbility === ability) {
        pokemon.selectedAbility = null;
        abilityButton.removeClass('selected');
    } else {
        pokemon.selectedAbility = ability;
        $("#pokemon-abilities button").removeClass('selected');
        abilityButton.addClass('selected');
    }
}

function deselectPokemon(pokemon) {
    const index = selectedTeam.indexOf(pokemon);
    if (index !== -1) {
        selectedTeam.splice(index, 1);
        updateSelectedTeam();
    }
    $(".pokemon-item").each(function() {
        const button = $(this).find('button');
        if (button.text() === pokemon.name) {
            $(this).removeClass("selected");
        }
    });
}

$("#confirm-team-button").click(function() {
    const teamSize = parseInt($("#team-size-selector").val());
    if (selectedTeam.length === teamSize) {
        saveSelectedTeam();
        $("#team-selection-screen").removeClass("active");
        $("#battle-screen").addClass("active");
        displayPlayerTeam();
        startBattle();
    } else {
        Swal.fire({
            text: `Seleccione un equipo de ${teamSize} Pokémon antes de iniciar la batalla.`,
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    }
});

function displayPlayerTeam() {
    const playerTeamContainer = $("#player-team").html("");
    selectedTeam.forEach(function(pokemon, index) {
        const pokemonItem = $("<div>").addClass("pokemon-item");

        const pokemonImg = $("<img>").attr("src", pokemon.backImage).attr("alt", pokemon.name);

        const pokemonName = $("<div>").text(pokemon.name);

        const switchButton = $("<button>").text("Cambiar").click(function() {
            switchPokemon(index);
        });

        pokemonItem.append(pokemonImg, pokemonName, switchButton);
        playerTeamContainer.append(pokemonItem);
    });
}

function switchPokemon(index) {
    if (index !== playerIndex && selectedTeam[index] && !selectedTeam[index].isFainted()) {
        playerIndex = index;
        displayCurrentPokemon();
        playerTurn = false;
        nextTurn();
    } else {
        Swal.fire({
            text: "No puedes seleccionar un Pokémon debilitado o el mismo Pokémon actual.",
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    }
}

function displayCurrentPokemon() {
    const playerPokemon = selectedTeam[playerIndex];
    const enemyPokemon = enemyTeam[enemyIndex];

    $("#player-pokemon").html(`
        <img src="${playerPokemon.backImage}" alt="${playerPokemon.name}" style="width: 150px; height: 150px;">
        <p>${playerPokemon.name}</p>
        <div class="health-bar"><div id="player-health" style="width: ${(playerPokemon.currentHP / playerPokemon.hp) * 100}%;"></div></div>`);
    $("#enemy-pokemon").html(`
        <img src="${enemyPokemon.frontImage}" alt="${enemyPokemon.name}" style="width: 150px; height: 150px;">
        <p>${enemyPokemon.name}</p>
        <div class="health-bar"><div id="enemy-health" style="width: ${(enemyPokemon.currentHP / enemyPokemon.hp) * 100}%;"></div></div>`);

    updateHealthBars();
    updateMoveButtons(playerPokemon, enemyPokemon);
    scrollToBottom();
}

function updateHealthBars() {
    const playerPokemon = selectedTeam[playerIndex];
    const enemyPokemon = enemyTeam[enemyIndex];

    const playerHealthBar = $("#player-health");
    const enemyHealthBar = $("#enemy-health");

    if (playerHealthBar && playerPokemon) {
        playerHealthBar.css("width", (playerPokemon.currentHP / playerPokemon.hp) * 100 + "%");
    } else {
        console.error("El objeto playerPokemon o la propiedad currentHP no existen");
    }

    if (enemyHealthBar && enemyPokemon) {
        enemyHealthBar.css("width", (enemyPokemon.currentHP / enemyPokemon.hp) * 100 + "%");
    } else {
        console.error("El objeto enemyPokemon o la propiedad currentHP no existen");
    }
    scrollToBottom();
}

function scrollToBottom() {
    const battleLog = $("#battle-log");
    battleLog.scrollTop(battleLog.prop("scrollHeight"));
}

function saveSelectedTeam() {
    localStorage.setItem('selectedTeam', JSON.stringify(selectedTeam.map(pokemon => pokemon.name)));
}

function saveFavoriteTeam(teamName) {
    const favoriteTeams = JSON.parse(localStorage.getItem('favoriteTeams')) || [];
    const team = selectedTeam.map(pokemon => pokemon.name);
    favoriteTeams.push({ name: teamName, team });
    localStorage.setItem('favoriteTeams', JSON.stringify(favoriteTeams));
    loadFavoriteTeams();
}

function loadFavoriteTeams() {
    const favoriteTeamsContainer = $("#favorite-teams-container").html('');
    const favoriteTeams = JSON.parse(localStorage.getItem('favoriteTeams')) || [];
    favoriteTeams.forEach(favorite => {
        const teamButton = $("<button>").text(favorite.name).click(function() {
            selectedTeam = allPokemonData.filter(pokemon => favorite.team.includes(pokemon.name));
            updateFavoriteTeamPreview();
            $("#start-battle-favorite-button").prop('disabled', false);
        });
        favoriteTeamsContainer.append(teamButton);
    });
}

function updateFavoriteTeamPreview() {
    const favoriteTeamPreviewContainer = $("#favorite-team-preview").html("<h3>Vista Previa del Equipo</h3>");
    selectedTeam.forEach(function(pokemon) {
        const pokemonItem = $("<div>").addClass("pokemon-item");

        const pokemonImg = $("<img>").attr("src", pokemon.frontImage).attr("alt", pokemon.name);

        const pokemonName = $("<div>").text(pokemon.name);

        pokemonItem.append(pokemonImg, pokemonName);
        favoriteTeamPreviewContainer.append(pokemonItem);
    });
}

function deleteFavoriteTeam(teamName) {
    let favoriteTeams = JSON.parse(localStorage.getItem('favoriteTeams')) || [];
    favoriteTeams = favoriteTeams.filter(favorite => favorite.name !== teamName);
    localStorage.setItem('favoriteTeams', JSON.stringify(favoriteTeams));
    loadFavoriteTeams();
}

$("#save-favorite-team-button").click(function() {
    const teamName = Swal.fire({
        title: 'Ingrese el nombre para su equipo favorito:',
        input: 'text',
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            saveFavoriteTeam(result.value);
        }
    });
});

$("#start-battle-favorite-button").click(function() {
    if (selectedTeam.length === maxTeamSize) {
        $("#favorite-teams-screen").removeClass('active');
        $("#battle-screen").addClass('active');
        displayPlayerTeam();
        startBattle();
    } else {
        Swal.fire({
            text: "Seleccione un equipo de 6 Pokémon antes de iniciar la batalla.",
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    }
});

$("#back-button").click(function() {
    $("#favorite-teams-screen").removeClass("active");
    $("#start-screen").addClass("active");
});

$("#back-to-start-button").click(function() {
    $("#team-selection-screen").removeClass("active");
    $("#start-screen").addClass("active");
});

function generateRandomTeam() {
    const shuffled = _.shuffle(allPokemonData);
    const team = shuffled.slice(0, maxTeamSize);
    team.forEach(pokemon => pokemon.currentHP = pokemon.hp);
    return team;
}

function startBattle() {
    enemyTeam = generateRandomTeam();
    playerIndex = 0;
    enemyIndex = 0;
    playerTurn = true;
    gameEnded = false;
    selectedTeam.forEach(pokemon => pokemon.currentHP = pokemon.hp);
    nextTurn();
}

function nextTurn() {
    if (gameEnded) return;

    if (playerIndex >= selectedTeam.length) {
        $("#battle-log").append("<p>Has perdido la batalla.</p>");
        Swal.fire({
            text: "Has perdido la batalla.",
            icon: 'error',
            confirmButtonText: 'OK'
        });
        gameEnded = true;
        displayRestartButton();
        return;
    }
    if (enemyIndex >= enemyTeam.length) {
        $("#battle-log").append("<p>¡Has ganado la batalla!</p>");
        Swal.fire({
            text: "¡Has ganado la batalla!",
            icon: 'success',
            confirmButtonText: 'OK'
        });
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
                    $("#battle-log").append("<p>¡Has ganado la batalla!</p>");
                    Swal.fire({
                        text: "¡Has ganado la batalla!",
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
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
    Swal.fire({
        text: "Selecciona un nuevo Pokémon",
        icon: 'info',
        confirmButtonText: 'OK'
    });
    displayPlayerTeam();
}

function displayRestartButton() {
    $("#restart-button").show().click(function() {
        location.reload();
    });
}

function updateMoveButtons(playerPokemon, enemyPokemon) {
    const moveButtons = $("#move-buttons").html("");
    playerPokemon.selectedMoves.forEach(function(move) {
        const btn = $("<button>").text(move.name).addClass('move-button').addClass(move.type.toLowerCase());
        btn.prop('disabled', gameEnded);
        btn.click(function() {
            if (gameEnded) return;
            console.log("Botón de movimiento " + move.name + " presionado");
            if (playerPokemon.speed >= enemyPokemon.speed) {
                playerAttack(move, playerPokemon, enemyPokemon, function() {
                    if (!enemyPokemon.isFainted()) {
                        enemyAttack(playerPokemon, enemyPokemon, nextTurn);
                    } else {
                        enemyIndex++;
                        if (enemyIndex >= enemyTeam.length) {
                            $("#battle-log").append("<p>¡Has ganado la batalla!</p>");
                            Swal.fire({
                                text: "¡Has ganado la batalla!",
                                icon: 'success',
                                confirmButtonText: 'OK'
                            });
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
                                    $("#battle-log").append("<p>¡Has ganado la batalla!</p>");
                                    Swal.fire({
                                        text: "¡Has ganado la batalla!",
                                        icon: 'success',
                                        confirmButtonText: 'OK'
                                    });
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
                            $("#battle-log").append("<p>Has perdido la batalla.</p>");
                            Swal.fire({
                                text: "Has perdido la batalla.",
                                icon: 'error',
                                confirmButtonText: 'OK'
                            });
                            gameEnded = true;
                            displayRestartButton();
                            return;
                        }
                        selectNewPokemon();
                    }
                });
            }
        });
        moveButtons.append(btn);
    });
}

function playerAttack(move, playerPokemon, enemyPokemon, callback) {
    const { damage, hit, message } = playerPokemon.calculateDamage(move, enemyPokemon);
    $("#battle-log").append(`<p>${message}</p>`);
    scrollToBottom();
    if (hit) {
        enemyPokemon.takeDamage(damage);
        const effectiveness = getEffectiveness(move.type.toLowerCase(), enemyPokemon.types);
        let effectivenessMessage = "";
        if (effectiveness > 1) {
            effectivenessMessage = "¡Es súper efectivo!";
        } else if (effectiveness < 1) {
            effectivenessMessage = "No es muy efectivo...";
        }
        $("#battle-log").append(`<p>${effectivenessMessage}</p>`);
        scrollToBottom();
        if (enemyPokemon.isFainted()) {
            $("#battle-log").append(`<p>${enemyPokemon.name} se ha debilitado</p>`);
            scrollToBottom();
            enemyIndex++;
            if (enemyIndex >= enemyTeam.length) {
                $("#battle-log").append("<p>¡Has ganado la batalla!</p>");
                Swal.fire({
                    text: "¡Has ganado la batalla!",
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
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

    const enemyMove = _.sample(enemyPokemon.selectedMoves);
    const { damage, hit, message } = enemyPokemon.calculateDamage(enemyMove, playerPokemon);
    $("#battle-log").append(`<p>${message}</p>`);
    scrollToBottom();
    if (hit) {
        playerPokemon.takeDamage(damage);
        const effectiveness = getEffectiveness(enemyMove.type.toLowerCase(), playerPokemon.types);
        let effectivenessMessage = "";
        if (effectiveness > 1) {
            effectivenessMessage = "¡Es súper efectivo!";
        } else if (effectiveness < 1) {
            effectivenessMessage = "No es muy efectivo...";
        }
        $("#battle-log").append(`<p>${effectivenessMessage}</p>`);
        scrollToBottom();
        if (playerPokemon.isFainted()) {
            $("#battle-log").append(`<p>${playerPokemon.name} se ha debilitado</p>`);
            scrollToBottom();
            playerIndex++;
            if (playerIndex >= selectedTeam.length) {
                $("#battle-log").append("<p>Has perdido la batalla.</p>");
                Swal.fire({
                    text: "Has perdido la batalla.",
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
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
