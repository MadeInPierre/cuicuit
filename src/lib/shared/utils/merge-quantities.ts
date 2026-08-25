import {
	unitAliases,
	type UnitRegionized,
	type UnitType,
	volumeConversionRates,
	type VolumeUnitRegionized,
	weightConversionRates,
	type WeightUnitRegionized
} from './quantity';

export type MergeQuantitiesInput = Partial<Record<UnitRegionized, number>> & Record<string, number>;

export type MergeQuantitiesOptions = {
	/**
	 * Preferred candidate units. The best magnitude among valid candidates is selected.
	 * Accepts keys or aliases (e.g. "cup", "liters", "ml", "kg", "grams").
	 */
	priorities?: Partial<{
		volume: string[];
		weight: string[];
		whole: string[];
	}>;
	/**
	 * Cross-type merge behavior when both volume and weight exist.
	 * Requires density for to-volume / to-weight.
	 */
	crossTypeMerge?: 'none' | 'to-volume' | 'to-weight' | 'auto';
};

const defaultPriorities = {
	volume: ['l', 'ml'],
	weight: ['kg', 'g'],
	whole: ['whole']
};

// Function that merges multiple quantities of the same ingredient with different units into as few units as possible,
// using a density value to convert between volume and weight units if possible.
// E.g. { g: 200, kg: 0.5, ml: 100, cup: 0.5 } + density of 0.5 g/ml => { kg: 0.7, cup: 0.5 }
export function mergeQuantities(
	quantities: MergeQuantitiesInput,
	density: number | undefined = undefined,
	options: MergeQuantitiesOptions = {}
): MergeQuantitiesResult {
	const crossTypeMerge = options.crossTypeMerge ?? 'none';

	// If the item is alone, no need to merge, and display its unit as-is (more intuitive)
	if (Object.keys(quantities).length === 1) return quantities;

	const priorities = {
		volume: options.priorities?.volume ?? defaultPriorities.volume,
		weight: options.priorities?.weight ?? defaultPriorities.weight,
		whole: options.priorities?.whole ?? defaultPriorities.whole
	};

	const parseUnit = (text: string): UnitRegionized | undefined => {
		const normalized = text.toLowerCase().replace('.', '').trim();
		if (!normalized) return undefined;

		if (normalized in volumeConversionRates) return normalized as VolumeUnitRegionized;
		if (normalized in weightConversionRates) return normalized as WeightUnitRegionized;
		if ((unitAliases['whole'] as unknown as string[]).includes(normalized)) return 'whole';

		for (const [key, aliases] of Object.entries(unitAliases)) {
			if (key === normalized || (aliases as unknown as string[]).includes(normalized)) {
				return key as UnitRegionized;
			}
		}

		return undefined;
	};

	const magnitudeScore = (value: number): number => {
		const abs = Math.abs(value);
		if (abs === 0) return 0;

		// Strongly prefer readable values in [1, 1000)
		if (abs >= 1 && abs < 1000) return Math.abs(Math.log10(abs) - 1);

		// Penalize tiny/huge values
		if (abs < 1) return 10 + Math.abs(Math.log10(abs));
		return 10 + Math.abs(Math.log10(abs / 1000));
	};

	const unique = <T extends string>(arr: T[]) => [...new Set(arr)];

	const pickTargetUnit = (
		type: UnitType,
		candidates: string[],
		totalBase: number
	): UnitRegionized => {
		if (type === 'whole') return 'whole';

		const parsedCandidates = unique(
			candidates
				.map((candidate) => parseUnit(candidate))
				.filter((u): u is UnitRegionized => !!u)
				.filter((u) =>
					type === 'volume' ? u in volumeConversionRates : u in weightConversionRates
				)
		);

		const fallbackUnits =
			type === 'volume'
				? (Object.keys(volumeConversionRates) as VolumeUnitRegionized[])
				: (Object.keys(weightConversionRates) as WeightUnitRegionized[]);

		const units = (
			parsedCandidates.length > 0 ? parsedCandidates : fallbackUnits
		) as UnitRegionized[];

		let bestUnit = units[0];
		let bestScore = Number.POSITIVE_INFINITY;

		for (const unit of units) {
			const converted =
				type === 'volume'
					? totalBase / volumeConversionRates[unit as VolumeUnitRegionized]
					: totalBase / weightConversionRates[unit as WeightUnitRegionized];

			const score = magnitudeScore(converted);
			if (score < bestScore) {
				bestScore = score;
				bestUnit = unit;
			}
		}

		return bestUnit;
	};

	let totalMl = 0;
	let totalG = 0;
	let totalWhole = 0;
	const passthroughUnknown: Record<string, number> = {};

	for (const [rawUnit, rawValue] of Object.entries(quantities)) {
		const value = Number(rawValue);
		if (!Number.isFinite(value) || value === 0) continue;

		const unit = parseUnit(rawUnit);
		if (!unit) {
			passthroughUnknown[rawUnit] = (passthroughUnknown[rawUnit] ?? 0) + value;
			continue;
		}

		if (unit in volumeConversionRates) {
			totalMl += value * volumeConversionRates[unit as VolumeUnitRegionized];
		} else if (unit in weightConversionRates) {
			totalG += value * weightConversionRates[unit as WeightUnitRegionized];
		} else if (unit === 'whole') {
			totalWhole += value;
		}
	}

	// Optional cross merge between volume and weight
	if (crossTypeMerge !== 'none' && totalMl !== 0 && totalG !== 0) {
		if (!density || density <= 0) {
			throw new Error('Density must be a positive number for cross-type merging');
		}

		const mode =
			crossTypeMerge === 'auto'
				? // Simple auto heuristic: prefer weight if any weight priorities are defined, else volume
					priorities.weight.length > 0
					? 'to-weight'
					: 'to-volume'
				: crossTypeMerge;

		if (mode === 'to-weight') {
			totalG += totalMl * density;
			totalMl = 0;
		} else if (mode === 'to-volume') {
			totalMl += totalG / density;
			totalG = 0;
		}
	}

	const result: MergeQuantitiesResult = {};

	if (totalG !== 0) {
		const target = pickTargetUnit('weight', priorities.weight, totalG) as WeightUnitRegionized;
		result[target] = totalG / weightConversionRates[target];
	}

	if (totalMl !== 0) {
		const target = pickTargetUnit('volume', priorities.volume, totalMl) as VolumeUnitRegionized;
		result[target] = totalMl / volumeConversionRates[target];
	}

	if (totalWhole !== 0) {
		const target = pickTargetUnit('whole', priorities.whole, totalWhole);
		result[target] = totalWhole;
	}

	for (const [unit, value] of Object.entries(passthroughUnknown)) {
		if (value !== 0) result[unit] = value;
	}

	return result;
}

export type MergeQuantitiesResult = Partial<Record<UnitRegionized, number>> &
	Record<string, number>;
