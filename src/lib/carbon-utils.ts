import { Category } from './types';

export const CARBON_COEFFICIENTS: Record<Category, number> = {
  Food: 0.15,      // kg CO2 per unit of currency
  Travel: 0.45,    // High impact
  Shopping: 0.25,  // Material impact
  Bills: 0.08,     // Energy usage
  Education: 0.02, // Low impact
  Others: 0.12,
};

export const getCarbonImpact = (amount: number, category: Category) => {
  return amount * (CARBON_COEFFICIENTS[category] || 0.1);
};

export const getRelatableImpact = (kgCO2: number) => {
  // 1 tree absorbs ~20kg CO2 per year
  const trees = kgCO2 / 20;
  return trees.toFixed(1);
};

export const getGreenScore = (kgCO2: number) => {
  if (kgCO2 < 50) return { grade: 'A', label: 'Eco-Warrior', color: 'text-green-500' };
  if (kgCO2 < 150) return { grade: 'B', label: 'Sustainable', color: 'text-emerald-500' };
  if (kgCO2 < 300) return { grade: 'C', label: 'Average', color: 'text-yellow-500' };
  if (kgCO2 < 500) return { grade: 'D', label: 'High Impact', color: 'text-orange-500' };
  if (kgCO2 < 800) return { grade: 'E', label: 'Concerning', color: 'text-red-500' };
  return { grade: 'F', label: 'Critical', color: 'text-destructive' };
};

export const getImpactLevel = (kgCO2: number) => {
  if (kgCO2 < 10) return { label: 'Low', color: 'bg-green-500' };
  if (kgCO2 < 50) return { label: 'Medium', color: 'bg-yellow-500' };
  return { label: 'High', color: 'bg-red-500' };
};

export const ECO_SUGGESTIONS: Record<string, string[]> = {
  Travel: [
    "Consider public transport or carpooling for your next trip.",
    "Offset your flights through certified gold standard programs.",
    "Short distance? Try cycling or walking for zero-carbon transit."
  ],
  Food: [
    "Support local farmers to reduce food miles.",
    "Try incorporating more plant-based meals into your week.",
    "Reduce food waste by planning meals and using leftovers."
  ],
  Shopping: [
    "Choose quality over quantity; opt for durable, long-lasting goods.",
    "Look for brands with recycled packaging or circular initiatives.",
    "Explore thrift stores or second-hand markets for your next buy."
  ],
  Bills: [
    "Switch to a renewable energy provider if available.",
    "Improve home insulation to reduce heating and cooling costs.",
    "Unplug electronics when not in use to stop 'vampire' energy."
  ],
  Education: [
    "Opt for digital textbooks instead of printed ones.",
    "Support institutions that prioritize sustainability and renewable energy.",
    "Share or donate used educational materials to reduce waste."
  ],
  Others: [
    "Track your carbon footprint regularly to stay mindful of your impact.",
    "Offset remaining emissions through verified carbon offset projects.",
    "Encourage others in your network to adopt sustainable spending habits."
  ]
};
