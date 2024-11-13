/// Single-file library that converts any cooking unit to any other cooking unit using a food density value as input.

// Define the conversion rates for each unit in a map (separately for volume and weight):
const volumeConversionRates = {
	// Metric
	ml: 1,
	cl: 10,
	dl: 100,
	l: 1000,
	// Common
	quart: 946.352946,
	gallon: 3785.411784,
	// EU
	eutsp: 5,
	eudstspn: 10,
	eutbsp: 15,
	eucup: 250,
	// US
	ustsp: 4.9289216,
	usdstspn: 9.8578432,
	ustbsp: 14.786765,
	uscup: 236.58824,
	usfloz: 29.57353,
	uspint: 473.17647,
	// UK
	uktsp: 4.9289216,
	ukdstspn: 9.8578432,
	uktbsp: 14.786765,
	ukcup: 236.58824,
	ukfloz: 28.413063,
	ukpint: 568.26125,
	// AU
	autsp: 5,
	audstspn: 10,
	autbsp: 20,
	aucup: 250
} as const;

const weightConversionRates = {
	g: 1,
	kg: 1000,
	oz: 28.349523,
	lb: 453.59237
} as const;

export type VolumeUnit = keyof typeof volumeConversionRates;
export type WeightUnit = keyof typeof weightConversionRates;
export type Unit = VolumeUnit | WeightUnit | 'whole';
export type UnitType = 'volume' | 'weight' | 'whole';
export type UnitRegion = 'US' | 'UK' | 'EU' | 'AU';

// Define aliases for each unit to parse free text input
const volumeAliases = {
	ml: ['milliliter', 'millilitre', 'milliliters', 'millilitres'],
	cl: ['centiliter', 'centilitre', 'centiliters', 'centilitres'],
	dl: ['deciliter', 'decilitre', 'deciliters', 'decilitres'],
	l: ['liter', 'litre', 'liters', 'litres'],
	tsp: ['teaspoon', 'teaspoons'],
	tbsp: ['tablespoon', 'tablespoons'],
	dstspn: ['dessertspoon', 'dessertspoons'],
	cup: ['cups', 'c'],
	quart: ['quarts', 'qt', 'qts'],
	gallon: ['gallons', 'gal', 'gals'],
	floz: ['fluid ounce', 'fluid ounces', 'fl oz', 'fl ozs'],
	pint: ['pint', 'pints', 'pt', 'pts']
};

const weightAliases = {
	g: ['gram', 'grams'],
	kg: ['kilogram', 'kilograms'],
	oz: ['ounce', 'ounces'],
	lb: ['pound', 'pounds']
};

/**
 * Quantity class: represents a quantity of a food item with a value, a unit and an optional food density.
 * The class has a method to convert the quantity to another unit (weight to/from volume if density is provided).
 * @param value the value of the quantity
 * @param unit the unit of the quantity
 * @param density the density of the food item (optional, in g/ml)
 * @param region the region of the user or recipe (default: 'EU') as volume units differ between regions
 * @returns a Quantity object
 *
 * @example
 * const quantity = new Quantity(200, 'g', 0.9998395); // 200 grams of water (0.9998395 g/ml)
 * console.log(quantity.tsp); // 40.0
 * console.log(quantity.tbsp); // 13.33
 * console.log(quantity.cup); // 0.83
 */
abstract class VolumeWeightQuantity {
	value: number;
	originUnitInput: string;
	originUnitKey: Unit;
	originUnitType: UnitType;
	density: number | undefined;
	region: UnitRegion;

	constructor(
		value: number,
		unit: string,
		density: number | undefined = undefined,
		region: UnitRegion = 'EU'
	) {
		// TODO Add support for whole ingredients (e.g. 1 egg to grams)
		this.value = value;
		this.originUnitInput = unit;
		this.originUnitKey = this._parseUnit(unit, region);
		this.originUnitType = this._detectUnitType(this.originUnitKey);
		this.density = density;
		this.region = region;

		console.log(
			`New quantity: ${this.value} ${this.originUnitKey} ("${this.originUnitInput}", ${this.region}, ${this.density} g/ml)`
		);
	}

