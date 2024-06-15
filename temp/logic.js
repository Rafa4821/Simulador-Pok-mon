class Move {
    constructor(name, type, power, category, accuracy, effect) {
        this.name = name;
        this.type = type;
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

        return { damage: damage, hit: true, message: `${this.name} usa ${move.name} y causa ${damage} de daño a ${opponent.name}` };
    }
}

let typeChart = {};

async function loadTypeChart() {
    const types = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];
    const typePromises = types.map(async (type) => {
        const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
        const typeData = await response.json();
        typeChart[type] = {
            double_damage_to: typeData.damage_relations.double_damage_to.map(t => t.name),
            half_damage_to: typeData.damage_relations.half_damage_to.map(t => t.name),
            no_damage_to: typeData.damage_relations.no_damage_to.map(t => t.name)
        };
    });
    await Promise.all(typePromises);
}

function getEffectiveness(moveType, opponentTypes) {
    let effectiveness = 1;
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
