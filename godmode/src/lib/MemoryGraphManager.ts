import { memoryVault } from "../server/db.js";

export interface GraphNode {
  id: string;
  label: string; // e.g. "Trend" | "QuantumConcept" | "OntologyConcept" | "LinguisticOrigin"
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string; // e.g. "RESONATES_WITH" | "CORRELATES_TO" | "DESCENDS_FROM"
  properties: Record<string, any>;
}

// Prepare table schemas for local graph representation
try {
  memoryVault.prepare(`
    CREATE TABLE IF NOT EXISTS graph_nodes (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      properties TEXT NOT NULL
    )
  `).run();

  memoryVault.prepare(`
    CREATE TABLE IF NOT EXISTS graph_edges (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      target TEXT NOT NULL,
      type TEXT NOT NULL,
      properties TEXT NOT NULL,
      FOREIGN KEY(source) REFERENCES graph_nodes(id) ON DELETE CASCADE,
      FOREIGN KEY(target) REFERENCES graph_nodes(id) ON DELETE CASCADE
    )
  `).run();
} catch (e) {
  console.warn("Could not create local graph memory tables. Fallback active:", e);
}

export class MemoryGraphManager {
  static upsertNode(id: string, label: string, properties: Record<string, any>) {
    console.log(`[MEMORY GRAPH] Upserting node [${label}] ID: ${id}`);
    const propsStr = JSON.stringify(properties);
    try {
      memoryVault.prepare(`
        INSERT INTO graph_nodes (id, label, properties)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          label = excluded.label,
          properties = excluded.properties
      `).run(id, label, propsStr);
    } catch (e: any) {
      console.error("[MEMORY GRAPH] Upsert node failed:", e.message);
    }
  }

  static createRelationship(source: string, target: string, type: string, properties: Record<string, any> = {}) {
    console.log(`[MEMORY GRAPH] Creating edge: (${source})-[${type}]->(${target})`);
    const id = `${source}_${target}_${type}`;
    const propsStr = JSON.stringify(properties);
    try {
      memoryVault.prepare(`
        INSERT INTO graph_edges (id, source, target, type, properties)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          properties = excluded.properties
      `).run(id, source, target, type, propsStr);
    } catch (e: any) {
      console.error("[MEMORY GRAPH] Create edge failed:", e.message);
    }
  }

  // Get relationships for the reasoning context
  static queryRelationships(): string {
    try {
      const nodes = memoryVault.prepare(`SELECT * FROM graph_nodes LIMIT 50`).all() as any[];
      const edges = memoryVault.prepare(`SELECT * FROM graph_edges LIMIT 50`).all() as any[];
      
      let context = "=== MEMORY GRAPH MAP ===\n";
      context += "Nodes:\n";
      nodes.forEach(n => {
        context += ` - [${n.label}] ${n.id} (${n.properties})\n`;
      });
      context += "Edges:\n";
      edges.forEach(e => {
        context += ` - (${e.source})-[${e.type}]->(${e.target})\n`;
      });
      return context;
    } catch (e: any) {
      return "Memory Graph offline.";
    }
  }

  // Populate graph with initial esoteric / physics ontology links to guarantee rich reasoning
  static seedInitialOntology() {
    // 10 Dimensions & Branes
    this.upsertNode("dimension_10", "QuantumConcept", {
      name: "10-Dimensional Superstring Theory",
      nature: "Hyperspace topology required for quantum gravity consistency",
      provenance: "M-Theory & Membrane cosmology"
    });
    this.upsertNode("non_locality", "QuantumConcept", {
      name: "Non-Local Reality",
      nature: "Proven quantum entanglement where spatial boundaries are secondary projection",
      evidence: "EPR Paradox, Bell's Theorem, Aspect experiments"
    });
    this.upsertNode("ontology_causal", "OntologyConcept", {
      name: "Ontology of Being & Causal Plane",
      nature: "Primary structure of reality where consciousness is prior to matter"
    });
    this.upsertNode("pie_origin", "LinguisticOrigin", {
      name: "Proto-Indo-European Root",
      nature: "The linguistic motherboard originating verbal & scriptal consciousness",
      branches: "Indo-Iranian, Balto-Slavic, Germanic, Celtic, Italic, Hellenic, Anatolian, Tocharian"
    });

    // Connect them
    this.createRelationship("ontology_causal", "non_locality", "DESCENDS_INTO");
    this.createRelationship("dimension_10", "ontology_causal", "RESONATES_WITH");
    this.createRelationship("pie_origin", "ontology_causal", "COGNITIVE_MAPPING_OF");
  }
}

// Automatically seed
try {
  MemoryGraphManager.seedInitialOntology();
} catch (e) {
  // Catch silent
}