	/**
	 * Convert the quantity to another unit
	 * @param text the new unit to convert to (e.g. 'tbsp', 'kg', "grams")
	 * @param region the region of the new unit (default: same as origin unit)
	 * @returns the converted value
	 */
	to(text: string, region: UnitRegion | undefined = undefined): number {
		// Parse the new unit
		const newUnit: Unit = this._parseUnit(text, region || this.region);

		// Detect the unit type (volume or weight)
		const newUnitType: UnitType = this._detectUnitType(newUnit);

		// Convert between volume units
		if (this.originUnitType === 'volume' && newUnitType === 'volume') {
			return (
				(this.value * volumeConversionRates[this.originUnitKey as VolumeUnit]) /
				volumeConversionRates[newUnit as VolumeUnit]
			);
		} else if (this.originUnitType === 'weight' && newUnitType === 'weight') {
			return (
				(this.value * weightConversionRates[this.originUnitKey as WeightUnit]) /
				weightConversionRates[newUnit as WeightUnit]
			);
		} else {
			// Volume/weight conversions require a density value
			if (!this.density) throw new Error('Density is required for volume to weight conversion');

			// Convert volume to weight
			if (this.originUnitType === 'volume' && newUnitType === 'weight') {
				const volumeInMl = this.value * volumeConversionRates[this.originUnitKey as VolumeUnit];
				const weightInG = volumeInMl * this.density;
				return weightInG / weightConversionRates[newUnit as WeightUnit];

				// Convert weight to volume
			} else if (this.originUnitType === 'weight' && newUnitType === 'volume') {
				const weightInG = this.value * weightConversionRates[this.originUnitKey as WeightUnit];
				const volumeInMl = weightInG / this.density;
				return volumeInMl / volumeConversionRates[newUnit as VolumeUnit];
			} else throw new Error(`Invalid unit types: ${this.originUnitType} to ${newUnitType}`);
		}
	}

	/**
	 * Detect the type of the unit (volume or weight)
	 * @param unit the unit to detect
	 * @returns the type of the unit, either 'volume' or 'weight'
	 */
	protected _detectUnitType(unit: Unit): UnitType {
		if (unit in volumeConversionRates) return 'volume';
		else if (unit in weightConversionRates) return 'weight';
		else throw new Error('Invalid unit');
	}

	/**
	 * Convert the unit (any alias) to the key of the unit
	 * @param text any free form unit
	 * @returns the key of the unit
	 */
	protected _parseUnit(text: string, region: UnitRegion): Unit {
		text = text.toLowerCase().replace('.', '').trim();

		// Check if the unit is already a valid unit
		if (text in volumeConversionRates) {
			return text as VolumeUnit;
		} else if (text in weightConversionRates) {
			return text as WeightUnit;
		}

		// Check if the unit is a weight alias
		for (const [key, value] of Object.entries(weightAliases)) {
			if (value.includes(text)) return key as WeightUnit;
		}

		// Check if the unit is a volume alias (region-dependent)
		for (const [key, value] of Object.entries(volumeAliases)) {
			if (value.includes(text) || key === text) {
				// If the unit is not region-dependent, return it directly
				if (key in volumeConversionRates) return key as VolumeUnit;
				// If the unit is region-dependent, transform the unit to the
				// correct region and check if it exists before returning it
				else {
					const unit: string = region.toLowerCase() + key;
					if (unit in volumeConversionRates) return unit as VolumeUnit;
					else throw new Error(`Invalid unit: ${unit}, maybe specify another region?`);
				}
			}
		}

		throw new Error(`Invalid unit: ${text}`);
	}

	toString() {
		return `${this.value} ${this.originUnitInput} (d=${this.density})`;
	}
}

// Command to run this file only: npx tsx src/lib/shared/utils/quantity.ts

export type MinMidMax = {
	min: number;
	mid: number;
	max: number;
};

export type GramsPerWhole = MinMidMax;

const wholeAliases = [
	'whole',
	'egg',
	'eggs',
	'piece',
	'pieces',
	'unit',
	'units',
	'item',
	'items',
	'portion',
	'portions',
	'slice',
	'slices',
	'u'
];

class WholeVolumeWeightQuantity extends VolumeWeightQuantity {
	gramsPerWhole: GramsPerWhole | undefined;

	constructor(
		value: number,
		unit: string,
		region: UnitRegion = 'EU',
		density: number | undefined = undefined,
		gramsPerWhole: GramsPerWhole | undefined = undefined
	) {
		super(value, unit, density, region);
		this.gramsPerWhole = gramsPerWhole;
	}

