import { SkillBundle, MarketplaceSource } from "../types";

export const DEFAULT_MARKETPLACE_SOURCE: MarketplaceSource = {
  id: "claude-code-skills",
  name: "Claude Code Skills",
  owner: "alirezarezvani",
  url: "alirezarezvani/claude-skills",
  addedAt: new Date().toISOString(),
};

export const SKILL_BUNDLES: SkillBundle[] = [
  {
    id: "engineering-skills",
    name: "engineering-skills",
    displayName: "Engineering Skills",
    description:
      "Advanced engineering skill pack for Blueprint Buddy. Includes structural analysis prompts, parametric design helpers, load-bearing calculations, and CNC-ready export guidance.",
    author: "claude-code-skills",
    version: "1.0.0",
    icon: "Wrench",
    category: "engineering",
    installCount: 1243,
    rating: 4.8,
    tags: ["structural", "parametric", "CNC", "engineering", "load-analysis"],
    skills: [
      {
        id: "structural-analysis",
        name: "Structural Analysis",
        description:
          "Adds load-bearing analysis and stress calculations to build plans. Automatically evaluates joint strength, wood grain orientation, and weight distribution.",
        category: "design",
        icon: "Shield",
        author: "claude-code-skills",
        promptInjection:
          "When generating a build plan, include a STRUCTURAL ANALYSIS section that evaluates: 1) Load-bearing capacity of each joint, 2) Stress points and potential failure modes, 3) Recommended reinforcement if needed, 4) Weight distribution analysis across all legs/supports.",
      },
      {
        id: "parametric-design",
        name: "Parametric Design",
        description:
          "Enables parametric scaling of designs. Specify one dimension and the system auto-scales all related parts proportionally while maintaining structural integrity.",
        category: "design",
        icon: "Scaling",
        author: "claude-code-skills",
        promptInjection:
          "Support parametric design: when the user specifies a target dimension, auto-scale all related parts proportionally. Include a PARAMETRIC NOTES section showing the scaling ratios applied and any manual overrides needed for structural reasons.",
      },
      {
        id: "cnc-export",
        name: "CNC Export Guide",
        description:
          "Generates CNC-ready specifications including tool paths, feed rates, bit sizes, and G-code considerations for each cut list item.",
        category: "general",
        icon: "Cpu",
        author: "claude-code-skills",
        promptInjection:
          "Include a CNC MACHINING section with: 1) Recommended bit sizes for each cut, 2) Suggested feed rates based on material, 3) Tool path strategy (climb vs conventional), 4) Nesting layout for sheet goods to minimize waste.",
      },
      {
        id: "advanced-joinery",
        name: "Advanced Joinery Library",
        description:
          "Expands joinery options with complex Japanese and traditional European woodworking joints including detailed angle calculations.",
        category: "joinery",
        icon: "Puzzle",
        author: "claude-code-skills",
        referenceData: {
          japaneseJoinery: [
            "Sashimono (dovetail variant)",
            "Kawai Tsugite (4-way joint)",
            "Shachi Sen (keyed tenon)",
            "Kanawa Tsugi (spliced joint)",
          ],
          europeanJoinery: [
            "Knapp joint",
            "Fox wedged tenon",
            "Blind dovetail",
            "Butterfly / bowtie key",
          ],
        },
      },
      {
        id: "material-optimizer",
        name: "Material Optimizer",
        description:
          "Calculates optimal cut layouts to minimize waste from standard lumber and sheet goods. Includes board-foot calculator and cost estimation.",
        category: "materials",
        icon: "Calculator",
        author: "claude-code-skills",
        promptInjection:
          "Include a MATERIAL OPTIMIZATION section: 1) Optimal cut layout from standard lumber sizes, 2) Waste percentage calculation, 3) Alternative lumber dimensions that reduce waste, 4) Total board-feet required with 10% safety margin.",
      },
    ],
  },
  {
    id: "marketing-skills",
    name: "marketing-skills",
    displayName: "Marketing Skills",
    description:
      "Turn your furniture designs into marketable products. Includes product listing generators, pricing calculators, social media content prompts, and customer-facing documentation.",
    author: "claude-code-skills",
    version: "1.0.0",
    icon: "Megaphone",
    category: "marketing",
    installCount: 876,
    rating: 4.6,
    tags: ["marketing", "pricing", "social-media", "product-listing", "branding"],
    skills: [
      {
        id: "product-listing",
        name: "Product Listing Generator",
        description:
          "Auto-generates professional product descriptions, feature highlights, and SEO-friendly titles from your build plans for Etsy, Amazon Handmade, and custom shops.",
        category: "business",
        icon: "ShoppingBag",
        author: "claude-code-skills",
        promptInjection:
          "After generating the build plan, also produce a PRODUCT LISTING section with: 1) SEO-optimized title (max 140 chars), 2) Product description (200-300 words) highlighting craftsmanship, 3) Feature bullet points (5-7), 4) Suggested tags/keywords for marketplace search.",
      },
      {
        id: "pricing-calculator",
        name: "Pricing Calculator",
        description:
          "Calculates retail pricing based on material costs, labor hours, overhead, and target profit margins. Supports wholesale and retail tiers.",
        category: "business",
        icon: "DollarSign",
        author: "claude-code-skills",
        promptInjection:
          "Include a PRICING ANALYSIS section: 1) Material cost breakdown from BOM, 2) Estimated labor hours at $35/hr, $50/hr, and $75/hr rates, 3) Suggested retail price with 40% margin, 4) Wholesale price at 50% of retail, 5) Competitor price range estimate.",
      },
      {
        id: "social-content",
        name: "Social Media Content",
        description:
          "Generates engaging social media posts, hashtags, and build-process storytelling captions for Instagram, TikTok, and Pinterest.",
        category: "business",
        icon: "Share2",
        author: "claude-code-skills",
        promptInjection:
          "Generate a SOCIAL MEDIA KIT: 1) Instagram caption with storytelling angle (150-200 words), 2) Hashtag set (15-20 relevant tags), 3) Pinterest pin description, 4) Short TikTok/Reel script concept for a build montage.",
      },
      {
        id: "customer-docs",
        name: "Customer Documentation",
        description:
          "Creates customer-facing care instructions, assembly guides (for flat-pack), and warranty documentation templates.",
        category: "general",
        icon: "FileText",
        author: "claude-code-skills",
        promptInjection:
          "Include a CUSTOMER DOCUMENTATION section: 1) Care & maintenance instructions specific to the wood and finish used, 2) Seasonal wood movement advisory, 3) Touch-up and repair guide, 4) Suggested warranty terms.",
      },
    ],
  },
  {
    id: "c-level-skills",
    name: "c-level-skills",
    displayName: "C-Level / Business Skills",
    description:
      "Executive-level business planning tools for furniture makers. Includes workshop capacity planning, project timeline estimation, client proposal generation, and business analytics.",
    author: "claude-code-skills",
    version: "1.0.0",
    icon: "Briefcase",
    category: "leadership",
    installCount: 542,
    rating: 4.7,
    tags: ["business", "planning", "proposals", "analytics", "workshop"],
    skills: [
      {
        id: "project-timeline",
        name: "Project Timeline Planner",
        description:
          "Generates realistic project timelines with milestones, accounting for wood acclimation, glue cure times, finish drying, and workshop scheduling.",
        category: "business",
        icon: "Calendar",
        author: "claude-code-skills",
        promptInjection:
          "Include a PROJECT TIMELINE section: 1) Phase breakdown (prep, milling, joinery, assembly, finishing), 2) Estimated hours per phase for a solo woodworker, 3) Critical path items and dependencies, 4) Calendar estimate assuming 4-6 hours/day workshop time, 5) Buffer for glue cure and finish drying times.",
      },
      {
        id: "client-proposal",
        name: "Client Proposal Generator",
        description:
          "Creates professional client proposals with scope, pricing tiers, material options, and terms. Ready to send as a PDF.",
        category: "business",
        icon: "FileSignature",
        author: "claude-code-skills",
        promptInjection:
          "Generate a CLIENT PROPOSAL section: 1) Executive summary of the piece, 2) Three pricing tiers (Good/Better/Best) with different material and finish options, 3) Deposit and payment schedule, 4) Estimated delivery timeline, 5) Revision policy (e.g., 2 design revisions included).",
      },
      {
        id: "workshop-capacity",
        name: "Workshop Capacity Planner",
        description:
          "Analyzes the tool and space requirements for a project and maps them against a standard workshop setup.",
        category: "business",
        icon: "Factory",
        author: "claude-code-skills",
        promptInjection:
          "Include a WORKSHOP REQUIREMENTS section: 1) Required tools list (hand and power), 2) Minimum workspace dimensions needed, 3) Clamp inventory needed, 4) Dust collection considerations, 5) Safety equipment checklist.",
      },
      {
        id: "business-analytics",
        name: "Business Analytics",
        description:
          "Provides per-project profitability analysis, time tracking benchmarks, and metrics for growing a furniture business.",
        category: "business",
        icon: "BarChart3",
        author: "claude-code-skills",
        promptInjection:
          "Include a BUSINESS METRICS section: 1) Cost per hour of production, 2) Material cost as percentage of retail price, 3) Break-even quantity for batch production, 4) Suggested batch size for efficiency gains, 5) Revenue projection if producing 2/4/8 units per month.",
      },
    ],
  },
];

export function getAvailableBundles(): SkillBundle[] {
  return SKILL_BUNDLES;
}

export function getBundleById(id: string): SkillBundle | undefined {
  return SKILL_BUNDLES.find((b) => b.id === id);
}

export function searchBundles(query: string): SkillBundle[] {
  const q = query.toLowerCase();
  return SKILL_BUNDLES.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.displayName.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.tags.some((t) => t.toLowerCase().includes(q))
  );
}
