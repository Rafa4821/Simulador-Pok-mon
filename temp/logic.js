class Move {
    constructor(name, type, power, category, accuracy, effect) {
        this.name = name;
        this.type = type.toLowerCase(); // Asegurarse de que el tipo siempre esté en minúsculas
        this.power = power;
        this.category = category; // "physical" o "special"
        this.accuracy = accuracy; // Probabilidad de acertar
        this.effect = effect; // Efecto del movimiento
    }
}

class Pokemon {
    constructor(name, types, hp, attack, defense, spAttack, spDefense, speed, moves, abilities, frontImage, backImage) {
        this.name = name;
        this.types = types; // Ahora es un array
        this.hp = hp;
        this.attack = attack;
        this.defense = defense;
        this.spAttack = spAttack;
        this.spDefense = spDefense;
        this.speed = speed;
        this.moves = moves.map(move => new Move(move.name, move.type, move.power, move.category, move.accuracy, move.effect));
        this.abilities = abilities;
        this.frontImage = frontImage;
        this.backImage = backImage;
        this.currentHP = hp; // HP actual durante la batalla
        this.selectedMoves = [];
        this.selectedAbility = null;
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
        if (move === undefined) {
            console.error('El movimiento no está definido');
            return;
        }

        const accuracyCheck = Math.random() * 100;
        if (accuracyCheck > move.accuracy) {
            return { damage: 0, hit: false, message: `${this.name} usa ${move.name} pero falla.` }; // El ataque falla
        }

        const effectiveness = getEffectiveness(move.type, opponent.types);
        let damage;
        if (move.category === "physical") {
            damage = Math.floor((move.power * (this.attack / opponent.defense)) * effectiveness);
        } else if (move.category === "special") {
            damage = Math.floor((move.power * (this.spAttack / opponent.spDefense)) * effectiveness);
        } else {
            damage = 0; // Si el movimiento no tiene una categoría definida, no hace daño
        }

        if (isNaN(damage)) {
            damage = 0; // Evita mostrar NaN como daño
        }

        return { damage: damage, hit: true, message: `${this.name} usa ${move.name} y causa ${damage} de daño a ${opponent.name}` };
    }
}

const typeChart = {
    normal: { double_damage_to: [], half_damage_to: ["rock", "steel"], no_damage_to: ["ghost"] },
    fire: { double_damage_to: ["grass", "ice", "bug", "steel"], half_damage_to: ["fire", "water", "rock", "dragon"], no_damage_to: [] },
    water: { double_damage_to: ["fire", "ground", "rock"], half_damage_to: ["water", "grass", "dragon"], no_damage_to: [] },
    electric: { double_damage_to: ["water", "flying"], half_damage_to: ["electric", "grass", "dragon"], no_damage_to: ["ground"] },
    grass: { double_damage_to: ["water", "ground", "rock"], half_damage_to: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"], no_damage_to: [] },
    ice: { double_damage_to: ["grass", "ground", "flying", "dragon"], half_damage_to: ["fire", "water", "ice", "steel"], no_damage_to: [] },
    fighting: { double_damage_to: ["normal", "ice", "rock", "dark", "steel"], half_damage_to: ["poison", "flying", "psychic", "bug", "fairy"], no_damage_to: ["ghost"] },
    poison: { double_damage_to: ["grass", "fairy"], half_damage_to: ["poison", "ground", "rock", "ghost"], no_damage_to: ["steel"] },
    ground: { double_damage_to: ["fire", "electric", "poison", "rock", "steel"], half_damage_to: ["grass", "bug"], no_damage_to: ["flying"] },
    flying: { double_damage_to: ["grass", "fighting", "bug"], half_damage_to: ["electric", "rock", "steel"], no_damage_to: [] },
    psychic: { double_damage_to: ["fighting", "poison"], half_damage_to: ["psychic", "steel"], no_damage_to: ["dark"] },
    bug: { double_damage_to: ["grass", "psychic", "dark"], half_damage_to: ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"], no_damage_to: [] },
    rock: { double_damage_to: ["fire", "ice", "flying", "bug"], half_damage_to: ["fighting", "ground", "steel"], no_damage_to: [] },
    ghost: { double_damage_to: ["psychic", "ghost"], half_damage_to: ["dark"], no_damage_to: ["normal"] },
    dragon: { double_damage_to: ["dragon"], half_damage_to: ["steel"], no_damage_to: ["fairy"] },
    dark: { double_damage_to: ["psychic", "ghost"], half_damage_to: ["fighting", "dark", "fairy"], no_damage_to: [] },
    steel: { double_damage_to: ["ice", "rock", "fairy"], half_damage_to: ["fire", "water", "electric", "steel"], no_damage_to: [] },
    fairy: { double_damage_to: ["fighting", "dragon", "dark"], half_damage_to: ["fire", "poison", "steel"], no_damage_to: [] },
};

function getEffectiveness(moveType, opponentTypes) {
    let effectiveness = 1;
    moveType = moveType.toLowerCase(); // Convierte el tipo de movimiento a minúsculas
    if (!typeChart[moveType]) {
        console.error(`Tipo de movimiento desconocido: ${moveType}`);
        return effectiveness;
    }
    opponentTypes.forEach(type => {
        if (typeChart[moveType].double_damage_to.includes(type)) {
            effectiveness *= 2;
        }
        if (typeChart[moveType].half_damage_to.includes(type)) {
            effectiveness *= 0.5;
        }
        if (typeChart[moveType].no_damage_to.includes(type)) {
            effectiveness *= 0;
        }
    });
    return effectiveness;
}