	// Override the to method to handle whole ingredients
	// @ts-ignore: Override with different return type (number to MinMidMax), not an issue as the base class is private
	to(text: string, region: UnitRegion | undefined = undefined): MinMidMax {
		// Parse the new unit
		const newUnit: Unit = this._parseUnit(text, region || this.region);

		// Detect the unit type (volume or weight)
		const newUnitType: UnitType = this._detectUnitType(newUnit);

		// Convert between weight/volume units using the base class
		const baseTypes = ['volume', 'weight'];
		if (baseTypes.includes(this.originUnitType) && baseTypes.includes(newUnitType)) {
			const result = super.to(text, region);
			return { min: result, mid: result, max: result };
			// Convert whole ingredients to weight/volume
		} else {
			// Whole/weight conversions require a gramsPerWhole value
			if (!this.gramsPerWhole) throw new Error('GramsPerWhole is required for whole conversions');

			// Convert whole to whole
			if (this.originUnitType === 'whole' && newUnitType === 'whole') {
				return { min: this.value, mid: this.value, max: this.value };
				// Convert whole to weight
			} else if (this.originUnitType === 'whole' && newUnitType === 'weight') {
				return {
					min: (this.value * this.gramsPerWhole.min) / weightConversionRates[newUnit as WeightUnit],
					mid: (this.value * this.gramsPerWhole.mid) / weightConversionRates[newUnit as WeightUnit],
					max: (this.value * this.gramsPerWhole.max) / weightConversionRates[newUnit as WeightUnit]
				};
				// Convert whole to volume
			} else if (this.originUnitType === 'whole' && newUnitType === 'volume') {
				// Whole/volume conversions require a density value
				if (!this.density) throw new Error('Density is required for whole to volume conversion');

				let result: MinMidMax = { min: 0, mid: 0, max: 0 };

				for (const size of ['min', 'mid', 'max'] as const) {
					const weightInG = this.value * this.gramsPerWhole[size];
					const volumeInMl = weightInG / this.density;
					result[size] = volumeInMl / volumeConversionRates[newUnit as VolumeUnit];
				}

				return result;
				// Convert weight to whole
			} else if (this.originUnitType === 'weight' && newUnitType === 'whole') {
				const weightInG = this.value * weightConversionRates[this.originUnitKey as WeightUnit];
				return {
					min: weightInG / this.gramsPerWhole.max,
					mid: weightInG / this.gramsPerWhole.mid,
					max: weightInG / this.gramsPerWhole.min
				};
				// Convert volume to whole
			} else if (this.originUnitType === 'volume' && newUnitType === 'whole') {
				// Volume/whole conversions require a density value
				if (!this.density) throw new Error('Density is required for volume to whole conversion');

				const volumeInMl = this.value * volumeConversionRates[this.originUnitKey as VolumeUnit];
				const weightInG = volumeInMl * this.density;
				return {
					min: weightInG / this.gramsPerWhole.max,
					mid: weightInG / this.gramsPerWhole.mid,
					max: weightInG / this.gramsPerWhole.min
				};
			} else throw new Error(`Invalid unit types: ${this.originUnitType} to ${newUnitType}`);
		}
	}

	// Override the _detectUnitType method to add support for whole ingredients
	protected _detectUnitType(unit: Unit): UnitType {
		if (wholeAliases.includes(unit)) return 'whole' as UnitType;
		else return super._detectUnitType(unit);
	}

	// Override the _parseUnit method to add support for whole ingredients
	protected _parseUnit(text: string, region: UnitRegion): Unit {
		if (wholeAliases.includes(text) || !text) return 'whole' as Unit;
		else return super._parseUnit(text, region);
	}

	toString() {
		return `${this.value} ${this.originUnitInput} (${this.density} g/ml, ${this.region}, ${this.gramsPerWhole?.min}/${this.gramsPerWhole?.mid}/${this.gramsPerWhole?.max} g/u)`;
	}
}

// Export the Quantity class using a simpler name
export const Quantity = WholeVolumeWeightQuantity;

// Test all unit & region combinations using nested loops
const allUnits = Object.keys(volumeAliases).concat(Object.keys(weightAliases)).concat('whole');

for (const originUnit of allUnits) {
	for (const region of ['EU', 'US', 'UK', 'AU'] as UnitRegion[]) {
		try {
			const quantity = new Quantity(100, originUnit, region, 0.8, {
				min: 50,
				mid: 60,
				max: 70
			});

			for (const newUnit of allUnits) {
				for (const newRegion of ['EU', 'US', 'UK', 'AU'] as UnitRegion[]) {
					try {
						const result = quantity.to(newUnit, newRegion);
						const min = Math.round(result.min * 100) / 100;
						const mid = Math.round(result.mid * 100) / 100;
						const max = Math.round(result.max * 100) / 100;

						console.log(quantity.toString(), '=', min, mid, max, newUnit, newRegion);
					} catch (error: any) {
						console.error(newUnit, error.message);
					}
				}
			}

			console.log('---');
		} catch (error: any) {
			console.error(originUnit, error.message);
		}
	}
}
