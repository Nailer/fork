import type { DecisionAnalysis } from './schema';
import type { DecisionInput } from './types';

/**
 * A hand-written example decision bundled with the app. It is always labelled
 * "Sample" in the UI and never counts against the free allowance. It exists so the
 * product can be explored (and demoed) without a network connection.
 */
export const SAMPLE_INPUT: DecisionInput = {
  description:
    'Should I buy a new laptop now or keep my current one for another year? It is four years old, the battery barely lasts two hours and it slows down when I run design tools, but it still works.',
  priorities: 'Getting real work done without friction, not wasting money',
  budget: 'About $1,500 if I buy',
  timeHorizon: 'Next 12 months',
};

export const SAMPLE_ANALYSIS: DecisionAnalysis = {
  decisionTitle: 'New laptop now, or one more year?',
  summary:
    'Your current laptop works but is starting to cost you time and focus. The real question is whether that friction is worth about $1,500 today, or whether a cheaper fix buys enough time to decide later with better information.',
  variables: [
    { name: 'Daily friction', why: 'How much the slowdowns and short battery actually cost you each week.' },
    { name: 'Cash on hand', why: 'Whether $1,500 now squeezes other priorities or sits comfortably.' },
    { name: 'Upcoming workload', why: 'A heavy project in the next few months raises the cost of a slow machine.' },
    { name: 'Repairability', why: 'A new battery or more storage may or may not be possible on your model.' },
  ],
  scenarios: [
    {
      id: 'buy-now',
      title: 'Buy a new laptop now',
      summary:
        'You spend about $1,500 now and remove the day-to-day friction immediately. This path assumes the slowdowns are genuinely costing you work time.',
      immediateEffects: [
        'Design tools and exports run without waiting',
        'All-day battery removes the hunt for a charger',
        'About $1,500 leaves your savings this month',
        'A weekend of setup and migrating files',
      ],
      longerTermConsiderations: [
        'A new machine is likely to stay capable for several years',
        'Next year’s models may be meaningfully better or cheaper',
        'Trading in or selling the old laptop recovers a little of the cost',
      ],
      benefits: [
        'The friction ends today rather than in a year',
        'More headroom if your workload grows',
        'Warranty coverage for the first year or more',
      ],
      tradeoffs: [
        'The largest up-front cost of any path',
        'You give up the option of waiting for better hardware',
      ],
      risks: [
        'If money gets tight, the purchase may feel heavier than expected',
        'The gain may be smaller than hoped if the slowdown is mostly software',
      ],
      assumptions: [
        'The slowdowns are caused by hardware, not a cluttered system',
        'Spending $1,500 now does not put essentials at risk',
      ],
      uncertaintyLevel: 'low',
      uncertainty: [
        'How much time the old machine really costs you per week is an estimate',
      ],
      importantVariables: ['Daily friction', 'Cash on hand'],
      whatWouldChange: [
        'A clean reinstall fixing most of the slowdown',
        'An unexpected expense in the next few months',
      ],
      questionsToConsider: [
        'Roughly how many hours a week do you lose to waiting?',
        'Would this purchase delay anything else you care about?',
      ],
      ratings: [
        { dimension: 'cost', level: 'high', note: 'About $1,500 up front' },
        { dimension: 'time', level: 'low', note: 'One weekend of setup, then time saved' },
        { dimension: 'flexibility', level: 'low', note: 'Commits the money now' },
        { dimension: 'risk', level: 'low', note: 'A known, predictable outcome' },
        { dimension: 'effort', level: 'moderate', note: 'Research, buy, migrate' },
        { dimension: 'upside', level: 'high', note: 'Immediate daily improvement' },
        { dimension: 'shortTerm', level: 'high', note: 'Changes every working day right away' },
        { dimension: 'longTerm', level: 'moderate', note: 'Sets your setup for years' },
      ],
      branches: [
        {
          label: 'The speed-up is big',
          condition: 'If the slowdowns were mostly hardware',
          outcome: 'Hours come back each week and the cost feels justified within months.',
        },
        {
          label: 'The speed-up is small',
          condition: 'If the slowdown was mostly software clutter',
          outcome: 'You enjoy the battery, but a cheaper fix might have covered most of it.',
        },
      ],
    },
    {
      id: 'keep-a-year',
      title: 'Keep it for one more year',
      summary:
        'You keep your money and your options, and accept the current friction for now. This path assumes the laptop keeps limping along and nothing critical fails.',
      immediateEffects: [
        'No spending this month',
        'Slow exports and short battery continue',
        'You carry a charger everywhere',
      ],
      longerTermConsiderations: [
        'Next year you decide with better information about your needs',
        'Newer models or discounts may be available',
        'Resale value of the old laptop keeps dropping',
      ],
      benefits: [
        'Keeps $1,500 available for anything unexpected',
        'Maximum flexibility on what and when to buy',
      ],
      tradeoffs: [
        'You pay in time and patience instead of money',
        'Frustration can quietly drain focus on hard days',
      ],
      risks: [
        'A failure at a bad moment could force a rushed purchase',
        'Work that depends on speed may take noticeably longer',
      ],
      assumptions: [
        'Nothing critical fails in the next twelve months',
        'Your workload stays roughly the same',
      ],
      uncertaintyLevel: 'moderate',
      uncertainty: [
        'Older batteries and drives can fail without much warning',
        'It is hard to predict how much the friction will grow',
      ],
      importantVariables: ['Upcoming workload', 'Cash on hand'],
      whatWouldChange: [
        'A big project landing in the next few months',
        'Signs the storage or battery is failing',
      ],
      questionsToConsider: [
        'Is your important work backed up if the laptop fails?',
        'What would make you change your mind mid-year?',
      ],
      ratings: [
        { dimension: 'cost', level: 'low', note: 'Nothing spent now' },
        { dimension: 'time', level: 'high', note: 'Waiting on a slow machine adds up' },
        { dimension: 'flexibility', level: 'high', note: 'Every option stays open' },
        { dimension: 'risk', level: 'moderate', note: 'A sudden failure is possible' },
        { dimension: 'effort', level: 'low', note: 'Nothing to do now' },
        { dimension: 'upside', level: 'low', note: 'Mostly the value of waiting' },
        { dimension: 'shortTerm', level: 'low', note: 'Day-to-day stays the same' },
        { dimension: 'longTerm', level: 'moderate', note: 'A better-informed purchase later' },
      ],
      branches: [
        {
          label: 'It holds up',
          condition: 'If the laptop survives the year',
          outcome: 'You buy next year with more savings and clearer needs.',
        },
        {
          label: 'It fails early',
          condition: 'If the battery or drive gives out',
          outcome: 'You end up buying anyway, under time pressure and without comparing.',
        },
      ],
    },
    {
      id: 'repair-and-wait',
      title: 'Fix it up, then decide',
      summary:
        'You spend a little on a new battery and a clean reinstall, then revisit in six months. This path assumes your model can still be repaired affordably.',
      immediateEffects: [
        'Roughly $100–200 for a battery and maybe more storage',
        'An afternoon to back up and reinstall',
        'Battery life likely improves noticeably',
      ],
      longerTermConsiderations: [
        'Buys time without committing to a new machine',
        'Performance limits of older hardware remain',
        'You revisit with six months of real evidence',
      ],
      benefits: [
        'Small cost for a real improvement',
        'Tests whether the slowdown was software or hardware',
      ],
      tradeoffs: [
        'Money spent on a machine you may replace soon anyway',
        'Heavy design work may still feel slow',
      ],
      risks: [
        'Parts may be hard to find or the repair may not help much',
        'Two rounds of setup if you buy in six months',
      ],
      assumptions: [
        'Your model has replaceable parts or an affordable repair option',
        'The clean reinstall recovers some lost speed',
      ],
      uncertaintyLevel: 'moderate',
      uncertainty: [
        'Repair costs and part availability vary a lot by model',
      ],
      importantVariables: ['Repairability', 'Daily friction'],
      whatWouldChange: [
        'Learning your model cannot be repaired affordably',
        'The reinstall making no difference to speed',
      ],
      questionsToConsider: [
        'Have you checked what a battery replacement costs for your model?',
        'When exactly would you revisit this decision?',
      ],
      ratings: [
        { dimension: 'cost', level: 'moderate', note: 'Small repair cost now' },
        { dimension: 'time', level: 'moderate', note: 'An afternoon, and some slowness remains' },
        { dimension: 'flexibility', level: 'high', note: 'You can still buy any time' },
        { dimension: 'risk', level: 'moderate', note: 'The repair might not help enough' },
        { dimension: 'effort', level: 'moderate', note: 'Book a repair, back up, reinstall' },
        { dimension: 'upside', level: 'moderate', note: 'Better battery, maybe better speed' },
        { dimension: 'shortTerm', level: 'moderate', note: 'Noticeably better within a week' },
        { dimension: 'longTerm', level: 'low', note: 'A bridge, not a destination' },
      ],
      branches: [
        {
          label: 'It feels new again',
          condition: 'If the reinstall and battery fix most issues',
          outcome: 'You comfortably wait a year and spend far less overall.',
        },
        {
          label: 'Still too slow',
          condition: 'If design tools still struggle',
          outcome: 'You buy in six months, knowing the hardware was the limit.',
        },
      ],
    },
  ],
  comparisonDimensions: ['cost', 'time', 'flexibility', 'risk', 'effort', 'upside', 'shortTerm', 'longTerm'],
  questions: [
    'How many hours a week does the slowdown really cost you?',
    'Is $1,500 comfortable right now, or a stretch?',
    'Is anything work-critical coming up in the next three months?',
  ],
  assumptions: [
    'Prices stay roughly the same over the year',
    'Your work keeps relying on this laptop',
  ],
  missingInformation: [
    'The exact model and whether it can be repaired',
    'Whether your files are backed up today',
  ],
  caution: null,
};
